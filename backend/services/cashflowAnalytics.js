// Real cash-flow & receivables/payables analytics computed from actual
// bills, payments, customers and suppliers — no random/mock data.
const { Op } = require("sequelize");
const Bill = require("../models/Bill");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");

const DAY_MS = 1000 * 60 * 60 * 24;

// Effective due date for a bill: explicit dueDate, else createdAt + creditDays.
function billDueDate(bill, creditDays) {
  if (bill.dueDate) return new Date(bill.dueDate);
  const base = new Date(bill.createdAt);
  base.setDate(base.getDate() + (creditDays || 0));
  return base;
}

function riskLevelFor(score) {
  if (score > 75) return "critical";
  if (score > 50) return "high";
  if (score > 25) return "medium";
  return "low";
}

// Per-customer payment risk derived from real outstanding balances and the
// actual age of their unpaid/partial invoices.
async function computePaymentRisks(where) {
  const customers = await Customer.findAll({
    where: { ...where, status: "active", balance: { [Op.gt]: 0 } },
    order: [["balance", "DESC"]],
    limit: 100,
  });

  const now = new Date();
  const risks = [];

  for (const c of customers) {
    const bills = await Bill.findAll({
      where: { ...where, customerName: c.name, status: { [Op.in]: ["unpaid", "partial"] } },
    });

    let overdueAmount = 0;
    let weightedDelay = 0;
    let overdueCount = 0;

    for (const b of bills) {
      const due = billDueDate(b, c.creditDays);
      const daysLate = Math.floor((now - due) / DAY_MS);
      if (daysLate > 0) {
        const amt = parseFloat(b.total) || 0;
        overdueAmount += amt;
        weightedDelay += daysLate * amt;
        overdueCount++;
      }
    }

    const balance = parseFloat(c.balance) || 0;
    const creditLimit = parseFloat(c.creditLimit) || 0;
    const avgDelayDays = overdueAmount > 0 ? Math.round(weightedDelay / overdueAmount) : 0;

    // Score blends lateness, how much of the credit limit is consumed, and
    // the share of the balance that is already overdue.
    const delayComponent = Math.min(50, avgDelayDays); // up to 50 pts
    const utilisation = creditLimit > 0 ? balance / creditLimit : (balance > 100000 ? 1 : 0.4);
    const utilComponent = Math.min(30, utilisation * 30); // up to 30 pts
    const overdueRatio = balance > 0 ? overdueAmount / balance : 0;
    const overdueComponent = Math.min(20, overdueRatio * 20); // up to 20 pts
    const riskScore = Math.round(Math.min(100, delayComponent + utilComponent + overdueComponent));

    risks.push({
      customerId: c.id,
      customerName: c.name,
      riskScore,
      riskLevel: riskLevelFor(riskScore),
      avgDelayDays,
      totalOutstanding: Math.round(balance),
      overdueAmount: Math.round(overdueAmount),
      overdueInvoices: overdueCount,
      creditLimit: Math.round(creditLimit),
      creditUtilisation: creditLimit > 0 ? Math.round(utilisation * 100) : null,
      predictedDefault: riskScore > 80,
      lastAssessed: now,
      factors: {
        paymentHistory: avgDelayDays > 30 ? "poor" : avgDelayDays > 7 ? "fair" : "good",
        creditUtilisation: utilisation > 0.9 ? "high" : utilisation > 0.5 ? "moderate" : "low",
      },
    });
  }

  return risks.sort((a, b) => b.riskScore - a.riskScore);
}

// Cash-flow forecast: expected inflows from receivables bucketed by when each
// invoice falls due, and expected outflows from supplier payables bucketed by
// their credit terms. A historical collection rate discounts the inflows.
async function computeForecast(where) {
  const now = new Date();
  const periods = [
    { period: "7d", days: 7 },
    { period: "30d", days: 30 },
    { period: "60d", days: 60 },
    { period: "90d", days: 90 },
  ];

  // Historical collection rate across the branch (paid / billed), bounded.
  const customers = await Customer.findAll({ where });
  let totalBilled = 0, totalPaid = 0;
  customers.forEach((c) => {
    totalBilled += parseFloat(c.totalPurchased) || 0;
    totalPaid += parseFloat(c.totalPaid) || 0;
  });
  const collectionRate = totalBilled > 0 ? Math.max(0.5, Math.min(1, totalPaid / totalBilled)) : 0.85;

  // Outstanding receivables with their due dates.
  const custDays = {};
  customers.forEach((c) => { custDays[c.name] = c.creditDays; });
  const openBills = await Bill.findAll({
    where: { ...where, status: { [Op.in]: ["unpaid", "partial"] } },
  });
  const receivableByDay = openBills.map((b) => {
    const due = billDueDate(b, custDays[b.customerName] ?? 30);
    const inDays = Math.max(0, Math.floor((due - now) / DAY_MS));
    return { inDays, amount: parseFloat(b.total) || 0 };
  });

  // Outstanding payables: spread each supplier's balance to a due point based
  // on their credit terms (no per-invoice payable ledger exists yet).
  const suppliers = await Supplier.findAll({
    where: { ...where, balance: { [Op.gt]: 0 } },
  });
  const payableByDay = suppliers.map((s) => ({
    inDays: Math.max(0, s.creditDays || 30),
    amount: parseFloat(s.balance) || 0,
  }));

  const forecasts = periods.map(({ period, days }) => {
    const predictedInflow = Math.round(
      receivableByDay.filter((r) => r.inDays <= days).reduce((sum, r) => sum + r.amount, 0) * collectionRate
    );
    const predictedOutflow = Math.round(
      payableByDay.filter((p) => p.inDays <= days).reduce((sum, p) => sum + p.amount, 0)
    );
    return {
      date: now,
      period,
      predictedInflow,
      predictedOutflow,
      netPosition: predictedInflow - predictedOutflow,
      confidence: Math.round(collectionRate * 100),
      factors: {
        collectionRate: Math.round(collectionRate * 100),
        openReceivables: receivableByDay.length,
        openPayables: payableByDay.length,
      },
    };
  });

  return forecasts;
}

// Supplier payment pressure: who we owe, with a real due date derived from
// their credit terms relative to the most recent purchase.
async function computePressure(where, PurchaseOrder) {
  const now = new Date();
  const suppliers = await Supplier.findAll({
    where: { ...where, status: "active", balance: { [Op.gt]: 0 } },
    order: [["balance", "DESC"]],
    limit: 50,
  });

  const pressure = [];
  for (const s of suppliers) {
    const lastPo = await PurchaseOrder.findOne({
      where: { ...where, supplierName: s.name },
      order: [["createdAt", "DESC"]],
    });
    const anchor = lastPo ? new Date(lastPo.createdAt) : new Date(s.updatedAt);
    const due = new Date(anchor);
    due.setDate(due.getDate() + (s.creditDays || 30));
    const daysUntilDue = Math.round((due - now) / DAY_MS);
    const payable = parseFloat(s.balance) || 0;

    pressure.push({
      id: s.id,
      name: s.name,
      payable: Math.round(payable),
      dueDate: due.toISOString().split("T")[0],
      daysUntilDue,
      overdue: daysUntilDue < 0,
      priority: daysUntilDue < 0 ? "critical" : payable > 100000 ? "high" : daysUntilDue <= 7 ? "high" : "normal",
    });
  }

  return pressure.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

module.exports = { computePaymentRisks, computeForecast, computePressure };

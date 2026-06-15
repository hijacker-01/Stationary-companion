const JournalVoucher = require("../models/JournalVoucher");
const JournalLine = require("../models/JournalLine");
const LedgerAccount = require("../models/LedgerAccount");

async function getLedger(code, name, group, transaction) {
  let account = await LedgerAccount.findOne({ where: { code }, transaction });
  if (!account) {
    account = await LedgerAccount.create({ code, name, group }, { transaction });
  }
  return account;
}

exports.postSalesJournal = async (bill, transaction) => {
  try {
    // 1. Get/Create Ledgers
    const customerAcc = await getLedger("CUSTOMER_CTRL", "Customer Control Account", "Asset", transaction);
    const salesAcc = await getLedger("SALES", "Sales Account", "Revenue", transaction);
    const gstOutAcc = await getLedger("GST_OUT", "Output GST Account", "Liability", transaction);

    // 2. Create Journal Voucher Header (using legacy model but we only fill basic info)
    const jv = await JournalVoucher.create({
      jvNo: `JV-S-${bill.billNo}`,
      date: bill.createdAt || new Date(),
      debitPartyType: "customer",
      debitPartyId: bill.customerId || 0, // Fallback if no ID is saved
      debitPartyName: bill.customerName || "Unknown",
      creditPartyType: "customer", // Just to satisfy legacy constraints
      creditPartyId: 0,
      creditPartyName: "Sales",
      amount: bill.total,
      narration: `Sales invoice ${bill.billNo} to ${bill.customerName}`,
      branchId: bill.branchId,
    }, { transaction });

    // 3. Create Journal Lines (Double Entry)
    // Debit Customer
    await JournalLine.create({
      journalVoucherId: jv.id,
      ledgerAccountId: customerAcc.id,
      debit: bill.total,
      credit: 0,
      narration: `Sales invoice ${bill.billNo}`
    }, { transaction });

    // Credit Sales (Subtotal)
    await JournalLine.create({
      journalVoucherId: jv.id,
      ledgerAccountId: salesAcc.id,
      debit: 0,
      credit: bill.subtotal,
      narration: `Sales revenue from ${bill.billNo}`
    }, { transaction });

    // Credit GST Output
    if (bill.gstAmount > 0) {
      await JournalLine.create({
        journalVoucherId: jv.id,
        ledgerAccountId: gstOutAcc.id,
        debit: 0,
        credit: bill.gstAmount,
        narration: `Output GST for ${bill.billNo}`
      }, { transaction });
    }
  } catch (error) {
    console.error("Failed to post sales journal:", error);
    throw error;
  }
};

exports.postPurchaseJournal = async (po, transaction) => {
  try {
    const supplierAcc = await getLedger("SUPPLIER_CTRL", "Supplier Control Account", "Liability", transaction);
    const inventoryAcc = await getLedger("INVENTORY", "Inventory Account", "Asset", transaction);
    const gstInAcc = await getLedger("GST_IN", "Input GST Account", "Asset", transaction);

    const jv = await JournalVoucher.create({
      jvNo: `JV-P-${po.poNumber}`,
      date: po.createdAt || new Date(),
      debitPartyType: "supplier",
      debitPartyId: po.supplierId || 0,
      debitPartyName: "Inventory",
      creditPartyType: "supplier",
      creditPartyId: po.supplierId || 0,
      creditPartyName: po.supplierName || "Unknown",
      amount: po.total,
      narration: `Purchase from ${po.supplierName} via PO ${po.poNumber}`,
      branchId: po.branchId,
    }, { transaction });

    // Debit Inventory
    await JournalLine.create({
      journalVoucherId: jv.id,
      ledgerAccountId: inventoryAcc.id,
      debit: po.subtotal,
      credit: 0,
      narration: `Inventory purchase PO ${po.poNumber}`
    }, { transaction });

    // Debit GST Input
    if (po.gstAmount > 0) {
      await JournalLine.create({
        journalVoucherId: jv.id,
        ledgerAccountId: gstInAcc.id,
        debit: po.gstAmount,
        credit: 0,
        narration: `Input GST for PO ${po.poNumber}`
      }, { transaction });
    }

    // Credit Supplier
    await JournalLine.create({
      journalVoucherId: jv.id,
      ledgerAccountId: supplierAcc.id,
      debit: 0,
      credit: po.total,
      narration: `Payable for PO ${po.poNumber}`
    }, { transaction });

  } catch (error) {
    console.error("Failed to post purchase journal:", error);
    throw error;
  }
};

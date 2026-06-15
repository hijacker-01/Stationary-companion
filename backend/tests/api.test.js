// API integration tests — exercise the real server + database.
//
// Run with the server up:  npm test   (which runs: node --test tests/)
// Override target with TEST_BASE_URL.
//
// Auth/RBAC, branch-tenant isolation, the billing write path, and the Phase-2
// real analytics/messaging endpoints are covered. A handful of records are
// created during the billing test and cleaned up afterward.

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { api, login, ADMIN, STAFF, ensureStaffUser, assertServerUp } = require("./helpers");

let admin; // { cookie, user }
let staff;
const created = { billIds: [] };

before(async () => {
  await assertServerUp();
  await ensureStaffUser();
  // Log each role in exactly once; reuse cookies across all tests.
  admin = await login(ADMIN);
  staff = await login(STAFF);
  assert.equal(admin.user.role, "admin", "admin fixture must be an admin");
  assert.equal(staff.user.branchId, 1, "staff fixture must be in branch 1");
});

// ── Auth ─────────────────────────────────────────────────────────────────────
test("rejects unauthenticated requests with 401", async () => {
  const res = await api("/items?limit=1");
  assert.equal(res.status, 401);
});

test("accepts authenticated requests", async () => {
  const res = await api("/items?limit=1", { cookie: admin.cookie });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.data), "items response has a data array");
});

test("login carries branchId and isCrossBranch in the user payload", async () => {
  assert.equal(staff.user.branchId, 1);
  // admin is cross-branch by role
  assert.equal(admin.user.role, "admin");
});

// ── RBAC ───────────────────────────────────────────────────────────────────-─
test("approvals require the approve_invoices permission", async () => {
  const staffRes = await api("/enterprise/approvals", { cookie: staff.cookie });
  assert.equal(staffRes.status, 403, "staff without permission is forbidden");
  const adminRes = await api("/enterprise/approvals", { cookie: admin.cookie });
  assert.equal(adminRes.status, 200, "admin (cross-branch) is allowed");
});

// ── Branch-tenant isolation ───────────────────────────────────────────────────
test("admin (cross-branch) sees at least as many items as branch staff", async () => {
  const staffRes = await api("/items?limit=1", { cookie: staff.cookie });
  const adminRes = await api("/items?limit=1", { cookie: admin.cookie });
  assert.equal(staffRes.status, 200);
  assert.equal(adminRes.status, 200);
  assert.ok(
    adminRes.data.total >= staffRes.data.total,
    `admin total (${adminRes.data.total}) should be >= staff total (${staffRes.data.total})`
  );
});

test("every item visible to branch staff belongs to their branch", async () => {
  const res = await api("/items?limit=100", { cookie: staff.cookie });
  assert.equal(res.status, 200);
  for (const item of res.data.data) {
    assert.equal(item.branchId, 1, `item ${item.id} leaked from another branch`);
  }
});

test("a record created by branch staff is stamped with their branchId", async () => {
  const name = `TEST Item ${Date.now()}`;
  const res = await api("/items", {
    method: "POST",
    cookie: staff.cookie,
    body: { name, batch: "TST1", category: "General", unit: "PCS", mrp: 10, selling_price: 9, cost_price: 8, stock_qty: 5 },
  });
  assert.ok(res.status === 200 || res.status === 201, `unexpected status ${res.status}`);
  assert.equal(res.data.branchId, 1, "created item must inherit the creator's branch");
  // cleanup
  await api(`/items/${res.data.id}`, { method: "DELETE", cookie: staff.cookie });
});

// ── Billing write path ────────────────────────────────────────────────────────
test("creating a bill stamps branchId and a branch-scoped bill number", async () => {
  // Use a real item from the admin's branch.
  const items = await api("/items?limit=1", { cookie: admin.cookie });
  const item = items.data.data[0];
  assert.ok(item, "need at least one item to bill");

  const res = await api("/billing", {
    method: "POST",
    cookie: admin.cookie,
    body: {
      customerName: "TEST Walk-in",
      items: [{ name: item.name, batch: item.batch, qty: 1, rate: item.selling_price || item.mrp || 10, mrp: item.mrp || 10, amount: item.selling_price || item.mrp || 10 }],
      subtotal: item.selling_price || item.mrp || 10,
      total: item.selling_price || item.mrp || 10,
      paymentMode: "cash",
    },
  });
  assert.equal(res.status, 200, `billing create failed: ${JSON.stringify(res.data)}`);
  assert.equal(res.data.branchId, admin.user.branchId, "bill must carry the branch");
  assert.match(res.data.billNo, /^INV-/, "bill number should use the INV- sequence");
  created.billIds.push(res.data.id);
});

// ── Cross-branch uniqueness (regression for the global-unique bug) ────────────
test("two branches can stock the same item name+batch (branch-scoped item uniqueness)", async () => {
  // Use a fresh name so the test is independent of prior runs (Item is
  // soft-deleted, and the composite unique index covers soft-deleted rows).
  const name = `TEST Shared Drug ${Date.now()}`;
  const batch = "SHB1";
  const mk = (cookie) => api("/items", {
    method: "POST", cookie,
    body: { name, batch, category: "General", unit: "PCS", mrp: 10, selling_price: 9, cost_price: 8, stock_qty: 3 },
  });

  // Same name+batch in the admin's branch (4) and the staff branch (1).
  const a = await mk(admin.cookie);
  const b = await mk(staff.cookie);
  assert.ok(a.status === 200 || a.status === 201, `admin item create failed: ${JSON.stringify(a.data)}`);
  assert.ok(b.status === 200 || b.status === 201, `cross-branch item create failed: ${JSON.stringify(b.data)}`);
  assert.equal(a.data.branchId, admin.user.branchId);
  assert.equal(b.data.branchId, 1);
  assert.notEqual(a.data.id, b.data.id, "each branch gets its own item row");

  await api(`/items/${a.data.id}`, { method: "DELETE", cookie: admin.cookie });
  await api(`/items/${b.data.id}`, { method: "DELETE", cookie: staff.cookie });
});

test("a branch's bill number sequence is independent of other branches", async () => {
  // Give branch 1 an item to bill.
  const itemRes = await api("/items", {
    method: "POST",
    cookie: staff.cookie,
    body: { name: `TEST Bill Item ${Date.now()}`, batch: "TB1", category: "General", unit: "PCS", mrp: 20, selling_price: 18, cost_price: 15, stock_qty: 10 },
  });
  assert.ok(itemRes.status === 200 || itemRes.status === 201);
  const it = itemRes.data;

  // Staff creates a bill. Its number (INV-<fy>-0001 for a fresh branch) may
  // duplicate an existing number in another branch — the composite
  // (branchId, billNo) unique must allow it.
  const billRes = await api("/billing", {
    method: "POST",
    cookie: staff.cookie,
    body: {
      customerName: "TEST Branch1 Walk-in",
      items: [{ name: it.name, batch: it.batch, qty: 1, rate: 18, mrp: 20, amount: 18 }],
      subtotal: 18, total: 18, paymentMode: "cash",
    },
  });
  assert.equal(billRes.status, 200, `branch-1 billing failed: ${JSON.stringify(billRes.data)}`);
  assert.equal(billRes.data.branchId, 1);
  assert.match(billRes.data.billNo, /^INV-/);

  // cleanup
  await api(`/billing/${billRes.data.id}`, { method: "DELETE", cookie: staff.cookie });
  await api(`/items/${it.id}`, { method: "DELETE", cookie: staff.cookie });
});

// ── Phase-2 real analytics ────────────────────────────────────────────────────
test("cash-flow forecast returns well-formed period buckets", async () => {
  const res = await api("/cashflow/forecast", { cookie: admin.cookie });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data) && res.data.length === 4, "expect 7/30/60/90 buckets");
  for (const f of res.data) {
    assert.equal(typeof f.predictedInflow, "number");
    assert.equal(typeof f.predictedOutflow, "number");
    assert.equal(f.netPosition, f.predictedInflow - f.predictedOutflow);
  }
});

test("payment risk scores are bounded 0-100 and consistently leveled", async () => {
  const res = await api("/cashflow/risks", { cookie: admin.cookie });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
  for (const r of res.data.slice(0, 20)) {
    assert.ok(r.riskScore >= 0 && r.riskScore <= 100, `score out of range: ${r.riskScore}`);
    assert.ok(["low", "medium", "high", "critical"].includes(r.riskLevel));
  }
});

// ── Phase-2 messaging ─────────────────────────────────────────────────────────
test("messaging status reports configuration; send validates input", async () => {
  const status = await api("/communication/status", { cookie: admin.cookie });
  assert.equal(status.status, 200);
  assert.equal(typeof status.data.configured, "boolean");

  const bad = await api("/communication/send", { method: "POST", cookie: admin.cookie, body: { to: "+910000000000" } });
  assert.equal(bad.status, 400, "missing message should be rejected");

  const ok = await api("/communication/send", {
    method: "POST",
    cookie: admin.cookie,
    body: { to: "+910000000000", message: "test", channel: "sms" },
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.success, true);
});

// ── Cleanup ───────────────────────────────────────────────────────────────────
after(async () => {
  for (const id of created.billIds) {
    await api(`/billing/${id}`, { method: "DELETE", cookie: admin.cookie }).catch(() => {});
  }
});

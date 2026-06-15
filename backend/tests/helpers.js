// Shared helpers for the API integration test suite.
//
// Tests run against a live server (default http://localhost:5000, override with
// TEST_BASE_URL). Auth is cookie-based; we log each role in ONCE and reuse the
// returned cookie across all tests so we don't hammer the login rate limiter.

require("dotenv").config();

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

const ADMIN = { email: "admin@company.com", password: "admin123" };
const STAFF = { email: "staffmumbai@test.com", password: "staff123" };

// Extract the `token` cookie value from a Set-Cookie header.
function parseTokenCookie(setCookie) {
  if (!setCookie) return null;
  const m = /token=([^;]+)/.exec(setCookie);
  return m ? m[1] : null;
}

// Make a request; `cookie` is the raw token value (sent as `token=<value>`).
async function api(path, { method = "GET", body, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers["Cookie"] = `token=${cookie}`;
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

async function login({ email, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const cookie = parseTokenCookie(res.headers.get("set-cookie"));
  if (!cookie) throw new Error(`No token cookie returned for ${email}`);
  const body = await res.json();
  return { cookie, user: body.user };
}

// Ensure the non-admin test user exists (branch 1), so the suite is
// reproducible on a fresh database. The user is a non-admin in branch 1 with
// the `billing.create` permission (so we can exercise the billing path) but
// WITHOUT `approve_invoices` (so the RBAC test still proves enforcement).
// Upsert permissions/branch so the fixture is correct even if the user exists.
async function ensureStaffUser() {
  const bcrypt = require("bcryptjs");
  const sequelize = require("../config/db");
  const hashed = await bcrypt.hash(STAFF.password, 10);
  const permissions = JSON.stringify(["billing.create"]);
  await sequelize.query(
    `INSERT INTO "Users" (name, email, password, role, permissions, "isActive", "branchId", "createdAt", "updatedAt")
     VALUES (:name, :email, :password, 'staff', :permissions, true, 1, NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET permissions = :permissions, "branchId" = 1, role = 'staff', "isActive" = true`,
    { replacements: { name: "Staff Mumbai (test)", email: STAFF.email, password: hashed, permissions } }
  );
}

// Verify the server is reachable before running the suite.
async function assertServerUp() {
  try {
    await fetch(`${BASE_URL}/api/auth/login`, { method: "OPTIONS" });
  } catch (e) {
    throw new Error(
      `Cannot reach server at ${BASE_URL}. Start it first: (cd backend && node server.js). Original: ${e.message}`
    );
  }
}

module.exports = { BASE_URL, ADMIN, STAFF, api, login, ensureStaffUser, assertServerUp };

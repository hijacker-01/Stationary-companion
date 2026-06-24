require("dotenv").config();
const bcrypt = require("bcryptjs");
const sequelize = require("./config/db");

(async () => {
  const email = "owner@bp.com";
  const password = "owner123";
  const hash = await bcrypt.hash(password, 10);
  // Upsert: create if absent, else reset password + ensure admin/active.
  await sequelize.query(
    `INSERT INTO "Users" (name, email, password, role, permissions, "isActive", "branchId", "createdAt", "updatedAt")
     VALUES ('Owner', :email, :hash, 'admin', '[]', true, 4, NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET password = :hash, role = 'admin', "isActive" = true, "branchId" = 4`,
    { replacements: { email, hash } }
  );
  console.log("User ready:", email, "/", password);
  await sequelize.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });

const bcrypt = require('bcryptjs');
const sequelize = require('./config/db');

async function resetPassword() {
  try {
    const hashed = await bcrypt.hash('admin123', 10);
    await sequelize.query(`UPDATE "Users" SET password = '${hashed}' WHERE email = 'admin@company.com'`);
    console.log('Password reset successfully for admin@company.com to admin123');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPassword();

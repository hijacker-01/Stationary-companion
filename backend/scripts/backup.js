const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const backupDir = path.join(__dirname, "../../backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const performBackup = () => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `marg_erp_backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    const dbUser = process.env.DB_USER || "postgres";
    const dbName = process.env.DB_NAME || "marg_erp";
    const dbPassword = process.env.DB_PASSWORD || "kush1210";
    const dbHost = process.env.DB_HOST || "localhost";
    
    // Set PGPASSWORD environment variable so pg_dump doesn't prompt for password
    const env = { ...process.env, PGPASSWORD: dbPassword };
    
    const command = `pg_dump -U ${dbUser} -h ${dbHost} -F c -b -v -f "${filepath}" ${dbName}`;

    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup error: ${error.message}`);
        return reject(error);
      }
      console.log(`Backup successful: ${filepath}`);
      resolve(filepath);
    });
  });
};

module.exports = performBackup;

if (require.main === module) {
  performBackup().then(() => process.exit(0)).catch(() => process.exit(1));
}

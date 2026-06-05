const sequelize = require('./config/db');
sequelize.query('SELECT email FROM "Users"').then(([results]) => {
  console.log('USERS:', results);
  process.exit(0);
}).catch(console.error);

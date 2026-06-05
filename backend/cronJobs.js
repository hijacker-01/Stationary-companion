const cron = require('node-cron');
const Bill = require('./models/Bill');
const Customer = require('./models/Customer');
const { Op } = require('sequelize');

function initCronJobs() {
  // Schedule task to run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily 8 AM summary task...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
      const yesterdayEnd   = new Date(yesterday.setHours(23, 59, 59, 999));

      const yesterdayBills = await Bill.findAll({
        where: { createdAt: { [Op.between]: [yesterdayStart, yesterdayEnd] } }
      });
      
      const salesAmount = yesterdayBills.reduce((s, b) => s + (b.total || 0), 0);
      console.log(`Summary: Yesterday's sales: ${salesAmount} across ${yesterdayBills.length} bills.`);

      // Normally we would send an email or SMS here
      // e.g. await sendEmail('admin@erp.com', 'Daily Summary', `Sales: ${salesAmount}`);
    } catch (err) {
      console.error('Error running 8 AM cron job:', err);
    }
  });
}

module.exports = initCronJobs;

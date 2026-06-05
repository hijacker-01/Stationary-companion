const sequelize = require('./config/db');

async function fixDeletedAt() {
  try {
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE;');
    console.log('Successfully added deletedAt to Users table.');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('deletedAt already exists on Users table.');
    } else {
      console.error('Error adding deletedAt to Users:', err.message);
    }
  }

  // Let's also check if other tables might need it, just in case, but usually it's just the one causing the error
  process.exit(0);
}

fixDeletedAt();

require('dotenv').config();
const db = require('./db');

const checkData = async () => {
  try {
    console.log('Checking database data...');
    
    const count = await db.query('SELECT COUNT(*) FROM cutoffs');
    console.log(`Total Cutoffs: ${count.rows[0].count}`);

    const types = await db.query('SELECT * FROM counselling_types');
    console.log('Counselling Types:', types.rows);

    const sample = await db.query('SELECT * FROM cutoffs LIMIT 5');
    console.log('Sample Cutoffs:', sample.rows);

  } catch (err) {
    console.error('Error checking data:', err);
  } finally {
    process.exit();
  }
};

checkData();

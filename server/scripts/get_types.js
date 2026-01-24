const db = require('../db');

const getIds = async () => {
  try {
    const res = await db.query('SELECT * FROM counselling_types ORDER BY id');
    console.log('Counselling Types:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

getIds();

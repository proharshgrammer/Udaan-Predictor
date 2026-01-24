const db = require('../db');

const seedCounsellingTypes = async () => {
  try {
    console.log('Seeding counseling types...');
    
    const types = ['AKTU', 'MHTCET'];
    
    // We assume 'exams' entry exists or we map them to a generic exam if specific exam ID is needed.
    // For now, let's just insert them. If they need a specific exam_id, we might default to JEE Main (1) 
    // or create new exams. AKTU is often JEE Main based, MHTCET is its own exam.
    
    // Let's check exams first or just create MHTCET exam
    await db.query(`INSERT INTO exams (name, code) VALUES ('MHT CET', 'MHTCET') ON CONFLICT DO NOTHING`);
    await db.query(`INSERT INTO exams (name, code) VALUES ('UPSEE', 'UPSEE') ON CONFLICT DO NOTHING`); // AKTU used to be UPSEE, now JEE Main mainly but let's keep it safe.

    // Map AKTU to JEE Main (usually ID 1, but we'll fetch)
    const jeeRes = await db.query(`SELECT id FROM exams WHERE code = 'JEE_MAIN'`);
    const mhtRes = await db.query(`SELECT id FROM exams WHERE code = 'MHTCET'`);
    
    const jeeId = jeeRes.rows[0]?.id;
    const mhtId = mhtRes.rows[0]?.id;

    if (jeeId) {
        await db.query(`INSERT INTO counselling_types (name, exam_id) VALUES ('AKTU', $1) ON CONFLICT DO NOTHING`, [jeeId]);
    }
    
    if (mhtId) {
        await db.query(`INSERT INTO counselling_types (name, exam_id) VALUES ('MHTCET', $1) ON CONFLICT DO NOTHING`, [mhtId]);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedCounsellingTypes();

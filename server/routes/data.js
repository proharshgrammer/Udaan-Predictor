const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('../db');
const { verifyAdmin } = require('../middleware/authMiddleware');

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Helper to Upsert College
const getOrCreateCollege = async (name, state) => {
  let res = await db.query('SELECT id FROM colleges WHERE name = $1 AND state = $2', [name, state]);
  if (res.rows.length > 0) return res.rows[0].id;
  
  res = await db.query('INSERT INTO colleges (name, state) VALUES ($1, $2) RETURNING id', [name, state]);
  return res.rows[0].id;
};

// Helper to Upsert Branch
const getOrCreateBranch = async (name, code) => {
  let res = await db.query('SELECT id FROM branches WHERE code = $1', [code]);
  if (res.rows.length > 0) return res.rows[0].id;

  res = await db.query('INSERT INTO branches (name, code) VALUES ($1, $2) RETURNING id', [name, code]);
  return res.rows[0].id;
};

router.post('/upload', verifyAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }

  const { counselling_type_id } = req.body;
  
  if (!counselling_type_id) {
     return res.status(400).send({ message: 'Counselling Type ID is required' });
  }

  // Create Import Record
  let importId;
  const client = await db.pool.connect();

  try {
    const importRes = await client.query(
      'INSERT INTO imports (filename, counselling_type_id, admin_id) VALUES ($1, $2, $3) RETURNING id',
      [req.file.originalname, counselling_type_id, req.userId] // req.userId from verifyAdmin
    );
    importId = importRes.rows[0].id;
  } catch (err) {
    client.release();
    return res.status(500).send({ message: 'Failed to initialize import', error: err.message });
  }

  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv({
      headers: false, // User confirmed no headers
      mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, '') 
    }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const logFile = 'import_log.txt';
      const log = (msg) => fs.appendFileSync(logFile, msg + '\n');
      
      log(`\n--- New Import Started: ${new Date().toISOString()} ---`);
      
      try {
        await client.query('BEGIN');
        
        let successCount = 0;
        let errorCount = 0;

        for (const row of results) {
          // Since headers: false, row is an object with keys '0', '1', '2'...
          const values = Object.values(row);
          
          // Debug first row
          if (successCount === 0 && errorCount === 0) {
             log(`First Row detected: ${JSON.stringify(values)}`);
          }

          // Check if this looks like a header row (e.g. contains "College" or "Year")
          // If so, skip it.
          if (values.some(v => typeof v === 'string' && v.toLowerCase().includes('college name'))) {
             log('Skipping apparent header row.');
             continue;
          }

          // Expected Format (10 columns based on user sample):
          // 0: College, 1: BranchCode, 2: BranchName, 3: Year, 4: Round, 5: Category, 6: Quota, 7: Gender, 8: Open, 9: Close
          
          if (values.length < 10) {
             log(`Skipping Row: Not enough columns (${values.length}). Row: ${JSON.stringify(values)}`);
             errorCount++;
             continue;
          }

          const collegeName = values[0];
          const branchCode = values[1];
          const branchName = values[2];
          const rawYear = values[3];
          const rawRound = values[4];
          const category = values[5];
          const quota = values[6];
          const gender = values[7];
          const rawOpen = values[8];
          const rawClose = values[9];
          
          // Location is missing in user data -> Default to Unknown or extract?
          const location = 'Unknown'; 

          // Sanitize Ranks (Remove commas)
          const parseRank = (val) => {
            if (!val) return 0;
            if (typeof val === 'string') return parseInt(val.replace(/,/g, ''));
            return parseInt(val);
          };

          const year = parseInt(rawYear);
          const round = parseInt(rawRound) || 1;
          const openingRank = parseRank(rawOpen);
          const closingRank = parseRank(rawClose);

          if (!collegeName || !branchName || isNaN(year) || isNaN(closingRank)) {
             log(`Skipping Invalid Row: ${JSON.stringify(values)}`);
             errorCount++;
             continue;
          }

          const collegeId = await getOrCreateCollege(collegeName, location);
          const branchId = await getOrCreateBranch(branchName, branchCode);

          // Insert with Import ID
          const query = `
            INSERT INTO cutoffs 
            (college_id, branch_id, counselling_type_id, year, round, category, quota, gender, opening_rank, closing_rank, import_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (college_id, branch_id, counselling_type_id, year, round, category, quota, gender)
            DO UPDATE SET 
              opening_rank = EXCLUDED.opening_rank, 
              closing_rank = EXCLUDED.closing_rank,
              import_id = EXCLUDED.import_id
          `;

          await client.query(query, [
            collegeId, branchId, counselling_type_id, year, round, category, quota, gender, openingRank, closingRank, importId
          ]);
          
          successCount++;
        }

        // Update Import Stats
        await client.query('UPDATE imports SET record_count = $1 WHERE id = $2', [successCount, importId]);

        await client.query('COMMIT');
        fs.unlinkSync(req.file.path);
        
        log(`Import Finished: ${successCount} success, ${errorCount} failed`);

        res.status(200).send({ 
          message: 'Data processing complete', 
          stats: { success: successCount, failed: errorCount } 
        });

      } catch (err) {
        log(`Import Error: ${err.message}`);
        await client.query('ROLLBACK');
        console.error('Import Error:', err);
        res.status(500).send({ message: 'Error processing CSV data', error: err.message });
      } finally {
        client.release();
      }
    });
});

// GET Import History
router.get('/history', verifyAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, u.username as admin_name, ct.name as counselling_name
      FROM imports i
      LEFT JOIN users u ON i.admin_id = u.id
      LEFT JOIN counselling_types ct ON i.counselling_type_id = ct.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// DELETE Import Batch
router.delete('/history/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Because of ON DELETE CASCADE on the FK, deleting the import record automatically deletes associated cutoffs.
    await db.query('DELETE FROM imports WHERE id = $1', [id]);
    res.json({ message: 'Import batch deleted successfully' });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// GET Counselling Types
router.get('/counselling-types', verifyAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM counselling_types ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('../db');
const { verifyAdmin } = require('../middleware/authMiddleware');

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Helper to Upsert College
const getOrCreateCollege = async (name, state, type) => {
  let res = await db.query('SELECT id FROM colleges WHERE name = $1 AND state = $2', [name, state]);
  if (res.rows.length > 0) {
    await db.query('UPDATE colleges SET type = $1 WHERE id = $2', [type, res.rows[0].id]);
    return res.rows[0].id;
  }
  
  res = await db.query('INSERT INTO colleges (name, state, type) VALUES ($1, $2, $3) RETURNING id', [name, state, type]);
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
  const logFile = 'import_log.txt';
  const log = (msg) => {
      try {
        fs.appendFileSync(logFile, msg + '\n');
      } catch (e) { console.error('Log Error:', e); }
  };

  if (!counselling_type_id) {
     return res.status(400).send({ message: 'Counselling Type ID is required' });
  }

  let importId;
  const client = await db.pool.connect();

  try {
    const importRes = await client.query(
      'INSERT INTO imports (filename, counselling_type_id, admin_id) VALUES ($1, $2, $3) RETURNING id',
      [req.file.originalname, counselling_type_id, req.userId] 
    );
    importId = importRes.rows[0].id;
  } catch (err) {
    client.release();
    return res.status(500).send({ message: 'Failed to initialize import', error: err.message });
  }

  log(`\n--- New Import Started: ${new Date().toISOString()} ---`);
  
  try {
    await client.query('BEGIN');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Caches
    const collegeCache = new Map();
    const branchCache = new Map();

    const BATCH_SIZE = 500;
    let batchCutoffs = [];

    // Flush Batch Helper
    const flushBatch = async () => {
      if (batchCutoffs.length === 0) return;

      // Deduplicate within batch to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
      const uniqueBatch = new Map();
      
      for (const item of batchCutoffs) {
          const key = `${item.college_id}-${item.branch_id}-${item.counselling_type_id}-${item.year}-${item.round}-${item.category}-${item.quota}-${item.gender}`;
          uniqueBatch.set(key, item);
      }
      
      const itemsToInsert = Array.from(uniqueBatch.values());

      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const item of itemsToInsert) {
        placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9}, $${paramIndex+10})`);
        values.push(
           item.college_id, item.branch_id, item.counselling_type_id, 
           item.year, item.round, item.category, item.quota, item.gender, 
           item.opening_rank, item.closing_rank, item.import_id
        );
        paramIndex += 11;
      }

      const query = `
        INSERT INTO cutoffs 
        (college_id, branch_id, counselling_type_id, year, round, category, quota, gender, opening_rank, closing_rank, import_id)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (college_id, branch_id, counselling_type_id, year, round, category, quota, gender)
        DO UPDATE SET 
          opening_rank = EXCLUDED.opening_rank, 
          closing_rank = EXCLUDED.closing_rank,
          import_id = EXCLUDED.import_id
      `;

      await client.query(query, values);
      batchCutoffs = [];
    };

    const stream = fs.createReadStream(req.file.path)
      .pipe(csv({
        headers: false, 
        mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, '') 
      }));
    
    let rowIndex = 0;

    for await (const row of stream) {
      // Use indexed access since headers: false defaults to 0, 1, 2...
      // csv-parser emits object { '0': '...', '1': '...' }
      const values = [];
      let i = 0;
      while (row[i] !== undefined) {
          values.push(row[i]);
          i++;
      }

      // First Row handling
      if (rowIndex === 0) {
         log(`First Row parsed: ${JSON.stringify(values)}`);
         if (values.length > 0 && typeof values[0] === 'string') {
             values[0] = values[0].replace(/^\ufeff/, '');
         }
      }
      rowIndex++;

      // Header check
      if (values.some(v => typeof v === 'string' && v.toLowerCase().includes('college name'))) {
         log('Skipping apparent header row.');
         continue;
      }

      // Strict 11 columns
      if (values.length < 11) {
         if (errorCount < 10) log(`Skipping Row (Not enough columns - ${values.length}): ${JSON.stringify(values)}`);
         errorCount++;
         continue;
      }

      const collegeType = values[0]; 
      const collegeName = values[1];
      const branchCode = values[2];
      const branchName = values[3];
      const rawYear = values[4];
      const rawRound = values[5];
      const category = values[6];
      const quota = values[7];
      const gender = values[8];
      const rawOpen = values[9];
      const rawClose = values[10];
      
      const location = 'Unknown'; 

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
         if (errorCount < 10) log(`Skipping Invalid Row: ${JSON.stringify(values)}`);
         errorCount++;
         continue;
      }

      try {
        // Resolve IDs
        let collegeId;
        const colKey = `${collegeName}|${location}`;
        if (collegeCache.has(colKey)) {
           collegeId = collegeCache.get(colKey);
        } else {
           collegeId = await getOrCreateCollege(collegeName, location, collegeType);
           collegeCache.set(colKey, collegeId);
        }

        let branchId;
        const brKey = `${branchCode}`; 
        if (branchCache.has(brKey)) {
           branchId = branchCache.get(brKey);
        } else {
           branchId = await getOrCreateBranch(branchName, branchCode);
           branchCache.set(brKey, branchId);
        }

        batchCutoffs.push({
            college_id: collegeId,
            branch_id: branchId,
            counselling_type_id,
            year,
            round,
            category,
            quota,
            gender,
            opening_rank: openingRank,
            closing_rank: closingRank,
            import_id: importId
        });
        
        successCount++;

        if (batchCutoffs.length >= BATCH_SIZE) {
            await flushBatch();
        }

      } catch (rowErr) {
         log(`Error processing row ${rowIndex}: ${rowErr.message}`);
         errorCount++;
      }
    }

    // Flush remaining
    await flushBatch();

    await client.query('UPDATE imports SET record_count = $1 WHERE id = $2', [successCount, importId]);

    await client.query('COMMIT');
    
    // Sync unlink
    try { fs.unlinkSync(req.file.path); } catch(e) {}
    
    log(`Import Finished: ${successCount} success, ${errorCount} failed`);

    res.status(200).send({ 
      message: 'Data processing complete', 
      stats: { success: successCount, failed: errorCount } 
    });

  } catch (err) {
    log(`Import Critical Error: ${err.message}`);
    await client.query('ROLLBACK');
    console.error('Import Error:', err);
    res.status(500).send({ message: 'Error processing CSV data', error: err.message });
  } finally {
    client.release();
  }
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

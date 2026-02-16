const express = require('express');
const router = express.Router();
const db = require('../db');
const { predictCutoff, calculateChance } = require('../services/predictor');
const redis = require('../config/redis');

router.post('/', async (req, res) => {
  try {
    const { rank, category, quota, gender, counselling_type } = req.body;

    if (!rank || !category || !quota || !gender) {
      return res.status(400).send({ message: 'Missing required fields: rank, category, quota, gender' });
    }

    // Cache Key
    const cacheKey = `predict:${JSON.stringify(req.body)}`;
    if (redis) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    }

    // 1. Build Query
    // Join counselling_types to get the name
    // Normalize Gender (Handle "Gender-Neutral" vs "Gender Neutral")
    // Database has mixed or specific formats, so we should be flexible or ensure match.
    // For now, let's try to match exactly what's passed, but also handle common variations if no result?
    // Actually, user fixed DB to "Gender-Neutral", so it should match.
    // But let's log the queryparams for debugging if it fails.
    
    // Normalization logic:
    // If DB expects "Gender Neutral" but we get "Gender-Neutral", replace.
    // However, current DB state has "Gender-Neutral", so strict match is fine.
    
    let query = `
      SELECT 
        c.name as college_name, 
        c.state,
        c.type as college_type,
        b.name as branch_name, 
        b.code as branch_code,
        cty.name as counselling_name,
        ct.year,
        ct.round,
        ct.closing_rank
      FROM cutoffs ct
      JOIN colleges c ON ct.college_id = c.id
      JOIN branches b ON ct.branch_id = b.id
      JOIN counselling_types cty ON ct.counselling_type_id = cty.id
      WHERE ct.category = $1 
      AND ct.quota = $2 
      AND ct.gender = $3
    `;

    const params = [category, quota, gender];
    let paramIndex = 4;

    // If specific counselling selected (and not 'Multi-Counselling' or empty), filter by it
    if (counselling_type && counselling_type !== 'Multi-Counselling' && counselling_type !== 'Multi') {
      query += ` AND LOWER(cty.name) = LOWER($${paramIndex})`;
      params.push(counselling_type);
      paramIndex++;
    }

    // Filter by Exam Type (User Request)
    // "Sort iits only for jee advance and other NITs and GFTIs for JEE mains."
    const { exam_type } = req.body;
    if (exam_type) {
      if (exam_type === 'JEE Advanced') {
        query += ` AND c.type = 'IIT'`; 
      } else if (exam_type === 'JEE Main') {
        query += ` AND c.type IN ('NIT', 'IIIT', 'GFTI')`;
      }
    }

    query += ` ORDER BY ct.college_id, ct.branch_id, ct.year ASC`;

    const result = await db.query(query, params);

    // Group by College+Branch+Counselling
    const grouped = {};
    result.rows.forEach(row => {
      const key = `${row.college_name}|${row.branch_name}|${row.counselling_name}`;
      if (!grouped[key]) {
        grouped[key] = {
          college: row.college_name,
          state: row.state,
          college_type: row.college_type, // Create field in response
          branch: row.branch_name,
          branch_code: row.branch_code,
          counselling: row.counselling_name,
          history: []
        };
      }
      grouped[key].history.push({ 
        year: row.year, 
        round: row.round,
        closing_rank: row.closing_rank 
      });
    });

    // 2. Process Prediction for each
    const predictions = [];

    for (const key in grouped) {
      const item = grouped[key];
      const { expected, sigma } = predictCutoff(item.history);
      const { band, prob } = calculateChance(parseInt(rank), expected, sigma);

      // Only add reasonable predictions (e.g. if rank is 1M and cutoff is 100, maybe filter? 
      // User requirements didn't specify strict filtering, but "Sort by chance".
      // We'll return everything and let frontend filter/sort.
      
      // Get Latest Data for Display
      const sortedHistory = [...item.history].sort((a,b) => a.year - b.year);
      const latest = sortedHistory[sortedHistory.length - 1];

      predictions.push({
        college: item.college,
        state: item.state,
        college_type: item.college_type, // Create field in response
        branch: item.branch,
        branch_code: item.branch_code,
        counselling_type: item.counselling,
        history: item.history,
        latest_cutoff: {
          year: latest.year,
          round: latest.round,
          closing_rank: latest.closing_rank
        },
        prediction: {
          expected_cutoff: expected,
          sigma: Math.round(sigma * 100) / 100,
          band,
          probability: prob
        }
      });
    }

    // Sort by Best Chance (Probability Descending, then Expected Cutoff Descending)
    predictions.sort((a, b) => b.prediction.probability - a.prediction.probability);

    res.json(predictions);

    if (redis) {
        await redis.set(cacheKey, JSON.stringify(predictions), 'EX', 3600); // Cache for 1 hour
    }

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Prediction error', error: err.message });
  }
});

// GET /metadata - Fetch dynamic options
router.get('/metadata', async (req, res) => {
  try {
    const { counselling_type } = req.query;
    
    // Base query: Get all distinct combinations
    let query = `
      SELECT DISTINCT ct.category, ct.quota, ct.gender 
      FROM cutoffs ct
      JOIN counselling_types cty ON ct.counselling_type_id = cty.id
    `;
    
    const params = [];

    // If specific counselling selected (and not Multi), filter by it
    if (counselling_type && counselling_type !== 'Multi' && counselling_type !== 'Multi-Counselling') {
       query += ` WHERE LOWER(cty.name) = LOWER($1)`;
       params.push(counselling_type);
    }

    const result = await db.query(query, params);

    // Extract unique values for each field
    const categories = new Set();
    const quotas = new Set();
    const genders = new Set();

    result.rows.forEach(row => {
      if (row.category) categories.add(row.category);
      if (row.quota) quotas.add(row.quota);
      if (row.gender) genders.add(row.gender);
    });

    // Default fallbacks if empty (to avoid broken UI)
    const response = {
      categories: categories.size > 0 ? Array.from(categories).sort() : ['OPEN', 'OBC-NCL', 'SC', 'ST', 'GEN-EWS'],
      quotas: quotas.size > 0 ? Array.from(quotas).sort() : ['AI', 'HS', 'OS'],
      genders: genders.size > 0 ? Array.from(genders).sort() : ['Gender-Neutral', 'Female-Only']
    };

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Metadata fetch error', error: err.message });
  }
});

module.exports = router;

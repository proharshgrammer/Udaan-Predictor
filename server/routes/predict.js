const express = require('express');
const router = express.Router();
const db = require('../db');
const { predictCutoff, calculateChance } = require('../services/predictor');

router.post('/', async (req, res) => {
  try {
    const { rank, category, quota, gender, counselling_type } = req.body;

    if (!rank || !category || !quota || !gender) {
      return res.status(400).send({ message: 'Missing required fields: rank, category, quota, gender' });
    }

    // 1. Build Query
    // Join counselling_types to get the name
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
      query += ` AND cty.name = $${paramIndex}`;
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

  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Prediction error', error: err.message });
  }
});

module.exports = router;

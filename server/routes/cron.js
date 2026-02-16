const express = require('express');
const router = express.Router();

// Middleware to verify cron secret
const verifyCronSecret = (req, res, next) => {
  const authHeader = req.headers['x-cron-secret'] || req.headers['authorization'];
  // Check if header matches CRON_SECRET (Bearer token or direct value)
  
  const secret = process.env.CRON_SECRET;
  
  if (!secret) {
      console.error('CRON_SECRET is not set in environment variables.');
      return res.status(500).json({ error: 'Server configuration error' });
  }

  // Allow "Bearer <secret>" or just "<secret>"
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (token !== secret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Cron Secret' });
  }

  next();
};

// GET /api/cron/sync
// This endpoint is called by an external cron service (e.g., cron-job.org)
router.get('/sync', verifyCronSecret, async (req, res) => {
  try {
    console.log(`[CRON] Sync triggered at ${new Date().toISOString()}`);

    // TODO: Add your background logic here
    // Example: 
    // await runPredictionModelUpdates();
    // await fetchNewData();

    res.json({ message: 'Sync executed successfully', timestamp: new Date() });
  } catch (error) {
    console.error('[CRON] Sync failed:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;

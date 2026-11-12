const express = require('express');
const { comparePrices } = require('../services/priceService');
const { optionalAuth } = require('../middleware/auth');
const { getStorage } = require('../storage');

const router = express.Router();

// GET /api/prices?query=&sort=asc|desc&store=all|amazon|flipkart|other&refresh=true|false
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const rawQuery = typeof req.query.query === 'string' ? req.query.query.trim() : '';

    if (rawQuery.length < 2 || rawQuery.length > 100) {
      return res.status(400).json({
        error: 'Search query must be between 2 and 100 characters.',
      });
    }

    const sort = req.query.sort === 'desc' ? 'desc' : 'asc';
    const store = ['all', 'amazon', 'flipkart', 'other'].includes(req.query.store)
      ? req.query.store
      : 'all';
    const refresh = req.query.refresh === 'true';

    const result = await comparePrices({
      query: rawQuery,
      sort,
      store,
      refresh,
    });

    // Record search history for authenticated users without blocking the response on failure
    if (req.user) {
      try {
        const storage = getStorage();
        await storage.searchHistory.add(req.user.id, {
          query: rawQuery,
          mode: result.mode,
        });
      } catch (historyErr) {
        console.warn('[History] Could not record search:', historyErr.message);
      }
    }

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;


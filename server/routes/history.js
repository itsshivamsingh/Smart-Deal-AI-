const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getStorage } = require('../storage');

const router = express.Router();

router.use(requireAuth);

// GET /api/history
router.get('/', async (req, res, next) => {
  try {
    const storage = getStorage();
    const history = await storage.searchHistory.getByUser(req.user.id, 15);
    return res.json({ history });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;


const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getStorage } = require('../storage');

const router = express.Router();

router.use(requireAuth);

// GET /api/wishlist
router.get('/', async (req, res, next) => {
  try {
    const storage = getStorage();
    const items = await storage.wishlist.getByUser(req.user.id);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

// POST /api/wishlist
router.post('/', async (req, res, next) => {
  try {
    const { title, image, category, store, price, url, source } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return res.status(400).json({ error: 'Product title is required.' });
    }

    const storage = getStorage();
    const item = await storage.wishlist.add(req.user.id, {
      title: title.trim(),
      image: typeof image === 'string' ? image : '',
      category: typeof category === 'string' ? category : 'Gadgets',
      store: typeof store === 'string' ? store : '',
      price: typeof price === 'number' && Number.isFinite(price) ? price : null,
      url: typeof url === 'string' ? url : '',
      source: typeof source === 'string' ? source : 'sample',
    });

    return res.status(201).json({ item });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/wishlist/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const storage = getStorage();
    const removed = await storage.wishlist.remove(req.user.id, req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'Wishlist item not found.' });
    }
    return res.json({ message: 'Removed from wishlist', id: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;


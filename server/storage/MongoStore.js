/**
 * MongoDB storage adapter using Mongoose.
 * Mongoose is required lazily ONLY when MONGO_URI is configured so the app
 * runs with zero DB setup by default.
 */
async function createMongoStore(mongoUri) {
  const mongoose = require('mongoose');

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
    },
    { timestamps: true }
  );

  const wishlistSchema = new mongoose.Schema(
    {
      userId: { type: String, required: true, index: true },
      title: { type: String, required: true },
      image: { type: String, default: '' },
      category: { type: String, default: 'Gadgets' },
      store: { type: String, default: '' },
      price: { type: Number, default: null },
      url: { type: String, default: '' },
      source: { type: String, default: 'sample' },
    },
    { timestamps: true }
  );

  const searchHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    query: { type: String, required: true },
    mode: { type: String, default: 'sample' },
    searchedAt: { type: Date, default: Date.now },
  });

  const priceCacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    updatedAt: { type: Date, default: Date.now },
  });

  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const WishlistItem =
    mongoose.models.WishlistItem || mongoose.model('WishlistItem', wishlistSchema);
  const SearchHistory =
    mongoose.models.SearchHistory || mongoose.model('SearchHistory', searchHistorySchema);
  const PriceCache =
    mongoose.models.PriceCache || mongoose.model('PriceCache', priceCacheSchema);

  const formatUser = (doc) =>
    doc
      ? {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          passwordHash: doc.passwordHash,
          createdAt: doc.createdAt?.toISOString(),
        }
      : null;

  const formatWishlist = (doc) =>
    doc
      ? {
          id: doc._id.toString(),
          userId: doc.userId,
          title: doc.title,
          image: doc.image,
          category: doc.category,
          store: doc.store,
          price: doc.price,
          url: doc.url,
          source: doc.source,
          createdAt: doc.createdAt?.toISOString(),
          updatedAt: doc.updatedAt?.toISOString(),
        }
      : null;

  const users = {
    async findByEmail(email) {
      const doc = await User.findOne({ email: email.trim().toLowerCase() }).lean();
      return formatUser(doc);
    },
    async findById(id) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await User.findById(id).lean();
      return formatUser(doc);
    },
    async create({ name, email, passwordHash }) {
      const doc = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
      });
      return formatUser(doc);
    },
  };

  const wishlist = {
    async getByUser(userId) {
      const docs = await WishlistItem.find({ userId }).sort({ createdAt: -1 }).lean();
      return docs.map(formatWishlist);
    },
    async findById(id) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await WishlistItem.findById(id).lean();
      return formatWishlist(doc);
    },
    async findByUserAndTitle(userId, title) {
      const escaped = title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const doc = await WishlistItem.findOne({
        userId,
        title: new RegExp(`^${escaped}$`, 'i'),
      }).lean();
      return formatWishlist(doc);
    },
    async add(userId, item) {
      const existing = await wishlist.findByUserAndTitle(userId, item.title);
      if (existing) {
        const updated = await WishlistItem.findByIdAndUpdate(
          existing.id,
          {
            title: item.title,
            image: item.image || '',
            category: item.category || 'Gadgets',
            store: item.store || '',
            price: typeof item.price === 'number' ? item.price : null,
            url: item.url || '',
            source: item.source || 'sample',
          },
          { new: true }
        ).lean();
        return formatWishlist(updated);
      }

      const doc = await WishlistItem.create({
        userId,
        title: item.title,
        image: item.image || '',
        category: item.category || 'Gadgets',
        store: item.store || '',
        price: typeof item.price === 'number' ? item.price : null,
        url: item.url || '',
        source: item.source || 'sample',
      });
      return formatWishlist(doc);
    },
    async remove(userId, id) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await WishlistItem.deleteOne({ _id: id, userId });
      return res.deletedCount > 0;
    },
  };

  const searchHistory = {
    async getByUser(userId, limit = 15) {
      const docs = await SearchHistory.find({ userId })
        .sort({ searchedAt: -1 })
        .limit(limit)
        .lean();
      return docs.map((d) => ({
        id: d._id.toString(),
        userId: d.userId,
        query: d.query,
        mode: d.mode,
        searchedAt: d.searchedAt?.toISOString(),
      }));
    },
    async add(userId, { query, mode }) {
      const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await SearchHistory.deleteMany({
        userId,
        query: new RegExp(`^${escaped}$`, 'i'),
      });
      const doc = await SearchHistory.create({
        userId,
        query: query.trim(),
        mode: mode || 'sample',
        searchedAt: new Date(),
      });
      return {
        id: doc._id.toString(),
        userId: doc.userId,
        query: doc.query,
        mode: doc.mode,
        searchedAt: doc.searchedAt.toISOString(),
      };
    },
  };

  const priceCache = {
    async get(key) {
      const doc = await PriceCache.findOne({ key }).lean();
      if (!doc) return null;
      if (new Date(doc.expiresAt).getTime() <= Date.now()) {
        await PriceCache.deleteOne({ key });
        return null;
      }
      return doc.value;
    },
    async set(key, value, ttlHours = 3) {
      const ttlMs = Math.max(0.1, Number(ttlHours) || 3) * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + ttlMs);
      await PriceCache.findOneAndUpdate(
        { key },
        { key, value, expiresAt, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      return value;
    },
    async delete(key) {
      const res = await PriceCache.deleteOne({ key });
      return res.deletedCount > 0;
    },
  };

  return {
    type: 'mongo',
    label: 'MongoDB (Mongoose connected)',
    users,
    wishlist,
    searchHistory,
    priceCache,
  };
}

module.exports = { createMongoStore };


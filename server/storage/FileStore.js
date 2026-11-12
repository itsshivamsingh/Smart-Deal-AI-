const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  wishlist: path.join(DATA_DIR, 'wishlist.json'),
  searchHistory: path.join(DATA_DIR, 'searchHistory.json'),
  priceCache: path.join(DATA_DIR, 'priceCache.json'),
};

/**
 * Ensures the data directory and JSON backing files exist on disk.
 */
function ensureStorageFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  for (const [key, filePath] of Object.entries(FILES)) {
    if (!fs.existsSync(filePath)) {
      const initial = key === 'priceCache' ? {} : [];
      fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf8');
    }
  }
}

function readJson(filePath, fallback) {
  try {
    ensureStorageFiles();
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`[FileStore] Failed to read ${path.basename(filePath)}:`, err.message);
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureStorageFiles();
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

/**
 * Local JSON file-backed storage adapter (default when MONGO_URI is unset).
 */
function createFileStore() {
  ensureStorageFiles();

  const users = {
    async findByEmail(email) {
      const list = readJson(FILES.users, []);
      const normalized = email.trim().toLowerCase();
      return list.find((u) => u.email === normalized) || null;
    },

    async findById(id) {
      const list = readJson(FILES.users, []);
      return list.find((u) => u.id === id) || null;
    },

    async create({ name, email, passwordHash }) {
      const list = readJson(FILES.users, []);
      const newUser = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      list.push(newUser);
      writeJson(FILES.users, list);
      return newUser;
    },
  };

  const wishlist = {
    async getByUser(userId) {
      const list = readJson(FILES.wishlist, []);
      return list
        .filter((item) => item.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async findById(id) {
      const list = readJson(FILES.wishlist, []);
      return list.find((item) => item.id === id) || null;
    },

    async findByUserAndTitle(userId, title) {
      const list = readJson(FILES.wishlist, []);
      const norm = title.trim().toLowerCase();
      return (
        list.find(
          (item) => item.userId === userId && item.title.trim().toLowerCase() === norm
        ) || null
      );
    },

    async add(userId, item) {
      const list = readJson(FILES.wishlist, []);
      const norm = item.title.trim().toLowerCase();
      const existingIndex = list.findIndex(
        (entry) => entry.userId === userId && entry.title.trim().toLowerCase() === norm
      );

      const record = {
        id: existingIndex >= 0 ? list[existingIndex].id : crypto.randomUUID(),
        userId,
        title: item.title,
        image: item.image || '',
        category: item.category || 'Gadgets',
        store: item.store || '',
        price: typeof item.price === 'number' ? item.price : null,
        url: item.url || '',
        source: item.source || 'sample',
        createdAt:
          existingIndex >= 0 ? list[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        list[existingIndex] = record;
      } else {
        list.push(record);
      }

      writeJson(FILES.wishlist, list);
      return record;
    },

    async remove(userId, id) {
      const list = readJson(FILES.wishlist, []);
      const filtered = list.filter((item) => !(item.userId === userId && item.id === id));
      if (filtered.length === list.length) {
        return false;
      }
      writeJson(FILES.wishlist, filtered);
      return true;
    },
  };

  const searchHistory = {
    async getByUser(userId, limit = 15) {
      const list = readJson(FILES.searchHistory, []);
      return list
        .filter((entry) => entry.userId === userId)
        .sort((a, b) => new Date(b.searchedAt) - new Date(a.searchedAt))
        .slice(0, limit);
    },

    async add(userId, { query, mode }) {
      const list = readJson(FILES.searchHistory, []);
      const normalized = query.trim().toLowerCase();
      // Remove duplicate of the same query for this user so the latest moves to top
      const filtered = list.filter(
        (entry) =>
          !(entry.userId === userId && entry.query.trim().toLowerCase() === normalized)
      );

      const record = {
        id: crypto.randomUUID(),
        userId,
        query: query.trim(),
        mode: mode || 'sample',
        searchedAt: new Date().toISOString(),
      };

      filtered.push(record);
      // Cap total stored history per user at 50 entries
      const userEntries = filtered.filter((e) => e.userId === userId);
      let finalList = filtered;
      if (userEntries.length > 50) {
        const keepIds = new Set(
          userEntries
            .sort((a, b) => new Date(b.searchedAt) - new Date(a.searchedAt))
            .slice(0, 50)
            .map((e) => e.id)
        );
        finalList = filtered.filter((e) => e.userId !== userId || keepIds.has(e.id));
      }

      writeJson(FILES.searchHistory, finalList);
      return record;
    },
  };

  const priceCache = {
    async get(key) {
      const cacheMap = readJson(FILES.priceCache, {});
      const entry = cacheMap[key];
      if (!entry) return null;

      if (Date.now() > entry.expiresAt) {
        delete cacheMap[key];
        writeJson(FILES.priceCache, cacheMap);
        return null;
      }
      return entry.value;
    },

    async set(key, value, ttlHours = 3) {
      const cacheMap = readJson(FILES.priceCache, {});
      const ttlMs = Math.max(0.1, Number(ttlHours) || 3) * 60 * 60 * 1000;
      cacheMap[key] = {
        value,
        updatedAt: new Date().toISOString(),
        expiresAt: Date.now() + ttlMs,
      };
      writeJson(FILES.priceCache, cacheMap);
      return value;
    },

    async delete(key) {
      const cacheMap = readJson(FILES.priceCache, {});
      if (!(key in cacheMap)) return false;
      delete cacheMap[key];
      writeJson(FILES.priceCache, cacheMap);
      return true;
    },
  };

  return {
    type: 'file',
    label: 'local JSON files (MongoDB not configured)',
    users,
    wishlist,
    searchHistory,
    priceCache,
  };
}

module.exports = { createFileStore };


const { createFileStore } = require('./FileStore');

let activeStorage = null;

/**
 * Initializes the storage adapter once at server startup.
 * Uses MongoStore if MONGO_URI is set and connects; otherwise defaults to FileStore.
 */
async function initStorage() {
  if (activeStorage) return activeStorage;

  const mongoUri = process.env.MONGO_URI && process.env.MONGO_URI.trim();
  if (mongoUri) {
    try {
      const { createMongoStore } = require('./MongoStore');
      activeStorage = await createMongoStore(mongoUri);
      console.log(`Storage: ${activeStorage.label}`);
      return activeStorage;
    } catch (err) {
      console.error(
        `[Storage] Failed to connect to MongoDB (${err.message}). Falling back to local JSON files.`
      );
    }
  }

  activeStorage = createFileStore();
  console.log(`Storage: ${activeStorage.label}`);
  return activeStorage;
}

/**
 * Returns the initialized storage adapter.
 */
function getStorage() {
  if (!activeStorage) {
    throw new Error('Storage has not been initialized. Call initStorage() first.');
  }
  return activeStorage;
}

module.exports = { initStorage, getStorage };


const DEV_JWT_FALLBACK = 'smartdeal-ai-dev-secret-key-do-not-use-in-prod';

let warnedJwt = false;

function getConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  let jwtSecret = process.env.JWT_SECRET && process.env.JWT_SECRET.trim();

  if (!jwtSecret) {
    if (nodeEnv === 'production') {
      console.warn(
        '[Config] WARNING: JWT_SECRET is not set in production! Using temporary fallback.'
      );
    } else if (!warnedJwt) {
      console.warn(
        '[Config] Warning: JWT_SECRET not set in environment. Using development fallback secret.'
      );
      warnedJwt = true;
    }
    jwtSecret = DEV_JWT_FALLBACK;
  }

  const parsedTtl = Number(process.env.CACHE_TTL_HOURS);
  const cacheTtlHours =
    Number.isFinite(parsedTtl) && parsedTtl > 0 ? parsedTtl : 3;

  return {
    port: Number(process.env.PORT) || 5000,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    jwtSecret,
    cacheTtlHours,
    serpApiKey: (process.env.SERPAPI_KEY || '').trim(),
    mongoUri: (process.env.MONGO_URI || '').trim(),
    nodeEnv,
  };
}

module.exports = { getConfig };


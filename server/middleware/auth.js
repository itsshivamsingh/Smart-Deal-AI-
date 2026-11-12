const jwt = require('jsonwebtoken');
const { getConfig } = require('../config/env');
const { getStorage } = require('../storage');

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

/**
 * Extracts and verifies a Bearer JWT token if present.
 */
async function resolveUserFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const { jwtSecret } = getConfig();
  const decoded = jwt.verify(token, jwtSecret);
  if (!decoded?.id) return null;

  const storage = getStorage();
  const user = await storage.users.findById(decoded.id);
  return sanitizeUser(user);
}

/**
 * Requires a valid JWT token; returns 401 otherwise.
 */
async function requireAuth(req, res, next) {
  try {
    const user = await resolveUserFromHeader(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * Attaches req.user when a valid JWT is present, without blocking guests.
 */
async function optionalAuth(req, _res, next) {
  try {
    req.user = await resolveUserFromHeader(req.headers.authorization);
  } catch {
    req.user = null;
  }
  return next();
}

module.exports = { requireAuth, optionalAuth, sanitizeUser };


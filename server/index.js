// Load dotenv FIRST before importing modules that read process.env
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { getConfig } = require('./config/env');
const { initStorage, getStorage } = require('./storage');
const authRoutes = require('./routes/auth');
const priceRoutes = require('./routes/prices');
const wishlistRoutes = require('./routes/wishlist');
const historyRoutes = require('./routes/history');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const config = getConfig();
const app = express();

// Security, logging, CORS, and JSON body parsing
app.use(helmet());
app.use(
  cors({
    origin: [config.clientUrl, 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

// Rate limit: 30 requests per minute per IP across /api/*
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please wait a minute and try again.',
  },
});

app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  const storage = getStorage();
  res.json({
    status: 'ok',
    service: 'SmartDeal AI API',
    storage: storage.type,
    storageLabel: storage.label,
    mode: config.serpApiKey ? 'live' : 'sample',
    cacheTtlHours: config.cacheTtlHours,
    timestamp: new Date().toISOString(),
  });
});

// Core API routes
app.use('/api/auth', authRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/history', historyRoutes);

// 404 & central error handlers
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await initStorage();
    app.listen(config.port, () => {
      const modeLabel = config.serpApiKey
        ? 'LIVE (SerpApi Google Shopping)'
        : 'SAMPLE (Add SERPAPI_KEY in server/.env for live prices)';
      console.log(`Price Mode: ${modeLabel}`);
      console.log(`SmartDeal AI server listening on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('[Startup Error] Failed to initialize server:', err);
    process.exit(1);
  }
}

startServer();


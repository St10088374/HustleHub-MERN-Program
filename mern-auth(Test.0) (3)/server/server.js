const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const logger = require('./utils/logger');

dotenv.config();

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// Helmet: sets secure HTTP headers including Content-Security-Policy & HSTS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:5173', 'https://localhost:5173', 'http://localhost:5000', 'https://localhost:5000'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.USE_HTTPS === 'true' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: restrict to frontend origin
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://localhost:5173',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS_BLOCKED', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing with strict limits to mitigate DOS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize against NoSQL injection
app.use(mongoSanitize());

// Sanitize against XSS
app.use(xss());

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('RATE_LIMIT_EXCEEDED_GLOBAL', { ip: req.ip, path: req.originalUrl });
    res.status(options.statusCode).json(options.message);
  },
});
app.use(globalLimiter);

// Auth-specific rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('RATE_LIMIT_EXCEEDED_AUTH', { ip: req.ip, path: req.originalUrl });
    res.status(options.statusCode).json(options.message);
  },
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/gigs', require('./routes/gigs'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/transactions', require('./routes/transactions'));

// Health check
app.get('/', (req, res) =>
  res.json({
    message: 'HustleHub+ API is running',
    version: '2.0.0',
    protocol: req.protocol,
    secure: req.secure,
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (prevents leaking internal stack traces or database info)
app.use((err, req, res, next) => {
  logger.error('UNHANDLED_EXCEPTION', {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Server Startup & HTTPS Configuration ────────────────────────────────────
const PORT = process.env.PORT || 5000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

let server;
const keyPath = path.join(__dirname, 'certs', 'server.key');
const certPath = path.join(__dirname, 'certs', 'server.cert');

if (USE_HTTPS && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  server = https.createServer(httpsOptions, app);
  logger.info('SERVER_CONFIG', { protocol: 'HTTPS', port: PORT });
} else {
  server = http.createServer(app);
  logger.info('SERVER_CONFIG', { protocol: 'HTTP', port: PORT, httpsAvailable: fs.existsSync(keyPath) });
}

// Only connect and listen if executed directly (not required as a test module)
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hustlehub-plus')
    .then(() => {
      logger.info('DATABASE_CONNECTED', { uri: process.env.MONGO_URI ? 'Connected to configured URI' : 'Default localhost' });
      server.listen(PORT, () => {
        const proto = USE_HTTPS && fs.existsSync(keyPath) ? 'https' : 'http';
        console.log(`🚀 HustleHub+ server running on ${proto}://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      logger.error('DATABASE_CONNECTION_ERROR', { error: err.message });
      process.exit(1);
    });
}

module.exports = { app, server };

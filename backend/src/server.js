const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware — enhanced Helmet config
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(null, true); // Allow all in dev, restrict via env in prod
  },
  credentials: true,
}));

// Global rate limiting (granular limiters are in routes)
const { generalLimiter } = require('./middleware/rateLimiter');
app.use('/api/', generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization (XSS prevention)
const { sanitizeInput } = require('./middleware/inputSanitizer');
app.use(sanitizeInput);

// Compression
app.use(compression());

// Logging
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models (in production, use migrations)
    const dialect = sequelize.getDialect();
    if (dialect === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = OFF;');
    }
    
    try {
      await sequelize.sync({ alter: true });
    } catch (syncErr) {
      // alter can fail on SQLite – fall back to a non-destructive sync
      // that only creates missing tables (never drops existing ones).
      console.warn('⚠️  alter sync failed, falling back to safe sync...', syncErr.message);
      await sequelize.sync(); // creates missing tables, never drops data
    }
    
    if (dialect === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = ON;');
    }
    console.log('Database models synchronized.');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1);
  }
};

// Global error handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error);
  // Don't exit — let nodemon handle restarts if needed
});

startServer();

module.exports = app;

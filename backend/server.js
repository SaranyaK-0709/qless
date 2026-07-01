const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Import socket handler
const initializeSocket = require('./socket');

// Import database pool (to verify connection on startup)
const pool = require('./config/db');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ─── Security Middleware ─────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,   // disabled for dev; enable in production
  crossOriginEmbedderPolicy: false
}));

// ─── Rate Limiting ───────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 5000 : 20,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Core Middleware ─────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Make io accessible to route handlers via req.app.get('io')
app.set('io', io);

// ─── API Routes ──────────────────────────────────────

// Health check (no rate limit)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'QLess API',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's'
  });
});

// Auth routes (strict rate limit)
app.use('/api/auth', authLimiter, authRoutes);

// Business API routes (standard rate limit)
app.use('/api/organizations', apiLimiter, organizationRoutes);
app.use('/api/tokens', apiLimiter, tokenRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/super-admin', apiLimiter, superAdminRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);

// ─── Socket.IO ───────────────────────────────────────
initializeSocket(io);

// ─── 404 Handler ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// ─── Global Error Handler ────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ─── Start Server ────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected');
    connection.release();

    server.listen(PORT, () => {
      console.log(`\n🚀 QLess server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO ready for real-time connections`);
      console.log(`🔒 Security: Helmet + Rate Limiting active`);
      console.log(`🏥 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    console.error('   Make sure MySQL is running and the database "qless" exists.');
    console.error('   Run: mysql -u root -p < ../database/schema.sql\n');
    process.exit(1);
  }
};

startServer();

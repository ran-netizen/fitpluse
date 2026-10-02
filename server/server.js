const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Diagnostic Health Check (does not block on DB to allow server monitoring)
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({
    status: 'ok',
    message: 'Fitness & Workout Logger API is running',
    database: {
      status: states[readyState] || 'unknown',
      connected: readyState === 1,
      name: mongoose.connection.name || null,
      configured: Boolean(process.env.MONGO_URI)
    },
    timestamp: new Date().toISOString()
  });
});

// Database connection middleware for all functional API routes
// Ensures Mongoose is connected before any controller queries the database
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(`[DATABASE ROUTE BLOCKED]: ${error.message}`);
    return res.status(503).json({
      error: 'Database connection unavailable',
      details: error.message,
      help: 'Ensure MONGO_URI is set in Vercel Environment Variables and MongoDB Atlas Network Access permits 0.0.0.0/0'
    });
  }
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);

const PORT = process.env.PORT || 5000;

// Listen only when not run under serverless wrapper
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Email service configured with: ${process.env.EMAIL_USER ? process.env.EMAIL_USER : 'None'}`);
  });
}

module.exports = app;
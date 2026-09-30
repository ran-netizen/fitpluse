const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const isDbConnected = () => mongoose.connection.readyState === 1;

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitness_logger_academic_secret_key_2026');

      if (isDbConnected()) {
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({ error: 'User not found, authorization denied' });
        }
      } else {
        // Fallback in-memory
        const { getInMemoryUserById } = require('../controllers/authController');
        const user = getInMemoryUserById(decoded.id);
        if (!user) {
          return res.status(401).json({ error: 'User not found, authorization denied' });
        }
        req.user = { _id: user._id, name: user.name, email: user.email };
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };

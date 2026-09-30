const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

// In-memory fallback users for offline development
const inMemoryUsers = [];

const isDbConnected = () => mongoose.connection.readyState === 1;

const generateToken = (id) => {
  return jwt.sign(
    { id: id.toString() },
    process.env.JWT_SECRET || 'fitness_logger_academic_secret_key_2026',
    { expiresIn: '7d' }
  );
};

const getInMemoryUserById = (id) => {
  return inMemoryUsers.find((u) => u._id.toString() === id.toString());
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide all required fields (name, email, password)' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (isDbConnected()) {
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    }

    // Fallback in-memory
    const existing = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: new mongoose.Types.ObjectId(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    inMemoryUsers.push(newUser);

    return res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      token: generateToken(newUser._id)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (user && (await user.matchPassword(password))) {
        return res.status(200).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id)
        });
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Fallback in-memory
    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (user && (await bcrypt.compare(password, user.password))) {
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  return res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getInMemoryUserById
};

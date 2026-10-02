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

  // 1. Lowercase and trim email
  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedName = String(name).trim();

  console.log(`\n========================================`);
  console.log(`[AUTH REGISTER ATTEMPT]`);
  console.log(`Email: "${normalizedEmail}"`);
  console.log(`Name: "${normalizedName}"`);
  console.log(`Database Connected: ${isDbConnected()} (readyState: ${mongoose.connection.readyState}, DB: ${mongoose.connection.name || 'none'})`);
  console.log(`========================================\n`);

  try {
    if (isDbConnected()) {
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        console.log(`[AUTH REGISTER] User already exists in MongoDB Atlas: "${normalizedEmail}"`);
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const user = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        password
      });

      console.log(`[AUTH REGISTER SUCCESS] User created in MongoDB Atlas!`);
      console.log(`ID: ${user._id}, Name: "${user.name}", Email: "${user.email}"`);

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    }

    // Fallback in-memory
    console.log(`[AUTH REGISTER IN-MEMORY] Registering in local fallback store...`);
    const existing = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (existing) {
      console.log(`[AUTH REGISTER IN-MEMORY] User already exists in local store: "${normalizedEmail}"`);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: new mongoose.Types.ObjectId(),
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    inMemoryUsers.push(newUser);

    console.log(`[AUTH REGISTER IN-MEMORY SUCCESS] User created in memory: ${newUser._id}`);
    console.log(`Total in-memory users: ${inMemoryUsers.length}`);

    return res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      token: generateToken(newUser._id)
    });
  } catch (error) {
    console.error(`[AUTH REGISTER ERROR]:`, error.message);
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

  // 1. Lowercase and trim email
  const normalizedEmail = String(email).toLowerCase().trim();

  console.log(`\n========================================`);
  console.log(`[AUTH LOGIN ATTEMPT]`);
  console.log(`Email provided: "${normalizedEmail}"`);
  console.log(`Database Connected: ${isDbConnected()} (readyState: ${mongoose.connection.readyState}, DB: ${mongoose.connection.name || 'none'})`);
  console.log(`========================================\n`);

  try {
    if (isDbConnected()) {
      // 2. Log what user is found during User.findOne()
      console.log(`[AUTH FIND] Searching MongoDB Atlas for email: "${normalizedEmail}"...`);
      const user = await User.findOne({ email: normalizedEmail });

      console.log(`[AUTH FIND RESULT]:`, user ? {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      } : 'null (No user found)');

      if (!user) {
        // Query all existing user emails to help debug typos
        const existingUsers = await User.find({}, 'email name');
        console.log(`[AUTH DEBUG] Total users in Atlas database "${mongoose.connection.name}": ${existingUsers.length}`);
        console.log(`[AUTH DEBUG] Registered emails in database:`, existingUsers.map((u) => u.email));
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check password
      const isPasswordMatch = await user.matchPassword(password);
      console.log(`[AUTH PASSWORD CHECK] Password matches: ${isPasswordMatch}`);

      if (!isPasswordMatch) {
        console.log(`[AUTH FAILED] Password mismatch for user: "${normalizedEmail}"`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      console.log(`[AUTH LOGIN SUCCESS] Logged in user: "${user.name}" (${user._id})`);

      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    }

    // Fallback in-memory
    console.log(`[AUTH FIND IN-MEMORY] Searching local store for email: "${normalizedEmail}"...`);
    console.log(`[AUTH DEBUG] Existing in-memory emails (${inMemoryUsers.length}):`, inMemoryUsers.map((u) => u.email));

    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    console.log(`[AUTH IN-MEMORY FIND RESULT]:`, user ? {
      id: user._id,
      name: user.name,
      email: user.email
    } : 'null (No user found in memory)');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log(`[AUTH IN-MEMORY PASSWORD CHECK] Matches: ${isPasswordMatch}`);

    if (!isPasswordMatch) {
      console.log(`[AUTH IN-MEMORY FAILED] Password mismatch for user: "${normalizedEmail}"`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log(`[AUTH IN-MEMORY LOGIN SUCCESS] Logged in user: "${user.name}"`);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(`[AUTH LOGIN ERROR]:`, error.message);
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

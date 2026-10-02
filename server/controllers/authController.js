const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateOtp, sendVerificationEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign(
    { id: id.toString() },
    process.env.JWT_SECRET || 'fitness_logger_academic_secret_key_2026',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user & generate 6-digit OTP
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
  console.log(`Database: ${mongoose.connection.name || 'none'}`);
  console.log(`========================================\n`);

  try {
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.isVerified) {
        console.log(`[AUTH REGISTER] User already exists & verified: "${normalizedEmail}"`);
        return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      }

      // Account exists but unverified: update name, password & send fresh code
      console.log(`[AUTH REGISTER] Unverified account exists in MongoDB Atlas. Reissuing OTP for "${normalizedEmail}"...`);
      user.name = normalizedName;
      user.password = password; // Pre-save hook will rehash
      user.verificationOtp = otp;
      user.verificationOtpExpires = otpExpires;
      await user.save();

      await sendVerificationEmail(normalizedEmail, otp, user.name);

      return res.status(200).json({
        message: 'Verification code sent to your email. Please enter the 6-digit code to complete registration.',
        email: normalizedEmail,
        requireVerification: true
      });
    }

    // New permanent registration in MongoDB Atlas
    user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
      isVerified: false
    });

    console.log(`[AUTH REGISTER SUCCESS] New user permanently saved to MongoDB Atlas: ${user._id}`);
    await sendVerificationEmail(normalizedEmail, otp, user.name);

    return res.status(201).json({
      message: 'Account created! Please enter the 6-digit verification code sent to your email.',
      email: normalizedEmail,
      requireVerification: true
    });
  } catch (error) {
    console.error(`[AUTH REGISTER ERROR]:`, error.message);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Verify 6-digit email code and activate account
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Please provide both email and 6-digit verification code' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const cleanOtp = String(otp).trim();

  console.log(`\n========================================`);
  console.log(`[AUTH VERIFY EMAIL ATTEMPT]`);
  console.log(`Email: "${normalizedEmail}", Code entered: "${cleanOtp}"`);
  console.log(`========================================\n`);

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account is already verified. Please sign in directly.' });
    }

    if (!user.verificationOtp || user.verificationOtp !== cleanOtp) {
      console.log(`[AUTH VERIFY FAILED] Invalid code for ${normalizedEmail}. Expected: ${user.verificationOtp}, Received: ${cleanOtp}`);
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    if (!user.verificationOtpExpires || new Date() > new Date(user.verificationOtpExpires)) {
      console.log(`[AUTH VERIFY FAILED] Code expired for ${normalizedEmail}`);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();

    console.log(`[AUTH VERIFY SUCCESS] Account permanently activated on MongoDB Atlas: ${user.email} (${user._id})`);

    const nutrition = user.getCalculatedNutrition();
    const token = generateToken(user._id);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      weight: user.weight,
      fitnessGoal: user.fitnessGoal,
      customCalorieTarget: user.customCalorieTarget,
      customProteinTarget: user.customProteinTarget,
      nutrition,
      token
    });
  } catch (error) {
    console.error(`[AUTH VERIFY ERROR]:`, error.message);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Resend 6-digit verification code
// @route   POST /api/auth/resend-verification-code
// @access  Public
const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please provide email address' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  try {
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account is already verified. You can sign in directly.' });
    }

    user.verificationOtp = otp;
    user.verificationOtpExpires = otpExpires;
    await user.save();

    await sendVerificationEmail(normalizedEmail, otp, user.name);

    return res.status(200).json({
      message: 'A fresh 6-digit verification code has been dispatched to your email.'
    });
  } catch (error) {
    console.error(`[AUTH RESEND ERROR]:`, error.message);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Authenticate user & get token (Login) - Password sign in ONLY
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  console.log(`\n========================================`);
  console.log(`[AUTH LOGIN ATTEMPT]`);
  console.log(`Email provided: "${normalizedEmail}"`);
  console.log(`Database: ${mongoose.connection.name || 'none'}`);
  console.log(`========================================\n`);

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`[AUTH FIND RESULT]: null (No user found for "${normalizedEmail}" in DB: ${mongoose.connection.name})`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      console.log(`[AUTH FAILED] Password mismatch for user: "${normalizedEmail}"`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check verification status
    if (!user.isVerified) {
      console.log(`[AUTH LOGIN WARNING] User "${normalizedEmail}" is not verified.`);
      return res.status(403).json({
        error: 'Please verify your email to continue',
        isVerified: false,
        requireVerification: true,
        email: normalizedEmail
      });
    }

    console.log(`[AUTH LOGIN SUCCESS] Logged in verified user: "${user.name}" (${user._id})`);

    const nutrition = user.getCalculatedNutrition();

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      weight: user.weight,
      fitnessGoal: user.fitnessGoal,
      customCalorieTarget: user.customCalorieTarget,
      customProteinTarget: user.customProteinTarget,
      nutrition,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(`[AUTH LOGIN ERROR]:`, error.message);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Update weight-based nutrition targets and custom overrides
// @route   PUT /api/auth/nutrition-targets
// @access  Private
const updateNutritionTargets = async (req, res) => {
  const { weight, fitnessGoal, customCalorieTarget, customProteinTarget } = req.body;

  try {
    const validGoals = ['lose_fat', 'maintain', 'build_muscle'];
    if (fitnessGoal && !validGoals.includes(fitnessGoal)) {
      return res.status(400).json({ error: 'Invalid fitness goal. Must be lose_fat, maintain, or build_muscle' });
    }

    if (weight !== undefined && (isNaN(Number(weight)) || Number(weight) <= 0)) {
      return res.status(400).json({ error: 'Weight must be a positive number' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (weight !== undefined) user.weight = Number(weight);
    if (fitnessGoal) user.fitnessGoal = fitnessGoal;
    if (customCalorieTarget !== undefined) {
      user.customCalorieTarget = customCalorieTarget === null || customCalorieTarget === '' ? null : Number(customCalorieTarget);
    }
    if (customProteinTarget !== undefined) {
      user.customProteinTarget = customProteinTarget === null || customProteinTarget === '' ? null : Number(customProteinTarget);
    }

    await user.save();

    const nutrition = user.getCalculatedNutrition();

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      weight: user.weight,
      fitnessGoal: user.fitnessGoal,
      customCalorieTarget: user.customCalorieTarget,
      customProteinTarget: user.customProteinTarget,
      nutrition
    });
  } catch (error) {
    console.error(`[UPDATE NUTRITION TARGETS ERROR]:`, error.message);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const nutrition = user.getCalculatedNutrition();
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      weight: user.weight,
      fitnessGoal: user.fitnessGoal,
      customCalorieTarget: user.customCalorieTarget,
      customProteinTarget: user.customProteinTarget,
      nutrition
    });
  } catch (error) {
    console.error(`[GET ME ERROR]:`, error.message);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  updateNutritionTargets,
  getMe
};

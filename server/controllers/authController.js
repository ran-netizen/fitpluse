const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateOtp, sendVerificationEmail } = require('../utils/emailService');

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

const calculateNutritionHelper = (weight, goal, customCal, customProt) => {
  const userWeight = weight && Number(weight) > 0 ? Number(weight) : 70;
  const recommendedProtein = Math.round(userWeight * 2.0);
  const baseMaintenance = Math.round(userWeight * 32);

  let recommendedCalories = baseMaintenance;
  if (goal === 'lose_fat') {
    recommendedCalories = Math.max(baseMaintenance - 400, 1200);
  } else if (goal === 'build_muscle') {
    recommendedCalories = baseMaintenance + 300;
  }

  return {
    calorieTarget: customCal !== null && customCal !== undefined ? Number(customCal) : recommendedCalories,
    proteinTarget: customProt !== null && customProt !== undefined ? Number(customProt) : recommendedProtein,
    recommendedCalories,
    recommendedProtein,
    isCustomCalorie: customCal !== null && customCal !== undefined,
    isCustomProtein: customProt !== null && customProt !== undefined
  };
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
  console.log(`Database Connected: ${isDbConnected()} (readyState: ${mongoose.connection.readyState}, DB: ${mongoose.connection.name || 'none'})`);
  console.log(`========================================\n`);

  try {
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (isDbConnected()) {
      let user = await User.findOne({ email: normalizedEmail });

      if (user) {
        if (user.isVerified) {
          console.log(`[AUTH REGISTER] User already exists & verified: "${normalizedEmail}"`);
          return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
        }

        // Account exists but unverified: update name, password & send fresh code
        console.log(`[AUTH REGISTER] Unverified account exists. Reissuing OTP for "${normalizedEmail}"...`);
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

      // New registration
      user = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        password,
        verificationOtp: otp,
        verificationOtpExpires: otpExpires,
        isVerified: false
      });

      console.log(`[AUTH REGISTER SUCCESS] Pending unverified user saved to Atlas: ${user._id}`);
      await sendVerificationEmail(normalizedEmail, otp, user.name);

      return res.status(201).json({
        message: 'Account created! Please enter the 6-digit verification code sent to your email.',
        email: normalizedEmail,
        requireVerification: true
      });
    }

    // Fallback in-memory
    console.log(`[AUTH REGISTER IN-MEMORY] Registering in local store...`);
    let existingIndex = inMemoryUsers.findIndex((u) => u.email === normalizedEmail);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (existingIndex !== -1) {
      if (inMemoryUsers[existingIndex].isVerified) {
        return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      }

      inMemoryUsers[existingIndex].name = normalizedName;
      inMemoryUsers[existingIndex].password = hashedPassword;
      inMemoryUsers[existingIndex].verificationOtp = otp;
      inMemoryUsers[existingIndex].verificationOtpExpires = otpExpires;

      await sendVerificationEmail(normalizedEmail, otp, normalizedName);

      return res.status(200).json({
        message: 'Verification code sent to your email. Please enter the 6-digit code to complete registration.',
        email: normalizedEmail,
        requireVerification: true
      });
    }

    const newUser = {
      _id: new mongoose.Types.ObjectId(),
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
      isVerified: false,
      weight: 70,
      fitnessGoal: 'maintain',
      customCalorieTarget: null,
      customProteinTarget: null,
      createdAt: new Date().toISOString()
    };
    inMemoryUsers.push(newUser);

    await sendVerificationEmail(normalizedEmail, otp, normalizedName);

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
    if (isDbConnected()) {
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

      console.log(`[AUTH VERIFY SUCCESS] Account activated for: ${user.email} (${user._id})`);

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
    }

    // In-memory fallback
    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account is already verified. Please sign in directly.' });
    }

    if (!user.verificationOtp || user.verificationOtp !== cleanOtp) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    if (!user.verificationOtpExpires || new Date() > new Date(user.verificationOtpExpires)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;

    const nutrition = calculateNutritionHelper(
      user.weight,
      user.fitnessGoal,
      user.customCalorieTarget,
      user.customProteinTarget
    );
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

    if (isDbConnected()) {
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
    }

    // In-memory fallback
    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account is already verified. You can sign in directly.' });
    }

    user.verificationOtp = otp;
    user.verificationOtpExpires = otpExpires;

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

  // 1. Lowercase and trim email
  const normalizedEmail = String(email).toLowerCase().trim();

  console.log(`\n========================================`);
  console.log(`[AUTH LOGIN ATTEMPT]`);
  console.log(`Email provided: "${normalizedEmail}"`);
  console.log(`Database Connected: ${isDbConnected()} (readyState: ${mongoose.connection.readyState}, DB: ${mongoose.connection.name || 'none'})`);
  console.log(`========================================\n`);

  try {
    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        console.log(`[AUTH FIND RESULT]: null (No user found for "${normalizedEmail}")`);
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
    }

    // Fallback in-memory
    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email to continue',
        isVerified: false,
        requireVerification: true,
        email: normalizedEmail
      });
    }

    const nutrition = calculateNutritionHelper(
      user.weight,
      user.fitnessGoal,
      user.customCalorieTarget,
      user.customProteinTarget
    );

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

    if (isDbConnected()) {
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
    }

    // In-memory fallback
    const user = getInMemoryUserById(req.user._id);
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

    const nutrition = calculateNutritionHelper(
      user.weight,
      user.fitnessGoal,
      user.customCalorieTarget,
      user.customProteinTarget
    );

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
  if (isDbConnected()) {
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
  }

  // In-memory
  const user = getInMemoryUserById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const nutrition = calculateNutritionHelper(
    user.weight,
    user.fitnessGoal,
    user.customCalorieTarget,
    user.customProteinTarget
  );
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
};

module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  updateNutritionTargets,
  getMe,
  getInMemoryUserById
};

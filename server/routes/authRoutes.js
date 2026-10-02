const express = require('express');
const {
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  updateNutritionTargets,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Registration & OTP Email Verification routes (Sign up only)
router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-code', resendVerificationCode);

// Standard Password Login (No code required)
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getMe);
router.put('/nutrition-targets', protect, updateNutritionTargets);

module.exports = router;

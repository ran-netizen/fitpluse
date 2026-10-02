const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    // Email Verification Code Fields (Sign Up only)
    verificationOtp: {
      type: String,
      default: null
    },
    verificationOtpExpires: {
      type: Date,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    // Weight-Based Nutrition Targets & Custom Overrides
    weight: {
      type: Number,
      default: 70 // kg
    },
    fitnessGoal: {
      type: String,
      enum: ['lose_fat', 'maintain', 'build_muscle'],
      default: 'maintain'
    },
    customCalorieTarget: {
      type: Number,
      default: null
    },
    customProteinTarget: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving (Mongoose 8/9 async hook)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate nutrition targets helper
userSchema.methods.getCalculatedNutrition = function () {
  const userWeight = this.weight && Number(this.weight) > 0 ? Number(this.weight) : 70;
  
  // Recommended Protein: Math.round(weight * 2.0)
  const recommendedProtein = Math.round(userWeight * 2.0);

  // Base Maintenance: weight * 32 kcal
  const baseMaintenance = Math.round(userWeight * 32);
  let recommendedCalories = baseMaintenance;
  if (this.fitnessGoal === 'lose_fat') {
    recommendedCalories = Math.max(baseMaintenance - 400, 1200);
  } else if (this.fitnessGoal === 'build_muscle') {
    recommendedCalories = baseMaintenance + 300;
  }

  return {
    calorieTarget: this.customCalorieTarget !== null && this.customCalorieTarget !== undefined
      ? Number(this.customCalorieTarget)
      : recommendedCalories,
    proteinTarget: this.customProteinTarget !== null && this.customProteinTarget !== undefined
      ? Number(this.customProteinTarget)
      : recommendedProtein,
    recommendedCalories,
    recommendedProtein,
    isCustomCalorie: this.customCalorieTarget !== null && this.customCalorieTarget !== undefined,
    isCustomProtein: this.customProteinTarget !== null && this.customProteinTarget !== undefined
  };
};

module.exports = mongoose.model('User', userSchema);

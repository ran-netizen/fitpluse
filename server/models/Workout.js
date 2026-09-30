const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    title: {
      type: String,
      required: [true, 'Workout/Exercise title is required'],
      trim: true
    },
    reps: {
      type: Number,
      required: [true, 'Number of reps is required'],
      min: [1, 'Reps must be at least 1']
    },
    load: {
      type: Number,
      required: [true, 'Load (weight in kg) is required'],
      min: [0, 'Load cannot be negative']
    },
    sets: {
      type: Number,
      default: 1,
      min: [1, 'Sets must be at least 1']
    },
    duration: {
      type: Number,
      default: 0, // duration in minutes
      min: [0, 'Duration cannot be negative']
    },
    calories: {
      type: Number,
      default: 0,
      min: [0, 'Calories cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Workout', workoutSchema);

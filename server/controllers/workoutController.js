const mongoose = require('mongoose');
const Workout = require('../models/Workout');

// @desc    Get all workouts for logged in user
// @route   GET /api/workouts
// @access  Private
const getWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(workouts);
  } catch (error) {
    console.error('[GET WORKOUTS ERROR]:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Get single workout by ID
// @route   GET /api/workouts/:id
// @access  Private
const getWorkout = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No workout found with that ID (invalid ID format)' });
  }

  try {
    const workout = await Workout.findById(id);
    if (!workout) {
      return res.status(404).json({ error: 'No such workout found' });
    }
    if (workout.user.toString() !== userId) {
      return res.status(403).json({ error: 'User not authorized to access this workout' });
    }
    return res.status(200).json(workout);
  } catch (error) {
    console.error('[GET WORKOUT ERROR]:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Create a new workout for logged in user
// @route   POST /api/workouts
// @access  Private
const createWorkout = async (req, res) => {
  const { title, exercise, reps, load, sets, duration, calories, caloriesBurned } = req.body;
  const workoutTitle = title || exercise;
  const calValue = calories !== undefined ? Number(calories) : (caloriesBurned !== undefined ? Number(caloriesBurned) : 0);

  // Validation
  const emptyFields = [];
  if (!workoutTitle) emptyFields.push('title');
  if (reps === undefined || reps === null || reps === '') emptyFields.push('reps');
  if (load === undefined || load === null || load === '') emptyFields.push('load');

  if (emptyFields.length > 0) {
    return res.status(400).json({
      error: 'Please fill in all required fields',
      emptyFields
    });
  }

  try {
    const workout = await Workout.create({
      user: req.user._id,
      title: workoutTitle.trim(),
      reps: Number(reps),
      load: Number(load),
      sets: sets ? Number(sets) : 1,
      duration: duration ? Number(duration) : 0,
      calories: calValue
    });
    return res.status(201).json(workout);
  } catch (error) {
    console.error('[CREATE WORKOUT ERROR]:', error.message);
    return res.status(400).json({ error: error.message });
  }
};

// @desc    Delete a workout
// @route   DELETE /api/workouts/:id
// @access  Private
const deleteWorkout = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No workout found with that ID (invalid ID format)' });
  }

  try {
    const workout = await Workout.findById(id);
    if (!workout) {
      return res.status(404).json({ error: 'No such workout found' });
    }
    if (workout.user.toString() !== userId) {
      return res.status(403).json({ error: 'User not authorized to delete this workout' });
    }

    await Workout.findByIdAndDelete(id);
    return res.status(200).json(workout);
  } catch (error) {
    console.error('[DELETE WORKOUT ERROR]:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

// @desc    Update a workout
// @route   PATCH /api/workouts/:id or PUT /api/workouts/:id
// @access  Private
const updateWorkout = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No workout found with that ID (invalid ID format)' });
  }

  try {
    const updateData = { ...req.body };
    if (updateData.exercise) updateData.title = updateData.exercise;
    if (updateData.caloriesBurned !== undefined && updateData.calories === undefined) {
      updateData.calories = updateData.caloriesBurned;
    }

    const workout = await Workout.findById(id);
    if (!workout) {
      return res.status(404).json({ error: 'No such workout found' });
    }
    if (workout.user.toString() !== userId) {
      return res.status(403).json({ error: 'User not authorized to update this workout' });
    }

    const updated = await Workout.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('[UPDATE WORKOUT ERROR]:', error.message);
    return res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getWorkouts,
  getWorkout,
  createWorkout,
  deleteWorkout,
  updateWorkout
};

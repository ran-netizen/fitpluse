const express = require('express');
const {
  getWorkouts,
  getWorkout,
  createWorkout,
  deleteWorkout,
  updateWorkout
} = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all workout routes
router.use(protect);

// GET all workouts & POST a new workout
router.route('/')
  .get(getWorkouts)
  .post(createWorkout);

// GET single workout, DELETE a workout, UPDATE a workout
router.route('/:id')
  .get(getWorkout)
  .delete(deleteWorkout)
  .patch(updateWorkout)
  .put(updateWorkout);

module.exports = router;

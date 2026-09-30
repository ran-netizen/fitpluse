import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Dumbbell,
  Hash,
  Repeat,
  Weight,
  Clock,
  Sparkles,
  Flame,
  Zap,
  Activity
} from 'lucide-react';

const CALORIE_RATES = {
  'Weight Training': 6,
  'Running': 11,
  'Cycling': 8,
  'HIIT': 12,
  'Other': 7
};

const COMMON_EXERCISES = [
  { name: 'Bench Press', type: 'Weight Training' },
  { name: 'Squats', type: 'Weight Training' },
  { name: 'Deadlift', type: 'Weight Training' },
  { name: 'Running', type: 'Running' },
  { name: 'Stationary Cycling', type: 'Cycling' },
  { name: 'Tabata / HIIT', type: 'HIIT' },
  { name: 'Overhead Press', type: 'Weight Training' },
  { name: 'Pull-ups', type: 'Weight Training' }
];

const WorkoutForm = ({ onWorkoutAdded, token }) => {
  const [exercise, setExercise] = useState('');
  const [exerciseType, setExerciseType] = useState('Weight Training');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [load, setLoad] = useState('50');
  const [duration, setDuration] = useState('30');
  const [calories, setCalories] = useState('180'); // 30 mins * 6 kcal/min
  const [autoCalculate, setAutoCalculate] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Automatically update calories when duration or exercise type changes if autoCalculate is on
  useEffect(() => {
    if (autoCalculate) {
      const rate = CALORIE_RATES[exerciseType] || 6;
      const mins = Number(duration) || 0;
      setCalories(String(Math.round(mins * rate)));
    }
  }, [duration, exerciseType, autoCalculate]);

  const handleManualCalorieChange = (val) => {
    setCalories(val);
    // If user explicitly types their own custom calories, disable auto calculation temporarily
    setAutoCalculate(false);
  };

  const handleRecalculate = () => {
    const rate = CALORIE_RATES[exerciseType] || 6;
    const mins = Number(duration) || 0;
    setCalories(String(Math.round(mins * rate)));
    setAutoCalculate(true);
  };

  const handlePresetClick = (preset) => {
    setExercise(preset.name);
    setExerciseType(preset.type);
    const rate = CALORIE_RATES[preset.type] || 6;
    const mins = Number(duration) || 0;
    setCalories(String(Math.round(mins * rate)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!exercise || !reps || !load) {
      setError('Please provide exercise name, reps, and weight load');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          exercise,
          title: exercise,
          sets: Number(sets) || 1,
          reps: Number(reps),
          load: Number(load),
          duration: Number(duration) || 0,
          calories: Number(calories) || 0,
          caloriesBurned: Number(calories) || 0
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add workout');
      }

      // Reset form
      setExercise('');
      setSets('3');
      setReps('10');
      setLoad('50');
      setDuration('30');
      setCalories('180');
      setAutoCalculate(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      if (onWorkoutAdded) {
        onWorkoutAdded(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-400" />
          Log Workout Session
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">Add Exercise</span>
      </div>

      {/* Preset tags */}
      <div className="mb-4">
        <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-emerald-400" /> Quick Presets:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_EXERCISES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-slate-700/60 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          ✓ Workout successfully logged!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Exercise Name */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Exercise Name *
          </label>
          <div className="relative">
            <Dumbbell className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="e.g. Barbell Bench Press"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Exercise Type (for Auto-Calorie calculation) */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Exercise Category
            </span>
            <span className="text-[10px] text-slate-400">
              {CALORIE_RATES[exerciseType]} kcal/min
            </span>
          </label>
          <select
            value={exerciseType}
            onChange={(e) => setExerciseType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="Weight Training">Weight Training (6 kcal/min)</option>
            <option value="Running">Running (11 kcal/min)</option>
            <option value="Cycling">Cycling (8 kcal/min)</option>
            <option value="HIIT">HIIT (12 kcal/min)</option>
            <option value="Other">Other / General (7 kcal/min)</option>
          </select>
        </div>

        {/* Sets, Reps, Load, Duration grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Sets
            </label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                required
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Reps *
            </label>
            <div className="relative">
              <Repeat className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                required
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Load (kg) *
            </label>
            <div className="relative">
              <Weight className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={load}
                onChange={(e) => setLoad(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Duration (m)
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Calories Burned with Auto-Calculate helper */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Calories Burned (kcal)
            </label>
            <button
              type="button"
              onClick={handleRecalculate}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors"
              title="Recalculate from duration and activity rate"
            >
              <Zap className="w-3 h-3" />
              Auto-Calculate ({CALORIE_RATES[exerciseType]} kcal/min)
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              value={calories}
              onChange={(e) => handleManualCalorieChange(e.target.value)}
              placeholder="e.g. 240"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
              kcal
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Prefilled automatically based on exercise type ({CALORIE_RATES[exerciseType]} kcal/min) & duration. You can edit anytime.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Save Workout</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default WorkoutForm;

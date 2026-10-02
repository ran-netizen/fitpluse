import React, { useState } from 'react';
import {
  Flame,
  Dumbbell,
  Droplets,
  Zap,
  ArrowRight,
  Plus,
  Clock,
  Layers,
  Calendar,
  Sparkles,
  TrendingUp,
  Utensils,
  Trophy,
  CheckCircle2
} from 'lucide-react';

const QUICK_PRESETS = ['Bench Press', 'Squats', 'Deadlift', 'Running', 'Bicep Curls'];

const OverviewView = ({
  workouts = [],
  user,
  setActiveTab,
  onWorkoutAdded,
  token
}) => {
  const safeWorkouts = Array.isArray(workouts) ? workouts : [];

  // Water Tracker State with localStorage persistence
  const [waterMl, setWaterMl] = useState(() => {
    const saved = localStorage.getItem('fitpulse_water_ml');
    return saved ? Number(saved) : 1750;
  });
  const waterGoal = 3000;

  const handleAddWater = (amount) => {
    const updated = Math.min(waterMl + amount, 5000);
    setWaterMl(updated);
    localStorage.setItem('fitpulse_water_ml', updated.toString());
  };

  const handleResetWater = () => {
    setWaterMl(0);
    localStorage.setItem('fitpulse_water_ml', '0');
  };

  // Quick Log State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickReps, setQuickReps] = useState('10');
  const [quickLoad, setQuickLoad] = useState('50');
  const [quickSets, setQuickSets] = useState('3');
  const [quickDuration, setQuickDuration] = useState('30');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickMsg, setQuickMsg] = useState('');

  // Weekly calculations
  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };
  const startOfWeek = getStartOfWeek();

  const thisWeekWorkouts = safeWorkouts.filter((w) => {
    return w.createdAt && new Date(w.createdAt) >= startOfWeek;
  });

  const weeklySessionsGoal = Number(localStorage.getItem('fitpulse_weekly_goal')) || 5;
  const weeklyCaloriesGoal = Number(localStorage.getItem('fitpulse_weekly_calories')) || 2500;

  const totalCaloriesThisWeek = thisWeekWorkouts.reduce((acc, curr) => {
    const c = curr.calories || curr.caloriesBurned;
    return acc + (c !== undefined && c !== null ? Number(c) : (Number(curr.duration) || 0) * 7);
  }, 0);

  const totalVolumeThisWeek = thisWeekWorkouts.reduce((acc, curr) => {
    return acc + (curr.load || 0) * (curr.reps || 1) * (curr.sets || 1);
  }, 0);

  // Quick Log Submit
  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!quickTitle || !quickReps || !quickLoad) return;

    setQuickSubmitting(true);
    setQuickMsg('');

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: quickTitle,
          exercise: quickTitle,
          reps: Number(quickReps),
          load: Number(quickLoad),
          sets: Number(quickSets) || 1,
          duration: Number(quickDuration) || 0,
          calories: (Number(quickDuration) || 30) * 7
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add quick workout');
      }

      if (onWorkoutAdded) {
        onWorkoutAdded(data);
      }

      setQuickTitle('');
      setQuickMsg('✓ Session logged successfully!');
      setTimeout(() => setQuickMsg(''), 3000);
    } catch (err) {
      setQuickMsg(`⚠️ ${err.message}`);
    } finally {
      setQuickSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (now.toDateString() === d.toDateString()) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const recentWorkouts = safeWorkouts.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Hero Summary Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Fitness & Strength Hub
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to crush it today, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">{user?.name}</span>?
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              You have completed <strong className="text-white">{thisWeekWorkouts.length}</strong> of{' '}
              <strong className="text-white">{weeklySessionsGoal}</strong> target workouts this week. Keep up the consistency!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('workouts')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Full Workout Logger</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
            >
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Calories */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Active Calories</span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {totalCaloriesThisWeek.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Goal: {weeklyCaloriesGoal.toLocaleString()} kcal</span>
              <span className="text-orange-400 font-bold">
                {Math.min(Math.round((totalCaloriesThisWeek / weeklyCaloriesGoal) * 100), 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Workouts Completed */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Workouts Completed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {thisWeekWorkouts.length} <span className="text-xs font-normal text-slate-500">/ {weeklySessionsGoal} sessions</span>
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Total Volume</span>
              <span className="text-emerald-400 font-bold">{totalVolumeThisWeek.toLocaleString()} kg</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Daily Water Tracker */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Daily Hydration</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-xl font-black text-white">
                {waterMl} <span className="text-xs font-normal text-slate-500">/ {waterGoal} ml</span>
              </p>
              <span className="text-[11px] font-bold text-cyan-400">
                {Math.min(Math.round((waterMl / waterGoal) * 100), 100)}%
              </span>
            </div>

            {/* Quick add buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              <button
                onClick={() => handleAddWater(250)}
                className="flex-1 py-1 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
              >
                +250ml
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="flex-1 py-1 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
              >
                +500ml
              </button>
              <button
                onClick={handleResetWater}
                className="py-1 px-2 rounded-lg text-slate-500 hover:text-slate-300 text-[10px] transition-colors"
                title="Reset water counter"
              >
                ↺
              </button>
            </div>
          </div>
        </div>

        {/* KPI 4: Consistency Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Training Streak</span>
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {thisWeekWorkouts.length > 0 ? `${thisWeekWorkouts.length} Days` : 'Ready'}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active Streak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Hub: Quick Log & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left (2 cols): Concise Quick Log Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                Quick Session Log
              </h3>
              <p className="text-[11px] text-slate-400">Log an exercise set in 5 seconds</p>
            </div>
            <button
              onClick={() => setActiveTab('workouts')}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Deep Log <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setQuickTitle(p)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-slate-700/60 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {quickMsg && (
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              {quickMsg}
            </div>
          )}

          <form onSubmit={handleQuickSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Exercise Title
              </label>
              <input
                type="text"
                required
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="e.g. Incline Bench Press"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Sets</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quickSets}
                  onChange={(e) => setQuickSets(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Reps</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quickReps}
                  onChange={(e) => setQuickReps(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Load (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={quickLoad}
                  onChange={(e) => setQuickLoad(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Time (m)</label>
                <input
                  type="number"
                  min="0"
                  value={quickDuration}
                  onChange={(e) => setQuickDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={quickSubmitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer mt-2"
            >
              {quickSubmitting ? 'Saving...' : '⚡ Log Session Instantly'}
            </button>
          </form>
        </div>

        {/* Right (3 cols): Recent Activity Timeline */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Recent Activity
              </h3>
              <p className="text-[11px] text-slate-400">Latest logged sessions across your account</p>
            </div>
            <button
              onClick={() => setActiveTab('workouts')}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              View All ({safeWorkouts.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentWorkouts.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800">
              <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">No workout records yet</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Use the Quick Log form to record your first fitness set!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((w) => {
                const cals =
                  w.calories || w.caloriesBurned || (w.duration ? w.duration * 7 : 0);

                return (
                  <div
                    key={w._id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                        {w.title || w.exercise}
                      </h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(w.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                        {w.load} kg
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                        {w.reps}r &bull; {w.sets || 1}s
                      </span>
                      {cals > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-[11px] font-semibold hidden sm:inline-flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-orange-400" />
                          {cals} kcal
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('workouts')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
            <Dumbbell className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white group-hover:text-emerald-400">Workouts & CSV Export</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Search logs, calculate burn rates, and export data.</p>
        </button>

        <button
          onClick={() => setActiveTab('nutrition')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
            <Utensils className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white group-hover:text-cyan-400">Nutrition & Hydration</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Track daily water intake, macros, and calorie budget.</p>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white group-hover:text-emerald-400">Weekly Analytics</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Inspect volume trends, consistency streaks, and goals.</p>
        </button>
      </div>
    </div>
  );
};

export default OverviewView;

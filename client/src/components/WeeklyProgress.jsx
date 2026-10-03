import React, { useState, useEffect } from 'react';
import {
  Target,
  Trophy,
  Flame,
  Dumbbell,
  Clock,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Settings2,
  X,
  Zap,
  Check
} from 'lucide-react';
import { formatLocalDate, getStartOfWeek, getTodayDateStr } from '../utils/dateUtils';

const GOAL_PRESETS = [
  { name: 'Strength & Muscle', sessions: 4, calories: 2000, desc: '4 heavy sessions/week' },
  { name: 'Fat Loss & Burn', sessions: 5, calories: 3000, desc: '5 high-output sessions/week' },
  { name: 'Endurance & Cardio', sessions: 6, calories: 4000, desc: '6 intense aerobic days/week' },
  { name: 'General Health', sessions: 3, calories: 1500, desc: '3 balanced workouts/week' }
];

const WeeklyProgress = ({ workouts }) => {
  // Goal Settings with localStorage persistence
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const saved = localStorage.getItem('fitpulse_weekly_goal');
    return saved ? Number(saved) : 5;
  });

  const [targetCalories, setTargetCalories] = useState(() => {
    const saved = localStorage.getItem('fitpulse_weekly_calories');
    return saved ? Number(saved) : 2500;
  });

  const [goalType, setGoalType] = useState(() => {
    const saved = localStorage.getItem('fitpulse_goal_type');
    return saved || 'sessions'; // 'sessions' or 'calories'
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSessions, setTempSessions] = useState(weeklyGoal);
  const [tempCalories, setTempCalories] = useState(targetCalories);
  const [tempGoalType, setTempGoalType] = useState(goalType);

  // Chart Metric state: 'volume' | 'duration' | 'calories'
  const [chartMetric, setChartMetric] = useState('volume');

  const startOfWeek = getStartOfWeek();
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  // Filter workouts for current week (safely guarded)
  const safeWorkouts = Array.isArray(workouts) ? workouts : [];
  const thisWeekWorkouts = safeWorkouts.filter((w) => {
    if (!w.createdAt) return false;
    const wDate = new Date(w.createdAt);
    return wDate >= startOfWeek && wDate < endOfWeek;
  });

  const workoutsCount = thisWeekWorkouts.length;

  // Calculate totals
  const totalVolume = thisWeekWorkouts.reduce((acc, curr) => {
    const sets = curr.sets || 1;
    const reps = curr.reps || 1;
    const load = curr.load || 0;
    return acc + load * reps * sets;
  }, 0);

  const totalMinutes = thisWeekWorkouts.reduce((acc, curr) => {
    return acc + (Number(curr.duration) || 0);
  }, 0);

  const totalCalories = thisWeekWorkouts.reduce((acc, curr) => {
    const cals = curr.calories || curr.caloriesBurned;
    if (cals !== undefined && cals !== null && cals !== '') {
      return acc + Number(cals);
    }
    // Estimate if not set: ~7 kcal/min default
    return acc + (Number(curr.duration) || 0) * 7;
  }, 0);

  // Dynamic progress calculation based on active goal type
  const isSessionGoal = goalType === 'sessions';
  const currentMetricValue = isSessionGoal ? workoutsCount : totalCalories;
  const targetMetricValue = isSessionGoal ? weeklyGoal : targetCalories;
  const progressPercent = Math.min(
    Math.round((currentMetricValue / (targetMetricValue || 1)) * 100),
    100
  );
  const isGoalAchieved = currentMetricValue >= targetMetricValue;

  // Save Modal Changes
  const handleSaveGoals = (e) => {
    e.preventDefault();
    setWeeklyGoal(tempSessions);
    setTargetCalories(tempCalories);
    setGoalType(tempGoalType);

    localStorage.setItem('fitpulse_weekly_goal', tempSessions.toString());
    localStorage.setItem('fitpulse_weekly_calories', tempCalories.toString());
    localStorage.setItem('fitpulse_goal_type', tempGoalType);

    setIsModalOpen(false);
  };

  const openModal = () => {
    setTempSessions(weeklyGoal);
    setTempCalories(targetCalories);
    setTempGoalType(goalType);
    setIsModalOpen(true);
  };

  // 7-day data aggregator (Mon - Sun)
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayDateStr = getTodayDateStr();

  const dailyStats = daysOfWeek.map((dayName, idx) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + idx);
    const dateStr = formatLocalDate(d);

    const dayWorkouts = thisWeekWorkouts.filter(
      (w) => w.createdAt && formatLocalDate(new Date(w.createdAt)) === dateStr
    );

    const volume = dayWorkouts.reduce((acc, curr) => {
      const sets = curr.sets || 1;
      const reps = curr.reps || 1;
      const load = curr.load || 0;
      return acc + load * reps * sets;
    }, 0);

    const duration = dayWorkouts.reduce((acc, curr) => {
      return acc + (Number(curr.duration) || 0);
    }, 0);

    const calories = dayWorkouts.reduce((acc, curr) => {
      const c = curr.calories || curr.caloriesBurned;
      return acc + (c !== undefined && c !== null ? Number(c) : (Number(curr.duration) || 0) * 7);
    }, 0);

    const isToday = dateStr === todayDateStr;

    return {
      name: dayName,
      date: dateStr,
      count: dayWorkouts.length,
      volume,
      duration,
      calories,
      isToday,
      active: dayWorkouts.length > 0
    };
  });

  // Scale chart maximums
  const maxVolume = Math.max(...dailyStats.map((d) => d.volume), 500);
  const maxDuration = Math.max(...dailyStats.map((d) => d.duration), 60);
  const maxCalories = Math.max(...dailyStats.map((d) => d.calories), 500);

  const getActiveMetricValue = (day) => {
    if (chartMetric === 'volume') return day.volume;
    if (chartMetric === 'duration') return day.duration;
    return day.calories;
  };

  const activeMax =
    chartMetric === 'volume' ? maxVolume : chartMetric === 'duration' ? maxDuration : maxCalories;

  // Visual Target Line height percentage
  // Calculates pace based on active metric & target setting
  const targetThresholdPercent = Math.min(
    Math.max(
      isSessionGoal
        ? Math.round((weeklyGoal / 7) * 90)
        : Math.round(((targetCalories / 7) / activeMax) * 100),
      25
    ),
    85
  );

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md mb-8">
      {/* Top Header & Set Goal Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Weekly Progress & Goals</h2>
            {isGoalAchieved && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Met
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking {isSessionGoal ? `${weeklyGoal} weekly sessions` : `${targetCalories.toLocaleString()} kcal weekly burn`}
          </p>
        </div>

        {/* Set Goal Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-emerald-400" />
            <span>Set Goal</span>
          </button>
        </div>
      </div>

      {/* Goal Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs font-medium mb-2">
          <span className="text-slate-300 flex items-center gap-1.5">
            {isGoalAchieved ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Trophy className="w-4 h-4" /> Goal Met! Outstanding consistency!
              </span>
            ) : (
              <span>
                Completed{' '}
                <strong className="text-white">
                  {isSessionGoal
                    ? `${workoutsCount} of ${weeklyGoal} sessions`
                    : `${totalCalories.toLocaleString()} of ${targetCalories.toLocaleString()} kcal`}
                </strong>
              </span>
            )}
          </span>
          <span className="text-emerald-400 font-bold">{progressPercent}%</span>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isGoalAchieved
                ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-lg shadow-emerald-500/50'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Weekly Sessions</p>
            <p className="text-base font-bold text-white">
              {workoutsCount}{' '}
              <span className="text-[11px] font-normal text-slate-500">/ {weeklyGoal}</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Calories Burned</p>
            <p className="text-base font-bold text-white">
              {totalCalories.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-slate-500">kcal</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Lifted Volume</p>
            <p className="text-base font-bold text-white">
              {totalVolume.toLocaleString()}{' '}
              <span className="text-[11px] font-normal text-slate-500">kg</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Training Time</p>
            <p className="text-base font-bold text-white">
              {totalMinutes}{' '}
              <span className="text-[11px] font-normal text-slate-500">mins</span>
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Visual Weekly Progress Chart */}
      <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Weekly Activity Chart
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Live Dynamic Data
            </span>
          </div>

          {/* 3 Metric Switchers: Volume | Duration | Calories */}
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setChartMetric('volume')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                chartMetric === 'volume'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Volume (kg)
            </button>
            <button
              onClick={() => setChartMetric('duration')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                chartMetric === 'duration'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Duration (mins)
            </button>
            <button
              onClick={() => setChartMetric('calories')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                chartMetric === 'calories'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calories (kcal)
            </button>
          </div>
        </div>

        {/* Visual Bar Chart with Target Goal Line */}
        <div className="relative pt-6 pb-2">
          {/* Visual Target Goal Line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400/40 z-10 flex items-center justify-end pr-2 pointer-events-none transition-all duration-300"
            style={{ bottom: `${targetThresholdPercent}%` }}
          >
            <span className="text-[10px] font-semibold text-emerald-400 bg-slate-950/90 px-2 py-0.5 rounded border border-emerald-500/30 shadow-sm -mt-6">
              Goal Pace: {progressPercent}%
            </span>
          </div>

          {/* Vertical Bars Container */}
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {dailyStats.map((day) => {
              const value = getActiveMetricValue(day);
              const barHeightPercent = activeMax > 0 ? Math.round((value / activeMax) * 85) : 0;
              const hasActivity = value > 0;

              return (
                <div
                  key={day.name}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-slate-900 border border-slate-700 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    <p className="font-bold text-emerald-400">{day.name}</p>
                    <p>{day.calories.toLocaleString()} kcal burned</p>
                    <p>{day.volume.toLocaleString()} kg lifted &bull; {day.duration} mins</p>
                  </div>

                  {/* Value label above bar */}
                  <span className="text-[10px] text-slate-400 font-semibold mb-1 group-hover:text-emerald-300 transition-colors">
                    {value > 0 ? value.toLocaleString() : '-'}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-slate-900 rounded-t-lg overflow-hidden flex items-end h-full">
                    <div
                      className={`w-full transition-all duration-500 rounded-t-lg ${
                        hasActivity
                          ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-green-400 shadow-md shadow-emerald-500/20 group-hover:brightness-110'
                          : 'bg-slate-800/40 h-1.5'
                      }`}
                      style={{
                        height: hasActivity ? `${Math.max(barHeightPercent, 8)}%` : '6px'
                      }}
                    />
                  </div>

                  {/* Day label */}
                  <div className="mt-3 flex flex-col items-center">
                    <span
                      className={`text-xs font-medium ${
                        day.isToday
                          ? 'text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.name}
                    </span>
                    {day.isToday && (
                      <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-emerald-600 to-green-400" />
              Daily {chartMetric === 'volume' ? 'Volume' : chartMetric === 'duration' ? 'Duration' : 'Calories'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-emerald-400" />
              Goal Target Line
            </span>
          </div>
          <span className="text-slate-500">
            {chartMetric === 'volume'
              ? `Total Volume: ${totalVolume.toLocaleString()} kg`
              : chartMetric === 'duration'
              ? `Total Duration: ${totalMinutes} mins`
              : `Total Calories: ${totalCalories.toLocaleString()} kcal`}
          </span>
        </div>
      </div>

      {/* 7-Day Weekly Streak Matrix */}
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
          Weekly Consistency Matrix
        </p>
        <div className="grid grid-cols-7 gap-2">
          {dailyStats.map((day) => (
            <div
              key={day.name}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-center transition-all ${
                day.active
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/50 border-slate-800/60 text-slate-500'
              } ${day.isToday ? 'ring-2 ring-emerald-400/30' : ''}`}
            >
              <span className="text-[11px] font-semibold">{day.name}</span>
              <div className="mt-1.5 flex items-center justify-center">
                {day.active ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                )}
              </div>
              <span className="text-[9px] mt-1 opacity-70">
                {day.count > 0 ? `${day.count} set` : 'Rest'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Set Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Configure Weekly Goals</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoals} className="space-y-5">
              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Goal Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setTempSessions(p.sessions);
                        setTempCalories(p.calories);
                      }}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500/50 text-left transition-all group"
                    >
                      <p className="text-xs font-bold text-white group-hover:text-emerald-400">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p.sessions} sessions &bull; {p.calories.toLocaleString()} kcal
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Sessions */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Weekly Sessions Target
                  </label>
                  <span className="text-xs font-bold text-emerald-400">
                    {tempSessions} sessions / week
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={tempSessions}
                  onChange={(e) => setTempSessions(Number(e.target.value))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Target Calories */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Target Weekly Calories Burned
                  </label>
                  <span className="text-xs font-bold text-orange-400">
                    {tempCalories.toLocaleString()} kcal
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={tempCalories}
                  onChange={(e) => setTempCalories(Number(e.target.value))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Primary Focus Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Primary Tracking Metric
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTempGoalType('sessions')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      tempGoalType === 'sessions'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Sessions Count ({tempSessions})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempGoalType('calories')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      tempGoalType === 'calories'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    Calories Burned ({tempCalories} kcal)
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Save Goals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyProgress;

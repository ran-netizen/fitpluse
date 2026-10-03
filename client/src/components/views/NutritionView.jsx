import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Droplets,
  Flame,
  Plus,
  Trash2,
  PieChart,
  Apple,
  Pencil,
  X,
  Check,
  RotateCcw,
  Scale,
  Target,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatLocalDate, getTodayDateStr, getYesterdayDateStr } from '../../utils/dateUtils';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

// Recommendation Formulas
const computeRecommendations = (weightKg, goal) => {
  const w = Number(weightKg) > 0 ? Number(weightKg) : 70;
  const recommendedProtein = Math.round(w * 2.0);
  const baseMaintenance = Math.round(w * 32);

  let recommendedCalories = baseMaintenance;
  if (goal === 'lose_fat') {
    recommendedCalories = Math.max(baseMaintenance - 400, 1200);
  } else if (goal === 'build_muscle') {
    recommendedCalories = baseMaintenance + 300;
  }

  return {
    recommendedCalories: w ? recommendedCalories : 2000,
    recommendedProtein: w ? recommendedProtein : 140
  };
};

const NutritionView = () => {
  const { user, updateNutritionTargets } = useAuth();

  const todayDateStr = getTodayDateStr();
  const yesterdayDateStr = getYesterdayDateStr();
  const [selectedDate, setSelectedDate] = useState(todayDateStr);

  // Daily Hydration state with localStorage
  const [dailyWaterMap, setDailyWaterMap] = useState(() => {
    const savedDaily = localStorage.getItem('fitpulse_daily_water');
    if (savedDaily) {
      try {
        return JSON.parse(savedDaily) || {};
      } catch (e) {
        return {};
      }
    }
    // Backward compatibility: If legacy fitpulse_water_ml exists, assign it to yesterday
    const legacyWater = localStorage.getItem('fitpulse_water_ml');
    const initialMap = {};
    if (legacyWater && Number(legacyWater) > 0) {
      initialMap[getYesterdayDateStr()] = Number(legacyWater);
      localStorage.setItem('fitpulse_daily_water', JSON.stringify(initialMap));
    }
    return initialMap;
  });
  const waterGoal = 3000;
  const currentWaterMl = dailyWaterMap[selectedDate] || 0;

  // Meal Logs state with localStorage & legacy date migration
  const [meals, setMeals] = useState(() => {
    const saved = localStorage.getItem('fitpulse_meals');
    const yestStr = getYesterdayDateStr();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          let migratedAny = false;
          const migrated = parsed.map((m) => {
            if (m.date) return m;
            migratedAny = true;
            const timestamp = Number(m.id);
            if (timestamp > 1000000000000) {
              const dStr = formatLocalDate(new Date(timestamp));
              return { ...m, date: dStr || yestStr };
            }
            return { ...m, date: yestStr };
          });
          if (migratedAny) {
            localStorage.setItem('fitpulse_meals', JSON.stringify(migrated));
          }
          return migrated;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // New Meal Form
  const [mealType, setMealType] = useState('Lunch');
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');

  // Target Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalWeight, setModalWeight] = useState(user?.weight || 70);
  const [modalGoal, setModalGoal] = useState(user?.fitnessGoal || 'maintain');
  const [modalCustomCal, setModalCustomCal] = useState(
    user?.customCalorieTarget !== null && user?.customCalorieTarget !== undefined
      ? user.customCalorieTarget
      : ''
  );
  const [modalCustomProt, setModalCustomProt] = useState(
    user?.customProteinTarget !== null && user?.customProteinTarget !== undefined
      ? user.customProteinTarget
      : ''
  );
  const [modalSaving, setModalSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState('');

  // Synchronize modal state when user profile updates
  useEffect(() => {
    if (user) {
      setModalWeight(user.weight || 70);
      setModalGoal(user.fitnessGoal || 'maintain');
      setModalCustomCal(
        user.customCalorieTarget !== null && user.customCalorieTarget !== undefined
          ? user.customCalorieTarget
          : ''
      );
      setModalCustomProt(
        user.customProteinTarget !== null && user.customProteinTarget !== undefined
          ? user.customProteinTarget
          : ''
      );
    }
  }, [user]);

  // Dynamic recommendations for current user
  const userRecs = useMemo(() => {
    return computeRecommendations(user?.weight || 70, user?.fitnessGoal || 'maintain');
  }, [user?.weight, user?.fitnessGoal]);

  // Live recommendations for modal inputs
  const liveModalRecs = useMemo(() => {
    return computeRecommendations(modalWeight, modalGoal);
  }, [modalWeight, modalGoal]);

  // Effective Targets (custom overrides take precedence if set)
  const dailyCalorieBudget = useMemo(() => {
    if (user?.customCalorieTarget !== null && user?.customCalorieTarget !== undefined && user?.customCalorieTarget !== '') {
      return Number(user.customCalorieTarget);
    }
    return user?.nutrition?.calorieTarget || userRecs.recommendedCalories;
  }, [user, userRecs]);

  const dailyProteinTarget = useMemo(() => {
    if (user?.customProteinTarget !== null && user?.customProteinTarget !== undefined && user?.customProteinTarget !== '') {
      return Number(user.customProteinTarget);
    }
    return user?.nutrition?.proteinTarget || userRecs.recommendedProtein;
  }, [user, userRecs]);

  const isCustomCalorie = user?.customCalorieTarget !== null && user?.customCalorieTarget !== undefined && user?.customCalorieTarget !== '';
  const isCustomProtein = user?.customProteinTarget !== null && user?.customProteinTarget !== undefined && user?.customProteinTarget !== '';

  const displayedMeals = useMemo(() => {
    return meals.filter((m) => m.date === selectedDate);
  }, [meals, selectedDate]);

  const totalCaloriesConsumed = displayedMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalProteinConsumed = displayedMeals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);

  const caloriePercent = Math.min(Math.round((totalCaloriesConsumed / dailyCalorieBudget) * 100), 100);
  const proteinPercent = Math.min(Math.round((totalProteinConsumed / dailyProteinTarget) * 100), 100);

  // Save targets to backend and context
  const handleSaveTargets = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalMsg('');

    const payload = {
      weight: Number(modalWeight) || 70,
      fitnessGoal: modalGoal,
      customCalorieTarget: modalCustomCal !== '' ? Number(modalCustomCal) : null,
      customProteinTarget: modalCustomProt !== '' ? Number(modalCustomProt) : null
    };

    const res = await updateNutritionTargets(payload);
    setModalSaving(false);

    if (res.success) {
      setModalMsg('Targets successfully updated!');
      setTimeout(() => {
        setIsModalOpen(false);
        setModalMsg('');
      }, 1000);
    } else {
      setModalMsg(`Error: ${res.error || 'Failed to save targets'}`);
    }
  };

  const handleResetToRecommended = () => {
    setModalCustomCal('');
    setModalCustomProt('');
  };

  // Hydration handlers
  const handleAddWater = (amount) => {
    const currentForDay = dailyWaterMap[selectedDate] || 0;
    const updated = Math.min(currentForDay + amount, 5000);
    const newMap = { ...dailyWaterMap, [selectedDate]: updated };
    setDailyWaterMap(newMap);
    localStorage.setItem('fitpulse_daily_water', JSON.stringify(newMap));
    if (selectedDate === todayDateStr) {
      localStorage.setItem('fitpulse_water_ml', updated.toString());
    }
  };

  const handleResetWater = () => {
    const newMap = { ...dailyWaterMap, [selectedDate]: 0 };
    setDailyWaterMap(newMap);
    localStorage.setItem('fitpulse_daily_water', JSON.stringify(newMap));
    if (selectedDate === todayDateStr) {
      localStorage.setItem('fitpulse_water_ml', '0');
    }
  };

  // Meal handlers
  const handleAddMeal = (e) => {
    e.preventDefault();
    if (!mealName || !mealCalories) return;

    const newMeal = {
      id: Date.now().toString(),
      type: mealType,
      name: mealName.trim(),
      calories: Number(mealCalories),
      protein: Number(mealProtein) || 0,
      date: selectedDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    const updated = [newMeal, ...meals];
    setMeals(updated);
    localStorage.setItem('fitpulse_meals', JSON.stringify(updated));

    setMealName('');
    setMealCalories('');
    setMealProtein('');
  };

  const handleDeleteMeal = (id) => {
    const updated = meals.filter((m) => m.id !== id);
    setMeals(updated);
    localStorage.setItem('fitpulse_meals', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {selectedDate === todayDateStr
                  ? "Today's Nutrition"
                  : selectedDate === yesterdayDateStr
                  ? "Yesterday's Nutrition"
                  : `Nutrition for ${selectedDate}`}
              </h3>
              {selectedDate === todayDateStr && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Today
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Quick Date Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(yesterdayDateStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedDate === yesterdayDateStr
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(todayDateStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedDate === todayDateStr
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Today
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            title="Select specific date"
          />
        </div>
      </div>

      {/* Top Banner Nutrition Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Calorie Budget Card with Edit ✏️ button */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md relative group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Daily Calorie Budget</span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-1 rounded-md text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 transition-colors cursor-pointer"
                title="Edit Target & Body Weight"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {totalCaloriesConsumed.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">/ {dailyCalorieBudget.toLocaleString()} kcal</span>
          </p>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
            <span>{Math.max(dailyCalorieBudget - totalCaloriesConsumed, 0)} kcal remaining</span>
            <div className="flex items-center gap-1.5">
              {isCustomCalorie && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Custom
                </span>
              )}
              <span className="text-orange-400 font-bold">{caloriePercent}%</span>
            </div>
          </div>
        </div>

        {/* Protein Target Card with Edit ✏️ button */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md relative group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Daily Protein Goal</span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-1 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                title="Edit Target & Body Weight"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Apple className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {totalProteinConsumed}g{' '}
            <span className="text-xs font-normal text-slate-500">/ {dailyProteinTarget}g</span>
          </p>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
            <span>{Math.max(dailyProteinTarget - totalProteinConsumed, 0)}g needed</span>
            <div className="flex items-center gap-1.5">
              {isCustomProtein && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Custom
                </span>
              )}
              <span className="text-emerald-400 font-bold">{proteinPercent}%</span>
            </div>
          </div>
        </div>

        {/* Hydration Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Daily Hydration</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {currentWaterMl} <span className="text-xs font-normal text-slate-500">/ {waterGoal} ml</span>
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => handleAddWater(250)}
              className="flex-1 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              +250ml
            </button>
            <button
              onClick={() => handleAddWater(500)}
              className="flex-1 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              +500ml
            </button>
            <button
              onClick={handleResetWater}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer text-xs"
              title="Reset water"
            >
              ↺
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Meal Logger Form on Left, Meals List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left (1 col): Log Meal Form */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Utensils className="w-4 h-4 text-emerald-400" />
            Record Daily Meal
          </h3>

          <form onSubmit={handleAddMeal} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Meal Category
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Food / Description *
              </label>
              <input
                type="text"
                required
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g. Salmon with Quinoa & Asparagus"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Calories (kcal) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={mealCalories}
                  onChange={(e) => setMealCalories(e.target.value)}
                  placeholder="e.g. 550"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={mealProtein}
                  onChange={(e) => setMealProtein(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer mt-2"
            >
              + Add Meal Log
            </button>
          </form>
        </div>

        {/* Right (2 cols): Meal History List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                {selectedDate === todayDateStr
                  ? "Today's Meals"
                  : selectedDate === yesterdayDateStr
                  ? "Yesterday's Meals"
                  : `Meals for ${selectedDate}`}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {displayedMeals.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Breakdown of calories and macros consumed</p>
            </div>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
              {totalCaloriesConsumed} kcal logged
            </span>
          </div>

          {displayedMeals.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800">
              <Utensils className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">
                {selectedDate === todayDateStr ? "No meals logged today" : "No meals logged for this date"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Log breakfast, lunch, or snacks to track your nutrition!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedMeals.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {m.type}
                      </span>
                      <h4 className="font-bold text-xs text-white">{m.name}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-bold">
                      {m.calories} kcal
                    </span>
                    {m.protein > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
                        {m.protein}g protein
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteMeal(m.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Delete meal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Target & Weight Settings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Weight-Based Nutrition Targets</h3>
                  <p className="text-xs text-slate-400">Configure body weight, fitness goal & custom targets</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  modalMsg.startsWith('Error')
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}
              >
                {modalMsg.startsWith('Error') ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                <span>{modalMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveTargets} className="space-y-4">
              {/* Weight & Goal Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    Body Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="250"
                    step="0.5"
                    required
                    value={modalWeight}
                    onChange={(e) => setModalWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    Fitness Goal
                  </label>
                  <select
                    value={modalGoal}
                    onChange={(e) => setModalGoal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="lose_fat">Fat Loss (-400 kcal deficit)</option>
                    <option value="maintain">Maintenance (Maintain weight)</option>
                    <option value="build_muscle">Build Muscle (+300 kcal surplus)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Auto-Recommendation Banner */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-300">Auto-Recommendation:</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    {liveModalRecs.recommendedCalories} kcal
                  </span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {liveModalRecs.recommendedProtein}g protein
                  </span>
                </div>
              </div>

              {/* Custom Overrides Section */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Custom Target Overrides (Optional)
                  </label>
                  {(modalCustomCal !== '' || modalCustomProt !== '') && (
                    <button
                      type="button"
                      onClick={handleResetToRecommended}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to Recommended
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Custom Calories (kcal)
                    </label>
                    <input
                      type="number"
                      min="800"
                      max="10000"
                      value={modalCustomCal}
                      onChange={(e) => setModalCustomCal(e.target.value)}
                      placeholder={`Auto (${liveModalRecs.recommendedCalories})`}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Custom Protein (g)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="500"
                      value={modalCustomProt}
                      onChange={(e) => setModalCustomProt(e.target.value)}
                      placeholder={`Auto (${liveModalRecs.recommendedProtein}g)`}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Leave empty to use dynamic weight-based recommendations.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {modalSaving ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save Targets</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionView;

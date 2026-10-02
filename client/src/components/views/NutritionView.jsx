import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Droplets,
  Flame,
  Plus,
  Trash2,
  PieChart,
  CheckCircle2,
  Sparkles,
  Apple
} from 'lucide-react';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const NutritionView = () => {
  // Hydration state with localStorage
  const [waterMl, setWaterMl] = useState(() => {
    const saved = localStorage.getItem('fitpulse_water_ml');
    return saved ? Number(saved) : 1750;
  });
  const waterGoal = 3000;

  // Meal Logs state with localStorage
  const [meals, setMeals] = useState(() => {
    const saved = localStorage.getItem('fitpulse_meals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: '1', type: 'Breakfast', name: 'Oatmeal & Whey Protein Shake', calories: 450, protein: 35 },
      { id: '2', type: 'Lunch', name: 'Grilled Chicken Breast, Brown Rice & Broccoli', calories: 650, protein: 55 }
    ];
  });

  // New Meal Form
  const [mealType, setMealType] = useState('Lunch');
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');

  // Daily Targets
  const dailyCalorieBudget = 2400;
  const dailyProteinTarget = 160; // in grams

  const totalCaloriesConsumed = meals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalProteinConsumed = meals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);

  const caloriePercent = Math.min(Math.round((totalCaloriesConsumed / dailyCalorieBudget) * 100), 100);
  const proteinPercent = Math.min(Math.round((totalProteinConsumed / dailyProteinTarget) * 100), 100);

  // Hydration handlers
  const handleAddWater = (amount) => {
    const updated = Math.min(waterMl + amount, 5000);
    setWaterMl(updated);
    localStorage.setItem('fitpulse_water_ml', updated.toString());
  };

  const handleResetWater = () => {
    setWaterMl(0);
    localStorage.setItem('fitpulse_water_ml', '0');
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      {/* Top Banner Nutrition Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Calorie Budget Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Daily Calorie Budget</span>
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
            <span className="text-orange-400 font-bold">{caloriePercent}%</span>
          </div>
        </div>

        {/* Protein Target Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Daily Protein Goal</span>
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
            <span className="text-emerald-400 font-bold">{proteinPercent}%</span>
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
            {waterMl} <span className="text-xs font-normal text-slate-500">/ {waterGoal} ml</span>
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
                Today's Meals
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {meals.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Breakdown of calories and macros consumed</p>
            </div>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
              {totalCaloriesConsumed} kcal logged
            </span>
          </div>

          {meals.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800">
              <Utensils className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">No meals logged today</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Log breakfast, lunch, or snacks to track your nutrition!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((m) => (
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
    </div>
  );
};

export default NutritionView;

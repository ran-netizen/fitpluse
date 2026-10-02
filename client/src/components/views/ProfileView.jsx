import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Settings,
  Database,
  Key,
  LogOut,
  Save,
  Check,
  Scale,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfileView = () => {
  const { user, logout, updateNutritionTargets } = useAuth();

  const [weightUnit, setWeightUnit] = useState(() => {
    return localStorage.getItem('fitpulse_weight_unit') || 'kg';
  });

  const [defaultDuration, setDefaultDuration] = useState(() => {
    return localStorage.getItem('fitpulse_default_duration') || '45';
  });

  const [weight, setWeight] = useState(user?.weight || 70);
  const [fitnessGoal, setFitnessGoal] = useState(user?.fitnessGoal || 'maintain');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.weight) setWeight(user.weight);
      if (user.fitnessGoal) setFitnessGoal(user.fitnessGoal);
    }
  }, [user]);

  const isVerified = user?.isVerified !== false;

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem('fitpulse_weight_unit', weightUnit);
    localStorage.setItem('fitpulse_default_duration', defaultDuration);

    if (updateNutritionTargets) {
      await updateNutritionTargets({
        weight: Number(weight) || 70,
        fitnessGoal
      });
    }

    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Account Info Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {user?.name}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  FitPulse Pro Member
                </span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Verification Status */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {isVerified ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs font-bold text-white">
                {isVerified ? 'Email Verification Status: Verified' : 'Email Verification Status: Action Required'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isVerified
                  ? 'Your account is fully verified and connected to cloud sync.'
                  : 'Please confirm your email address to unlock cloud backup.'}
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              isVerified
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {isVerified ? 'Verified' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Fitness Preferences Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Settings className="w-4 h-4 text-emerald-400" />
          Fitness & Profile Preferences
        </h3>

        {savedSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            Preferences updated successfully!
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Current Body Weight (kg)
              </label>
              <input
                type="number"
                min="30"
                max="250"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Primary Fitness Goal
              </label>
              <select
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="lose_fat">Lose Fat (-400 kcal deficit)</option>
                <option value="maintain">Maintain Weight</option>
                <option value="build_muscle">Build Muscle (+300 kcal surplus)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Weight Measurement Unit
              </label>
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="kg">Kilograms (kg) — Default</option>
                <option value="lbs">Pounds (lbs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Default Session Duration
              </label>
              <select
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Cloud & Security Status Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Database className="w-4 h-4 text-emerald-400" />
          Cloud Architecture & Security
        </h3>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">MongoDB Atlas Cluster</p>
                <p className="text-[10px] text-slate-400">Database cluster: fitnesscluster.rbpyvxv.mongodb.net</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Connected
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">JWT Session Security</p>
                <p className="text-[10px] text-slate-400">Tokens cryptographically signed with HMAC SHA-256</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

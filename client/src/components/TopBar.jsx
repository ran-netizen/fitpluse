import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Plus,
  ShieldCheck,
  AlertCircle,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TAB_TITLES = {
  overview: { title: 'Overview', breadcrumb: 'Dashboard' },
  workouts: { title: 'Workout Logs', breadcrumb: 'Training' },
  nutrition: { title: 'Nutrition & Water', breadcrumb: 'Wellness' },
  analytics: { title: 'Analytics & Goals', breadcrumb: 'Metrics' },
  profile: { title: 'Profile & Settings', breadcrumb: 'Account' }
};

const TopBar = ({ activeTab, setActiveTab, onOpenMobileSidebar }) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isVerified = user?.isVerified !== false;

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const tabInfo = TAB_TITLES[activeTab] || { title: 'Dashboard', breadcrumb: 'FitPulse' };


  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Drawer Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span>FitPulse</span>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">{tabInfo.breadcrumb}</span>
          </nav>
          <h1 className="text-base font-bold text-white tracking-tight leading-tight">
            {tabInfo.title}
          </h1>
        </div>
      </div>

      {/* Right: Actions, Status Pill, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* User Status Pill (Verified / Pending) */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isVerified
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
          title={isVerified ? 'Account is verified' : 'Account pending email verification'}
        >
          {isVerified ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Email Verified</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Verification</span>
            </>
          )}
        </div>

        {/* Quick Action: + Log Workout */}
        {activeTab !== 'workouts' && (
          <button
            onClick={() => setActiveTab('workouts')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Log Workout</span>
            <span className="sm:hidden">Log</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white">Notifications</p>
                <span className="text-[10px] text-emerald-400 font-semibold">2 New</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Consistency Streak!
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    You logged workouts 5 days this week. Keep up the momentum!
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> MongoDB Atlas Synced
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    All session records are securely synced to your cloud database.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-green-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white truncate max-w-[100px]">{user?.name}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Profile & Settings</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;

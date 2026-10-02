import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import OverviewView from './views/OverviewView';
import WorkoutsView from './views/WorkoutsView';
import NutritionView from './views/NutritionView';
import AnalyticsView from './views/AnalyticsView';
import ProfileView from './views/ProfileView';
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  TrendingUp,
  Settings
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab & Shell Navigation state
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch all workouts for current user
  const fetchWorkouts = async () => {
    if (!user || !user.token) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/workouts', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          // Stale session or deleted user -> gracefully reset session
          logout();
          return;
        }
        throw new Error(data.error || 'Failed to fetch workouts');
      }

      // Defensive guard against non-array response
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch workouts error:', err);
      setError(err.message);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [user]);

  // Handle adding new workout
  const handleWorkoutAdded = (newWorkout) => {
    setWorkouts((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      return [newWorkout, ...current];
    });
  };

  // Handle deleting workout
  const handleDeleteWorkout = async (id) => {
    try {
      const res = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete workout');
      }

      setWorkouts((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        return current.filter((w) => w._id !== id);
      });
    } catch (err) {
      alert(`Error deleting workout: ${err.message}`);
    }
  };

  const safeWorkouts = Array.isArray(workouts) ? workouts : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. Collapsible/Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workoutsCount={safeWorkouts.length}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area (adjusted with dynamic left padding on desktop) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* 2. Top Bar */}
        <TopBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Global Error Banner */}
        {error && (
          <div className="mx-4 sm:mx-8 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
            <span>⚠️ Error syncing records: {error}</span>
            <button
              onClick={fetchWorkouts}
              className="text-white bg-red-500/20 px-2.5 py-1 rounded-lg hover:bg-red-500/30 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* 3. Main View Area: Render only the active tab */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              workouts={safeWorkouts}
              user={user}
              setActiveTab={setActiveTab}
              onWorkoutAdded={handleWorkoutAdded}
              token={user?.token}
            />
          )}

          {activeTab === 'workouts' && (
            <WorkoutsView
              workouts={safeWorkouts}
              onWorkoutAdded={handleWorkoutAdded}
              onDeleteWorkout={handleDeleteWorkout}
              loading={loading}
              token={user?.token}
            />
          )}

          {activeTab === 'nutrition' && <NutritionView />}

          {activeTab === 'analytics' && (
            <AnalyticsView workouts={safeWorkouts} />
          )}

          {activeTab === 'profile' && <ProfileView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for quick access */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-2 px-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'overview' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('workouts')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all relative ${
            activeTab === 'workouts' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Dumbbell className="w-5 h-5 mb-0.5" />
          <span>Workouts</span>
          {safeWorkouts.length > 0 && (
            <span className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('nutrition')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'nutrition' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Utensils className="w-5 h-5 mb-0.5" />
          <span>Nutrition</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'analytics' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'profile' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;

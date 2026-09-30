import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import WeeklyProgress from './WeeklyProgress';
import WorkoutForm from './WorkoutForm';
import WorkoutList from './WorkoutList';

const Dashboard = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all workouts for current user
  const fetchWorkouts = async () => {
    if (!user || !user.token) return;

    try {
      setLoading(true);
      const res = await fetch('/api/workouts', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch workouts');
      }

      setWorkouts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [user]);

  // Handle adding new workout
  const handleWorkoutAdded = (newWorkout) => {
    setWorkouts((prev) => [newWorkout, ...prev]);
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

      setWorkouts((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      alert(`Error deleting workout: ${err.message}`);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner Greeting */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-emerald-400">{user.name}</span> 👋
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Log your training sets today and stay on track with your fitness goals.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Weekly Progress & Goal Tracker */}
      <WeeklyProgress workouts={workouts} />

      {/* Main Grid: Form (Workout Logger) & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Workout Logger Form */}
        <div className="lg:col-span-1">
          <WorkoutForm onWorkoutAdded={handleWorkoutAdded} token={user.token} />
        </div>

        {/* Right Column: Workout History List */}
        <div className="lg:col-span-2">
          <WorkoutList
            workouts={workouts}
            onDeleteWorkout={handleDeleteWorkout}
            loading={loading}
          />
        </div>
      </div>
    </main>
  );
};

export default Dashboard;

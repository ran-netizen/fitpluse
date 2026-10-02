import React from 'react';
import WorkoutForm from '../WorkoutForm';
import WorkoutList from '../WorkoutList';
import { Dumbbell, Layers, TrendingUp } from 'lucide-react';

const WorkoutsView = ({
  workouts = [],
  onWorkoutAdded,
  onDeleteWorkout,
  loading,
  token
}) => {
  const safeWorkouts = Array.isArray(workouts) ? workouts : [];

  const totalVolume = safeWorkouts.reduce((acc, curr) => {
    return acc + (curr.load || 0) * (curr.reps || 1) * (curr.sets || 1);
  }, 0);

  const totalDuration = safeWorkouts.reduce((acc, curr) => {
    return acc + (Number(curr.duration) || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Total Exercises Logged</p>
            <p className="text-lg font-bold text-white">{safeWorkouts.length} sessions</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">All-Time Volume Lifted</p>
            <p className="text-lg font-bold text-white">{totalVolume.toLocaleString()} kg</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Total Training Duration</p>
            <p className="text-lg font-bold text-white">{totalDuration} mins</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, History List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left (1 col): Deep Workout Form */}
        <div className="lg:col-span-1">
          <WorkoutForm onWorkoutAdded={onWorkoutAdded} token={token} />
        </div>

        {/* Right (2 cols): Workout History List with CSV Export */}
        <div className="lg:col-span-2">
          <WorkoutList
            workouts={safeWorkouts}
            onDeleteWorkout={onDeleteWorkout}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkoutsView;

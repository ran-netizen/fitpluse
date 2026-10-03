import React, { useState } from 'react';
import {
  Trash2,
  Dumbbell,
  Calendar,
  Search,
  Download,
  Layers,
  Clock,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { formatLocalDate, getTodayDateStr } from '../utils/dateUtils';

const WorkoutList = ({ workouts, onDeleteWorkout, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const safeWorkouts = Array.isArray(workouts) ? workouts : [];
  const filteredWorkouts = safeWorkouts.filter((w) => {
    const title = (w.title || w.exercise || '').toLowerCase();
    return title.includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id) => {
    setDeletingId(id);
    await onDeleteWorkout(id);
    setDeletingId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = now.toDateString() === date.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // CSV Data Export Handler
  const handleExportCSV = () => {
    if (!workouts || workouts.length === 0) {
      alert('No workout data to export yet.');
      return;
    }

    setExporting(true);

    try {
      const headers = ['Date', 'Exercise Name', 'Duration (mins)', 'Sets', 'Reps', 'Load (kg)', 'Calories Burned (kcal)'];

      const rows = workouts.map((w) => {
        const dateStr = w.createdAt ? formatLocalDate(new Date(w.createdAt)) : '';
        const name = (w.title || w.exercise || 'Workout').replace(/"/g, '""');
        const duration = w.duration || 0;
        const sets = w.sets || 1;
        const reps = w.reps || 0;
        const load = w.load || 0;
        const calories = w.calories || w.caloriesBurned || (w.duration ? w.duration * 7 : 0);

        return [
          `"${dateStr}"`,
          `"${name}"`,
          duration,
          sets,
          reps,
          load,
          calories
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateTag = getTodayDateStr();
      link.setAttribute('href', url);
      link.setAttribute('download', `fitpulse_workouts_${dateTag}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to generate CSV export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* List Header, Search & Export CSV Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-400" />
            Workout History
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {workouts.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400">View, search, and export your personal fitness records</p>
        </div>

        {/* Right side: Search & Export CSV */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleExportCSV}
            disabled={workouts.length === 0 || exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/30">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400 mb-3">
            <Dumbbell className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">
            {searchTerm ? 'No exercises match your search' : 'No workouts logged yet'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Try searching with a different exercise keyword.'
              : 'Use the form on the left to record your first fitness exercise and start tracking progress.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredWorkouts.map((workout) => {
            const cals =
              workout.calories ||
              workout.caloriesBurned ||
              (workout.duration ? workout.duration * 7 : 0);

            return (
              <div
                key={workout._id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                      {workout.title || workout.exercise}
                    </h4>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(workout.createdAt)}
                    </span>
                  </div>

                  {/* Metric Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                      <strong>{workout.load}</strong> kg
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                      <strong>{workout.reps}</strong> reps
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <strong>{workout.sets || 1}</strong> sets
                    </span>
                    {workout.duration > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <strong>{workout.duration}</strong> mins
                      </span>
                    )}
                    {cals > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                        <Flame className="w-3 h-3 text-orange-400" />
                        <strong>{cals}</strong> kcal
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete Action */}
                <div className="self-end sm:self-center">
                  <button
                    onClick={() => handleDelete(workout._id)}
                    disabled={deletingId === workout._id}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Delete workout log"
                  >
                    {deletingId === workout._id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkoutList;

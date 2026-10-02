import React from 'react';
import WeeklyProgress from '../WeeklyProgress';
import { TrendingUp, BarChart3, Award } from 'lucide-react';

const AnalyticsView = ({ workouts = [] }) => {
  const safeWorkouts = Array.isArray(workouts) ? workouts : [];

  return (
    <div className="space-y-6">
      {/* Full Weekly Progress Component with Set Goal Modal & Charts */}
      <WeeklyProgress workouts={safeWorkouts} />
    </div>
  );
};

export default AnalyticsView;

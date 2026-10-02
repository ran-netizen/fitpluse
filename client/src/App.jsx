import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import Dashboard from './components/Dashboard';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading FitPulse PRO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {user ? (
        <Dashboard />
      ) : (
        <>
          <Navbar />
          <div className="flex-1">
            <AuthView />
          </div>
          <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
            FitPulse &copy; {new Date().getFullYear()} &bull; Academic MERN Fitness & Workout Logger
          </footer>
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

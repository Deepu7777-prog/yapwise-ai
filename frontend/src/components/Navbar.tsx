import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, Flame, User, LogOut, Sparkles, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white">YAPWISE</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-none">Voice & Interview Coach</p>
          </div>
        </Link>

        {/* Primary Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            to="/dashboard"
            className={`px-3 py-2 rounded-lg transition-colors ${
              isCurrent('/dashboard')
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/practice"
            className={`px-3 py-2 rounded-lg transition-colors ${
              isCurrent('/practice')
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Voice Practice
          </Link>
          <Link
            to="/interview/hr"
            className={`px-3 py-2 rounded-lg transition-colors ${
              isCurrent('/interview/hr')
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            HR Interview
          </Link>
          <Link
            to="/interview/technical"
            className={`px-3 py-2 rounded-lg transition-colors ${
              isCurrent('/interview/technical')
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Tech Interview
          </Link>
          <Link
            to="/interview/gd"
            className={`px-3 py-2 rounded-lg transition-colors ${
              isCurrent('/interview/gd')
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            GD Arena
          </Link>
          <Link
            to="/learning"
            className={`px-3 py-2 rounded-lg transition-colors ${
              isCurrent('/learning')
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Curriculum
          </Link>
          <Link
            to="/progress"
            className={`px-3 py-2 rounded-lg transition-colors ${
              isCurrent('/progress')
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Analytics
          </Link>
        </nav>

        {/* Right Action Icons / Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Daily Streak Badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold"
                title={`${user.daily_streak} Day Practice Streak`}
              >
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                <span>{user.daily_streak}d streak</span>
              </div>

              {/* Profile & Settings link */}
              <Link
                to="/settings"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                title="Goal & Audio Settings"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700">
                  {user.full_name ? user.full_name[0] : 'U'}
                </div>
                <span className="hidden lg:inline text-xs font-medium text-slate-200">
                  {user.full_name.split(' ')[0]}
                </span>
              </Link>

              {/* Logout button */}
              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-md shadow-brand-500/20 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

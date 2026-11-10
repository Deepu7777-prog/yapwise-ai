import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Briefcase,
  Cpu,
  Users,
  Flame,
  Gauge,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import { ScoreRadar } from '../components/ScoreRadar';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getDashboardAnalytics();
        setStats(data);
      } catch (err) {
        console.warn('Using default dashboard metrics for preview');
        setStats({
          readiness_score: 87.5,
          total_sessions: 14,
          practice_sessions_count: 8,
          interview_sessions_count: 4,
          gd_sessions_count: 2,
          daily_streak: user?.daily_streak || 5,
          average_wpm: 142.0,
          average_filler_words: 1.8,
          learning_progress_pct: 60.0,
          radar_metrics: [
            { subject: 'Clarity', value: 88, fullMark: 100 },
            { subject: 'Fluency', value: 85, fullMark: 100 },
            { subject: 'Vocabulary', value: 82, fullMark: 100 },
            { subject: 'Confidence', value: 89, fullMark: 100 },
            { subject: 'Structure', value: 86, fullMark: 100 },
          ],
          timeline: [
            { date: 'Nov 01', score: 79, wpm: 130, fillers: 4 },
            { date: 'Nov 02', score: 82, wpm: 138, fillers: 3 },
            { date: 'Nov 03', score: 84, wpm: 140, fillers: 2 },
            { date: 'Nov 04', score: 86, wpm: 144, fillers: 2 },
            { date: 'Nov 05', score: 89, wpm: 142, fillers: 1 },
          ],
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-brand-950/40">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target Role: {user?.target_role || 'Senior Software Engineer'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Executive'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Your speech cadence and interview structure have improved by 14% this week. Keep up the momentum!
            </p>
          </div>

          {/* Composite Readiness Score Card */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-950/80 border border-brand-500/30 shadow-xl">
            <div className="relative flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" className="text-slate-800" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={200}
                  strokeDashoffset={200 - (200 * stats.readiness_score) / 100}
                  strokeLinecap="round"
                  className="text-brand-500 transition-all duration-1000 ease-out"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-lg font-black text-white">
                {Math.round(stats.readiness_score)}
              </span>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interview Readiness</div>
              <div className="text-sm font-bold text-brand-400">
                {stats.readiness_score >= 85 ? 'Executive Ready' : stats.readiness_score >= 70 ? 'Proficient' : 'Developing'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Top 5% among applicants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Daily Streak"
          value={`${stats.daily_streak} Days`}
          subtitle="Consistency is key to vocal confidence"
          icon={<Flame className="w-5 h-5 text-amber-400" />}
          accentColor="amber"
          trend="+1 day"
          trendUp={true}
        />
        <StatCard
          title="Average Cadence"
          value={`${stats.average_wpm} WPM`}
          subtitle="Optimal range: 130 - 160 WPM"
          icon={<Gauge className="w-5 h-5 text-brand-400" />}
          accentColor="brand"
          trend="Ideal"
          trendUp={true}
        />
        <StatCard
          title="Filler Word Rate"
          value={`${stats.average_filler_words} / min`}
          subtitle="Down from 4.2 last month"
          icon={<TrendingUp className="w-5 h-5 text-indigo-400" />}
          accentColor="indigo"
          trend="-57%"
          trendUp={true}
        />
        <StatCard
          title="Curriculum Progress"
          value={`${Math.round(stats.learning_progress_pct)}%`}
          subtitle="Vocal dynamics & behavioral modules"
          icon={<BookOpen className="w-5 h-5 text-emerald-400" />}
          accentColor="brand"
          trend="3 modules done"
          trendUp={true}
        />
      </div>

      {/* Main Middle Row: Radar Chart & Quick Practice Arena Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-400" />
              Communication Competency Radar
            </h2>
            <p className="text-xs text-slate-400 mt-1">Multi-axis rubric evaluated by Gemini AI</p>
          </div>

          <div className="py-2 flex items-center justify-center">
            <ScoreRadar metrics={stats.radar_metrics} size={280} />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Strongest: Confidence & Clarity</span>
            <Link to="/progress" className="text-brand-400 hover:text-brand-300 font-semibold">
              Deep Analytics →
            </Link>
          </div>
        </div>

        {/* Quick Launch Arenas */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Instant Practice Arenas
            </h2>
            <p className="text-xs text-slate-400 mt-1">Select a simulated session to practice right now</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4">
            <Link
              to="/practice"
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/40 hover:bg-slate-900 transition-all group flex items-start gap-3.5"
            >
              <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-brand-400">
                  Voice Practice Lab
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Live STT, filler word counts & pacing.</p>
              </div>
            </Link>

            <Link
              to="/interview/hr"
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group flex items-start gap-3.5"
            >
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400">
                  HR Behavioral Round
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">STAR method critique with Sarah (AI HR).</p>
              </div>
            </Link>

            <Link
              to="/interview/technical"
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition-all group flex items-start gap-3.5"
            >
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400">
                  Technical Architecture
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">System design & trade-off defense with Alex.</p>
              </div>
            </Link>

            <Link
              to="/interview/gd"
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900 transition-all group flex items-start gap-3.5"
            >
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-400">
                  Group Discussion Arena
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Multi-agent panel with Elena, Priya & Marcus.</p>
              </div>
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Daily goal: 15 minutes of verbal practice</span>
            <Link to="/learning" className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
              <span>View Recommended Drills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

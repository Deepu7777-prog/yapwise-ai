import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Clock, ArrowDown, Calendar, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { ScoreRadar } from '../components/ScoreRadar';
import { DashboardStats, ActivityHistory } from '../types';

export const ProgressReportsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<ActivityHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashData, histData] = await Promise.all([
          api.getDashboardAnalytics(),
          api.getActivityHistory(),
        ]);
        setStats(dashData);
        setHistory(histData);
      } catch (err: any) {
        console.error('Failed to load progress analytics:', err);
        setErrorMsg(err.message || 'Failed to load progress telemetry from backend.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Longitudinal Telemetry & Scorecards</span>
        </div>
        <h1 className="text-3xl font-black text-white">Progress & Analytics Reports</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track cadence evolution, filler word reduction, and multidimensional competency growth over time.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading && (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading progress telemetry and historical session logs...</p>
        </div>
      )}

      {/* Overview Grid */}
      {!loading && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Readiness Card */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Readiness Index</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-brand-400">{Math.round(stats.readiness_score)}%</span>
                <span className="text-xs text-emerald-400 font-bold">{stats.readiness_score >= 80 ? 'Optimal' : 'In Progress'}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Composite index combining pacing consistency, STAR behavioral adherence, and vocabulary richness.
              </p>
            </div>

            {/* Filler Word Reduction */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filler Pause Rate</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-indigo-400">{stats.average_filler_words}</span>
                <span className="text-xs text-slate-400 font-semibold">fillers / session</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tactical pauses replace vocal hesitations like "um" and "like".
              </p>
            </div>

            {/* Average WPM */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Speaking Pace</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-cyan-400">{stats.average_wpm}</span>
                <span className="text-xs text-slate-400 font-semibold">WPM</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Target range: 130–160 WPM for clear executive articulation.
              </p>
            </div>
          </div>

          {/* Middle: Radar Chart + Historical Trend Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Competencies */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-400" />
                  5-Axis Communication Competency
                </h3>
                <p className="text-xs text-slate-400">Holistic rubric evaluated by Gemini AI across all sessions</p>
              </div>
              <div className="flex items-center justify-center py-2">
                <ScoreRadar metrics={stats.radar_metrics} size={300} />
              </div>
            </div>

            {/* Timeline Progression Bar Chart */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Recent Session Score Trajectory
                </h3>
                <p className="text-xs text-slate-400">Scores across recent practice and interview sessions</p>
              </div>

              {stats.timeline && stats.timeline.length > 0 ? (
                <div className="space-y-4 py-4">
                  {stats.timeline.map((point, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">{point.date}</span>
                        <div className="flex items-center gap-4 text-slate-400">
                          <span>{point.wpm} WPM</span>
                          <span>{point.fillers} fillers</span>
                          <span className="font-bold text-brand-400">{point.score}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-600 to-emerald-400 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, point.score)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  No practice sessions recorded yet. Start a session in the Voice Practice Lab!
                </div>
              )}

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Scores are calculated dynamically across all speech exercises.</span>
              </div>
            </div>
          </div>

          {/* Activity History Logs (Practices & Interviews) */}
          {history && (history.practices.length > 0 || history.interviews.length > 0) && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Session History Log
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Practices */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Practice Exercises</span>
                  {history.practices.length === 0 ? (
                    <p className="text-xs text-slate-500">No practice sessions logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {history.practices.map((p) => (
                        <div key={p.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-200">{p.title}</div>
                            <div className="text-[11px] text-slate-400">{p.mode} • {p.wpm} WPM</div>
                          </div>
                          <span className="font-bold text-brand-400 text-sm">{Math.round(p.overall_score)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interviews */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Interview Simulations</span>
                  {history.interviews.length === 0 ? (
                    <p className="text-xs text-slate-500">No interview sessions logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {history.interviews.map((i) => (
                        <div key={i.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-200">{i.title}</div>
                            <div className="text-[11px] text-slate-400">{i.type.toUpperCase()} • {i.role}</div>
                          </div>
                          <span className="font-bold text-indigo-400 text-sm">{Math.round(i.overall_score)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Play, Sparkles, ChevronRight, Award, Trophy, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { LearningModule } from '../types';

export const LearningPage: React.FC = () => {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchModules = async () => {
    try {
      const data = await api.getLearningModules();
      setModules(data);
    } catch (err: any) {
      console.error('API error fetching modules:', err);
      setErrorMsg(err.message || 'Failed to load learning modules from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleCompleteExercise = async (moduleId: number) => {
    setErrorMsg(null);
    try {
      const updated = await api.advanceModuleExercise(moduleId);
      setModules((prev) => prev.map((m) => (m.id === moduleId ? updated : m)));
    } catch (err: any) {
      console.error('Failed to update exercise progress:', err);
      setErrorMsg(err.message || 'Failed to advance module exercise.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Executive Communication Curriculum</span>
        </div>
        <h1 className="text-3xl font-black text-white">Personalized Learning & Skill Drills</h1>
        <p className="text-sm text-slate-400 mt-1">
          Targeted micro-lessons and vocal workouts curated for your target engineering and leadership roles.
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
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading personalized modules from database...</p>
        </div>
      )}

      {/* Module Cards Grid */}
      {!loading && (
        <div className="space-y-4">
          {modules.map((module) => {
            const isDone = module.is_completed;
            return (
              <div
                key={module.id}
                className={`glass-panel rounded-2xl p-6 border transition-all ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {module.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          module.difficulty === 'Beginner'
                            ? 'bg-blue-500/10 text-blue-400'
                            : module.difficulty === 'Intermediate'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {module.difficulty}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      {module.title}
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{module.description}</p>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-slate-300">
                        {module.completed_exercises_count} of {module.exercises_count} Drills
                      </span>
                      <div className="w-32 bg-slate-800 h-2 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDone ? 'bg-emerald-500' : 'bg-brand-500'
                          }`}
                          style={{ width: `${module.progress_percent}%` }}
                        />
                      </div>
                    </div>

                    {!isDone ? (
                      <button
                        type="button"
                        onClick={() => handleCompleteExercise(module.id)}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Practice Drill</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        Mastered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

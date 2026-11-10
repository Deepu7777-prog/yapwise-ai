import React from 'react';
import { Mic, Heart, ShieldCheck, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm">YapWise AI Platform</span>
              <p className="text-xs text-slate-500">FastAPI • SQLite • React • Vite • Gemini AI</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Client Speech Privacy & Offline Fallback</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Multi-Agent Interview Chambers</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            YapWise AI © {new Date().getFullYear()} • Elevate Executive Communication
          </p>
        </div>
      </div>
    </footer>
  );
};

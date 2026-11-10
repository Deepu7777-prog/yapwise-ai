import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Users,
  Briefcase,
  Cpu,
  BarChart3,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      title: 'Voice Practice Lab',
      desc: 'Extempore, pacing, and filler word detection with live browser speech recognition and instant Gemini AI rubric evaluation.',
      icon: <Mic className="w-6 h-6 text-brand-400" />,
      link: '/practice',
      badge: 'Real-Time STT',
    },
    {
      title: 'HR Behavioral Interviews',
      desc: 'Simulate high-stakes behavioral rounds with Sarah (HR Lead) using the STAR framework and speech pacing critique.',
      icon: <Briefcase className="w-6 h-6 text-indigo-400" />,
      link: '/interview/hr',
      badge: 'STAR Rubric',
    },
    {
      title: 'Technical System Defense',
      desc: 'Defend architecture, trade-offs, and algorithms verbally with Alex (Principal Architect) in conversational simulations.',
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      link: '/interview/technical',
      badge: 'System Design',
    },
    {
      title: 'Group Discussion Arena',
      desc: 'Multi-agent panel chamber featuring opposing personas: Moderator Elena, Advocate Priya, and Skeptic Marcus.',
      icon: <Users className="w-6 h-6 text-amber-400" />,
      link: '/interview/gd',
      badge: 'Multi-Agent',
    },
    {
      title: 'Personalized Curriculum',
      desc: 'Targeted drills to eliminate filler words, expand vocabulary, master pauses, and build commanding executive presence.',
      icon: <BookOpen className="w-6 h-6 text-emerald-400" />,
      link: '/learning',
      badge: 'Self-Paced Drills',
    },
    {
      title: 'Longitudinal Analytics',
      desc: 'Track speaking rate (WPM), filler frequency trends, and multidimensional radar charts over time.',
      icon: <BarChart3 className="w-6 h-6 text-rose-400" />,
      link: '/progress',
      badge: 'Radar Scoring',
    },
  ];

  return (
    <div className="space-y-20 py-10">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-6 animate-pulse-slow">
          <Sparkles className="w-4 h-4" />
          <span>Next-Gen AI Speech & Interview Simulation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Master High-Stakes <br />
          <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-indigo-400 bg-clip-text text-transparent">
            Verbal Communication & Interviews
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          YapWise AI provides real-time voice feedback, STAR-framework interview simulations, multi-agent group discussions, and personalized vocal drills powered by Google Gemini.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/practice"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <span>Start Voice Practice</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/interview/hr"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition-all"
          >
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>Simulate HR Interview</span>
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-medium text-sm border border-slate-800 transition-all"
          >
            <span>View Dashboard</span>
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Zero hardware lock-in (In-browser STT/TTS)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Typed text fallback for noisy environments
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> Secure backend Gemini integration
          </span>
        </div>
      </section>

      {/* 4 Voice Arenas Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Full-Spectrum Communication Arenas</h2>
          <p className="mt-2 text-sm text-slate-400">Everything you need to articulate thoughts under pressure</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Link
              key={i}
              to={f.link}
              className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-brand-400 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-brand-400 group-hover:text-brand-300">
                <span>Launch Session</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

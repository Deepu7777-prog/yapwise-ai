import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mic,
  Users,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  BarChart3,
  CalendarCheck,
  Cpu,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Landing: React.FC = () => {
  const { user, isLoading } = useAuth();

  // If already logged in, redirect to dashboard
  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: Mic,
      color: 'bg-[#EDE7FF] text-[#8B70D6]',
      title: 'AI Voice Practice',
      desc: 'Free-flowing spoken conversations on any topic. Real-time transcription, immediate speech coaching, and sentence-by-sentence corrections.',
    },
    {
      icon: Briefcase,
      color: 'bg-[#FFD9C9] text-[#8C4A2F]',
      title: 'HR & Technical Mock Interviews',
      desc: 'Role-specific questions for software engineers, analysts, and fresh grads. Get evaluated on answer structure, clarity, and industry terminology.',
    },
    {
      icon: Users,
      color: 'bg-[#BDEBD9] text-[#1D6A4E]',
      title: 'Group Discussion Simulator',
      desc: 'Practice GD rounds with 3 realistic AI peers (Aarav, Meera, and Rohan). Learn to assert points, counter arguments, and conclude effectively.',
    },
    {
      icon: CalendarCheck,
      color: 'bg-[#EDE7FF] text-[#8B70D6]',
      title: 'Daily Practice Tasks',
      desc: 'Bite-sized communication drills tailored to your weak areas, complete with instant AI feedback and habit reminders.',
    },
    {
      icon: BarChart3,
      color: 'bg-[#BDEBD9] text-[#1D6A4E]',
      title: 'Weekly Progress & Skill Reports',
      desc: 'Transparent tracking across Grammar, Vocabulary, Clarity, and Content. See your repeated mistakes decrease over time.',
    },
    {
      icon: Shield,
      color: 'bg-[#FFD9C9] text-[#8C4A2F]',
      title: 'Zero Voice Uploads',
      desc: 'Your voice is transcribed directly inside your browser via Web Speech API. Audio is never recorded or sent to any server.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Speak or Type',
      desc: 'Use your microphone to speak naturally or type if you are in a quiet room. The browser transcribes your speech instantly.',
    },
    {
      num: '02',
      title: 'AI Analyzes Communication',
      desc: 'FastAPI and Gemini evaluate your vocabulary choices, grammatical accuracy, clarity of thought, and content substance.',
    },
    {
      num: '03',
      title: 'Review Actionable Corrections',
      desc: 'Get exact "Said vs Better" corrections, actionable tips, and personalized drill recommendations to fix recurring errors.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6FF] text-[#29243A] flex flex-col selection:bg-[#EDE7FF] selection:text-[#8B70D6]">
      {/* Top Navigation */}
      <header className="border-b border-[#EDE7FF] bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8B70D6] flex items-center justify-center text-white shadow-md">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-lg text-[#29243A] tracking-tight">YapWise</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EDE7FF] text-[#8B70D6] rounded border border-[#D4C7F5]">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-[#77718B] font-medium hidden sm:block">Talk Smart. Speak Confidently.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-[#77718B] hover:text-[#29243A]">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Start Free
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDE7FF] border border-[#D4C7F5] text-[#8B70D6] text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Built for College Students, Fresh Graduates & Job Seekers</span>
        </div>

        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl text-[#29243A] tracking-tight leading-[1.15]">
          Master Spoken English & Interview Communication with{' '}
          <span className="bg-gradient-to-r from-[#8B70D6] to-[#6949C6] bg-clip-text text-transparent">
            Real AI Feedback
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#77718B] max-w-2xl mx-auto leading-relaxed">
          Practice mock interviews, conversational fluency, and group discussions. Speak into your browser, get instant grammar and clarity analysis, and eliminate repeated mistakes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/login?tab=register" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
              Start Free Assessment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
              Sign In to Account
            </Button>
          </Link>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#77718B]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2E9B71]" /> Free to practice
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2E9B71]" /> Web Speech API (no audio upload)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2E9B71]" /> Real scoring across 4 skills
          </span>
        </div>
      </section>

      {/* How it Works (3 Steps) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8B70D6]">Simple 3-Step Process</span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#29243A]">How YapWise AI Works</h2>
          <p className="text-xs sm:text-sm text-[#77718B]">Designed to be simple, frictionless, and respectful of your privacy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((st) => (
            <div
              key={st.num}
              className="p-6 rounded-2xl bg-white border border-[#EDE7FF] shadow-card hover:shadow-card-hover transition-all duration-200 relative overflow-hidden"
            >
              <span className="text-4xl font-heading font-extrabold text-[#EDE7FF] absolute top-4 right-4">
                {st.num}
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#EDE7FF] text-[#8B70D6] flex items-center justify-center font-bold mb-4 border border-[#D4C7F5]">
                {st.num}
              </div>
              <h3 className="font-heading font-bold text-base text-[#29243A] mb-2">{st.title}</h3>
              <p className="text-xs text-[#77718B] leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8B70D6]">Structured Preparation</span>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#29243A]">Everything You Need for Campus Placements</h2>
          <p className="text-xs sm:text-sm text-[#77718B]">Tailored practice modes specifically targeting standard recruitment rounds.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white border border-[#EDE7FF] shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#29243A] mb-2">{f.title}</h3>
                  <p className="text-xs text-[#77718B] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Honest Section: Real AI feedback, never fake scores */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="p-8 sm:p-10 rounded-2xl bg-white border border-[#EDE7FF] shadow-card space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE7FF] text-[#8B70D6] text-xs font-bold border border-[#D4C7F5]">
            <Cpu className="w-3.5 h-3.5" />
            <span>Honest & Objective Evaluation</span>
          </div>

          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#29243A]">
            Real AI Feedback. Never Fake Scores.
          </h2>

          <div className="space-y-4 text-xs sm:text-sm text-[#29243A] leading-relaxed">
            <p className="text-[#77718B]">
              Most practice apps shower users with fake 95% scores and generic praise to keep them clicking. YapWise takes your career readiness seriously:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF]">
                <span className="font-bold text-[#8B70D6] block mb-1">True 4-Skill Rubric</span>
                <span className="text-xs text-[#77718B]">
                  Separate evaluations for Grammar, Vocabulary, Clarity, and Content based on linguistic benchmarks.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF]">
                <span className="font-bold text-[#8B70D6] block mb-1">Exact Mistake Detection</span>
                <span className="text-xs text-[#77718B]">
                  Shows your exact spoken phrase alongside a professional correction and clear explanation.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF]">
                <span className="font-bold text-[#8B70D6] block mb-1">No Fake Testimonials</span>
                <span className="text-xs text-[#77718B]">
                  No invented user counts or made-up quotes. You see your actual spoken turns and your real progress.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF]">
                <span className="font-bold text-[#8B70D6] block mb-1">Zero Audio Storage</span>
                <span className="text-xs text-[#77718B]">
                  Transcription runs in the browser. Voice recordings never leave your machine or touch a cloud server.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link to="/login?tab=register">
              <Button variant="primary" size="md">
                Get Started Now – It's Free
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#EDE7FF] bg-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-heading font-bold text-[#29243A] text-base">YapWise AI</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EDE7FF] text-[#8B70D6] rounded border border-[#D4C7F5]">
                AI
              </span>
            </div>
            <p className="text-xs text-[#77718B]">Talk Smart. Speak Confidently.</p>
          </div>

          <div className="max-w-md text-xs text-[#77718B] text-center sm:text-right space-y-1">
            <p className="font-medium text-[#29243A]">Privacy First Commitment</p>
            <p className="text-[11px] leading-relaxed">
              Your voice is never recorded or uploaded. Only the transcribed text of what you say is sent to the backend for AI evaluation.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[#EDE7FF] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#77718B] gap-4">
          <p>© {new Date().getFullYear()} YapWise AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-[#29243A]">Sign in</Link>
            <Link to="/login?tab=register" className="hover:text-[#29243A]">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
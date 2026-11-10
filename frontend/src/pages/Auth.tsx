import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
  MessageSquare,
  Award,
  Mic,
  Flame,
} from 'lucide-react';

interface AuthProps {
  initialTab?: 'login' | 'register';
}

export const Auth: React.FC<AuthProps> = ({ initialTab = 'login' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab') === 'register' ? 'register' : initialTab;
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(queryTab);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register, loginWithGoogle, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Google OAuth Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleTabChange = (val: 'login' | 'register') => {
    setActiveTab(val);
    setError(null);
    setSearchParams(val === 'register' ? { tab: 'register' } : {});
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setError('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!registerName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!registerEmail.trim()) {
      setError('Please enter your college email address.');
      return;
    }
    if (registerPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(registerEmail.trim(), registerPassword, registerName.trim());
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. This email may already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async (emailToUse?: string, nameToUse?: string) => {
    const targetEmail = (emailToUse || googleEmail).trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please enter a valid Google account email.');
      return;
    }
    const targetName = (nameToUse || googleName).trim() || targetEmail.split('@')[0];

    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle(targetEmail, targetName);
      setShowGoogleModal(false);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google sign-in could not be completed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF8EF] relative flex flex-col justify-between overflow-x-hidden selection:bg-[#EDE7FF] selection:text-[#7652C8]">
      {/* 3D Immersive Campus Gradient Backdrop with Soft Depth Halos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-[#EDE7FF] to-[#D8C7FF] rounded-full blur-[100px] opacity-70" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#FFEDE4] via-[#FFE4DA] to-[#FFD0AE] rounded-full blur-[110px] opacity-60" />
        <div className="absolute -bottom-24 left-1/3 w-[650px] h-[650px] bg-gradient-to-tr from-[#A9E7D0]/40 to-[#EDE7FF] rounded-full blur-[120px] opacity-65" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#7652C8 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Top Header Navigation Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#7652C8] to-[#A78BFA] flex items-center justify-center text-white shadow-lg shadow-[#7652C8]/30 group-hover:scale-105 transition-transform duration-300">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-heading font-black text-xl sm:text-2xl text-[#302B42] tracking-tight block leading-none">
              YapWise AI
            </span>
            <span className="text-[11px] sm:text-xs text-[#77718B] font-semibold tracking-wide">
              Talk Smart. Speak Confidently.
            </span>
          </div>
        </Link>

        {/* Sign In with Google Header CTA */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          disabled={isSubmitting}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#EDE7FF] hover:border-[#D4C7F5] text-xs font-black text-[#302B42] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Sign In with Google</span>
        </button>
      </header>

      {/* Main Full-Screen Hero & Auth Split (Matching Screen 1 in Reference) */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 my-auto flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Modern Interactive Learning Canvas & Live Features Showcase  */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
            
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#D4C7F5] shadow-xs text-xs font-bold text-[#7652C8]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Interactive AI College Student Companion</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#302B42] tracking-tight leading-[1.15]">
              Master English Fluency & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#7652C8] via-[#A78BFA] to-[#FF9A91] bg-clip-text text-transparent">
                Campus Placements
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#77718B] max-w-xl font-medium leading-relaxed">
              Practice natural conversations with real-time AI speaking coaches, follow step-by-step developer roadmaps, and crack technical interviews with confidence.
            </p>

            {/* Interactive Feature Canvas Bento Showcase */}
            <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              
              {/* Feature Card 1: Interactive Spoken English Engine */}
              <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-md border-2 border-[#EDE7FF] hover:border-[#7652C8] shadow-md hover:shadow-xl transition-all duration-300 text-left space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7652C8] to-[#A78BFA] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-heading font-black text-xs text-[#302B42] block">AI Speaking Partner</span>
                      <span className="text-[10px] text-emerald-600 font-bold">● Live Voice Analysis</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    92% Fluency
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] text-[11px] text-[#302B42] space-y-1">
                  <p className="italic text-[#77718B] text-[10px]">Student: "I was wondering about DSA roadmap..."</p>
                  <p className="font-semibold text-[#7652C8]">Maya (Coach): "Excellent clarity! Let's drill tree traversals next."</p>
                </div>

                {/* Animated Equalizer Wave */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1">
                    {[6, 14, 20, 12, 18, 10, 16, 8].map((h, i) => (
                      <motion.span
                        key={i}
                        animate={{ height: [4, h, 4] }}
                        transition={{ repeat: Infinity, duration: 0.4 + (i % 3) * 0.15, ease: 'easeInOut' }}
                        className="w-1 bg-[#7652C8] rounded-full inline-block"
                        style={{ height: h }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-[#77718B]">Real-Time TTS</span>
                </div>
              </div>

              {/* Feature Card 2: 7-Step Career Roadmap */}
              <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-md border-2 border-[#EDE7FF] hover:border-emerald-400 shadow-md hover:shadow-xl transition-all duration-300 text-left space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-heading font-black text-xs text-[#302B42] block">Career Roadmap</span>
                      <span className="text-[10px] text-[#7652C8] font-bold">Java Developer Track</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    +150 XP
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#302B42]">Milestone 4: Data Structures</span>
                    <span className="text-[#7652C8]">33% Active</span>
                  </div>
                  <div className="w-full bg-[#EDE7FF] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#7652C8] h-full rounded-full w-[33%]" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-[#77718B] font-bold">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> Java Fundamentals Done
                  </span>
                  <span>7 Milestones Total</span>
                </div>
              </div>
            </div>

            {/* Feature Pills Footer */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2 text-xs text-[#302B42] font-bold">
              <span className="px-3 py-1 rounded-full bg-white/90 border border-[#EDE7FF] shadow-2xs flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                12-Day Streak
              </span>
              <span className="px-3 py-1 rounded-full bg-white/90 border border-[#EDE7FF] shadow-2xs flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#7652C8]" />
                3 AI Speaking Coaches
              </span>
              <span className="px-3 py-1 rounded-full bg-white/90 border border-[#EDE7FF] shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Placement Interview Simulator
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Screen 1 Login Card (Matching Reference Screen 1)           */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="rounded-3xl border-2 border-white/90 bg-white/95 backdrop-blur-xl shadow-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300">
              
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7652C8] via-[#A78BFA] to-[#FF9A91]" />

              {/* Card Header matching Screen 1 in reference */}
              <div className="text-center mb-4">
                <h2 className="font-heading font-black text-2xl text-[#302B42] tracking-tight">
                  {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
                </h2>
                <p className="text-xs text-[#77718B] mt-1">
                  {activeTab === 'login' ? 'Sign in to continue your journey' : 'Start your placement learning roadmap today'}
                </p>
              </div>

              {/* Google One-Tap Sign In Button */}
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                disabled={isSubmitting}
                className="w-full h-11 mb-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-[#EDE7FF] hover:border-[#7652C8]/50 text-xs font-black text-[#302B42] shadow-2xs flex items-center justify-center gap-3 transition-all cursor-pointer group"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="border-t border-[#EDE7FF] w-full" />
                <span className="bg-white/95 px-3 text-[10px] font-black uppercase tracking-wider text-[#77718B] shrink-0">
                  or continue with email
                </span>
              </div>

              {/* Tab Switcher: [Login] [Register] */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#EDE7FF]/70 border border-[#D4C7F5]/50 mb-4">
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className={`py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-[#7652C8] text-white shadow-md shadow-[#7652C8]/30'
                      : 'text-[#7652C8] hover:text-[#302B42]'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  className={`py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-[#7652C8] text-white shadow-md shadow-[#7652C8]/30'
                      : 'text-[#7652C8] hover:text-[#302B42]'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Error Message */}
              {error && <ErrorBanner error={error} className="mb-3 text-xs" />}

              {/* FORMS WRAPPED IN ANIMATEPRESENCE FOR SMOOTH TAB SWITCHING */}
              <AnimatePresence mode="wait">
                {activeTab === 'login' ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleLoginSubmit}
                    className="space-y-3.5"
                  >
                    <div>
                      <label className="block text-xs font-bold text-[#302B42] mb-1" htmlFor="login-email">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7652C8]">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="login-email"
                          type="email"
                          placeholder="you@college.edu"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="w-full pl-10 pr-3 h-10 rounded-xl bg-[#F8F6FF] border border-[#D4C7F5] text-xs font-medium text-[#302B42] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#302B42] mb-1" htmlFor="login-password">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7652C8]">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="login-password"
                          type={showLoginPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          className="w-full pl-10 pr-10 h-10 rounded-xl bg-[#F8F6FF] border border-[#D4C7F5] text-xs font-medium text-[#302B42] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77718B] hover:text-[#302B42] p-1 cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password (Exact from Screen 1) */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[#77718B] hover:text-[#302B42]">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 text-[#7652C8] rounded border-gray-300 focus:ring-[#7652C8]"
                        />
                        <span className="font-medium text-[11px]">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setError('Password reset link sent to registered email in production.')}
                        className="text-[11px] font-bold text-[#7652C8] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-xl text-xs font-black bg-[#7652C8] hover:bg-[#5e3da8] text-white shadow-md shadow-[#7652C8]/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      {isSubmitting ? (
                        <span>Signing in...</span>
                      ) : (
                        <>
                          <span>Login</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleRegisterSubmit}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-bold text-[#302B42] mb-1" htmlFor="register-name">
                        Full Student Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7652C8]">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="register-name"
                          type="text"
                          placeholder="e.g. Priya Sharma"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          required
                          className="w-full pl-10 pr-3 h-10 rounded-xl bg-[#F8F6FF] border border-[#D4C7F5] text-xs font-medium text-[#302B42] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#302B42] mb-1" htmlFor="register-email">
                        College Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7652C8]">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="register-email"
                          type="email"
                          placeholder="priya@college.edu"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="w-full pl-10 pr-3 h-10 rounded-xl bg-[#F8F6FF] border border-[#D4C7F5] text-xs font-medium text-[#302B42] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#302B42] mb-1" htmlFor="register-password">
                        Password (min 8 characters)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7652C8]">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="register-password"
                          type={showRegisterPassword ? 'text' : 'password'}
                          placeholder="At least 8 characters"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                          className="w-full pl-10 pr-10 h-10 rounded-xl bg-[#F8F6FF] border border-[#D4C7F5] text-xs font-medium text-[#302B42] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77718B] hover:text-[#302B42] p-1 cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-xl text-xs font-black bg-[#7652C8] hover:bg-[#5e3da8] text-white shadow-md shadow-[#7652C8]/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      {isSubmitting ? (
                        <span>Creating Account...</span>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Bottom Switcher: Don't have an account? Register / Login */}
              <div className="pt-3 text-center text-xs text-[#77718B]">
                {activeTab === 'login' ? (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabChange('register')}
                      className="font-black text-[#7652C8] hover:underline cursor-pointer"
                    >
                      Register
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabChange('login')}
                      className="font-black text-[#7652C8] hover:underline cursor-pointer"
                    >
                      Login
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 text-center text-[11px] text-[#77718B] font-semibold">
        © 2026 YapWise AI • Talk Smart. Speak Confidently.
      </footer>

      {/* Google Sign-In Dialog */}
      <Dialog
        open={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        title="Sign in with Google"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF]">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-black text-[#302B42] block">Continue to YapWise AI</span>
              <span className="text-[11px] text-[#77718B]">Choose an account or enter your Google email</span>
            </div>
          </div>

          {/* Real Google Account Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGoogleSubmit();
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-bold text-[#302B42] mb-1">
                Google / Gmail Address
              </label>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 h-10 rounded-xl bg-[#F8F6FF] border border-[#D4C7F5] text-xs font-medium text-[#302B42] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#302B42] mb-1">
                Your Full Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Deepu Kumar"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                className="w-full px-3.5 h-10 rounded-xl bg-[#F8F6FF] border border-[#D4C7F5] text-xs font-medium text-[#302B42] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
              />
              <p className="text-[10px] text-[#77718B] mt-1">
                Used to personalize your AI speaking mentor and placement roadmap.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowGoogleModal(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="flex-1 rounded-xl"
              >
                Continue with Google
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

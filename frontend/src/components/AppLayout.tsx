import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Mic,
  BarChart3,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  Sparkles,
  Flame,
  CheckCircle2,
  X,
  GraduationCap,
  Layers,
  Presentation,
  Briefcase,
  Menu,
  Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES, AppTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';

export function AppLayout() {
  const { user, profile, logout } = useAuth();
  const { theme, setTheme, config: currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global keyboard shortcut '/' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reminders state
  const [reminderConfig, setReminderConfig] = useState({
    enabled: true,
    time_hhmm: '19:00',
    timezone: 'Asia/Kolkata',
    days: [0, 1, 2, 3, 4],
  });
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>('default');
  const [hasReminderDue, setHasReminderDue] = useState(false);
  const [dueMessage, setDueMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPerm(Notification.permission);
    }
  }, []);

  useEffect(() => {
    async function loadReminders() {
      try {
        const res = await api.reminders.get();
        if (res) {
          setReminderConfig({
            enabled: res.enabled,
            time_hhmm: res.time_hhmm || '19:00',
            timezone: res.timezone || 'Asia/Kolkata',
            days: res.days || [0, 1, 2, 3, 4],
          });
        }
      } catch {
        // quiet error on initial fetch
      }
    }
    loadReminders();
  }, []);

  // Poll for due reminders
  useEffect(() => {
    async function checkReminders() {
      try {
        const res = await api.reminders.getDue();
        if (res.due && res.message) {
          setHasReminderDue(true);
          setDueMessage(res.message);
        }
      } catch {
        // quiet
      }
    }
    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const studentName =
    profile?.full_name ||
    user?.full_name ||
    (user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Student');
  const firstName = studentName.split(' ')[0] || 'Student';
  const studentInitials =
    studentName
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST';

  const navSections = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Career Path', icon: Compass, path: '/career-path' },
      ],
    },
    {
      title: 'AI PRACTICE',
      items: [
        { label: 'AI Talking Avatar', icon: Sparkles, path: '/avatar' },
        { label: 'Speak with AI', icon: Mic, path: '/speaking' },
        { label: 'My Progress', icon: BarChart3, path: '/session-report' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Profile', icon: UserIcon, path: '/profile' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6FF] text-[#302B42] flex flex-col md:flex-row antialiased selection:bg-[#EDE7FF] selection:text-[#7652C8]">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Matching Screens 2, 3, 4, 5, 8, 9)                       */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-[#EDE7FF] p-5 shrink-0 z-30 min-h-screen shadow-sm sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* Logo with Graduation Cap */}
          <NavLink to="/dashboard" className="flex items-center gap-3 px-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7652C8] to-[#A78BFA] flex items-center justify-center text-white shadow-md shadow-[#7652C8]/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-black text-xl text-[#302B42] tracking-tight block leading-tight">
                YapWise AI
              </span>
              <span className="text-[10px] text-[#77718B] font-semibold tracking-wide">
                Smart Campus Hub
              </span>
            </div>
          </NavLink>

          {/* Categorized Navigation Links */}
          <nav className="space-y-4 pt-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A78BFA] px-3">
                  {section.title}
                </span>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.path ||
                      (item.path === '/career-path' && (location.pathname === '/roadmap' || location.pathname === '/assessment' || location.pathname === '/career-mentor')) ||
                      (item.path === '/speaking' && (location.pathname === '/speak' || location.pathname === '/speaking-session'));

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group',
                          isActive
                            ? 'bg-[#7652C8] text-white shadow-md shadow-[#7652C8]/30 font-black'
                            : 'text-[#77718B] hover:text-[#302B42] hover:bg-[#F8F6FF]'
                        )}
                      >
                        <Icon className={cn('w-4 h-4 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-[#77718B]')} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Middle / Bottom: Streak Pill & Student Profile Footer Card */}
        <div className="space-y-3 pt-4 border-t border-[#EDE7FF]">
          {/* Daily Streak Mini Pill */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#EDE7FF]/70 to-[#FFF8EF] border border-[#D4C7F5] shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#7652C8] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                12-Day Streak
              </span>
              <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                2,540 XP
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#77718B] font-bold">
                <span>Level 4 Scholar</span>
                <span>85% to L5</span>
              </div>
              <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-[#EDE7FF]">
                <div className="bg-gradient-to-r from-[#7652C8] to-[#A78BFA] h-full rounded-full w-[85%]" />
              </div>
            </div>
          </div>

          {/* Student Profile Footer Card with Online Status */}
          <div className="p-2 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] flex items-center justify-between gap-2 shadow-2xs">
            <NavLink
              to="/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7652C8] via-[#A78BFA] to-[#FF9A91] flex items-center justify-center text-white text-xs font-black ring-2 ring-[#7652C8]/30 shadow-xs">
                  {firstName[0] || 'P'}S
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black text-[#302B42] truncate block leading-tight">
                  {studentName}
                </span>
                <span className="text-[10px] text-[#77718B] font-medium block truncate">
                  CSE Undergrad
                </span>
              </div>
            </NavLink>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                title="Settings & Reminders"
                className="p-1.5 rounded-xl hover:bg-white text-[#77718B] hover:text-[#302B42] transition-colors cursor-pointer"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-xl hover:bg-rose-50 text-[#77718B] hover:text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN APP CONTENT AREA (Header + Child Routes)                          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar with Search & Profile Chip */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#EDE7FF] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          
          {/* Mobile Menu Toggle & Brand */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#EDE7FF] text-[#302B42]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-heading font-black text-lg text-[#302B42]">YapWise AI</span>
          </div>

          {/* Search Bar (Matching Reference Header: "Search anything...") */}
          <div className="hidden sm:flex items-center flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77718B]">
              <Search className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search courses, skills, mock questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] text-xs font-medium text-[#302B42] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#7652C8]/30 transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-[#77718B] border border-[#EDE7FF] shadow-2xs">
                /
              </kbd>
            </div>
          </div>

          {/* Right Header Controls: Theme, Notification & Priya S. Avatar Chip */}
          <div className="flex items-center gap-3 ml-auto">
            
            {/* Theme Selector Pill & Modal */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowThemeModal(!showThemeModal)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] hover:border-[#7652C8] text-xs font-bold text-[#302B42] hover:text-[#7652C8] transition-all cursor-pointer shadow-xs"
                title="Switch Frontend Theme"
              >
                <Palette className="w-3.5 h-3.5 text-[#7652C8]" />
                <span className="hidden sm:inline font-black">{currentTheme.name}</span>
              </button>

              {/* Theme Dropdown */}
              {showThemeModal && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border-2 border-[#EDE7FF] p-4 z-50 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EDE7FF] pb-2">
                    <span className="text-xs font-black text-[#302B42] flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#7652C8]" />
                      Frontend Theme Presets
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowThemeModal(false)}
                      className="text-[#77718B] hover:text-[#302B42] p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(Object.keys(THEMES) as AppTheme[]).map((tKey) => {
                      const t = THEMES[tKey];
                      const isSelected = theme === tKey;
                      return (
                        <button
                          key={tKey}
                          type="button"
                          onClick={() => {
                            setTheme(tKey);
                            setShowThemeModal(false);
                          }}
                          className={cn(
                            'w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer',
                            isSelected
                              ? 'border-[#7652C8] bg-[#EDE7FF]/60 ring-2 ring-[#7652C8]/20'
                              : 'border-[#EDE7FF] bg-[#F8F6FF] hover:border-[#7652C8]/50'
                          )}
                        >
                          <div
                            className={cn('w-8 h-8 rounded-xl bg-gradient-to-tr shrink-0 shadow-xs', t.previewGradient)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-heading font-black text-xs text-[#302B42]">
                                {t.name}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#7652C8]" />
                              )}
                            </div>
                            <p className="text-[10px] text-[#77718B] leading-tight line-clamp-2 mt-0.5">
                              {t.tagline}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell with Red Dot */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                className="w-9 h-9 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] flex items-center justify-center text-[#77718B] hover:text-[#302B42] hover:bg-[#EDE7FF] transition-all cursor-pointer relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {hasReminderDue && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
                )}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {/* Notification Popup Dropdown */}
              {showNotificationPopup && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#EDE7FF] p-4 z-50 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EDE7FF] pb-2">
                    <span className="text-xs font-black text-[#302B42] flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#7652C8]" />
                      Campus Notifications
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNotificationPopup(false)}
                      className="text-[#77718B] hover:text-[#302B42]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-[#EDE7FF]/60 border border-[#D4C7F5] space-y-1">
                      <span className="font-bold text-[#7652C8] block">🎯 Daily English Streak Alert</span>
                      <p className="text-[11px] text-[#302B42]">
                        {dueMessage || "Keep your 12-day streak alive! Practice 5 minutes with your AI coach today."}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                      <span className="font-bold text-amber-800 block">⚡ Java DSA Milestone 3 Ready</span>
                      <p className="text-[11px] text-[#302B42]">
                        Complete the Binary Search Tree practice problem to unlock placement badges.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Student Profile Chip (Top-Right) */}
            <NavLink
              to="/profile"
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white border border-[#EDE7FF] shadow-xs hover:border-[#7652C8] transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7652C8] via-[#A78BFA] to-[#FF9A91] flex items-center justify-center text-white text-[11px] font-black ring-2 ring-[#7652C8]/30 shadow-xs">
                {studentInitials}
              </div>
              <span className="text-xs font-black text-[#302B42] hidden sm:inline">
                {studentName}
              </span>
            </NavLink>
          </div>
        </header>

        {/* Mobile Slide-in Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
            <div className="w-64 bg-white h-full p-5 space-y-4 flex flex-col justify-between shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-black text-lg text-[#302B42]">YapWise AI</span>
                  <button type="button" onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-[#77718B]" />
                  </button>
                </div>
                <nav className="space-y-3">
                  {navSections.map((section) => (
                    <div key={section.title} className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#A78BFA] px-2 block">
                        {section.title}
                      </span>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                          location.pathname === item.path ||
                          (item.path === '/career-path' && (location.pathname === '/roadmap' || location.pathname === '/assessment' || location.pathname === '/career-mentor')) ||
                          (item.path === '/speaking' && (location.pathname === '/speak' || location.pathname === '/speaking-session'));

                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all',
                              isActive ? 'bg-[#7652C8] text-white' : 'text-[#77718B] hover:text-[#302B42]'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-rose-600 rounded-xl hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Routed Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

        {/* Mobile View Bottom Floating Navigation Bar (Matching Screen 10) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#EDE7FF] px-6 py-2 flex items-center justify-around shadow-lg">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 text-[10px] font-bold py-1',
                isActive ? 'text-[#7652C8]' : 'text-[#77718B]'
              )
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/session-report"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 text-[10px] font-bold py-1',
                isActive ? 'text-[#7652C8]' : 'text-[#77718B]'
              )
            }
          >
            <BarChart3 className="w-5 h-5" />
            <span>Progress</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 text-[10px] font-bold py-1',
                isActive ? 'text-[#7652C8]' : 'text-[#77718B]'
              )
            }
          >
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </NavLink>
        </nav>
      </div>

      {/* Settings Modal Dialog */}
      <Dialog
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Student Settings & Preferences"
        description="Configure study reminders, practice notifications, and language goals."
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] space-y-2">
            <span className="font-bold text-[#302B42] block">Daily Practice Reminders</span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#77718B]">Enable daily study notifications</span>
              <input
                type="checkbox"
                checked={reminderConfig.enabled}
                onChange={(e) => setReminderConfig({ ...reminderConfig, enabled: e.target.checked })}
                className="w-4 h-4 text-[#7652C8] rounded focus:ring-[#7652C8]"
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#77718B]">Reminder Time</span>
              <input
                type="time"
                value={reminderConfig.time_hhmm}
                onChange={(e) => setReminderConfig({ ...reminderConfig, time_hhmm: e.target.value })}
                className="px-2 py-1 rounded-lg border border-[#EDE7FF] bg-white text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                await api.reminders.update(reminderConfig);
                setShowSettingsModal(false);
              }}
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

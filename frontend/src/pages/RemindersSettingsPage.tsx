import React, { useState, useEffect } from 'react';
import { Bell, Clock, Volume2, User, Save, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { GoalReminder } from '../types';

export const RemindersSettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { voices, selectedVoice, setSelectedVoice, rate, setRate, speak } = useSpeechSynthesis();

  const [reminder, setReminder] = useState<GoalReminder>({
    id: 1,
    user_id: user?.id || 1,
    daily_goal_minutes: 15,
    reminder_time: '09:00',
    days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    notifications_enabled: true,
    sound_effects_enabled: true,
    selected_voice: 'default',
    playback_speed: '1.0',
  });

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || 'Senior');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setTargetRole(user.target_role || '');
      setExperienceLevel(user.experience_level || 'Senior');
    }
  }, [user]);

  useEffect(() => {
    async function loadReminderSettings() {
      try {
        const data = await api.getReminders();
        setReminder(data);
      } catch (err: any) {
        console.warn('Could not load reminder settings from backend:', err);
      }
    }
    loadReminderSettings();
  }, []);

  const toggleDay = (day: string) => {
    setReminder((prev) => {
      const current = prev.days_of_week;
      const updated = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day];
      return { ...prev, days_of_week: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await Promise.all([
        api.updateReminders(reminder),
        api.updateProfile({
          full_name: fullName,
          target_role: targetRole,
          experience_level: experienceLevel,
        }),
      ]);
      await refreshUser();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const testVoice = () => {
    speak('Hello! This is a preview of your AI interview coaching voice in YapWise.');
  };

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-2">
          <Bell className="w-3.5 h-3.5" />
          <span>Daily Cadence & Vocal Preferences</span>
        </div>
        <h1 className="text-3xl font-black text-white">Reminders & Goal Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure daily speech workout goals, reminder schedule, and browser speech synthesis voices.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Practice Goal & Frequency Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            Daily Practice Target
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setReminder({ ...reminder, daily_goal_minutes: mins })}
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  reminder.daily_goal_minutes === mins
                    ? 'bg-brand-600/20 text-brand-300 border-brand-500/40 font-bold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="text-lg font-black">{mins}</div>
                <div className="text-[11px]">minutes / day</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reminder Time
              </label>
              <input
                type="time"
                value={reminder.reminder_time}
                onChange={(e) => setReminder({ ...reminder, reminder_time: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Active Training Days
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {daysList.map((day) => {
                  const isSelected = reminder.days_of_week.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white border-brand-500 shadow-sm shadow-brand-500/20'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Audio & Speech Synthesis Settings */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            AI Voice Synthesis Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Browser Speech Voice
              </label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const v = voices.find((voice) => voice.name === e.target.value);
                  if (v) setSelectedVoice(v);
                }}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                {voices.length > 0 ? (
                  voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                ) : (
                  <option value="">Default Browser Voice</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Playback Speed: {rate}x
              </label>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full mt-3 accent-brand-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={testVoice}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 flex items-center gap-2"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Audio Playback</span>
          </button>
        </div>

        {/* Profile Settings */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            Career Profile & Target Role
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="Entry-Level">Entry-Level</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Staff / Principal">Staff / Principal</option>
                <option value="Engineering Director">Engineering Director / VP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings updated successfully!</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Preferences are saved to your local database profile.</span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

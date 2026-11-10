import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { Profile } from '../lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { ErrorBanner } from '../components/ErrorBanner';
import { CardSkeleton } from '../components/Skeleton';
import { getLevelBadge } from '../lib/utils';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  LogOut,
  Save,
  GraduationCap,
  Briefcase,
  Target,
  Sparkles,
  Lock,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, profile, refreshProfile, logout } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [goals, setGoals] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const p = await refreshProfile();
        if (p) {
          setFullName(p.full_name || '');
          setCollege(p.college || '');
          setDegree(p.degree || '');
          setTargetRole(p.target_role || '');
          setGoals(p.goals || '');
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [refreshProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await api.profile.update({
        full_name: fullName.trim(),
        college: college.trim(),
        degree: degree.trim(),
        target_role: targetRole.trim(),
        goals: goals.trim(),
      });
      await refreshProfile();
      toast({
        title: 'Profile Updated',
        description: 'Your career profile and target role have been saved.',
        type: 'success',
      });
    } catch (err: any) {
      setError(err);
      toast({
        title: 'Update Failed',
        description: err?.message || 'Could not update profile.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const levelBadge = getLevelBadge(profile?.level || 'beginner');

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
        <div className="h-8 w-60 bg-[#EDE7FF] rounded-lg animate-pulse" />
        <CardSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#29243A] tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EDE7FF] text-[#8B70D6] border border-[#D4C7F5]">
              <SettingsIcon className="w-5 h-5" />
            </div>
            Profile & Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#77718B] mt-1">
            Manage your personal academic background, target placement profile, and privacy preferences.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="self-start sm:self-auto text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Log out
        </Button>
      </div>

      {error && <ErrorBanner error={error} onRetry={() => refreshProfile()} />}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-[#EDE7FF] bg-white shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
              <User className="w-4 h-4 text-[#8B70D6]" />
              Academic & Placement Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Read-Only Account Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF]">
              <div>
                <span className="text-[10px] font-semibold text-[#77718B] uppercase tracking-wider block">
                  Account Email (Read-Only)
                </span>
                <span className="text-xs font-semibold text-[#29243A] mt-0.5 block truncate">
                  {profile?.email || user?.email || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-[#77718B] uppercase tracking-wider block">
                  Calibrated Level
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border inline-block mt-1 ${levelBadge.className}`}>
                  {levelBadge.label}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-[#77718B] uppercase tracking-wider block">
                  Interview Difficulty
                </span>
                <span className="text-xs font-bold text-[#29243A] mt-1 block">
                  Level {profile?.difficulty || 1} / 5
                </span>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#29243A] mb-1.5" htmlFor="full-name">
                  Full Name
                </label>
                <Input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29243A] mb-1.5" htmlFor="college-name">
                  College / University
                </label>
                <Input
                  id="college-name"
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29243A] mb-1.5" htmlFor="degree-branch">
                  Degree & Branch
                </label>
                <Input
                  id="degree-branch"
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#29243A] mb-1.5" htmlFor="target-role">
                  Target Job Role
                </label>
                <Input
                  id="target-role"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Development Engineer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#29243A] mb-1.5" htmlFor="career-goals">
                Specific Communication Goals
              </label>
              <textarea
                id="career-goals"
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. Overcome filler words in technical interviews, speak more concisely in group discussions..."
                className="w-full bg-[#F8F6FF] border border-[#EDE7FF] rounded-xl px-3.5 py-2.5 text-xs text-[#29243A] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#8B70D6] focus:border-[#8B70D6] resize-none"
              />
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Privacy Commitment Card */}
      <Card className="border-[#EDE7FF] bg-white shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#2E9B71]" />
            Privacy & Speech Data Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-[#29243A] leading-relaxed">
          <div className="p-4 rounded-xl bg-[#E1F7EE] border border-[#BDEBD9] space-y-1.5">
            <span className="font-semibold text-[#1D6A4E] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Browser-Native Voice Transcription
            </span>
            <p className="text-xs text-[#1D6A4E]">
              Your voice is never recorded or uploaded. Only the transcribed text of what you say is sent to the backend for AI evaluation.
            </p>
          </div>
          <p className="text-[11px] text-[#77718B]">
            YapWise AI uses the W3C Web Speech API embedded in modern browsers. Speech-to-text processing occurs strictly on your device or via your browser vendor's native engine. No audio files or raw voice bytes are ever transferred to YapWise servers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
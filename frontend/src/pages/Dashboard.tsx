import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Profile,
  TodayTasksResponse,
  ProgressResponse,
  MistakesResponse,
  LearningPath,
} from '../lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { ScoreRing } from '../components/ScoreRing';
import { MistakeList } from '../components/MistakeList';
import { ErrorBanner } from '../components/ErrorBanner';
import { CardSkeleton, StatSkeleton } from '../components/Skeleton';
import { getLevelBadge, formatDate } from '../lib/utils';
import {
  Mic,
  Briefcase,
  Users,
  Compass,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Flame,
  Award,
  Clock,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [tasksData, setTasksData] = useState<TodayTasksResponse | null>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [mistakesData, setMistakesData] = useState<MistakesResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [p, t, pr, lp, m] = await Promise.all([
        refreshProfile().catch(() => profile),
        api.tasks.getToday().catch(() => null),
        api.progress.get(14).catch(() => null),
        api.learning.getPath().catch(() => null),
        api.learning.getMistakes().catch(() => null),
      ]);

      if (t) setTasksData(t);
      if (pr) setProgressData(pr);
      if (lp) setLearningPath(lp);
      if (m) setMistakesData(m);
    } catch (err: any) {
      setError(err?.message || 'Could not load dashboard information.');
    } finally {
      setIsLoading(false);
    }
  }, [profile, refreshProfile]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const firstName =
    profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Student';
  const initial = firstName.charAt(0).toUpperCase();
  const levelBadge = getLevelBadge(profile?.level || 'beginner');
  const isAssessed = profile?.assessed ?? false;

  // Filter valid progress points for chart (only points that have actual overall scores)
  const chartPoints = (progressData?.points || [])
    .filter((pt) => pt.overall !== null && typeof pt.overall === 'number')
    .map((pt) => ({
      date: formatDate(pt.date).split(',')[0],
      score: pt.overall,
      grammar: pt.grammar,
      clarity: pt.clarity,
      vocabulary: pt.vocabulary,
      content: pt.content,
    }));

  // Skills from learning path or progress
  const skillsMap: Record<string, number | null> = {
    Grammar: null,
    Vocabulary: null,
    Clarity: null,
    Content: null,
  };

  if (learningPath?.skills) {
    for (const s of learningPath.skills) {
      const capitalized = s.skill.charAt(0).toUpperCase() + s.skill.slice(1);
      skillsMap[capitalized] = s.avg_score;
    }
  } else if (progressData?.skills) {
    for (const [k, v] of Object.entries(progressData.skills)) {
      const capitalized = k.charAt(0).toUpperCase() + k.slice(1);
      skillsMap[capitalized] = v;
    }
  }

  // Calculate overall average from available skill scores
  const scoreValues = Object.values(skillsMap).filter((v): v is number => typeof v === 'number');
  const avgOverall = scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : null;

  // Top repeated mistakes
  const repeatedMistakes =
    learningPath?.repeated_mistakes || mistakesData?.repeated || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-28 rounded-3xl bg-white border border-[#EDE7FF] p-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Error Banner */}
      {error && <ErrorBanner error={error} onRetry={loadDashboardData} />}

      {/* =========================================================================
          CAMPUS WELCOME HEADER BANNER (Bright Lavender, Avatar, Streak, Scores)
         ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EDE7FF] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#EDE7FF]/40 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute right-40 bottom-0 w-40 h-40 bg-[#BDEBD9]/30 rounded-full blur-xl pointer-events-none -mb-10" />

        <div className="relative z-10 flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#8B70D6] to-[#A58FF0] text-white flex items-center justify-center font-heading font-extrabold text-2xl shadow-md shadow-[#8B70D6]/25 flex-shrink-0">
            {initial}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#29243A]">
                Welcome back, {firstName}! 🎓
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${levelBadge.className}`}>
                {levelBadge.label} Tier
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#77718B]">
              {profile?.target_role ? `Target Placement: ${profile.target_role}` : 'Placement Communication Hub'} • Campus Prep Portal
            </p>
          </div>
        </div>

        {/* Highlights: Streak & Overall Score */}
        <div className="relative z-10 flex items-center gap-4 sm:gap-6 self-start md:self-auto border-t md:border-t-0 md:border-l border-[#EDE7FF] pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 bg-[#FFEBE2] border border-[#FFD9C9] px-3.5 py-2 rounded-2xl text-xs font-bold text-[#C8572A]">
            <Flame className="w-4 h-4 fill-current text-[#F48B62]" />
            <span>3 Day Streak</span>
          </div>

          <div className="flex items-center gap-3">
            <ScoreRing score={avgOverall} size={54} strokeWidth={5} />
            <div>
              <span className="text-[10px] uppercase font-bold text-[#77718B] block">Average Score</span>
              <span className="text-sm font-extrabold text-[#29243A]">
                {avgOverall !== null ? `${avgOverall}/100` : 'Not scored'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Unassessed Prompt Banner */}
      {!isAssessed && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#EDE7FF] via-[#FAF8FF] to-[#E1F7EE] border border-[#DDD3FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-[#8B70D6] text-white shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#29243A]">
                Take your 4-question diagnostic assessment
              </h3>
              <p className="text-xs text-[#77718B] mt-0.5 max-w-xl">
                Answer 4 quick placement questions to calibrate your fluency baseline and tailor your personal learning path.
              </p>
            </div>
          </div>
          <Link to="/learning" className="flex-shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              Start Assessment
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* =========================================================================
          FOUR LARGE CAMPUS FEATURE CARDS (Voice, HR, Tech, GD)
         ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-heading font-bold text-base sm:text-lg text-[#29243A] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8B70D6]" />
            Core Practice Studios
          </h2>
          <span className="text-xs text-[#77718B]">Select a mode to begin</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Voice Practice */}
          <div
            onClick={() => navigate('/practice')}
            className="p-5 rounded-3xl bg-white border border-[#EDE7FF] hover:border-[#8B70D6] shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between group space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7FF] text-[#674BB4] flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6 text-[#8B70D6]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B70D6]">
                  Studio 1
                </span>
                <h3 className="font-heading font-bold text-base text-[#29243A] group-hover:text-[#8B70D6] transition-colors">
                  AI Voice Practice
                </h3>
                <p className="text-xs text-[#77718B] mt-1 leading-relaxed">
                  Free-flowing conversations with instant speech feedback and accent calibration.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#8B70D6]">
              <span>Enter Voice Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. HR Interview */}
          <div
            onClick={() => navigate('/interview?kind=hr')}
            className="p-5 rounded-3xl bg-white border border-[#EDE7FF] hover:border-[#FFD9C9] shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between group space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFEBE2] text-[#C8572A] flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6 text-[#F48B62]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C8572A]">
                  Studio 2
                </span>
                <h3 className="font-heading font-bold text-base text-[#29243A] group-hover:text-[#C8572A] transition-colors">
                  HR Mock Interview
                </h3>
                <p className="text-xs text-[#77718B] mt-1 leading-relaxed">
                  Behavioral, situational & STAR framework questions with Sarah (Senior HR Lead).
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#C8572A]">
              <span>Start HR Interview</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Technical Interview */}
          <div
            onClick={() => navigate('/interview?kind=technical')}
            className="p-5 rounded-3xl bg-white border border-[#EDE7FF] hover:border-[#BDEBD9] shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between group space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E1F7EE] text-[#267E5A] flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6 text-[#46B88A]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#267E5A]">
                  Studio 3
                </span>
                <h3 className="font-heading font-bold text-base text-[#29243A] group-hover:text-[#267E5A] transition-colors">
                  Technical Interview
                </h3>
                <p className="text-xs text-[#77718B] mt-1 leading-relaxed">
                  Role-specific CS questions, architecture tradeoffs & technical articulation.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#267E5A]">
              <span>Start Tech Interview</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Group Discussion */}
          <div
            onClick={() => navigate('/gd')}
            className="p-5 rounded-3xl bg-white border border-[#EDE7FF] hover:border-[#DDD3FF] shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between group space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7FF] text-[#674BB4] flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6 text-[#8B70D6]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#674BB4]">
                  Studio 4
                </span>
                <h3 className="font-heading font-bold text-base text-[#29243A] group-hover:text-[#8B70D6] transition-colors">
                  Group Discussion
                </h3>
                <p className="text-xs text-[#77718B] mt-1 leading-relaxed">
                  Collaborative debate simulation with 3 AI candidates (Aarav, Meera & Rohan).
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#8B70D6]">
              <span>Join GD Circle</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Skill Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['Grammar', 'Vocabulary', 'Clarity', 'Content'] as const).map((skill) => {
          const score = skillsMap[skill];
          return (
            <Card key={skill} className="hover:border-[#DDD3FF] transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#77718B] uppercase tracking-wider block">
                    {skill}
                  </span>
                  <div className="mt-2">
                    {score !== null && score !== undefined ? (
                      <div className="flex items-baseline gap-1">
                        <span className="font-heading font-extrabold text-2xl text-[#29243A]">
                          {Math.round(score)}
                        </span>
                        <span className="text-xs text-[#77718B] font-medium">/100</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-[#77718B] bg-[#EDE7FF]/60 px-2 py-1 rounded-md">
                        No data yet
                      </span>
                    )}
                  </div>
                </div>
                <ScoreRing score={score} size={54} strokeWidth={5} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Middle Grid: Today's Learning Goal & Recommended Daily Drill */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Learning Goal Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#8B70D6]" />
                Today's Learning Goal
              </CardTitle>
              <Badge variant="mint" className="text-[11px] font-bold">
                {tasksData ? `${tasksData.done}/${tasksData.total} Completed` : '0/0'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasksData && tasksData.total > 0 ? (
              <div className="space-y-2">
                <Progress
                  value={Math.round((tasksData.done / Math.max(1, tasksData.total)) * 100)}
                  className="h-2.5"
                />
                <p className="text-xs text-[#77718B]">
                  {tasksData.done === tasksData.total
                    ? '🎉 Awesome! All daily speaking missions done!'
                    : `${tasksData.total - tasksData.done} exercise${tasksData.total - tasksData.done > 1 ? 's' : ''} left for today.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#77718B]">
                No active drills queued. Click below to view daily communication exercises.
              </p>
            )}

            <div className="pt-2">
              <Link to="/tasks" className="block">
                <Button variant="secondary" size="sm" className="w-full">
                  Open Daily Drills
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Placement Step (Spans 2 cols on lg) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#46B88A]" />
                Personalized Learning Path
              </CardTitle>
              <Link to="/learning" className="text-xs text-[#8B70D6] font-bold hover:underline">
                View Full Path →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {learningPath?.steps && learningPath.steps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {learningPath.steps.slice(0, 2).map((st, i) => (
                  <Link
                    key={i}
                    to={st.link || '/practice'}
                    className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#EDE7FF] hover:border-[#8B70D6] transition-all group flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#8B70D6] uppercase tracking-wider block">
                        Recommended Drill {i + 1}
                      </span>
                      <h4 className="text-xs font-bold text-[#29243A] group-hover:text-[#8B70D6] transition-colors">
                        {st.title}
                      </h4>
                      <p className="text-[11px] text-[#77718B] line-clamp-2 leading-relaxed">{st.why}</p>
                    </div>
                    <div className="pt-3 flex items-center gap-1 text-[11px] text-[#8B70D6] font-bold">
                      <span>Practice Now</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#77718B]">
                Complete your baseline assessment or practice turns to generate customized step recommendations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: 14-Day Progress Chart & Repeated Mistakes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity / Score Trend Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#8B70D6]" />
                14-Day Performance Trend
              </CardTitle>
              <Link to="/progress" className="text-xs text-[#8B70D6] font-bold hover:underline">
                Full Analytics →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {chartPoints.length > 0 ? (
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartPoints} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE7FF" />
                    <XAxis dataKey="date" stroke="#77718B" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#77718B" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#EDE7FF',
                        borderRadius: '1rem',
                        fontSize: '11px',
                        color: '#29243A',
                        boxShadow: '0 4px 20px rgba(139, 112, 214, 0.15)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Overall Score"
                      stroke="#8B70D6"
                      strokeWidth={3}
                      dot={{ fill: '#8B70D6', r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FAF8FF] rounded-2xl border border-[#EDE7FF] space-y-2">
                <p className="text-xs text-[#77718B] font-semibold">No evaluated turns logged yet.</p>
                <p className="text-[11px] text-[#77718B]">
                  Complete a speaking session or mock interview question to see your trend line.
                </p>
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/practice')}>
                    Start Speaking Drill
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Repeated Mistakes */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#F48B62]" />
                Top Repeated Mistakes
              </CardTitle>
              <Link to="/learning" className="text-xs text-[#8B70D6] font-bold hover:underline">
                View All →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {repeatedMistakes.length > 0 ? (
              <MistakeList
                mistakes={repeatedMistakes}
                maxItems={3}
                emptyMessage="No recurring speech errors detected! Keep practicing."
              />
            ) : (
              <div className="p-8 text-center bg-[#FAF8FF] rounded-2xl border border-[#EDE7FF] space-y-2">
                <p className="text-xs text-[#77718B] font-semibold">No repeated mistakes identified.</p>
                <p className="text-[11px] text-[#77718B]">
                  As you complete mock interviews and discussions, YapWise will track recurring phrasing habits here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

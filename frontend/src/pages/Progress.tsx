import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../lib/api';
import { ProgressResponse, Report, ProgressPoint } from '../lib/types';
import { ScoreRing } from '../components/ScoreRing';
import { MistakeList } from '../components/MistakeList';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';
import { CardSkeleton, StatSkeleton } from '../components/Skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';
import {
  BarChart2,
  TrendingUp,
  Calendar,
  FileText,
  Sparkles,
  Award,
  Mic,
  Briefcase,
  Users,
  CheckSquare,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export const Progress: React.FC = () => {
  const { toast } = useToast();

  const [daysRange, setDaysRange] = useState<7 | 30 | 90>(30);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [reportsList, setReportsList] = useState<Report[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<Error | string | null>(null);

  const loadProgressAndReports = async (days: number = daysRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const [prog, reps] = await Promise.all([
        api.progress.get(days),
        api.reports.list().catch(() => []),
      ]);
      setProgressData(prog);
      setReportsList(reps);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProgressAndReports(daysRange);
  }, [daysRange]);

  const handleGenerateReport = async (which: 'current' | 'previous') => {
    setIsGeneratingReport(true);
    try {
      const rep = await api.reports.generate(which);
      toast({
        title: 'Weekly Report Generated',
        description: `Successfully synthesized report for ${which === 'current' ? 'this week' : 'last week'}.`,
        type: 'success',
      });
      // Prepend or refresh report list
      setReportsList((prev) => [rep, ...prev.filter((r) => r.id !== rep.id)]);
    } catch (err: any) {
      toast({
        title: 'Report Generation Failed',
        description: err?.message || 'Could not compile weekly report.',
        type: 'error',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Filter valid overall chart points (NEVER draw fake or sample data!)
  const overallChartPoints = (progressData?.points || [])
    .filter((pt) => pt.overall !== null && typeof pt.overall === 'number')
    .map((pt) => ({
      date: formatDate(pt.date).split(',')[0],
      score: pt.overall,
    }));

  // Filter valid multi-skill chart points
  const skillChartPoints = (progressData?.points || [])
    .filter(
      (pt) =>
        pt.grammar !== null ||
        pt.vocabulary !== null ||
        pt.clarity !== null ||
        pt.content !== null
    )
    .map((pt) => ({
      date: formatDate(pt.date).split(',')[0],
      Grammar: pt.grammar,
      Vocabulary: pt.vocabulary,
      Clarity: pt.clarity,
      Content: pt.content,
    }));

  const totals = progressData?.totals || {
    evaluated_answers: 0,
    speaking_sessions: 0,
    gd_sessions: 0,
    interviews_completed: 0,
    tasks_done: 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-8 w-60 bg-[#EDE7FF] rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Page Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#29243A] tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EDE7FF] text-[#8B70D6] border border-[#D4C7F5]">
              <BarChart2 className="w-5 h-5" />
            </div>
            Progress & Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#77718B] mt-1">
            Real metrics computed from your spoken answers, interviews, and group discussions.
          </p>
        </div>

        {/* 7 / 30 / 90 Days Range Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EDE7FF] shadow-sm self-start sm:self-auto">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDaysRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                daysRange === r
                  ? 'bg-[#8B70D6] text-white shadow-sm'
                  : 'text-[#77718B] hover:text-[#29243A]'
              }`}
            >
              {r} Days
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner error={error} onRetry={() => loadProgressAndReports()} />}

      {/* Totals Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-[#EDE7FF] bg-white shadow-card">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-semibold text-[#77718B] uppercase tracking-wider block">
              Evaluated Answers
            </span>
            <span className="font-heading font-extrabold text-xl text-[#29243A]">
              {totals.evaluated_answers}
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#EDE7FF] bg-white shadow-card">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-semibold text-[#77718B] uppercase tracking-wider block">
              Speaking Sessions
            </span>
            <span className="font-heading font-extrabold text-xl text-[#8B70D6]">
              {totals.speaking_sessions}
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#EDE7FF] bg-white shadow-card">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-semibold text-[#77718B] uppercase tracking-wider block">
              GD Sessions
            </span>
            <span className="font-heading font-extrabold text-xl text-[#E07A5F]">
              {totals.gd_sessions}
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#EDE7FF] bg-white shadow-card">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-semibold text-[#77718B] uppercase tracking-wider block">
              Interviews Completed
            </span>
            <span className="font-heading font-extrabold text-xl text-[#2E9B71]">
              {totals.interviews_completed}
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#EDE7FF] bg-white shadow-card col-span-2 sm:col-span-1">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[10px] font-semibold text-[#77718B] uppercase tracking-wider block">
              Daily Drills Done
            </span>
            <span className="font-heading font-extrabold text-xl text-blue-600">
              {totals.tasks_done}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Primary Chart: Overall Score By Day */}
      <Card className="border-[#EDE7FF] bg-white shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#8B70D6]" />
              Overall Score Trend (Past {daysRange} Days)
            </CardTitle>
            <span className="text-[11px] text-[#77718B]">
              {overallChartPoints.length} active data point{overallChartPoints.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {overallChartPoints.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overallChartPoints} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE7FF" />
                  <XAxis dataKey="date" stroke="#77718B" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#77718B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#EDE7FF',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#29243A',
                      boxShadow: '0 4px 20px -2px rgba(139, 112, 214, 0.15)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Overall"
                    stroke="#8B70D6"
                    strokeWidth={3}
                    dot={{ fill: '#8B70D6', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No Evaluated Turns in Selected Period"
              description="Complete a speaking turn, mock interview question, or group discussion to log your daily score trajectory."
              actionText="Start Voice Practice"
              actionLink="/practice"
            />
          )}
        </CardContent>
      </Card>

      {/* Secondary Chart: 4-Skill Multi-Line Breakdown */}
      <Card className="border-[#EDE7FF] bg-white shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2E9B71]" />
            4-Skill Trajectory (Grammar, Vocabulary, Clarity, Content)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {skillChartPoints.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={skillChartPoints} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE7FF" />
                  <XAxis dataKey="date" stroke="#77718B" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#77718B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#EDE7FF',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#29243A',
                      boxShadow: '0 4px 20px -2px rgba(139, 112, 214, 0.15)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="Grammar" stroke="#2E9B71" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Vocabulary" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Clarity" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Content" stroke="#8B70D6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#F8F6FF] rounded-xl border border-[#EDE7FF] space-y-2">
              <p className="text-xs text-[#77718B]">No skill breakdowns recorded yet.</p>
              <p className="text-[11px] text-[#77718B]">
                Individual skill traces will appear once you have evaluated speaking turns.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Reports Section */}
      <Card className="border-[#EDE7FF] bg-white shadow-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8B70D6]" />
                Executive Weekly Summaries
              </CardTitle>
              <p className="text-xs text-[#77718B]">
                Detailed weekly reports summarizing your fluency progress, key milestones, and recurring habits.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateReport('current')}
                disabled={isGeneratingReport}
                className="text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                This Week's Report
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleGenerateReport('previous')}
                disabled={isGeneratingReport}
                className="text-xs"
              >
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Last Week's Report
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {reportsList.length > 0 ? (
            <div className="space-y-4">
              {reportsList.map((rep, idx) => (
                <div
                  key={rep.id || idx}
                  className="p-5 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] space-y-4 text-xs"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#29243A] text-sm">
                          {rep.data?.week_start && rep.data?.week_end
                            ? `${formatDate(rep.data.week_start)} — ${formatDate(rep.data.week_end)}`
                            : `Report #${idx + 1}`}
                        </span>
                        <Badge
                          variant={rep.ai_generated ? 'lavender' : 'outline'}
                          className="text-[10px] font-bold"
                        >
                          {rep.ai_generated ? 'AI Summary' : 'Auto Summary'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-[#77718B] block">
                        Active Days: <strong className="text-[#29243A]">{rep.data?.active_days || 0}</strong> • Drills Done: <strong className="text-[#29243A]">{rep.data?.tasks_done || 0}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#77718B] block">Week Average</span>
                      <span className="font-bold text-base text-[#8B70D6]">
                        {rep.data?.avg_overall !== null && rep.data?.avg_overall !== undefined
                          ? `${Math.round(rep.data.avg_overall)}/100`
                          : 'Not scored'}
                      </span>
                    </div>
                  </div>

                  {/* Summary Text */}
                  <p className="text-[#29243A] leading-relaxed bg-white p-3.5 rounded-xl border border-[#EDE7FF]">
                    {rep.summary}
                  </p>

                  {/* Top Mistakes from that week */}
                  {rep.data?.top_mistakes && rep.data.top_mistakes.length > 0 && (
                    <MistakeList
                      mistakes={rep.data.top_mistakes}
                      maxItems={2}
                      title="Top Mistakes from this Week"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#F8F6FF] rounded-xl border border-[#EDE7FF] space-y-2">
              <p className="text-xs text-[#77718B] font-medium">No weekly reports compiled yet.</p>
              <p className="text-[11px] text-[#77718B]">
                Click "This Week's Report" above to compile a comprehensive summary of your recent practice activity.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
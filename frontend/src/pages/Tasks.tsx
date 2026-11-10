import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../lib/api';
import {
  Task,
  TodayTasksResponse,
  ReminderSettings,
  Evaluation,
} from '../lib/types';
import { VoiceInput } from '../components/VoiceInput';
import { EvaluationCard } from '../components/EvaluationCard';
import { ErrorBanner } from '../components/ErrorBanner';
import { CardSkeleton } from '../components/Skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Switch';
import { Dialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';
import {
  CheckSquare,
  Clock,
  Bell,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  HelpCircle,
  Settings,
} from 'lucide-react';

const WEEKDAYS = [
  { label: 'Mon', value: 0 },
  { label: 'Tue', value: 1 },
  { label: 'Wed', value: 2 },
  { label: 'Thu', value: 3 },
  { label: 'Fri', value: 4 },
  { label: 'Sat', value: 5 },
  { label: 'Sun', value: 6 },
];

export const Tasks: React.FC = () => {
  const { toast } = useToast();

  const [todayData, setTodayData] = useState<TodayTasksResponse | null>(null);
  const [historyTasks, setHistoryTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<ReminderSettings>({
    enabled: true,
    time_hhmm: '19:00',
    timezone: 'Asia/Kolkata',
    days: [0, 1, 2, 3, 4],
    channel: 'browser',
    weekly_report: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [error, setError] = useState<Error | string | null>(null);

  // Active Task Drill Dialog
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [taskEvaluation, setTaskEvaluation] = useState<Evaluation | null>(null);

  // Browser notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [todayRes, histRes, remRes] = await Promise.all([
        api.tasks.getToday().catch(() => null),
        api.tasks.getHistory(14).catch(() => []),
        api.reminders.get().catch(() => null),
      ]);

      if (todayRes) setTodayData(todayRes);
      if (histRes) setHistoryTasks(histRes);
      if (remRes) setReminders(remRes);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          toast({
            title: 'Notifications Enabled',
            description: 'You will receive YapWise practice reminders in your browser.',
            type: 'success',
          });
        } else {
          toast({
            title: 'Permission Denied',
            description: 'Browser notifications were not allowed. You can adjust this in browser settings.',
            type: 'error',
          });
        }
      } catch (e) {
        console.error('Failed to request notification permission:', e);
      }
    }
  };

  const handleSaveReminders = async () => {
    setIsSavingReminders(true);
    try {
      const updated = await api.reminders.update(reminders);
      setReminders(updated);
      toast({
        title: 'Reminders Saved',
        description: 'Your daily study schedule has been updated.',
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err?.message || 'Could not save reminder schedule.',
        type: 'error',
      });
    } finally {
      setIsSavingReminders(false);
    }
  };

  const handleToggleDay = (dayVal: number) => {
    setReminders((prev) => {
      const exists = prev.days.includes(dayVal);
      const newDays = exists ? prev.days.filter((d) => d !== dayVal) : [...prev.days, dayVal].sort();
      return { ...prev, days: newDays };
    });
  };

  const handleOpenTask = (t: Task) => {
    setActiveTask(t);
    setTaskEvaluation(t.evaluation || null);
  };

  const handleCompleteTask = async (answerText?: string) => {
    if (!activeTask) return;
    setIsCompleting(true);
    try {
      const res = await api.tasks.complete(activeTask.id, answerText);
      if (res.evaluation) {
        setTaskEvaluation(res.evaluation);
      }
      toast({
        title: 'Task Completed!',
        description: 'Your daily drill response has been saved.',
        type: 'success',
      });
      // Refresh list
      loadData();
    } catch (err: any) {
      toast({
        title: 'Submission Error',
        description: err?.message || 'Failed to submit task response.',
        type: 'error',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Group history tasks by date
  const groupedHistory = historyTasks.reduce<Record<string, Task[]>>((acc, task) => {
    const d = task.date || 'Earlier';
    if (!acc[d]) acc[d] = [];
    acc[d].push(task);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-8 w-60 bg-[#EDE7FF] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton className="md:col-span-2" rows={4} />
          <CardSkeleton rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#29243A] tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EDE7FF] text-[#8B70D6] border border-[#D4C7F5]">
              <CheckSquare className="w-5 h-5" />
            </div>
            Daily Tasks & Reminders
          </h1>
          <p className="text-xs sm:text-sm text-[#77718B] mt-1">
            Build consistent speaking discipline with bite-sized placement communication drills.
          </p>
        </div>

        {todayData && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#EDE7FF] shadow-sm self-start sm:self-auto">
            <span className="text-xs text-[#77718B]">Today:</span>
            <span className="text-xs font-bold text-[#8B70D6]">
              {todayData.done} of {todayData.total} Completed
            </span>
          </div>
        )}
      </div>

      {error && <ErrorBanner error={error} onRetry={loadData} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: TODAY'S TASKS & HISTORY (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Cards */}
          <Card className="border-[#EDE7FF] bg-white shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B70D6]" />
                Today's Curated Drills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayData?.tasks && todayData.tasks.length > 0 ? (
                todayData.tasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleOpenTask(task)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-[#F8F6FF] border-[#EDE7FF] opacity-80'
                          : 'bg-white border-[#EDE7FF] hover:border-[#8B70D6]/40 hover:bg-[#F8F6FF]/50 shadow-sm'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${isDone ? 'line-through text-[#77718B]' : 'text-[#29243A]'}`}>
                            {task.title}
                          </span>
                          <Badge variant="lavender" className="text-[10px]">
                            {task.skill}
                          </Badge>
                          <span className="text-[10px] text-[#77718B]">
                            Diff: {task.difficulty}/5
                          </span>
                        </div>
                        <p className="text-xs text-[#77718B] line-clamp-2">{task.description}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1D6A4E] bg-[#E1F7EE] px-2.5 py-1 rounded-lg border border-[#BDEBD9]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        ) : (
                          <Button variant="primary" size="sm" className="text-xs">
                            Start Drill
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-[#F8F6FF] rounded-xl border border-[#EDE7FF] space-y-1">
                  <p className="text-xs text-[#29243A] font-semibold">All tasks completed for today!</p>
                  <p className="text-[11px] text-[#77718B]">
                    Check back tomorrow morning for new communication exercises.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 14-Day History Grouped By Date */}
          <Card className="border-[#EDE7FF] bg-white shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#77718B]" />
                Task History (Past 14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedHistory).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedHistory).map(([dateStr, tasksList]) => (
                    <div key={dateStr} className="space-y-2">
                      <span className="text-[11px] font-bold text-[#8B70D6] uppercase tracking-wider block">
                        {formatDate(dateStr)}
                      </span>
                      <div className="divide-y divide-[#EDE7FF] bg-[#F8F6FF] rounded-xl border border-[#EDE7FF] px-3">
                        {tasksList.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleOpenTask(t)}
                            className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:text-[#8B70D6] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {t.status === 'done' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9B71] flex-shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-[#77718B] flex-shrink-0" />
                              )}
                              <span className="text-[#29243A] font-medium">{t.title}</span>
                            </div>
                            <span className="text-[11px] text-[#77718B] capitalize">{t.skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#77718B] text-center py-6">
                  No historical task entries in the past 14 days.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: REMINDER SETTINGS CARD (1 Col) */}
        <div>
          <Card className="border-[#EDE7FF] bg-white shadow-card sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#8B70D6]" />
                Practice Reminders
              </CardTitle>
              <p className="text-[11px] text-[#77718B]">
                Configure automated browser alerts to maintain a continuous placement streak.
              </p>
            </CardHeader>
            <CardContent className="space-y-5 text-xs">
              {/* Enable Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF]">
                <div>
                  <span className="font-bold text-[#29243A] block">Daily Alerts</span>
                  <span className="text-[11px] text-[#77718B]">Notify me when tasks are due</span>
                </div>
                <Switch
                  checked={reminders.enabled}
                  onCheckedChange={(checked) => setReminders({ ...reminders, enabled: checked })}
                />
              </div>

              {/* Notification Permission Button */}
              {notificationPermission !== 'granted' && (
                <div className="p-3 rounded-xl bg-[#FFF0E8] border border-[#FFD9C9] text-[#9A4B29] space-y-2">
                  <p className="text-[11px] leading-relaxed">
                    Browser notification permission is currently <strong>{notificationPermission}</strong>.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestNotificationPermission}
                    className="w-full text-xs text-[#8C4A2F] border-[#FFD9C9] hover:bg-[#FFD9C9]/30"
                  >
                    Enable Browser Notifications
                  </Button>
                </div>
              )}

              {/* Time Picker */}
              <div>
                <label htmlFor="reminder-time-input" className="block font-semibold text-[#29243A] mb-1.5">
                  Reminder Time
                </label>
                <input
                  id="reminder-time-input"
                  type="time"
                  value={reminders.time_hhmm}
                  onChange={(e) => setReminders({ ...reminders, time_hhmm: e.target.value })}
                  className="w-full bg-[#F8F6FF] border border-[#EDE7FF] rounded-xl px-3 py-2 text-xs text-[#29243A] focus:outline-none focus:ring-2 focus:ring-[#8B70D6] focus:border-[#8B70D6]"
                />
              </div>

              {/* Timezone */}
              <div>
                <label htmlFor="reminder-timezone-input" className="block font-semibold text-[#29243A] mb-1.5">
                  Timezone
                </label>
                <input
                  id="reminder-timezone-input"
                  type="text"
                  value={reminders.timezone}
                  onChange={(e) => setReminders({ ...reminders, timezone: e.target.value })}
                  className="w-full bg-[#F8F6FF] border border-[#EDE7FF] rounded-xl px-3 py-2 text-xs text-[#29243A] focus:outline-none focus:ring-2 focus:ring-[#8B70D6] focus:border-[#8B70D6]"
                />
              </div>

              {/* Days of Week */}
              <div>
                <label className="block font-semibold text-[#29243A] mb-1.5">Active Days</label>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((w) => {
                    const isSelected = reminders.days.includes(w.value);
                    return (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => handleToggleDay(w.value)}
                        className={`py-1.5 rounded-lg text-center font-bold text-[10px] transition-colors ${
                          isSelected
                            ? 'bg-[#8B70D6] text-white shadow-sm'
                            : 'bg-[#F8F6FF] text-[#77718B] hover:text-[#29243A] border border-[#EDE7FF]'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Report Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF]">
                <div>
                  <span className="font-bold text-[#29243A] block">Weekly Summary</span>
                  <span className="text-[11px] text-[#77718B]">Generate weekly progress digest</span>
                </div>
                <Switch
                  checked={reminders.weekly_report}
                  onCheckedChange={(checked) => setReminders({ ...reminders, weekly_report: checked })}
                />
              </div>

              {/* Save Button */}
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleSaveReminders}
                isLoading={isSavingReminders}
              >
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Drill Dialog */}
      <Dialog
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        title={activeTask?.title || 'Practice Drill'}
        description={activeTask?.description || 'Daily Communication Exercise'}
      >
        {activeTask && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="lavender" className="text-[10px]">
                {activeTask.skill}
              </Badge>
              <span className="text-xs text-[#77718B]">Difficulty: {activeTask.difficulty}/5</span>
            </div>

            {/* Prompt Box */}
            <div className="p-4 rounded-xl bg-[#EDE7FF]/60 border border-[#D4C7F5] text-xs sm:text-sm text-[#29243A] font-medium leading-relaxed">
              <span className="block text-[10px] font-bold uppercase text-[#8B70D6] mb-1">
                Exercise Prompt:
              </span>
              "{activeTask.prompt}"
            </div>

            {/* AI Feedback if evaluated */}
            {taskEvaluation && (
              <EvaluationCard
                evaluation={taskEvaluation}
                defaultOpen={true}
                title="Drill Feedback & Scoring"
              />
            )}

            {/* Voice Input if not yet completed */}
            {activeTask.status !== 'done' && !taskEvaluation && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-[#29243A] block">
                  Speak or type your response:
                </span>
                <VoiceInput
                  placeholder="Record your spoken answer or type here..."
                  onSubmit={(text: string) => handleCompleteTask(text)}
                  isLoading={isCompleting}
                  buttonText="Complete Exercise"
                />
              </div>
            )}

            {/* If task is already done, show close button */}
            {(activeTask.status === 'done' || taskEvaluation) && (
              <div className="pt-2 flex justify-end">
                <Button variant="outline" onClick={() => setActiveTask(null)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};
export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  target_role: string;
  experience_level: string;
  daily_streak: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PracticeSession {
  id: number;
  title: string;
  topic: string;
  mode: string;
  transcript: string;
  audio_duration_seconds: number;
  wpm: number;
  filler_words_count: number;
  filler_words_breakdown: Record<string, number>;
  clarity_score: number;
  fluency_score: number;
  vocabulary_score: number;
  confidence_score: number;
  relevance_score: number;
  overall_score: number;
  feedback_summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  created_at: string;
}

export interface InterviewTurn {
  id: number;
  turn_index: number;
  role: 'interviewer' | 'candidate';
  speaker_name: string;
  content: string;
  score?: number;
  feedback?: string;
  star_analysis?: string;
  created_at: string;
}

export interface InterviewSession {
  id: number;
  interview_type: 'hr' | 'technical';
  title: string;
  target_role: string;
  status: 'in_progress' | 'completed';
  overall_score: number;
  clarity_score: number;
  structure_score: number;
  technical_accuracy_score: number;
  confidence_score: number;
  summary_feedback: string;
  strengths: string[];
  improvements: string[];
  turns: InterviewTurn[];
  created_at: string;
  completed_at?: string;
}

export interface GDTurn {
  id: number;
  turn_index: number;
  speaker_name: string;
  speaker_role: 'moderator' | 'advocate' | 'skeptic' | 'user' | 'participant';
  content: string;
  feedback_for_user?: string;
  created_at: string;
}

export interface GDSession {
  id: number;
  topic: string;
  category: string;
  status: string;
  user_contributions_count: number;
  overall_score: number;
  leadership_score: number;
  active_listening_score: number;
  assertiveness_score: number;
  critical_thinking_score: number;
  summary_feedback: string;
  key_takeaways: string[];
  turns: GDTurn[];
  created_at: string;
}

export interface LearningModule {
  id: number;
  module_key: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  progress_percent: number;
  is_completed: boolean;
  exercises_count: number;
  completed_exercises_count: number;
  created_at: string;
  updated_at: string;
}

export interface GoalReminder {
  id: number;
  user_id: number;
  daily_goal_minutes: number;
  reminder_time: string;
  days_of_week: string[];
  notifications_enabled: boolean;
  sound_effects_enabled: boolean;
  selected_voice: string;
  playback_speed: string;
}

export interface DashboardStats {
  readiness_score: number;
  total_sessions: number;
  practice_sessions_count: number;
  interview_sessions_count: number;
  gd_sessions_count: number;
  daily_streak: number;
  average_wpm: number;
  average_filler_words: number;
  learning_progress_pct: number;
  radar_metrics: { subject: string; value: number; fullMark: number }[];
  timeline: { date: string; score: number; wpm: number; fillers: number }[];
}

export interface ActivityHistoryItemPractice {
  id: number;
  title: string;
  topic: string;
  mode: string;
  overall_score: number;
  wpm: number;
  fillers: number;
  created_at: string;
}

export interface ActivityHistoryItemInterview {
  id: number;
  title: string;
  type: string;
  role: string;
  overall_score: number;
  status: string;
  created_at: string;
}

export interface ActivityHistory {
  practices: ActivityHistoryItemPractice[];
  interviews: ActivityHistoryItemInterview[];
}

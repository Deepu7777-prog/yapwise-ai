export interface User {
  id: number | string;
  email: string;
  full_name: string;
  target_role?: string;
  experience_level?: string;
  avatar_url?: string;
  daily_streak?: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Profile {
  email: string;
  full_name: string;
  college: string;
  degree: string;
  year_branch?: string;
  skills?: string[];
  career_interests?: string;
  target_role: string;
  goals: string;
  level: string; // e.g. "beginner", "intermediate", "advanced"
  difficulty: number; // 1 - 5
  assessed: boolean;
  assessed_at: string | null;
}

export interface Mistake {
  original: string;
  correction: string;
  category: string;
  explanation: string;
  count?: number;
}

export interface Evaluation {
  id?: number | string;
  grammar: number | null;
  vocabulary: number | null;
  clarity: number | null;
  content: number | null;
  overall: number | null;
  feedback: string;
  strengths: string[];
  mistakes: Mistake[];
  created_at?: string;
  tip?: string;
}

export interface AssessmentResult {
  overall: number | null;
  level: string;
  difficulty: number;
  summary: string;
  results: Evaluation[];
}

export interface VoiceMessage {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  evaluation?: Evaluation | null;
}

export interface VoiceSummary {
  evaluated_turns: number;
  avg_overall: number | null;
  skill_averages: Record<string, number | null>;
  top_mistakes: Mistake[];
  strengths: string[];
}

export interface VoiceSession {
  id: number | string;
  topic: string;
  status: 'active' | 'ended' | string;
  started_at: string;
  ended_at?: string | null;
  summary?: VoiceSummary | null;
  messages?: VoiceMessage[];
  evaluations?: Evaluation[];
}

export interface InterviewMessage {
  id: number | string;
  role: string;
  content: string;
  created_at: string;
}

export interface InterviewEvaluation {
  id?: number | string;
  question: string;
  answer: string;
  score?: number | null;
  feedback?: string;
  tip?: string;
  mistakes?: Mistake[];
  grammar?: number | null;
  vocabulary?: number | null;
  clarity?: number | null;
  content?: number | null;
  overall?: number | null;
}

export interface Interview {
  id: number | string;
  kind: 'hr' | 'technical';
  role: string;
  difficulty: number;
  status: 'in_progress' | 'completed' | string;
  total_questions: number; // usually 5
  question_number: number;
  current_question: string;
  overall_score: number | null;
  summary?: string | null;
  ai_evaluated?: boolean;
  notice?: string;
  messages?: InterviewMessage[];
  evaluations?: InterviewEvaluation[];
}

export interface InterviewAnswerResponse {
  evaluated: boolean;
  evaluation: Evaluation | null;
  tip?: string;
  completed: boolean;
  next_question?: string | null;
  interview: Interview;
}

export interface GDParticipantTurn {
  name: string;
  text: string;
}

export interface GDTurn {
  id?: number | string;
  speaker: string;
  text: string;
  evaluation?: Evaluation | null;
  created_at?: string;
}

export interface GDSummary {
  evaluated_turns?: number;
  avg_overall?: number | null;
  consensus?: string;
  summary?: string;
  feedback?: string;
  top_mistakes?: Mistake[];
  strengths?: string[];
}

export interface GDSession {
  id: number | string;
  topic: string;
  status: 'active' | 'ended' | string;
  participants: string[]; // ["Aarav", "Meera", "Rohan"]
  openings: GDParticipantTurn[];
  notice?: string;
  summary?: GDSummary | null;
  turns?: GDTurn[];
}

export interface GDTurnResponse {
  participants: GDParticipantTurn[];
  evaluation: Evaluation | null;
}

export interface SkillItem {
  skill: string;
  avg_score: number | null;
  last_score: number | null;
  samples: number;
}

export interface LearningStep {
  title: string;
  why: string;
  link: string;
}

export interface LearningPath {
  level: string;
  difficulty: number;
  assessed: boolean;
  skills: SkillItem[];
  weak_areas: string[];
  steps: LearningStep[];
  repeated_mistakes: Mistake[];
}

export interface MistakesResponse {
  repeated: Mistake[];
  recent: Mistake[];
}

export interface Task {
  id: number | string;
  date: string;
  kind: string;
  title: string;
  description: string;
  skill: string;
  prompt: string;
  difficulty: number;
  status: 'pending' | 'done';
  answer?: string | null;
  evaluation_id?: number | string | null;
  completed_at?: string | null;
  evaluation?: Evaluation | null;
}

export interface TodayTasksResponse {
  date: string;
  tasks: Task[];
  done: number;
  total: number;
}

export interface ReminderSettings {
  enabled: boolean;
  time_hhmm: string;
  timezone: string;
  days: number[]; // 0=Mon, 1=Tue, ..., 6=Sun
  channel: 'browser' | 'push';
  weekly_report: boolean;
}

export interface DueReminder {
  due: boolean;
  pending: boolean;
  message?: string;
}

export interface ProgressPoint {
  date: string;
  overall: number | null;
  grammar: number | null;
  vocabulary: number | null;
  clarity: number | null;
  content: number | null;
  answers: number;
}

export interface ProgressTotals {
  evaluated_answers: number;
  speaking_sessions: number;
  gd_sessions: number;
  interviews_completed: number;
  tasks_done: number;
}

export interface ProgressResponse {
  days: number;
  points: ProgressPoint[];
  total_evaluated: number;
  skills: Record<string, number | null>;
  totals: ProgressTotals;
}

export interface ReportData {
  week_start: string;
  week_end: string;
  has_activity: boolean;
  evaluated_answers: number;
  avg_overall: number | null;
  prev_week_avg_overall: number | null;
  change_vs_prev_week: number | null;
  skill_averages: Record<string, number | null>;
  weakest_skill: string;
  speaking_sessions: number;
  gd_sessions: number;
  interviews_completed: number;
  tasks_total: number;
  tasks_done: number;
  active_days: number;
  top_mistakes: Mistake[];
}

export interface Report {
  id?: number | string;
  week_start?: string;
  week_end?: string;
  summary: string;
  ai_generated?: boolean;
  data: ReportData;
  created_at?: string;
}

export interface ApiErrorDetail {
  code?: 'AI_QUOTA' | 'AI_UNAVAILABLE' | string;
  message?: string;
}

// ==========================================
// CAREER PATH & AI MENTOR TYPES
// ==========================================
export interface Milestone {
  id: number;
  title: string;
  category: string;
  status: 'completed' | 'in-progress' | 'pending';
  description: string;
  estimated_weeks: number;
  tasks: string[];
}

export interface CareerRoadmap {
  role: string;
  summary: string;
  progress_percent: number;
  completed_milestones: number;
  total_milestones: number;
  milestones: Milestone[];
  recommended_next_step: {
    milestone_id: number;
    title: string;
    action: string;
  };
}

export interface CareerMentorResponse {
  reply: string;
  key_takeaways: string[];
  suggested_followups: string[];
}

export interface CodingQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  patterns: string[];
  company_tags: string[];
  description: string;
  hint1: string;
  hint2: string;
  explanation: string;
  time_complexity: string;
  space_complexity: string;
  python_example: string;
  java_example: string;
}

export interface CodingGuidance {
  dsa_order: Array<{
    step: number;
    topic: string;
    importance: string;
    problems: string;
    concept: string;
  }>;
  problem_solving_framework: Array<{
    step: string;
    desc: string;
  }>;
  curated_questions: CodingQuestion[];
}

export interface InterviewGuidance {
  self_introduction_guide: {
    structure: Array<{ part: string; focus: string }>;
    sample_script: string;
  };
  star_method_guide: {
    title: string;
    steps: Array<{ letter: string; word: string; description: string }>;
  };
  company_patterns: Array<{
    company: string;
    rounds: string;
    focus: string;
  }>;
  top_hr_questions: Array<{
    q: string;
    strategy: string;
  }>;
}

// ==========================================
// SPEAKING COMPANION (VOICE COMPANION) TYPES
// ==========================================
export type SpeakingMode = 'free' | 'daily' | 'hr' | 'technical' | 'gd';

export interface SpeakingTurnResponse {
  spoken_response: string;
  has_correction: boolean;
  original_phrase: string | null;
  corrected_phrase: string | null;
  correction_explanation: string | null;
  follow_up_question: string;
  evaluation: {
    grammar: number;
    vocabulary: number;
    clarity: number;
    content: number;
    overall: number;
    feedback: string;
    new_vocabulary: string[];
  };
}

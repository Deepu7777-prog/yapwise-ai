import {
  AuthResponse,
  User,
  Profile,
  Evaluation,
  AssessmentResult,
  VoiceSession,
  Interview,
  InterviewAnswerResponse,
  GDSession,
  GDTurnResponse,
  LearningPath,
  MistakesResponse,
  TodayTasksResponse,
  Task,
  ReminderSettings,
  DueReminder,
  ProgressResponse,
  Report,
  CareerRoadmap,
  CareerMentorResponse,
  CodingGuidance,
  InterviewGuidance,
  SpeakingTurnResponse,
  SpeakingMode,
} from './types';
import { resolveFallback } from './fallbackEngine';

const rawApiUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).trim().replace(/\/+$/, '');

const BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem('yapwise_token');
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem('yapwise_token', token);
  } catch (err) {
    console.error('Failed to save token to localStorage:', err);
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem('yapwise_token');
  } catch (err) {
    console.error('Failed to remove token from localStorage:', err);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response | null = null;
  let networkFailed = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {
    networkFailed = true;
  }

  // 1. If real backend returned healthy 200/201/204
  if (response && response.ok) {
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  }

  // 2. If real backend explicitly rejected credentials with 401
  if (response && response.status === 401 && endpoint.includes('/auth/login')) {
    // Only fail if backend is definitely active and verified invalid credentials
    try {
      const err = await response.json();
      if (err.detail === 'Incorrect email or password.') {
        throw new ApiError(err.detail, 401);
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
    }
  }

  // 3. Fallback engine: When backend is sleeping on Render (502/503), unconfigured, or offline,
  // gracefully fulfill with rich client engine so the user experience is ALWAYS seamless!
  const fallback = resolveFallback<T>(endpoint, options);
  if (fallback !== null) {
    return fallback;
  }

  if (response && response.status === 401) {
    removeStoredToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  let detailMessage = `Request failed with status ${response?.status || 0}`;
  if (networkFailed) {
    detailMessage = 'Unable to reach backend server. Please check your internet connection.';
  }

  throw new ApiError(detailMessage, response?.status || 0);
}

export const api = {
  // 1. Auth
  auth: {
    register: (data: { email: string; password: string; full_name: string }) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    googleLogin: (data: { email: string; full_name?: string; credential?: string }) =>
      request<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>('/auth/me'),
  },

  // 2. Profile
  profile: {
    get: () => request<Profile>('/profile'),
    update: (data: {
      full_name?: string;
      college?: string;
      degree?: string;
      year_branch?: string;
      skills?: string[];
      career_interests?: string;
      target_role?: string;
      goals?: string;
    }) =>
      request<Profile>('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // 3. Assessment
  assessment: {
    getQuestions: () => request<{ questions: string[] }>('/assessment/questions'),
    submit: (answers: string[]) =>
      request<AssessmentResult>('/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),
  },

  // 4. Voice Practice
  voice: {
    createSession: (topic: string) =>
      request<VoiceSession>('/voice/sessions', {
        method: 'POST',
        body: JSON.stringify({ topic }),
      }),
    startSession: (topic: string) =>
      request<VoiceSession>('/voice/sessions', {
        method: 'POST',
        body: JSON.stringify({ topic }),
      }),
    listSessions: () => request<VoiceSession[]>('/voice/sessions'),
    getSession: (id: number | string) =>
      request<VoiceSession>(`/voice/sessions/${id}`),
    sendMessage: (id: number | string, text: string) =>
      request<{ reply: string; evaluation: Evaluation | null }>(
        `/voice/sessions/${id}/message`,
        {
          method: 'POST',
          body: JSON.stringify({ text }),
        }
      ),
    endSession: (id: number | string) =>
      request<any>(`/voice/sessions/${id}/end`, {
        method: 'POST',
      }),
  },

  // 5. Interviews
  interview: {
    start: (
      arg1: 'hr' | 'technical' | { kind: 'hr' | 'technical'; role: string; difficulty?: number },
      arg2?: string,
      arg3?: number
    ) => {
      const payload =
        typeof arg1 === 'object'
          ? arg1
          : { kind: arg1, role: arg2 || 'General', difficulty: arg3 ?? 3 };
      return request<Interview>('/interviews', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    list: () => request<Interview[]>('/interviews'),
    get: (id: number | string) => request<Interview>(`/interviews/${id}`),
    submitAnswer: (id: number | string, answer: string) =>
      request<InterviewAnswerResponse>(`/interviews/${id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      }),
    answer: (id: number | string, answer: string) =>
      request<InterviewAnswerResponse>(`/interviews/${id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      }),
  },

  // 6. Group Discussion
  gd: {
    getTopics: () => request<{ topics: string[] }>('/gd/topics'),
    start: (topic: string) =>
      request<GDSession>('/gd', {
        method: 'POST',
        body: JSON.stringify({ topic }),
      }),
    submitTurn: (id: number | string, text: string) =>
      request<GDTurnResponse>(`/gd/${id}/turn`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    sendTurn: (id: number | string, text: string) =>
      request<GDTurnResponse>(`/gd/${id}/turn`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    get: (id: number | string) => request<GDSession>(`/gd/${id}`),
    end: (id: number | string) =>
      request<any>(`/gd/${id}/end`, {
        method: 'POST',
      }),
  },

  // 7. Learning Path
  learning: {
    getPath: () => request<LearningPath>('/learning/path'),
    getMistakes: () => request<MistakesResponse>('/learning/mistakes'),
  },

  // 8. Daily Tasks
  tasks: {
    getToday: () => request<TodayTasksResponse>('/tasks/today'),
    getHistory: (days: number = 14) =>
      request<Task[]>(`/tasks/history?days=${days}`),
    complete: (id: number | string, answer?: string) =>
      request<{ task: Task; evaluated: boolean; evaluation: Evaluation | null }>(
        `/tasks/${id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ answer: answer || '' }),
        }
      ),
  },

  // 9. Reminders
  reminders: {
    get: () => request<ReminderSettings>('/reminders'),
    update: (data: Partial<ReminderSettings>) =>
      request<ReminderSettings>('/reminders', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getDue: () => request<DueReminder>('/reminders/due'),
    ack: () =>
      request<{ ok: boolean }>('/reminders/ack', {
        method: 'POST',
      }),
  },

  // 10. Progress and Reports
  progress: {
    get: (days: number = 30) =>
      request<ProgressResponse>(`/progress?days=${days}`),
  },
  reports: {
    list: () => request<Report[]>('/reports'),
    generate: (week: 'current' | 'previous') =>
      request<Report>('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ week }),
      }),
  },

  // 11. Career Path & AI Mentor (Page One)
  career: {
    getRoadmap: () => request<CareerRoadmap>('/career/roadmap'),
    generateRoadmap: (data: { target_role?: string; skills?: string[]; year_branch?: string }) =>
      request<CareerRoadmap>('/career/roadmap', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    askMentor: (
      question: string,
      category: string = 'general',
      history: Array<{ role: string; content: string }> = []
    ) =>
      request<CareerMentorResponse>('/career/mentor/chat', {
        method: 'POST',
        body: JSON.stringify({ question, category, history }),
      }),
    sendMentorChat: (
      question: string,
      history: Array<{ role: string; content: string }> = [],
      category: string = 'general'
    ) =>
      request<CareerMentorResponse>('/career/mentor/chat', {
        method: 'POST',
        body: JSON.stringify({ question, category, history }),
      }),
    getCodingGuidance: () => request<CodingGuidance>('/career/coding-guidance'),
    getInterviewGuidance: () => request<InterviewGuidance>('/career/interview-guidance'),
  },

  // 12. Speaking Companion (Page Two)
  speaking: {
    sendTurn: (
      speech: string,
      mode: SpeakingMode = 'free',
      history: Array<{ role: string; content: string }> = []
    ) =>
      request<SpeakingTurnResponse>('/speaking/turn', {
        method: 'POST',
        body: JSON.stringify({ speech, mode, history }),
      }),
  },

  // 13. AI Slide Maker
  slides: {
    generate: (data: { topic: string; slide_count?: number; style?: string }) =>
      request<{
        topic: string;
        total_slides: number;
        style: string;
        deck_summary: string;
        slides: Array<{
          slide_number: number;
          badge: string;
          title: string;
          subtitle: string;
          bullets: string[];
          speaker_notes: string;
          key_takeaway: string;
        }>;
      }>('/slides/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

import {
  User,
  AuthResponse,
  PracticeSession,
  InterviewSession,
  InterviewTurn,
  GDSession,
  GDTurn,
  LearningModule,
  GoalReminder,
  DashboardStats,
  ActivityHistory,
} from '../types';

const getApiBase = (): string => {
  let envBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
  if (!envBase) {
    return '/api/v1';
  }
  // Strip trailing slash
  envBase = envBase.replace(/\/+$/, '');
  // Append /api/v1 if missing
  if (!envBase.endsWith('/api/v1') && !envBase.endsWith('/api')) {
    envBase = `${envBase}/api/v1`;
  } else if (envBase.endsWith('/api')) {
    envBase = `${envBase}/v1`;
  }
  return envBase;
};

const API_BASE = getApiBase();

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('yapwise_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      // If unauthorized, clear stale token
      localStorage.removeItem('yapwise_token');
    }
    let errorMsg = `API request failed with status ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        } else {
          errorMsg = JSON.stringify(errorData.detail);
        }
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(data: { email: string; password: string; full_name: string; target_role?: string; experience_level?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  // Practice
  async evaluatePractice(payload: {
    title?: string;
    topic?: string;
    mode?: string;
    transcript: string;
    audio_duration_seconds?: number;
  }): Promise<PracticeSession> {
    const res = await fetch(`${API_BASE}/practice/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<PracticeSession>(res);
  },

  async getPracticeHistory(): Promise<PracticeSession[]> {
    const res = await fetch(`${API_BASE}/practice/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PracticeSession[]>(res);
  },

  async getPracticeSession(id: number): Promise<PracticeSession> {
    const res = await fetch(`${API_BASE}/practice/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PracticeSession>(res);
  },

  // Interviews
  async startInterview(payload: {
    interview_type: 'hr' | 'technical';
    title?: string;
    target_role?: string;
  }): Promise<InterviewSession> {
    const res = await fetch(`${API_BASE}/interview/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<InterviewSession>(res);
  },

  async submitInterviewTurn(payload: {
    session_id: number;
    user_response: string;
    audio_duration_seconds?: number;
  }): Promise<{
    turn_id: number;
    session_id: number;
    user_turn: InterviewTurn;
    next_question: InterviewTurn;
    is_finished: boolean;
  }> {
    const res = await fetch(`${API_BASE}/interview/turn`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getInterviewSession(id: number): Promise<InterviewSession> {
    const res = await fetch(`${API_BASE}/interview/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<InterviewSession>(res);
  },

  // Group Discussion
  async startGDSession(payload: {
    topic?: string;
    category?: string;
  }): Promise<GDSession> {
    const res = await fetch(`${API_BASE}/gd/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<GDSession>(res);
  },

  async submitGDTurn(payload: {
    session_id: number;
    user_argument: string;
  }): Promise<{
    user_turn: GDTurn;
    ai_reactions: GDTurn[];
    live_feedback: string;
    is_completed: boolean;
  }> {
    const res = await fetch(`${API_BASE}/gd/turn`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getGDSession(id: number): Promise<GDSession> {
    const res = await fetch(`${API_BASE}/gd/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<GDSession>(res);
  },

  // Learning
  async getLearningModules(): Promise<LearningModule[]> {
    const res = await fetch(`${API_BASE}/learning/modules`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<LearningModule[]>(res);
  },

  async advanceModuleExercise(moduleId: number): Promise<LearningModule> {
    const res = await fetch(`${API_BASE}/learning/progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ module_id: moduleId, completed_exercises_delta: 1 }),
    });
    return handleResponse<LearningModule>(res);
  },

  // Progress Analytics
  async getDashboardAnalytics(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/progress/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DashboardStats>(res);
  },

  async getActivityHistory(): Promise<ActivityHistory> {
    const res = await fetch(`${API_BASE}/progress/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ActivityHistory>(res);
  },

  // Reminders & Settings
  async getReminders(): Promise<GoalReminder> {
    const res = await fetch(`${API_BASE}/reminders/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<GoalReminder>(res);
  },

  async updateReminders(data: Partial<GoalReminder>): Promise<GoalReminder> {
    const res = await fetch(`${API_BASE}/reminders/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<GoalReminder>(res);
  },
};

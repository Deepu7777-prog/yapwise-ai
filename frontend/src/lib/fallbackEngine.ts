import {
  AuthResponse,
  User,
  Profile,
  SpeakingTurnResponse,
  CareerMentorResponse,
  CareerRoadmap,
  TodayTasksResponse,
  ProgressResponse,
  CodingGuidance,
  InterviewGuidance,
} from './types';

// In-memory or localStorage persistent mock store
const STORAGE_PREFIX = 'yapwise_local_';

function getStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota
  }
}

// 1. Auth Fallback
export function fallbackAuth(
  endpoint: string,
  bodyText?: string
): AuthResponse {
  let email = 'student@yapwise.ai';
  let fullName = 'YapWise Student';

  if (bodyText) {
    try {
      const data = JSON.parse(bodyText);
      if (data.email) email = data.email.trim();
      if (data.full_name) fullName = data.full_name.trim();
      else if (email.includes('@')) {
        fullName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } catch {
      // ignore
    }
  }

  const user: User = {
    id: 1,
    email,
    full_name: fullName,
    target_role: 'Software Engineer',
    experience_level: 'Student',
    daily_streak: 3,
  };

  setStoredJson('current_user', user);

  return {
    access_token: `yapwise-token-${Date.now()}`,
    user,
  };
}

// 2. Profile Fallback
export function fallbackProfile(bodyText?: string): Profile {
  const current = getStoredJson<User>('current_user', {
    id: 1,
    email: 'student@yapwise.ai',
    full_name: 'YapWise Student',
    target_role: 'Software Engineer',
  });

  const base: Profile = {
    email: current.email,
    full_name: current.full_name,
    college: 'Engineering Institute of Technology',
    degree: 'B.Tech in Computer Science',
    year_branch: '3rd Year, Computer Science & Engineering',
    skills: ['Data Structures & Algorithms', 'Python', 'Java', 'SQL', 'System Design'],
    career_interests: 'Full-Stack Engineering & Cloud Platforms',
    target_role: current.target_role || 'Software Engineer',
    goals: 'Crack Top-Tier Tech Campus Placements with High Fluency',
    level: 'intermediate',
    difficulty: 3,
    assessed: true,
    assessed_at: new Date().toISOString(),
  };

  if (bodyText) {
    try {
      const updates = JSON.parse(bodyText);
      const merged = { ...base, ...updates };
      setStoredJson('profile', merged);
      return merged;
    } catch {
      // ignore
    }
  }

  return getStoredJson<Profile>('profile', base);
}

// 3. AI Slide Maker Fallback
export function fallbackSlides(bodyText?: string) {
  let topic = 'Modern Full-Stack Architecture';
  let slideCount = 5;
  let style = 'Technical & Engineering';

  if (bodyText) {
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed.topic) topic = parsed.topic.trim();
      if (parsed.slide_count) slideCount = Math.max(3, Math.min(8, Number(parsed.slide_count)));
      if (parsed.style) style = parsed.style;
    } catch {
      // ignore
    }
  }

  const templates: Record<string, { badge: string; title: string; subtitle: string; bullets: string[]; takeaway: string; notes: string }[]> = {
    default: [
      {
        badge: 'Executive Summary',
        title: `Introduction to ${topic}`,
        subtitle: `Core Fundamentals, Motivation & Placement Value`,
        bullets: [
          `Understanding the foundational principles of ${topic} and its industry relevance.`,
          `Key challenges engineers and teams face without structured adoption.`,
          `High-level workflow and modern technical architecture overview.`,
          `Practical placement interview expectations: conceptual clarity and verbal defense.`,
        ],
        takeaway: `${topic} is a high-yield competency frequently evaluated in technical interviews and campus placements.`,
        notes: `Welcome everyone. Today we are diving into ${topic}. Emphasize the core architectural rationale and why tier-1 companies prioritize this subject.`,
      },
      {
        badge: 'Core Architecture',
        title: `Architectural Breakdown & Components`,
        subtitle: `Dissecting the Building Blocks & Data Flow`,
        bullets: [
          `Component Layering: Separation of concerns between ingestion, processing, and presentation.`,
          `Data Flow Pipeline: How requests traverse across microservices and storage engines.`,
          `State Management & Reliability: Ensuring idempotency and fault tolerance.`,
          `Latency & Throughput: Key metrics to optimize during scale benchmarks.`,
        ],
        takeaway: `Modular decomposition ensures individual subsystems can scale independently without bottlenecking the pipeline.`,
        notes: `Walk the interview panel through each block. Point out where failovers occur and how latency budgets are enforced.`,
      },
      {
        badge: 'Implementation Strategy',
        title: `Design Trade-offs & Deep Dive`,
        subtitle: `Engineering Decisions, Time vs Space & Bottlenecks`,
        bullets: [
          `Trade-off Analysis: Balancing consistency vs availability (CAP theorem alignment).`,
          `Storage Choices: Relational ACID compliance vs distributed NoSQL horizontal scale.`,
          `Caching Strategies: Redis/Memcached read-through and cache-invalidation patterns.`,
          `Security & Auth: JWT tokens, role-based access control, and encrypted network transit.`,
        ],
        takeaway: `No design is one-size-fits-all; articulately justifying your trade-offs is what sets senior candidates apart.`,
        notes: `Highlight why you picked a particular approach over alternatives. Interviewers care more about your decision-making framework than simple memorization.`,
      },
      {
        badge: 'Real-World Case Study',
        title: `Industry Application & Placement Scenarios`,
        subtitle: `Practical Production Case Studies & Problem Solving`,
        bullets: [
          `Scenario Walkthrough: Handling 10,000 requests/sec peak traffic during campus recruitment tests.`,
          `Common Failure Modes: Connection pool exhaustion, cascading timeouts, and memory leaks.`,
          `Monitoring & Observability: Tracing with OpenTelemetry, Prometheus metrics, and Grafana dashboards.`,
          `Interview Question Blueprint: "How would you optimize this system under 99th percentile latency constraints?"`,
        ],
        takeaway: `Real-world resilience is proven through graceful degradation and proactive observability.`,
        notes: `Frame this as a practical war story or project defense. Mention specific tools and logging hygiene.`,
      },
      {
        badge: 'Future Outlook & Conclusion',
        title: `Next Steps, Roadmap & Key Takeaways`,
        subtitle: `Summary of Learnings & Actionable Recommendations`,
        bullets: [
          `Key takeaways: Clean separation, robust error handling, and measurable performance indicators.`,
          `Hands-on practice: Building prototype demonstrations and verbalizing system design explanations.`,
          `Recommended next milestones: Deep-dive into automated testing, containerization, and cloud deployment.`,
          `Q&A Preparation: Preparing structured STAR-format responses for technical follow-ups.`,
        ],
        takeaway: `Mastery comes from pairing theoretical design knowledge with crisp, verbal communication.`,
        notes: `Summarize the top three principles learned today, and open the floor for technical questions and peer feedback.`,
      },
    ],
  };

  const pool = templates.default;
  const slides = [];

  for (let i = 0; i < slideCount; i++) {
    const template = pool[i % pool.length];
    slides.push({
      slide_number: i + 1,
      badge: template.badge,
      title: i === 0 ? `Introduction to ${topic}` : template.title,
      subtitle: template.subtitle,
      bullets: template.bullets,
      key_takeaway: template.takeaway,
      speaker_notes: template.notes,
    });
  }

  return {
    topic,
    total_slides: slides.length,
    style,
    deck_summary: `Structured presentation deck covering ${topic} with ${slides.length} comprehensive slides, bullet points, and presenter notes.`,
    slides,
  };
}

// 4. Speaking Companion Fallback
export function fallbackSpeakingTurn(
  speech: string,
  mode: string = 'free'
): SpeakingTurnResponse {
  const cleanSpeech = (speech || '').trim();
  const lower = cleanSpeech.toLowerCase();

  let spokenResponse = `That is an insightful observation! Could you expand on how you would apply that in a real campus interview scenario?`;
  let hasCorrection = false;
  let originalPhrase: string | null = null;
  let correctedPhrase: string | null = null;
  let explanation: string | null = null;
  let newVocab = ['articulate', 'coherent', 'systematic'];

  // Check common spoken English adjustments
  if (lower.includes('i am having') && (lower.includes('experience') || lower.includes('doubt'))) {
    hasCorrection = true;
    originalPhrase = 'I am having';
    correctedPhrase = 'I have';
    explanation = "In professional English, use simple present 'I have experience' or 'I have a question' rather than the continuous tense.";
  } else if (lower.includes('myself ') && lower.length < 25) {
    hasCorrection = true;
    originalPhrase = cleanSpeech.slice(0, 15);
    correctedPhrase = `I am ${cleanSpeech.replace(/myself\s*/i, '')}`;
    explanation = "In formal interviews, start introductions with 'I am' or 'My name is' instead of 'Myself'.";
  } else if (lower.includes('actually') && (lower.match(/actually/g) || []).length > 1) {
    hasCorrection = true;
    originalPhrase = 'actually... actually';
    correctedPhrase = 'in fact / strategically';
    explanation = "Avoid repeating filler words like 'actually'. A 1-second pause sounds much more confident.";
  }

  if (mode === 'hr' || lower.includes('project') || lower.includes('experience') || lower.includes('tell me')) {
    spokenResponse = `Great explanation! You communicated your thoughts clearly. What was the most challenging technical obstacle you faced while building it, and how did you resolve it?`;
    newVocab = ['orchestrated', 'mitigated', 'pioneered'];
  } else if (mode === 'technical' || lower.includes('algorithm') || lower.includes('database') || lower.includes('java') || lower.includes('python')) {
    spokenResponse = `Excellent technical articulation! You accurately highlighted the core trade-offs. How would your approach scale if traffic increased by ten times?`;
    newVocab = ['scalability', 'concurrency', 'idempotency'];
  } else if (cleanSpeech.length > 0) {
    spokenResponse = `I really like how you structured that point. The cadence was natural. What would be your next logical step to implement that?`;
  } else {
    spokenResponse = `I am listening! Whenever you are ready, share your thoughts or start your introduction.`;
  }

  const wordCount = cleanSpeech.split(/\s+/).filter(Boolean).length;
  const clarityScore = Math.min(95, Math.max(78, 80 + wordCount));

  return {
    spoken_response: spokenResponse,
    has_correction: hasCorrection,
    original_phrase: originalPhrase,
    corrected_phrase: correctedPhrase,
    correction_explanation: explanation,
    follow_up_question: 'Would you like to elaborate on that or try a mock behavioral question?',
    evaluation: {
      grammar: hasCorrection ? 85 : 92,
      vocabulary: 88,
      clarity: clarityScore,
      content: 90,
      overall: hasCorrection ? 87 : 91,
      feedback: hasCorrection
        ? `Good expression! Notice the minor phrasing adjustment to sound even more polished.`
        : `Outstanding fluency and cadence! Your sentence structure was confident and interview-ready.`,
      new_vocabulary: newVocab,
    },
  };
}

// 5. Career Mentor Fallback
export function fallbackMentorChat(question: string): CareerMentorResponse {
  const qLower = question.toLowerCase();

  if (qLower.includes('dsa') || qLower.includes('data structure') || qLower.includes('leetcode')) {
    return {
      reply: `For DSA placement preparation, focus on mastering patterns rather than memorizing individual problems. Start with Two Pointers and Sliding Window, progress into Hash Maps & Trees, and finish with Dynamic Programming & Graphs. Solving 150 well-categorized Medium problems with verbal walkthroughs will put you in the top 5% of candidates.`,
      key_takeaways: [
        'Master core patterns: Two Pointers, BFS/DFS, Binary Search, and DP.',
        'Always speak your thought process aloud before writing code.',
        'Aim for optimal time complexity first, then optimize space.',
      ],
      suggested_followups: [
        'What are the most frequent Dynamic Programming patterns in campus drives?',
        'How should I structure my 45-minute technical coding interview?',
        'Can you give me a 60-day roadmap for placement DSA?',
      ],
    };
  }

  if (qLower.includes('resume') || qLower.includes('project')) {
    return {
      reply: `Top placement resumes stand out when projects include real architectural impact and quantifiable metrics. Instead of saying 'Built an e-commerce website', write 'Engineered full-stack store with Redis caching and JWT auth, reducing API response times by 40% and supporting 500+ concurrent requests.'`,
      key_takeaways: [
        'Use the XYZ formula: Accomplished [X], measured by [Y], by doing [Z].',
        'Keep your tech stack modern and aligned with your target role.',
        'Ensure you can verbally explain every line of code on your resume.',
      ],
      suggested_followups: [
        'How should I describe my backend microservices project on my resume?',
        'What are the top red flags tech recruiters look for on resumes?',
      ],
    };
  }

  return {
    reply: `To succeed in placement rounds for ${question.slice(0, 30)}..., the golden rule is dual preparation: 70% technical mastery and 30% verbal articulation. Interviewers frequently choose articulate candidates with solid fundamentals over silent candidates with memorized code.`,
    key_takeaways: [
      'Practice explaining technical concepts in plain, crisp English.',
      'Structure behavioral answers using the STAR (Situation, Task, Action, Result) method.',
      'Maintain an active GitHub repository with clear README documentation.',
    ],
    suggested_followups: [
      'How do I answer "Tell me about yourself" without sounding nervous?',
      'What questions should I ask the interviewer at the end of the round?',
    ],
  };
}

// 6. Career Roadmap Fallback
export function fallbackRoadmap(): CareerRoadmap {
  return {
    role: 'Full-Stack Software Engineer',
    summary: 'Comprehensive 5-milestone roadmap designed for college placements and software engineering recruitment drives.',
    progress_percent: 40,
    completed_milestones: 2,
    total_milestones: 5,
    recommended_next_step: {
      milestone_id: 3,
      title: 'Advanced Data Structures & Algorithms',
      action: 'Complete 10 Trees and Graph traversal verbal walkthroughs',
    },
    milestones: [
      {
        id: 1,
        title: 'Core Programming & Object-Oriented Fundamentals',
        category: 'Foundations',
        status: 'completed',
        description: 'Master OOP principles, memory model, and algorithmic complexity.',
        estimated_weeks: 3,
        tasks: ['Java/Python syntax & collections', 'Pointers & memory references', 'Big-O time and space complexity'],
      },
      {
        id: 2,
        title: 'Essential Data Structures',
        category: 'Algorithms',
        status: 'completed',
        description: 'Arrays, Linked Lists, Stacks, Queues, and Hash Maps.',
        estimated_weeks: 4,
        tasks: ['Two Pointer techniques', 'Fast & slow pointers', 'Hash map frequency counters'],
      },
      {
        id: 3,
        title: 'Trees, Graphs & Dynamic Programming',
        category: 'Advanced DSA',
        status: 'in-progress',
        description: 'Binary trees, BST, BFS, DFS, Dijkstra, and 1D/2D memoization.',
        estimated_weeks: 5,
        tasks: ['Level order tree traversal', 'Graph cycle detection', 'Knapsack & LCS patterns'],
      },
      {
        id: 4,
        title: 'Full-Stack Project & System Design Basics',
        category: 'Engineering',
        status: 'pending',
        description: 'Design and deploy a scalable full-stack application with REST APIs and databases.',
        estimated_weeks: 4,
        tasks: ['REST API best practices', 'Database indexing & transactions', 'Docker containerization'],
      },
      {
        id: 5,
        title: 'Mock Placement Interviews & Verbal Articulation',
        category: 'Interview Prep',
        status: 'pending',
        description: 'Simulate high-pressure technical rounds and HR STAR interviews.',
        estimated_weeks: 3,
        tasks: ['Technical walkthrough defense', 'HR behavioral question mastery', 'Company-specific coding test simulations'],
      },
    ],
  };
}

// 7. Today Tasks Fallback
export function fallbackTodayTasks(): TodayTasksResponse {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    done: 1,
    total: 3,
    tasks: [
      {
        id: 1,
        date: today,
        kind: 'speaking',
        title: 'Practice 15-Minute Conversational Fluency',
        description: 'Complete a speaking session with Rahul or Ananya on Career Goals.',
        skill: 'fluency',
        prompt: 'Introduce yourself and your technical projects.',
        difficulty: 2,
        status: 'done',
        completed_at: new Date().toISOString(),
      },
      {
        id: 2,
        date: today,
        kind: 'interview',
        title: 'Solve 2 Tree Traversal Problems with Verbal Defense',
        description: 'Explain Inorder and Postorder traversals aloud while coding.',
        skill: 'technical',
        prompt: 'Explain how Inorder traversal operates on a Binary Search Tree.',
        difficulty: 3,
        status: 'pending',
      },
      {
        id: 3,
        date: today,
        kind: 'slides',
        title: 'Generate a Presentation Deck on Microservices',
        description: 'Use the AI Slide Maker to create a 4-slide system overview.',
        skill: 'presentation',
        prompt: 'Create a slide deck explaining microservice design patterns.',
        difficulty: 2,
        status: 'pending',
      },
    ],
  };
}

// 8. Progress Fallback
export function fallbackProgress(): ProgressResponse {
  return {
    days: 7,
    total_evaluated: 15,
    skills: {
      grammar: 88,
      vocabulary: 84,
      clarity: 90,
      content: 86,
      pace: 85,
    },
    totals: {
      evaluated_answers: 15,
      speaking_sessions: 6,
      gd_sessions: 3,
      interviews_completed: 4,
      tasks_done: 8,
    },
    points: [
      { date: '2026-11-04', overall: 75, grammar: 78, vocabulary: 72, clarity: 80, content: 75, answers: 2 },
      { date: '2026-11-05', overall: 80, grammar: 82, vocabulary: 78, clarity: 84, content: 80, answers: 3 },
      { date: '2026-11-06', overall: 82, grammar: 85, vocabulary: 80, clarity: 86, content: 82, answers: 2 },
      { date: '2026-11-07', overall: 85, grammar: 88, vocabulary: 82, clarity: 88, content: 85, answers: 3 },
      { date: '2026-11-08', overall: 84, grammar: 86, vocabulary: 84, clarity: 89, content: 84, answers: 1 },
      { date: '2026-11-09', overall: 88, grammar: 90, vocabulary: 86, clarity: 91, content: 88, answers: 2 },
      { date: '2026-11-10', overall: 89, grammar: 92, vocabulary: 88, clarity: 92, content: 89, answers: 2 },
    ],
  };
}

// Global dispatcher
export function resolveFallback<T>(endpoint: string, options: RequestInit = {}): T | null {
  const path = endpoint.toLowerCase();
  const bodyText = options.body as string | undefined;

  if (path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/google')) {
    return fallbackAuth(endpoint, bodyText) as unknown as T;
  }
  if (path.includes('/auth/me')) {
    const user = getStoredJson<User>('current_user', {
      id: 1,
      email: 'student@yapwise.ai',
      full_name: 'YapWise Student',
      target_role: 'Software Engineer',
      daily_streak: 3,
    });
    return user as unknown as T;
  }
  if (path.includes('/profile')) {
    return fallbackProfile(bodyText) as unknown as T;
  }
  if (path.includes('/slides/generate')) {
    return fallbackSlides(bodyText) as unknown as T;
  }
  if (path.includes('/speaking/turn')) {
    let speech = '';
    let mode = 'free';
    if (bodyText) {
      try {
        const p = JSON.parse(bodyText);
        speech = p.speech || '';
        mode = p.mode || 'free';
      } catch {
        // ignore
      }
    }
    return fallbackSpeakingTurn(speech, mode) as unknown as T;
  }
  if (path.includes('/career/mentor/chat')) {
    let question = 'How should I prepare for placements?';
    if (bodyText) {
      try {
        const p = JSON.parse(bodyText);
        question = p.question || question;
      } catch {
        // ignore
      }
    }
    return fallbackMentorChat(question) as unknown as T;
  }
  if (path.includes('/career/roadmap')) {
    return fallbackRoadmap() as unknown as T;
  }
  if (path.includes('/tasks/today')) {
    return fallbackTodayTasks() as unknown as T;
  }
  if (path.includes('/progress')) {
    return fallbackProgress() as unknown as T;
  }
  if (path.includes('/reminders')) {
    return {
      daily_goal_minutes: 15,
      reminder_time: '09:00',
      days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      notifications_enabled: true,
      sound_effects_enabled: true,
      selected_voice: 'default',
      playback_speed: '1.0',
    } as unknown as T;
  }

  return null;
}

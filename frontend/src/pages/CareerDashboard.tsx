import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  CareerRoadmap,
  CareerMentorResponse,
  CodingGuidance,
  InterviewGuidance,
  Milestone,
} from '../lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  Compass,
  Sparkles,
  User,
  GraduationCap,
  Briefcase,
  Code2,
  CheckCircle2,
  Clock,
  Send,
  Lightbulb,
  Building2,
  ArrowRight,
  Flame,
  Award,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  HelpCircle,
  Lock,
  ChevronRight,
  ArrowLeft,
  Mic,
  Trophy,
  Target,
  MessageSquare,
  BookOpen,
  Settings,
  Presentation,
  Upload,
  FileText,
  FileCheck,
  TrendingUp,
  Star,
  Zap,
  Play,
  RotateCcw,
  Check,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Copy,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TwoWayMockInterview } from '../components/interview/TwoWayMockInterview';

interface CareerDashboardProps {
  initialView?: 'hub' | 'profile' | 'assessment' | 'roadmap' | 'mentor' | 'learning' | 'slides' | 'interview' | 'progress';
}

export interface RoadmapMilestoneItem {
  id: number;
  name: string;
  shortName: string;
  status: 'completed' | 'active' | 'pending';
  progress: number;
  topics: string[];
  description: string;
  advice: string;
}

export const ROADMAP_MILESTONES: RoadmapMilestoneItem[] = [
  {
    id: 1,
    name: 'Programming Basics',
    shortName: 'Basics',
    status: 'completed',
    progress: 100,
    topics: ['Primitive Data Types & Memory', 'Conditionals & Loops', 'Functions & Scope', 'Arrays & String Manipulation'],
    description: 'Fundamental syntax, algorithmic problem solving patterns, and basic computational thinking.',
    advice: "Awesome job mastering the core building blocks! You've laid a rock-solid foundation.",
  },
  {
    id: 2,
    name: 'Java Fundamentals',
    shortName: 'Java',
    status: 'completed',
    progress: 100,
    topics: ['JVM Memory Model & Garbage Collection', 'Java Collections (List, Set, Map)', 'Generics & Lambda Streams', 'Exception Handling & File I/O'],
    description: 'Deep dive into the Java platform, memory allocation, and core collection utilities.',
    advice: 'Great job! Your Java syntax and collection usage scored in the top tier.',
  },
  {
    id: 3,
    name: 'Object-Oriented Programming',
    shortName: 'OOP',
    status: 'completed',
    progress: 100,
    topics: ['Encapsulation & Access Modifiers', 'Inheritance & Polymorphic Dispatch', 'Abstract Classes vs Interfaces', 'SOLID Architectural Principles'],
    description: 'Modular software engineering patterns, clean code principles, and structural design paradigms.',
    advice: 'SOLID principles mastered! You can explain interfaces and abstract classes with clarity.',
  },
  {
    id: 4,
    name: 'Data Structures & Algorithms',
    shortName: 'DSA',
    status: 'active',
    progress: 33,
    topics: ['Binary Search Trees & AVL Balancing', 'Graph Traversals (BFS & DFS)', 'Dynamic Programming & Memoization', 'Heap & Priority Queue Optimizations'],
    description: 'Algorithmic efficiency, time and space complexity analysis, and competitive coding patterns.',
    advice: 'You are currently here! Aim for 2 tree problems every morning to lock in placement readiness.',
  },
  {
    id: 5,
    name: 'Full-Stack Projects',
    shortName: 'Projects',
    status: 'pending',
    progress: 10,
    topics: ['Spring Boot REST API Architecture', 'PostgreSQL Database Indexing & JPA', 'React & Tailwind Campus Dashboard', 'Docker Containerization & CI/CD'],
    description: 'Production-ready software applications with secure authentication and database persistence.',
    advice: 'Complete DSA Milestone 4 to unlock guided production project blueprints.',
  },
  {
    id: 6,
    name: 'Technical & HR Interviews',
    shortName: 'Interviews',
    status: 'pending',
    progress: 0,
    topics: ['STAR Framework for Behavioral Questions', 'Live System Architecture Whiteboarding', 'Spoken Technical Articulation', 'Mock Interview Drills with Vikram'],
    description: 'Campus placement interview drills, behavioral scenario questions, and live problem explanation.',
    advice: 'Practice with Vikram in the Speaking Room to prepare for live interview rounds.',
  },
  {
    id: 7,
    name: 'Career & Placement Readiness',
    shortName: 'Career Readiness',
    status: 'pending',
    progress: 0,
    topics: ['ATS Resume Optimization', 'Campus Placement Assessment Clearance', 'LinkedIn & GitHub Portfolio Reviews', 'Offer Evaluation & Negotiation'],
    description: 'Final campus placement readiness, portfolio polishing, and job offer negotiation strategies.',
    advice: 'The ultimate milestone! Complete all drills to unlock verified placement badges.',
  },
];

export const CareerDashboard: React.FC<CareerDashboardProps> = ({ initialView = 'hub' }) => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Active sub-screen view
  const [activeView, setActiveView] = useState<'hub' | 'profile' | 'assessment' | 'roadmap' | 'mentor' | 'learning' | 'slides' | 'interview' | 'progress'>(initialView);

  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  // Profile Edit State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || user?.full_name || '');
  const [editRole, setEditRole] = useState(profile?.target_role || user?.target_role || 'Software Engineer');
  const [editDegree, setEditDegree] = useState(profile?.degree || 'B.Tech');
  const [editBranch, setEditBranch] = useState(profile?.year_branch || '3rd Year Computer Science');
  const [editCollege, setEditCollege] = useState(profile?.college || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile data dynamically whenever profile or user loads/updates
  useEffect(() => {
    if (profile || user) {
      const realFullName =
        profile?.full_name ||
        user?.full_name ||
        (user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Student');
      setEditName(realFullName);
      setEditRole(profile?.target_role || user?.target_role || 'Software Engineer');
      setEditDegree(profile?.degree || 'B.Tech');
      setEditBranch(profile?.year_branch || '3rd Year Computer Science');
      setEditCollege(profile?.college || '');
    }
  }, [profile, user]);

  // Interactive Skills State
  const [skillsList, setSkillsList] = useState<string[]>(
    profile?.skills && profile.skills.length > 0
      ? profile.skills
      : ['Java', 'Python', 'DSA', 'Web Dev', 'AI/ML']
  );
  const [newSkillInput, setNewSkillInput] = useState('');

  useEffect(() => {
    if (profile?.skills && profile.skills.length > 0) {
      setSkillsList(profile.skills);
    }
  }, [profile?.skills]);

  const handleAddSkill = async (skillToAdd?: string) => {
    const raw = (skillToAdd || newSkillInput).trim();
    if (!raw) return;
    if (skillsList.some((s) => s.toLowerCase() === raw.toLowerCase())) {
      toast(`Skill "${raw}" is already listed!`, 'info');
      setNewSkillInput('');
      return;
    }
    const updated = [...skillsList, raw];
    setSkillsList(updated);
    setNewSkillInput('');
    try {
      await api.profile.update({ skills: updated });
      refreshProfile();
      toast(`Added "${raw}" to your skills!`, 'success');
    } catch {
      // quiet fallback
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updated = skillsList.filter((s) => s !== skillToRemove);
    setSkillsList(updated);
    try {
      await api.profile.update({ skills: updated });
      refreshProfile();
      toast(`Removed "${skillToRemove}"`, 'info');
    } catch {
      // quiet fallback
    }
  };

  // Screen 4: Career Roadmap State
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<number>(4); // Default to Milestone 4 (DSA)

  // Screen 5: AI Mentor Chat State
  const [mentorInput, setMentorInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; content: string; key_takeaways?: string[]; suggested_followups?: string[] }>
  >([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm your AI Career Mentor. How can I help you today?`,
      suggested_followups: [
        'What is Java?',
        'Explain OOP',
        'Java vs Python',
        'Career in Java',
      ],
    },
  ]);
  const [isAskingMentor, setIsAskingMentor] = useState(false);

  // Screen 3: AI Slide Maker State & Types
  interface SlideItem {
    slide_number: number;
    badge: string;
    title: string;
    subtitle: string;
    bullets: string[];
    speaker_notes: string;
    key_takeaway: string;
  }

  interface SlideDeck {
    topic: string;
    total_slides: number;
    style: string;
    deck_summary: string;
    slides: SlideItem[];
  }

  const DEFAULT_SLIDE_DECK: SlideDeck = {
    topic: 'Artificial Intelligence in Engineering Education',
    total_slides: 4,
    style: 'Modern Purple',
    deck_summary: 'An exploration of modern AI pedagogical systems, adaptive problem-solving curricula, and automated feedback loops for STEM undergraduates.',
    slides: [
      {
        slide_number: 1,
        badge: 'Introduction & Context',
        title: 'AI in Engineering Education',
        subtitle: 'Transforming Pedagogy and Technical Skills Development',
        bullets: [
          'Shift from passive lecture listening to interactive, personalized problem-solving environments.',
          'Continuous formative assessment using automated code linting and conversational reasoning.',
          'Bridging the industry-readiness gap with real-time articulation and placement practice.',
        ],
        speaker_notes: 'Welcome everyone. Today we are exploring the role of generative AI in engineering education, examining how interactive systems transform traditional rote learning into experiential mastery.',
        key_takeaway: 'AI transitions classrooms from one-size-fits-all instruction to dynamic personalized learning paths.',
      },
      {
        slide_number: 2,
        badge: 'Core Architecture',
        title: 'Generative AI & LLM Architecture',
        subtitle: 'Foundational Models Powering Adaptive Tutoring',
        bullets: [
          'Transformer attention mechanisms enabling semantic code understanding and natural speech parsing.',
          'Retrieval-Augmented Generation (RAG) connecting static textbooks with live student queries.',
          'Low-latency voice inference pipelines facilitating real-time spoken English conversation drills.',
        ],
        speaker_notes: 'On this slide, we inspect the architectural pipeline. By coupling high-throughput LLMs with domain-specific retrieval, tutors maintain accuracy without hallucinating curriculum standards.',
        key_takeaway: 'Modern LLM architectures provide the real-time reasoning necessary for responsive student mentoring.',
      },
      {
        slide_number: 3,
        badge: 'Practical Applications',
        title: 'Automated Code Review & Voice Drills',
        subtitle: 'Hands-On Skill Verification in Real Time',
        bullets: [
          'Instant algorithm feedback identifying boundary conditions, time complexity, and memory leaks.',
          'Technical interview simulators evaluating both algorithmic rigor and verbal articulation (STAR method).',
          'Gamified learning milestones with XP progress tracking to maintain daily student engagement.',
        ],
        speaker_notes: 'Here we see concrete student outcomes. Instead of waiting days for an assignment grade, students receive immediate feedback on algorithmic edge-cases and speech fluency.',
        key_takeaway: 'Instant diagnostic feedback reduces learning cycle latency from weeks to seconds.',
      },
      {
        slide_number: 4,
        badge: 'Future Outlook',
        title: 'Future Horizons & Ethical AI',
        subtitle: 'Building Equitable and Transparent Learning Frameworks',
        bullets: [
          'Ensuring academic integrity while leveraging AI as a cognitive amplifier rather than a crutch.',
          'Multi-modal student support: voice, diagrams, code execution, and peer collaborative sessions.',
          'Fostering deep conceptual intuition over mere syntactic memorization.',
        ],
        speaker_notes: 'In closing, ethical AI deployment in universities must empower independent student thought and critical reasoning while safeguarding educational equity.',
        key_takeaway: 'The goal of educational AI is amplifying human potential, not replacing independent student problem solving.',
      },
    ],
  };

  const [slideTopic, setSlideTopic] = useState('Artificial Intelligence in Engineering Education');
  const [slideCount, setSlideCount] = useState<number>(5);
  const [slideStyle, setSlideStyle] = useState('Modern Purple');
  const [slideInputTab, setSlideInputTab] = useState<'topic' | 'pdf' | 'ppt'>('topic');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<SlideDeck | null>(DEFAULT_SLIDE_DECK);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isFullscreenPresenter, setIsFullscreenPresenter] = useState<boolean>(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(true);

  // Screen 7: Interview Practice State
  const [interviewTimer, setInterviewTimer] = useState(45);
  const [isInterviewRecording, setIsInterviewRecording] = useState(false);
  const [interviewQuestionIndex, setInterviewQuestionIndex] = useState(0);

  const interviewQuestions = [
    {
      question: 'What is a Binary Search Tree and what are its time complexities?',
      category: 'Data Structures & Algorithms',
      hint: 'Explain root node, left subtree smaller, right subtree greater property, O(log n) average and O(n) worst case.',
    },
    {
      question: 'Can you explain the difference between Process and Thread in Operating Systems?',
      category: 'Operating Systems',
      hint: 'Mention address space, context switching overhead, communication mechanisms (IPC vs shared memory).',
    },
    {
      question: 'What is Polymorphism in Java and how does method overloading differ from overriding?',
      category: 'Object-Oriented Programming',
      hint: 'Compile-time (overloading: same name, different parameters) vs Run-time (overriding: subclass replaces parent implementation).',
    },
  ];

  // Screen 9: Progress Reports Tab State
  const [progressTab, setProgressTab] = useState<'Overview' | 'Speaking' | 'Career Path' | 'Assessment'>('Overview');

  // Screen 4: Skill Assessment State
  const [assessmentStep, setAssessmentStep] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [selectedCategory, setSelectedCategory] = useState<string>('Programming Basics');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);

  // Coding & Interview Guidance State (Learning Hub)
  const [codingGuidance, setCodingGuidance] = useState<CodingGuidance | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'java'>('java');
  const [revealedHints, setRevealedHints] = useState<Record<string, { hint1: boolean; hint2: boolean; solution: boolean }>>({});

  const [error, setError] = useState<string | null>(null);

  // Load Initial Roadmap & Coding Data
  useEffect(() => {
    async function loadData() {
      setIsLoadingRoadmap(true);
      try {
        const [roadRes, codeRes] = await Promise.all([
          api.career.getRoadmap().catch(() => null),
          api.career.getCodingGuidance().catch(() => null),
        ]);
        if (roadRes) setRoadmap(roadRes);
        if (codeRes) setCodingGuidance(codeRes);
      } catch (err: any) {
        console.warn('Could not load initial roadmap:', err);
      } finally {
        setIsLoadingRoadmap(false);
      }
    }
    loadData();
  }, []);

  // Interview timer countdown
  useEffect(() => {
    let interval: any = null;
    if (activeView === 'interview' && interviewTimer > 0) {
      interval = setInterval(() => setInterviewTimer((prev) => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [activeView, interviewTimer]);

  // Handle Asking Career Mentor (Real Gemini Chat with Context)
  const handleAskMentor = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isAskingMentor) return;

    setMentorInput('');
    setIsAskingMentor(true);
    setError(null);

    const userMsg = { id: `user-${Date.now()}`, role: 'user' as const, content: q };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const history = chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const response: CareerMentorResponse = await api.career.sendMentorChat(q, history, 'general');

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant' as const,
        content: response.reply,
        key_takeaways: response.key_takeaways,
        suggested_followups: response.suggested_followups,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err?.message || 'Could not connect to AI Mentor. Please try again.');
    } finally {
      setIsAskingMentor(false);
    }
  };

  // Handle Generate Slides with Gemini AI
  const handleGenerateSlides = async (customTopic?: string) => {
    const topicToUse = (customTopic || slideTopic).trim();
    if (!topicToUse) {
      toast('Please enter a presentation topic!', 'error');
      return;
    }
    if (customTopic) {
      setSlideTopic(customTopic);
    }
    setIsGeneratingSlides(true);
    try {
      const res = await api.slides.generate({
        topic: topicToUse,
        slide_count: slideCount,
        style: slideStyle,
      });
      setGeneratedDeck(res);
      setActiveSlideIndex(0);
      toast(`Successfully generated ${res.slides.length} slides for "${res.topic}"!`, 'success');
    } catch (err: any) {
      console.error('Slide generation error:', err);
      toast(err?.message || 'Slide generation encountered an issue. Please try again.', 'error');
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  // Handle Copy Deck as Markdown
  const handleCopyDeckMarkdown = () => {
    if (!generatedDeck) return;
    const md = [
      `# ${generatedDeck.topic}`,
      `*Style: ${generatedDeck.style} • Total Slides: ${generatedDeck.total_slides}*`,
      `> ${generatedDeck.deck_summary}\n`,
      ...generatedDeck.slides.map((s) => [
        `---`,
        `## Slide ${s.slide_number}: ${s.title}`,
        `### ${s.subtitle} [${s.badge}]`,
        '',
        ...s.bullets.map((b) => `- ${b}`),
        '',
        `> **Key Takeaway:** ${s.key_takeaway}`,
        `> **Speaker Notes:** ${s.speaker_notes}`,
        '',
      ].join('\n')),
    ].join('\n');

    navigator.clipboard.writeText(md);
    toast('Presentation copied as Markdown to clipboard! 📋', 'success');
  };

  // Handle Download Deck as JSON
  const handleDownloadDeckJson = () => {
    if (!generatedDeck) return;
    const blob = new Blob([JSON.stringify(generatedDeck, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedDeck.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-slides.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Downloaded presentation JSON file! 💾', 'success');
  };

  // Handle File Upload Simulation/Extraction
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setSlideTopic(cleanName);
      toast(`Loaded "${file.name}". Topic set to "${cleanName}". Click Generate to create slides!`, 'info');
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.profile.update({
        full_name: editName,
        target_role: editRole,
        degree: editDegree,
        year_branch: editBranch,
        college: editCollege,
      });
      await refreshProfile();
      setIsEditProfileOpen(false);
      toast('Profile updated successfully!', 'success');
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Assessment Quiz Questions
  const assessmentQuestions = [
    {
      q: 'What is the time complexity of searching in a Balanced Binary Search Tree (AVL / Red-Black)?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correct: 'O(log n)',
      explanation: 'In a balanced BST, the tree height is guaranteed to be O(log n), making search logarithmic.',
    },
    {
      q: 'Which OOP principle allows a subclass to provide a specific implementation of a method defined in its superclass?',
      options: ['Encapsulation', 'Polymorphism', 'Abstraction', 'Inheritance'],
      correct: 'Polymorphism',
      explanation: 'Runtime method overriding represents dynamic polymorphism in object-oriented programming.',
    },
    {
      q: 'In relational databases (SQL), which normal form eliminates transitive dependencies?',
      options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'BCNF'],
      correct: 'Third Normal Form (3NF)',
      explanation: '3NF requires 2NF compliance and ensures all non-key attributes are directly dependent only on the primary key.',
    },
    {
      q: 'When articulating technical projects in an interview, what is the best structured storytelling framework?',
      options: ['FIFO Approach', 'STAR Method (Situation, Task, Action, Result)', 'Waterfall Cycle', 'Bottom-Up Induction'],
      correct: 'STAR Method (Situation, Task, Action, Result)',
      explanation: 'The STAR method structures behavioral and project answers into concise, measurable milestones.',
    },
    {
      q: 'What is the primary difference between a process and a thread in modern operating systems?',
      options: [
        'Processes share memory by default; threads do not.',
        'Threads share the parent process address space; processes have isolated memory spaces.',
        'Threads cannot execute concurrently.',
        'Processes are always executed in user mode only.',
      ],
      correct: 'Threads share the parent process address space; processes have isolated memory spaces.',
      explanation: 'Threads within the same process share code, data, and heap segments, whereas processes have independent address spaces.',
    },
  ];

  // Submit Skill Assessment Quiz
  const handleSubmitAssessment = async () => {
    setIsSubmittingAssessment(true);
    let correctCount = 0;
    assessmentQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) correctCount++;
    });
    const computedScore = Math.round((correctCount / assessmentQuestions.length) * 100);

    const result = {
      score: computedScore,
      correctCount,
      total: assessmentQuestions.length,
      category: selectedCategory,
      level: computedScore >= 80 ? 'Advanced' : computedScore >= 60 ? 'Intermediate' : 'Beginner',
      recommendations: [
        'Review Binary Search Tree balancing operations and tree traversals.',
        'Practice STAR framework articulation in your technical speaking sessions.',
        'Complete Milestone 4: DSA Fundamentals on your career roadmap.',
      ],
    };

    try {
      await api.assessment.submit(Object.values(selectedAnswers));
      setAssessmentResult(result);
      setAssessmentStep('result');
      toast(`Assessment completed! Score: ${computedScore}%`, 'success');
    } catch {
      setAssessmentResult(result);
      setAssessmentStep('result');
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const studentName =
    profile?.full_name ||
    user?.full_name ||
    (user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Student');
  const firstName = studentName.split(' ')[0] || 'Student';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {error && <ErrorBanner error={error} />}

      {/* ========================================================================= */}
      {/* SCREEN 2: MAIN DASHBOARD (Campus Hub)                                      */}
      {/* ========================================================================= */}
      {activeView === 'hub' && (
        <div className="space-y-6">
          
          {/* Welcome Banner matching Screen 2 in Reference */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-white via-white to-[#EDE7FF]/50 border-2 border-[#EDE7FF] shadow-card flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 text-center sm:text-left z-10">
              <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#302B42] tracking-tight">
                Welcome back, {firstName}!
              </h1>
              <p className="text-sm text-[#77718B] font-medium">
                Ready to improve your skills today?
              </p>
              
              <div className="pt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <span className="px-3 py-1 rounded-full bg-[#EDE7FF] text-[#7652C8] text-xs font-bold border border-[#D4C7F5] flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {profile?.degree || 'B.Tech'} {profile?.year_branch ? `• ${profile.year_branch}` : '• Computer Science'}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Target: {profile?.target_role || user?.target_role || 'Software Engineer'}
                </span>
              </div>
            </div>

            {/* Right: Student Mastery Radial Card + Keep Going Badge */}
            <div className="relative flex items-center justify-center shrink-0 z-10">
              <div className="relative p-4 rounded-3xl bg-white/90 backdrop-blur-md border-2 border-[#EDE7FF] shadow-lg flex flex-col items-center gap-2 group hover:shadow-xl transition-all">
                {/* 78% Placement Readiness Radial Progress Meter */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#EDE7FF" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#7652C8"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset="55.2"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-heading font-black text-xl text-[#302B42]">78%</span>
                    <span className="text-[9px] font-bold text-[#7652C8] uppercase tracking-wider">Mastery</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="font-heading font-black text-xs text-[#302B42] block">Level 4 Scholar</span>
                  <span className="text-[10px] text-[#77718B]">Next: Placement Master</span>
                </div>

                {/* Keep Going Flame Badge */}
                <div className="absolute -top-3 -right-3 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1 shadow-md border border-amber-200 flex items-center gap-1.5 animate-bounce">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-black text-[#302B42]">Keep Going!</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards in a Row (Matching Screen 2 in Reference) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Learning Streak */}
            <div className="p-5 rounded-3xl bg-white border border-[#EDE7FF] shadow-card flex flex-col justify-between hover:-translate-y-1 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#77718B] block">Learning Streak</span>
                  <span className="font-heading font-black text-xl text-[#302B42]">12 Days</span>
                </div>
              </div>
              {/* Weekday streak dots */}
              <div className="mt-3 pt-2.5 border-t border-[#EDE7FF] flex items-center justify-between">
                {[
                  { day: 'M', active: true },
                  { day: 'T', active: true },
                  { day: 'W', active: true },
                  { day: 'T', active: true },
                  { day: 'F', active: true },
                  { day: 'S', active: true, today: true },
                  { day: 'S', active: false },
                ].map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-[#77718B]">{d.day}</span>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all',
                        d.active
                          ? d.today
                            ? 'bg-amber-500 text-white ring-2 ring-amber-200 shadow-xs animate-pulse'
                            : 'bg-emerald-500 text-white shadow-2xs'
                          : 'bg-[#EDE7FF] text-[#77718B]'
                      )}
                    >
                      {d.active ? '✓' : '·'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Speaking Score */}
            <div className="p-5 rounded-3xl bg-white border border-[#EDE7FF] shadow-card flex flex-col justify-between hover:-translate-y-1 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200 group-hover:scale-105 transition-transform">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#77718B] block">Speaking Score</span>
                  <span className="font-heading font-black text-xl text-sky-600">92%</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#EDE7FF] flex items-center justify-between text-[11px] text-[#77718B] font-bold">
                <span>Fluency & Tone</span>
                <span className="text-emerald-600 font-black">+4% this week</span>
              </div>
            </div>

            {/* 3. Completed Tasks */}
            <div className="p-5 rounded-3xl bg-white border border-[#EDE7FF] shadow-card flex flex-col justify-between hover:-translate-y-1 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#77718B] block">Completed Tasks</span>
                  <span className="font-heading font-black text-xl text-[#302B42]">24 / 28</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#EDE7FF] flex items-center justify-between text-[11px] text-[#77718B] font-bold">
                <span>Module Progress</span>
                <span className="text-[#7652C8] font-black">86% complete</span>
              </div>
            </div>

            {/* 4. XP Points */}
            <div className="p-5 rounded-3xl bg-white border border-[#EDE7FF] shadow-card flex flex-col justify-between hover:-translate-y-1 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7652C8] flex items-center justify-center shrink-0 border border-[#D4C7F5] group-hover:scale-105 transition-transform">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#77718B] block">XP Points</span>
                  <span className="font-heading font-black text-xl text-[#7652C8]">2,540</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#EDE7FF] flex items-center justify-between text-[11px] text-[#77718B] font-bold">
                <span>Leaderboard Rank</span>
                <span className="text-amber-600 font-black">🏆 Top 5%</span>
              </div>
            </div>
          </div>

          {/* Middle Row: Your Learning Tools (4 cards) + Your Progress (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left 8 Cols: "Your Learning Tools" */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-black text-lg text-[#302B42]">Your Learning Tools</h2>
                <span className="text-xs text-[#77718B] font-semibold">4 Placement Modules</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Tool 1: AI Slide Maker (Screen 3) */}
                <button
                  type="button"
                  onClick={() => setActiveView('slides')}
                  className="p-5 rounded-3xl bg-white border-2 border-[#EDE7FF] hover:border-[#7652C8] shadow-card hover:shadow-xl transition-all text-left flex items-start justify-between gap-4 group cursor-pointer"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7652C8] flex items-center justify-center shrink-0 border border-[#D4C7F5] group-hover:scale-110 transition-transform">
                      <Presentation className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-black text-base text-[#302B42] group-hover:text-[#7652C8] transition-colors">
                        AI Slide Maker
                      </h3>
                      <p className="text-xs text-[#77718B] mt-0.5">
                        Create stunning academic presentations in seconds
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 self-center text-[#77718B] group-hover:text-[#7652C8] group-hover:translate-x-1.5 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>

                {/* Tool 2: Speaking Practice (Screen 6) */}
                <button
                  type="button"
                  onClick={() => navigate('/speaking')}
                  className="p-5 rounded-3xl bg-white border-2 border-[#EDE7FF] hover:border-sky-400 shadow-card hover:shadow-xl transition-all text-left flex items-start justify-between gap-4 group cursor-pointer"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200 group-hover:scale-110 transition-transform">
                      <Mic className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-black text-base text-[#302B42] group-hover:text-sky-600 transition-colors">
                        Speaking Practice
                      </h3>
                      <p className="text-xs text-[#77718B] mt-0.5">
                        Improve your English fluency with 3 AI coaches
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 self-center text-[#77718B] group-hover:text-sky-600 group-hover:translate-x-1.5 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>

                {/* Tool 3: AI Interview (Screen 7) */}
                <button
                  type="button"
                  onClick={() => setActiveView('interview')}
                  className="p-5 rounded-3xl bg-white border-2 border-[#EDE7FF] hover:border-amber-400 shadow-card hover:shadow-xl transition-all text-left flex items-start justify-between gap-4 group cursor-pointer"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 group-hover:scale-110 transition-transform">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-black text-base text-[#302B42] group-hover:text-amber-600 transition-colors">
                        AI Interview
                      </h3>
                      <p className="text-xs text-[#77718B] mt-0.5">
                        Prepare for technical & HR campus placement rounds
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 self-center text-[#77718B] group-hover:text-amber-600 group-hover:translate-x-1.5 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>

                {/* Tool 4: Career Roadmap (Screen 4) */}
                <button
                  type="button"
                  onClick={() => setActiveView('roadmap')}
                  className="p-5 rounded-3xl bg-white border-2 border-[#EDE7FF] hover:border-emerald-400 shadow-card hover:shadow-xl transition-all text-left flex items-start justify-between gap-4 group cursor-pointer"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:scale-110 transition-transform">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-black text-base text-[#302B42] group-hover:text-emerald-600 transition-colors">
                        Career Roadmap
                      </h3>
                      <p className="text-xs text-[#77718B] mt-0.5">
                        Plan and track your step-by-step Java developer path
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 self-center text-[#77718B] group-hover:text-emerald-600 group-hover:translate-x-1.5 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </div>

            {/* Right 4 Cols: "Your Progress" Ring (Screen 2 Right) */}
            <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-[#EDE7FF] shadow-card flex flex-col justify-between items-center text-center space-y-4">
              <span className="font-heading font-black text-base text-[#302B42]">Your Progress</span>

              {/* 78% Circular Progress Ring */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#EDE7FF" strokeWidth="9" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#7652C8"
                    strokeWidth="9"
                    strokeDasharray="251.2"
                    strokeDashoffset="55.2"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-heading font-black text-2xl text-[#302B42]">78%</span>
                  <span className="text-[10px] font-bold text-emerald-600">On Track!</span>
                </div>
              </div>

              <div className="w-full pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveView('progress')}
                  className="w-full rounded-2xl text-xs font-bold"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                  View Full Analytics
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recent Activities & Practice History Feed */}
          <div className="rounded-3xl p-6 bg-white border border-[#EDE7FF] shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-[#302B42]">
                  Recent Learning Activities
                </h3>
                <p className="text-xs text-[#77718B]">Your recent speaking sessions and coding milestones</p>
              </div>
              <span className="text-xs font-bold text-[#7652C8] bg-[#EDE7FF] px-3 py-1 rounded-full">
                3 New Updates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Activity 1 */}
              <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] hover:border-[#7652C8] transition-all flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7652C8] flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#77718B] uppercase block">Speaking Companion</span>
                  <h4 className="font-heading font-bold text-xs text-[#302B42] truncate">Practice with Maya (92%)</h4>
                  <p className="text-[11px] text-emerald-700 font-semibold">Fluency Score: 92% • Great pacing</p>
                </div>
              </div>

              {/* Activity 2 */}
              <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] hover:border-[#7652C8] transition-all flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#77718B] uppercase block">Milestone 4: DSA</span>
                  <h4 className="font-heading font-bold text-xs text-[#302B42] truncate">Binary Search Tree Drill</h4>
                  <p className="text-[11px] text-[#77718B]">Solved time complexity questions</p>
                </div>
              </div>

              {/* Activity 3 */}
              <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] hover:border-[#7652C8] transition-all flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Presentation className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#77718B] uppercase block">AI Slide Maker</span>
                  <h4 className="font-heading font-bold text-xs text-[#302B42] truncate">AI in Education (10 Slides)</h4>
                  <p className="text-[11px] text-[#77718B]">Exported presentation deck</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: AI SLIDE MAKER & PRESENTATION ENGINE                             */}
      {/* ========================================================================= */}
      {activeView === 'slides' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveView('hub')}
              className="flex items-center gap-2 text-xs font-bold text-[#77718B] hover:text-[#302B42] cursor-pointer group transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Campus Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 2.5 AI Powered
              </span>
              <Badge variant="lavender">AI Presentation Generator</Badge>
            </div>
          </div>

          {/* Main Card: Topic Configuration & Generator Form */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white border-2 border-[#EDE7FF] shadow-card space-y-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7652C8] flex items-center justify-center">
                  <Presentation className="w-5 h-5" />
                </div>
                <h2 className="font-heading font-black text-2xl text-[#302B42]">AI Slide Maker</h2>
              </div>
              <p className="text-xs text-[#77718B] mt-1.5">
                Generate professional, academic-grade presentation decks with structured bullet points, speaker notes, and key takeaways in seconds.
              </p>
            </div>

            {/* Input Method Selector Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-[#F8F6FF] rounded-2xl border border-[#EDE7FF] max-w-md">
              <button
                type="button"
                onClick={() => setSlideInputTab('topic')}
                className={cn(
                  'flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  slideInputTab === 'topic'
                    ? 'bg-white text-[#7652C8] shadow-xs'
                    : 'text-[#77718B] hover:text-[#302B42]'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enter Topic</span>
              </button>
              <button
                type="button"
                onClick={() => setSlideInputTab('pdf')}
                className={cn(
                  'flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  slideInputTab === 'pdf'
                    ? 'bg-white text-[#7652C8] shadow-xs'
                    : 'text-[#77718B] hover:text-[#302B42]'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Upload PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSlideInputTab('ppt')}
                className={cn(
                  'flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  slideInputTab === 'ppt'
                    ? 'bg-white text-[#7652C8] shadow-xs'
                    : 'text-[#77718B] hover:text-[#302B42]'
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PPTX</span>
              </button>
            </div>

            {/* File Upload Zone (Shown when PDF or PPT tab selected) */}
            {slideInputTab !== 'topic' && (
              <label className="border-2 border-dashed border-[#D4C7F5] hover:border-[#7652C8] rounded-3xl p-6 sm:p-8 bg-[#F8F6FF]/60 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:bg-[#EDE7FF]/30 transition-all block relative">
                <input
                  type="file"
                  accept={slideInputTab === 'pdf' ? '.pdf' : '.pptx,.ppt'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#7652C8] border border-[#EDE7FF] mx-auto">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#302B42]">
                    {uploadedFileName ? `Selected: ${uploadedFileName}` : `Click to choose ${slideInputTab.toUpperCase()} or drag and drop`}
                  </p>
                  <p className="text-xs text-[#77718B] mt-0.5">
                    {uploadedFileName
                      ? 'Topic extracted from file! You can edit the topic name below or click Generate.'
                      : `Supports ${slideInputTab === 'pdf' ? 'PDF course notes & research papers' : 'PowerPoint presentation decks'} (Max 25 MB)`}
                  </p>
                </div>
              </label>
            )}

            {/* Topic Input Field & Suggested Academic Pills */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#302B42]">
                Presentation Topic or Syllabus Unit
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={slideTopic}
                  onChange={(e) => setSlideTopic(e.target.value)}
                  placeholder="e.g. Operating Systems Concurrency, Machine Learning Transformers, DSA Heaps"
                  className="w-full px-4 py-3 rounded-2xl border border-[#EDE7FF] text-xs font-medium bg-[#F8F6FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7652C8]/30 transition-all pr-10"
                />
                {slideTopic && (
                  <button
                    type="button"
                    onClick={() => setSlideTopic('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#77718B] hover:text-[#302B42]"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Clickable Preset Topics */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-[#77718B] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#7652C8]" />
                  Popular College Topics:
                </span>
                {[
                  'Operating Systems Deadlocks & Banker Algorithm',
                  'DSA Binary Search Trees & AVL Balancing',
                  'Cloud Microservices Architecture & Docker',
                  'Generative AI in Education',
                  'Spring Boot REST APIs with PostgreSQL',
                  'Zero Trust Cybersecurity Architecture',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setSlideTopic(suggestion)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-[#EDE7FF]/60 hover:bg-[#7652C8] text-[#5B3E96] hover:text-white border border-[#D4C7F5] transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Deck Configuration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#302B42] mb-1.5">Number of Slides</label>
                <select
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE7FF] text-xs font-bold bg-[#F8F6FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7652C8]/30 transition-all"
                >
                  <option value={3}>3 Slides (Quick Summary & Overview)</option>
                  <option value={5}>5 Slides (Standard Class Presentation)</option>
                  <option value={8}>8 Slides (In-Depth Technical Deck)</option>
                  <option value={10}>10 Slides (Complete Lecture Seminar)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#302B42] mb-1.5">Presentation Design Theme</label>
                <select
                  value={slideStyle}
                  onChange={(e) => setSlideStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EDE7FF] text-xs font-bold bg-[#F8F6FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7652C8]/30 transition-all"
                >
                  <option value="Modern Purple">Modern Purple (Signature Campus)</option>
                  <option value="Pastel Minimal">Pastel Minimal (Clean & Soft)</option>
                  <option value="Executive Dark">Executive Dark (Sleek Tech & Slate)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons: Generate & Quick Actions */}
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleGenerateSlides()}
                className="rounded-2xl shadow-md hover:shadow-lg transition-all"
                isLoading={isGeneratingSlides}
                disabled={isGeneratingSlides || !slideTopic.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span>{isGeneratingSlides ? 'Generating Slides with Gemini AI...' : 'Generate Slides ✨'}</span>
              </Button>

              {generatedDeck && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsFullscreenPresenter(true)}
                    className="px-4 py-2.5 rounded-2xl bg-[#7652C8] hover:bg-[#5B3E96] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Present Fullscreen</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyDeckMarkdown}
                    className="px-4 py-2.5 rounded-2xl bg-[#EDE7FF] hover:bg-[#D4C7F5] text-[#5B3E96] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Markdown</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDeckJson}
                    className="px-4 py-2.5 rounded-2xl bg-white border border-[#EDE7FF] hover:bg-[#F8F6FF] text-[#302B42] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Generated Deck Viewer & Presenter Card */}
          {generatedDeck && (
            <div className="space-y-6">
              {/* Deck Summary Header Bar */}
              <div className="rounded-3xl p-5 bg-[#F8F6FF] border border-[#EDE7FF] flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-black text-lg text-[#302B42]">
                      {generatedDeck.topic}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7652C8]">
                      {generatedDeck.slides.length} Slides
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-[#7652C8]">
                      {generatedDeck.style}
                    </span>
                  </div>
                  <p className="text-xs text-[#77718B] max-w-3xl leading-relaxed">
                    {generatedDeck.deck_summary}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#EDE7FF] bg-white text-[#77718B] hover:text-[#302B42] transition-colors cursor-pointer"
                  >
                    {showSpeakerNotes ? 'Hide Speaker Notes' : 'Show Speaker Notes'}
                  </button>
                </div>
              </div>

              {/* ACTIVE SLIDE SHOWCASE (Hero Card) */}
              {generatedDeck.slides[activeSlideIndex] && (
                (() => {
                  const currentSlide = generatedDeck.slides[activeSlideIndex];
                  const isExecutive = generatedDeck.style === 'Executive Dark';
                  const isPastel = generatedDeck.style === 'Pastel Minimal';

                  return (
                    <div
                      className={cn(
                        'rounded-3xl p-6 sm:p-10 border-2 shadow-xl transition-all duration-300 relative overflow-hidden',
                        isExecutive
                          ? 'bg-[#1e1b2e] border-[#362f52] text-white'
                          : isPastel
                          ? 'bg-[#FFF9F5] border-[#FDE5D8] text-[#302B42]'
                          : 'bg-white border-[#EDE7FF] text-[#302B42]'
                      )}
                    >
                      {/* Top Slide Accent Line */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#7652C8] via-[#A78BFA] to-[#F6B8D0]" />

                      {/* Slide Header: Badge & Counter */}
                      <div className="flex items-center justify-between gap-3 pb-6 border-b border-[#EDE7FF]/30">
                        <span
                          className={cn(
                            'text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full',
                            isExecutive
                              ? 'bg-purple-900/60 text-[#D4C7F5] border border-purple-700/50'
                              : 'bg-[#EDE7FF] text-[#7652C8] border border-[#D4C7F5]'
                          )}
                        >
                          {currentSlide.badge || `Slide ${currentSlide.slide_number}`}
                        </span>

                        <span
                          className={cn(
                            'font-mono text-xs font-bold px-3 py-1 rounded-xl',
                            isExecutive ? 'bg-[#29243A] text-[#A78BFA]' : 'bg-[#F8F6FF] text-[#77718B]'
                          )}
                        >
                          Slide {activeSlideIndex + 1} of {generatedDeck.slides.length}
                        </span>
                      </div>

                      {/* Slide Title & Subtitle */}
                      <div className="py-6 space-y-2">
                        <h3
                          className={cn(
                            'font-heading font-black text-2xl sm:text-3xl leading-snug',
                            isExecutive ? 'text-white' : 'text-[#302B42]'
                          )}
                        >
                          {currentSlide.title}
                        </h3>
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            isExecutive ? 'text-[#D4C7F5]' : 'text-[#7652C8]'
                          )}
                        >
                          {currentSlide.subtitle}
                        </p>
                      </div>

                      {/* Slide Bullet Points */}
                      <div className="space-y-3.5 pb-6">
                        {currentSlide.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-3">
                            <div
                              className={cn(
                                'w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
                                isExecutive
                                  ? 'bg-[#7652C8] text-white'
                                  : 'bg-[#EDE7FF] text-[#7652C8]'
                              )}
                            >
                              ✓
                            </div>
                            <p
                              className={cn(
                                'text-xs sm:text-sm leading-relaxed font-medium',
                                isExecutive ? 'text-slate-200' : 'text-[#4A455B]'
                              )}
                            >
                              {bullet}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Key Takeaway Callout */}
                      {currentSlide.key_takeaway && (
                        <div
                          className={cn(
                            'p-4 rounded-2xl flex items-start gap-3 my-4',
                            isExecutive
                              ? 'bg-[#29243A] border border-[#443B61]'
                              : 'bg-emerald-50/80 border border-emerald-200'
                          )}
                        >
                          <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-700 block">
                              Key Takeaway
                            </span>
                            <p
                              className={cn(
                                'text-xs font-bold mt-0.5',
                                isExecutive ? 'text-emerald-300' : 'text-emerald-900'
                              )}
                            >
                              {currentSlide.key_takeaway}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Speaker Notes Box (Collapsible) */}
                      {showSpeakerNotes && currentSlide.speaker_notes && (
                        <div
                          className={cn(
                            'p-4 rounded-2xl border transition-all mt-4',
                            isExecutive
                              ? 'bg-[#191624] border-[#362f52] text-slate-300'
                              : 'bg-[#F8F6FF] border-[#EDE7FF] text-[#4A455B]'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Mic className="w-3.5 h-3.5 text-[#7652C8]" />
                            <span className="text-[10px] font-black uppercase text-[#7652C8] tracking-wider">
                              Speaker Notes (Talking Points for Presentation)
                            </span>
                          </div>
                          <p className="text-xs italic leading-relaxed">
                            "{currentSlide.speaker_notes}"
                          </p>
                        </div>
                      )}

                      {/* Slide Stepper Navigation Controls */}
                      <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#EDE7FF]/30">
                        <button
                          type="button"
                          onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                          disabled={activeSlideIndex === 0}
                          className="px-4 py-2 rounded-xl border border-[#EDE7FF] bg-white text-[#302B42] text-xs font-bold hover:bg-[#F8F6FF] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {generatedDeck.slides.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              type="button"
                              onClick={() => setActiveSlideIndex(dotIdx)}
                              className={cn(
                                'w-2.5 h-2.5 rounded-full transition-all cursor-pointer',
                                dotIdx === activeSlideIndex
                                  ? 'w-7 bg-[#7652C8]'
                                  : 'bg-[#EDE7FF] hover:bg-[#D4C7F5]'
                              )}
                              title={`Go to slide ${dotIdx + 1}`}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setActiveSlideIndex(
                              Math.min(generatedDeck.slides.length - 1, activeSlideIndex + 1)
                            )
                          }
                          disabled={activeSlideIndex === generatedDeck.slides.length - 1}
                          className="px-4 py-2 rounded-xl bg-[#7652C8] hover:bg-[#5B3E96] text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Thumbnails Grid of all Generated Slides */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-[#77718B] uppercase tracking-wider block">
                  All Presentation Slides ({generatedDeck.slides.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {generatedDeck.slides.map((slide, i) => {
                    const isActive = i === activeSlideIndex;
                    return (
                      <div
                        key={i}
                        onClick={() => setActiveSlideIndex(i)}
                        className={cn(
                          'p-4 rounded-2xl border-2 transition-all cursor-pointer text-left space-y-2 group hover:scale-[1.02]',
                          isActive
                            ? 'bg-[#F8F6FF] border-[#7652C8] shadow-md ring-2 ring-[#7652C8]/20'
                            : 'bg-white border-[#EDE7FF] hover:border-[#D4C7F5] shadow-xs'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-[10px] font-black uppercase px-2 py-0.5 rounded-md',
                              isActive ? 'bg-[#7652C8] text-white' : 'bg-[#EDE7FF] text-[#7652C8]'
                            )}
                          >
                            Slide {slide.slide_number}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </div>

                        <h4 className="font-heading font-black text-xs text-[#302B42] line-clamp-1 group-hover:text-[#7652C8] transition-colors">
                          {slide.title}
                        </h4>

                        <p className="text-[11px] text-[#77718B] line-clamp-2 leading-relaxed">
                          {slide.subtitle}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Fullscreen Presenter Mode Modal Overlay */}
          {isFullscreenPresenter && generatedDeck && (
            <div className="fixed inset-0 z-50 bg-[#151221]/95 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-fadeIn">
              {/* Top Presenter Bar */}
              <div className="flex items-center justify-between text-white pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#7652C8] text-white">
                    Presenter View
                  </span>
                  <span className="text-sm font-bold text-white/90 truncate max-w-md">
                    {generatedDeck.topic}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/70 font-mono">
                    Slide {activeSlideIndex + 1} of {generatedDeck.slides.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFullscreenPresenter(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Exit Presenter Mode"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Center Slide Stage */}
              <div className="flex-1 flex items-center justify-center py-6 max-w-4xl mx-auto w-full">
                {(() => {
                  const curr = generatedDeck.slides[activeSlideIndex];
                  if (!curr) return null;
                  return (
                    <div className="w-full bg-[#201B33] border-2 border-white/15 rounded-3xl p-8 sm:p-12 shadow-2xl text-white space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-[#7652C8] text-white">
                          {curr.badge || `Slide ${curr.slide_number}`}
                        </span>
                        <span className="font-mono text-xs text-white/50">
                          {curr.slide_number} / {generatedDeck.slides.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h2 className="font-heading font-black text-3xl sm:text-4xl text-white">
                          {curr.title}
                        </h2>
                        <p className="text-base font-semibold text-[#A78BFA]">
                          {curr.subtitle}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        {curr.bullets.map((b, bi) => (
                          <div key={bi} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-lg bg-[#7652C8] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                              ✓
                            </span>
                            <span className="text-sm sm:text-base text-white/90 leading-relaxed">
                              {b}
                            </span>
                          </div>
                        ))}
                      </div>

                      {curr.key_takeaway && (
                        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Key Takeaway: {curr.key_takeaway}</span>
                        </div>
                      )}

                      {curr.speaker_notes && (
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-xs italic">
                          <span className="font-bold text-[#A78BFA] not-italic block mb-1">
                            Speaker Notes:
                          </span>
                          "{curr.speaker_notes}"
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Bottom Navigation Toolbar */}
              <div className="flex items-center justify-between max-w-4xl mx-auto w-full pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                  disabled={activeSlideIndex === 0}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  {generatedDeck.slides.map((_, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setActiveSlideIndex(pIdx)}
                      className={cn(
                        'w-3 h-3 rounded-full transition-all cursor-pointer',
                        pIdx === activeSlideIndex ? 'w-8 bg-[#7652C8]' : 'bg-white/20 hover:bg-white/40'
                      )}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSlideIndex(Math.min(generatedDeck.slides.length - 1, activeSlideIndex + 1))
                  }
                  disabled={activeSlideIndex === generatedDeck.slides.length - 1}
                  className="px-5 py-2.5 rounded-xl bg-[#7652C8] hover:bg-[#5B3E96] text-white font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: CAREER PATH ROADMAP                                             */}
      {/* ========================================================================= */}
      {activeView === 'roadmap' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-2xl text-[#302B42]">
                Your Personalized Career Roadmap
              </h2>
              <p className="text-xs text-[#77718B] mt-0.5">
                Step by step guide to become a Java Developer
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('mentor')}
              className="px-4 py-2 rounded-2xl bg-[#EDE7FF] text-[#7652C8] font-bold text-xs border border-[#D4C7F5] flex items-center gap-1.5 hover:bg-[#7652C8] hover:text-white transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask AI Mentor</span>
            </button>
          </div>

          {/* Connected Milestones Timeline (Matching Screen 4 in Reference) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#EDE7FF] shadow-card space-y-8">
            
            {/* Connected Node Path (7 Interactive Milestones) */}
            <div className="flex items-center justify-between relative overflow-x-auto py-4 px-2 min-w-[600px]">
              {/* Horizontal Connecting Progress Line */}
              <div className="absolute top-1/2 left-8 right-8 h-2 bg-[#EDE7FF] -translate-y-1/2 z-0 rounded-full" />
              <div className="absolute top-1/2 left-8 w-[45%] h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-[#7652C8] -translate-y-1/2 z-0 rounded-full" />
              
              {ROADMAP_MILESTONES.map((m) => {
                const isCompleted = m.status === 'completed';
                const isActive = m.status === 'active';
                const isSelected = selectedMilestone === m.id;

                return (
                  <div key={m.id} className="relative z-10 flex flex-col items-center gap-2 px-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMilestone(m.id)}
                      className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center font-black text-xs transition-all cursor-pointer shadow-md',
                        isCompleted
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : isActive
                          ? 'bg-[#7652C8] text-white ring-4 ring-[#EDE7FF] shadow-lg shadow-[#7652C8]/30'
                          : isSelected
                          ? 'bg-white border-2 border-[#7652C8] text-[#7652C8] ring-2 ring-[#EDE7FF]'
                          : 'bg-white border-2 border-[#EDE7FF] text-[#77718B] hover:border-[#7652C8]'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <span>{m.id}</span>
                      )}
                    </motion.button>
                    <span
                      className={cn(
                        'text-xs font-bold text-center whitespace-nowrap',
                        isActive || isSelected ? 'text-[#7652C8] font-black' : 'text-[#77718B]'
                      )}
                    >
                      {m.shortName}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Active / Selected Milestone Detailed Card */}
            {(() => {
              const currentMilestone = ROADMAP_MILESTONES.find((m) => m.id === selectedMilestone) || ROADMAP_MILESTONES[3];
              const isCompleted = currentMilestone.status === 'completed';
              const isActive = currentMilestone.status === 'active';

              return (
                <div className="space-y-5">
                  <div className="p-6 rounded-3xl bg-[#F8F6FF] border border-[#EDE7FF] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-[#7652C8] shadow-sm border border-[#EDE7FF] shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        ) : isActive ? (
                          <Zap className="w-8 h-8 text-[#7652C8] fill-[#7652C8]/20" />
                        ) : (
                          <Lock className="w-8 h-8 text-[#77718B]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              'text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider',
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isActive
                                ? 'bg-[#EDE7FF] text-[#7652C8]'
                                : 'bg-slate-100 text-slate-700'
                            )}
                          >
                            Milestone {currentMilestone.id} • {currentMilestone.status}
                          </span>
                        </div>
                        <h3 className="font-heading font-black text-xl text-[#302B42]">
                          {currentMilestone.name}
                        </h3>
                        <p className="text-xs text-[#77718B] mt-0.5 leading-relaxed">
                          {currentMilestone.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-bold text-[#77718B] uppercase block">Completion</span>
                        <span className="font-heading font-black text-xl text-[#7652C8]">
                          {currentMilestone.progress}%
                        </span>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => {
                          if (currentMilestone.id === 6) {
                            setActiveView('interview');
                          } else {
                            setActiveView('mentor');
                            setMentorInput(`Can you explain the key concepts for ${currentMilestone.name}?`);
                          }
                        }}
                        className="rounded-2xl"
                      >
                        {isCompleted ? 'Review Concepts' : isActive ? 'Continue Learning →' : 'Preview Syllabus'}
                      </Button>
                    </div>
                  </div>

                  {/* Syllabus Checklist & Character Reaction Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* Key Topics Checklist (8 Cols) */}
                    <div className="md:col-span-8 p-5 rounded-2xl bg-white border border-[#EDE7FF] space-y-3">
                      <span className="text-xs font-black text-[#302B42] flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#7652C8]" />
                        <span>Core Topics & Concepts Checklist</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentMilestone.topics.map((topic, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] text-xs text-[#302B42]"
                          >
                            <CheckCircle2
                              className={cn(
                                'w-4 h-4 shrink-0',
                                isCompleted
                                  ? 'text-emerald-500 fill-emerald-100'
                                  : idx === 0 && isActive
                                  ? 'text-[#7652C8]'
                                  : 'text-slate-300'
                              )}
                            />
                            <span className="font-semibold">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Character Reaction Commentary Card (4 Cols) */}
                    <div className="md:col-span-4 p-5 rounded-2xl bg-gradient-to-br from-[#EDE7FF]/50 to-[#F8F6FF] border border-[#D4C7F5] flex flex-col justify-between space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7652C8] to-[#FF9A91] flex items-center justify-center text-white shrink-0 shadow-md">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-black text-[#7652C8] block">Mentor Study Guidance</span>
                          <p className="text-xs text-[#302B42] leading-relaxed italic">
                            "{currentMilestone.advice}"
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView('mentor')}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#7652C8] text-[#7652C8] hover:text-white border border-[#D4C7F5] font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ask AI Mentor About {currentMilestone.shortName}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 5: AI CAREER MENTOR                                                */}
      {/* ========================================================================= */}
      {activeView === 'mentor' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveView('hub')}
              className="flex items-center gap-2 text-xs font-bold text-[#77718B] hover:text-[#302B42] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <Badge variant="lavender">24/7 AI Placement Mentor</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 4 Cols: Interactive Neural AI Mentor Console */}
            <div className="lg:col-span-4 p-6 rounded-3xl bg-white border-2 border-[#EDE7FF] shadow-card flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-44 h-44 relative flex items-center justify-center">
                {/* Ambient Halo */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7652C8]/25 via-[#A78BFA]/20 to-transparent blur-2xl pointer-events-none" />

                {/* Concentric Rotating Dash Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
                  className="absolute w-40 h-40 rounded-full border border-dashed border-[#D4C7F5] pointer-events-none flex items-start justify-center"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7652C8]" />
                </motion.div>

                {/* Center Neural Orb */}
                <motion.div
                  animate={{ y: [0, -4, 0], scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-[#7652C8] via-[#A78BFA] to-[#FF9A91] flex flex-col items-center justify-center text-white shadow-xl"
                >
                  <Sparkles className="w-9 h-9 drop-shadow-md mb-1" />
                  <span className="text-[10px] font-black tracking-wider uppercase">AI Mentor</span>
                </motion.div>
              </div>

              <div>
                <h3 className="font-heading font-black text-lg text-[#302B42]">AI Career Mentor</h3>
                <p className="text-xs text-[#77718B] mt-0.5">
                  Specialized in Java, Python, DSA, System Design & HR behavioral rounds
                </p>
              </div>

              {/* Quick Prompt Pills (Matching Screen 5) */}
              <div className="w-full space-y-2 pt-2">
                <span className="text-[10px] font-bold text-[#77718B] uppercase tracking-wider block text-left">
                  Suggested Questions:
                </span>
                {['What is Java?', 'Explain OOP', 'Java vs Python', 'Career in Java'].map((pill, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskMentor(pill)}
                    className="w-full py-2 px-3 rounded-xl border border-[#D4C7F5] bg-[#F8F6FF] hover:bg-[#EDE7FF] text-xs font-bold text-[#7652C8] text-left transition-colors cursor-pointer"
                  >
                    💡 {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Right 8 Cols: Conversational Chat Interface */}
            <div className="lg:col-span-8 flex flex-col h-[580px] rounded-3xl bg-white border-2 border-[#EDE7FF] shadow-card overflow-hidden">
              <div className="p-4 border-b border-[#EDE7FF] flex items-center justify-between">
                <span className="font-black text-xs text-[#302B42]">Placement Conversation</span>
                <span className="text-[11px] text-[#77718B]">{chatMessages.length} Messages</span>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {chatMessages.map((msg) => {
                  const isAI = msg.role === 'assistant';
                  return (
                    <div key={msg.id} className={cn('flex flex-col', isAI ? 'items-start pr-8' : 'items-end pl-8')}>
                      <div
                        className={cn(
                          'p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs',
                          isAI ? 'bg-[#F8F6FF] border border-[#EDE7FF] text-[#302B42]' : 'bg-[#7652C8] text-white'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Follow-up recommendation pills */}
                      {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.suggested_followups.map((f, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleAskMentor(f)}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#EDE7FF] text-[#7652C8] hover:bg-[#7652C8] hover:text-white transition-colors cursor-pointer"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isAskingMentor && (
                  <div className="p-3 rounded-2xl bg-[#F8F6FF] text-xs text-[#77718B] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7652C8] animate-spin" />
                    <span>AI Career Mentor is preparing guidance...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-[#F8F6FF] border-t border-[#EDE7FF]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (mentorInput.trim()) handleAskMentor(mentorInput);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={mentorInput}
                    onChange={(e) => setMentorInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-[#EDE7FF] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
                    disabled={isAskingMentor}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!mentorInput.trim() || isAskingMentor}
                    className="rounded-2xl"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 7: TECHNICAL INTERVIEW PRACTICE                                    */}
      {/* ========================================================================= */}
      {activeView === 'interview' && (
        <div className="space-y-4 animate-fadeIn">
          <TwoWayMockInterview
            role={editRole || 'Software Engineer'}
            companyTarget="Campus Placement Drive"
            onExit={() => setActiveView('hub')}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 8: STUDENT PROFILE                                                 */}
      {/* ========================================================================= */}
      {activeView === 'profile' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveView('hub')}
              className="flex items-center gap-2 text-xs font-bold text-[#77718B] hover:text-[#302B42] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              className="rounded-2xl"
            >
              Edit Profile
            </Button>
          </div>

          <div className="rounded-3xl p-6 sm:p-8 bg-white border-2 border-[#EDE7FF] shadow-card space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Left: Avatar & Basic Academic Info */}
              <div className="md:col-span-5 flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#7652C8] via-[#A78BFA] to-[#FF9A91] flex items-center justify-center text-white text-2xl font-black ring-4 ring-[#EDE7FF] shadow-md">
                    {studentName.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xl text-[#302B42]">{studentName}</h3>
                  <p className="text-xs text-[#7652C8] font-bold">{profile?.degree || 'B.Tech'} {profile?.year_branch ? `• ${profile.year_branch}` : ''}</p>
                  <div className="text-[11px] text-[#77718B] mt-1 space-y-0.5">
                    <p>Email: <strong>{user?.email || profile?.email || ''}</strong></p>
                    <p>College: <strong>{profile?.college || 'Click Edit Profile to add'}</strong></p>
                    <p>Target Role: <strong>{profile?.target_role || user?.target_role || 'Software Engineer'}</strong></p>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Skills & Learning Progress with Trophy */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#302B42] flex items-center gap-2">
                      <span>My Skills</span>
                      <span className="text-[10px] font-bold text-[#7652C8] bg-[#EDE7FF] px-2 py-0.5 rounded-full">
                        {skillsList.length} Active
                      </span>
                    </span>
                    <span className="text-[10px] text-[#77718B]">Click × to remove</span>
                  </div>

                  {/* Active Skills List */}
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((sk) => (
                      <span
                        key={sk}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D4C7F5] text-[#7652C8] text-xs font-bold shadow-2xs group hover:bg-[#EDE7FF] transition-all"
                      >
                        <span>{sk}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(sk)}
                          title={`Remove ${sk}`}
                          className="w-3.5 h-3.5 rounded-full hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-[10px] text-[#77718B] transition-colors cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Skill Inline Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddSkill();
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      placeholder="Add a new skill (e.g. Docker, React, Spring)..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-[#EDE7FF] focus:outline-none focus:ring-2 focus:ring-[#7652C8]/30 font-medium"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      className="rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer"
                    >
                      + Add
                    </Button>
                  </form>

                  {/* Quick-add Suggestions */}
                  {['React', 'Spring Boot', 'SQL', 'Docker', 'System Design', 'Git'].filter(
                    (s) => !skillsList.some((ex) => ex.toLowerCase() === s.toLowerCase())
                  ).length > 0 && (
                    <div className="pt-2 border-t border-[#EDE7FF] flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-[#77718B]">Quick Add:</span>
                      {['React', 'Spring Boot', 'SQL', 'Docker', 'System Design', 'Git']
                        .filter((s) => !skillsList.some((ex) => ex.toLowerCase() === s.toLowerCase()))
                        .slice(0, 4)
                        .map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleAddSkill(s)}
                            className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#EDE7FF] border border-[#EDE7FF] hover:border-[#7652C8] text-[10px] font-bold text-[#7652C8] transition-all cursor-pointer"
                          >
                            + {s}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#302B42]">
                      <span>Learning Progress</span>
                      <span className="text-[#7652C8]">78%</span>
                    </div>
                    <div className="w-full bg-[#EDE7FF] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#7652C8] h-2 rounded-full w-[78%]" />
                    </div>
                  </div>
                  <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 9: PROGRESS REPORTS & GROWTH JOURNEY                               */}
      {/* ========================================================================= */}
      {activeView === 'progress' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveView('hub')}
              className="flex items-center gap-2 text-xs font-bold text-[#77718B] hover:text-[#302B42] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <Badge variant="mint">Verified Campus Analytics</Badge>
          </div>

          <div className="rounded-3xl p-6 sm:p-8 bg-white border-2 border-[#EDE7FF] shadow-card space-y-6">
            
            {/* Report Tabs (Matching Screen 9 in Reference) */}
            <div className="flex items-center gap-2 border-b border-[#EDE7FF] pb-3">
              {(['Overview', 'Speaking', 'Career Path', 'Assessment'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setProgressTab(tab)}
                  className={cn(
                    'px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer',
                    progressTab === tab
                      ? 'bg-[#7652C8] text-white shadow-xs'
                      : 'text-[#77718B] hover:text-[#302B42] hover:bg-[#F8F6FF]'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Middle: 85% Overall Progress Ring & Growth Line Chart */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* 85% Progress Circle */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF]">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#EDE7FF" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#7652C8"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset="37.6"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute font-heading font-black text-2xl text-[#302B42]">85%</span>
                </div>
                <span className="text-xs font-black text-[#302B42] mt-2">Overall Progress</span>
              </div>

              {/* Your Growth Journey SVG Line Chart */}
              <div className="md:col-span-8 p-6 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] space-y-3">
                <span className="font-heading font-black text-xs text-[#302B42] block">
                  Your Growth Journey (Jan – Jun)
                </span>
                
                {/* Clean SVG Smooth Line Chart matching Screen 9 */}
                <div className="h-28 w-full">
                  <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#7652C8"
                      strokeWidth="3.5"
                      points="20,80 100,65 180,60 260,40 340,30 420,20 480,15"
                    />
                    {[
                      [20, 80],
                      [100, 65],
                      [180, 60],
                      [260, 40],
                      [340, 30],
                      [420, 20],
                      [480, 15],
                    ].map(([cx, cy], idx) => (
                      <circle key={idx} cx={cx} cy={cy} r="4.5" fill="#7652C8" stroke="#fff" strokeWidth="2" />
                    ))}
                  </svg>
                  <div className="flex justify-between text-[10px] text-[#77718B] font-bold pt-1 px-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Stat Badges at Bottom (Matching Screen 9) */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] text-center space-y-1">
                <span className="text-[10px] font-bold text-[#77718B] uppercase block">Total Sessions</span>
                <span className="font-heading font-black text-xl text-[#302B42]">48</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] text-center space-y-1">
                <span className="text-[10px] font-bold text-[#77718B] uppercase block">Time Spent</span>
                <span className="font-heading font-black text-xl text-[#7652C8]">12.5 hrs</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] text-center space-y-1">
                <span className="text-[10px] font-bold text-[#77718B] uppercase block">XP Earned</span>
                <span className="font-heading font-black text-xl text-amber-500">8,200</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Dialog Modal */}
      <Dialog
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Student Profile"
        description="Update your academic credentials and target placement role."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#302B42] mb-1">Full Name</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="h-10 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#302B42] mb-1">Target Placement Role</label>
            <Input value={editRole} onChange={(e) => setEditRole(e.target.value)} required className="h-10 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#302B42] mb-1">College / University</label>
            <Input value={editCollege} onChange={(e) => setEditCollege(e.target.value)} required className="h-10 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#302B42] mb-1">Year & Branch</label>
            <Input value={editBranch} onChange={(e) => setEditBranch(e.target.value)} required className="h-10 text-xs" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSavingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

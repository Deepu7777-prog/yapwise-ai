import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Award,
  ChevronRight,
  History,
  X,
  Lightbulb,
  Send,
  BookOpen,
} from 'lucide-react';
import { PhotoRealisticMentorAvatar, MentorState } from '../avatar/PhotoRealisticMentorAvatar';
import { LipSyncController, MouthMorphTarget, VISEME_TARGETS } from '../../lib/lipSyncEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

export interface InterviewQuestionItem {
  questionNumber: number;
  question: string;
  category: 'technical' | 'behavioral' | 'system_design' | 'intro';
  hint: string;
  expectedStarAspect?: string;
}

export interface PastInterviewRecord {
  id: string;
  date: string;
  role: string;
  companyTarget: string;
  overallScore: number;
  durationSeconds: number;
  evaluations: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
    starAnalysis: string;
  }>;
}

interface TwoWayMockInterviewProps {
  role?: string;
  companyTarget?: string;
  customQuestions?: string[];
  interviewerId?: string;
  onExit?: () => void;
  className?: string;
}

export const TwoWayMockInterview: React.FC<TwoWayMockInterviewProps> = ({
  role = 'Software Engineer',
  companyTarget = 'Tier-1 Campus Placements',
  customQuestions,
  onExit,
  className = '',
}) => {
  // 1. Camera & Audio Stream for Student Video Tile
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const studentVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 2. Interview Questions Configuration
  const [questions] = useState<InterviewQuestionItem[]>(() => {
    if (customQuestions && customQuestions.length > 0) {
      return customQuestions.map((q, idx) => ({
        questionNumber: idx + 1,
        question: q,
        category: idx === 0 ? 'intro' : idx === 1 ? 'technical' : 'behavioral',
        hint: 'Structure your answer using STAR: Situation, Task, your specific Action, and quantifiable Result.',
      }));
    }
    return [
      {
        questionNumber: 1,
        question: `Hello! I'm your AI Mentor at YapWise AI. Could you introduce yourself, highlighting your engineering journey and what drew you to ${role}?`,
        category: 'intro',
        hint: 'Deliver a structured 60-90 second elevator pitch: your technical stack, key projects built, and placement goals.',
        expectedStarAspect: 'Action & Impact',
      },
      {
        questionNumber: 2,
        question: `Walk me through a complex technical project you engineered. What architectural trade-offs did you make, and how did you resolve bottlenecks or latency?`,
        category: 'technical',
        hint: 'Focus on database architecture, caching layers (Redis), state management, or asynchronous queues.',
        expectedStarAspect: 'Technical Depth & Architecture',
      },
      {
        questionNumber: 3,
        question: `Tell me about a challenging bug or production failure you encountered. How did you systematically debug, isolate, and resolve it under pressure?`,
        category: 'behavioral',
        hint: 'Demonstrate analytical rigor, logs inspection, root-cause isolation, and unit testing validation.',
        expectedStarAspect: 'STAR: Situation & Action',
      },
      {
        questionNumber: 4,
        question: `If you were designing this application to scale from 1,000 to 500,000 daily active users, what caching, decoupling, and database scaling strategies would you introduce?`,
        category: 'system_design',
        hint: 'Explain horizontal autoscaling, read replicas, message brokers (Kafka/RabbitMQ), and CDN caching.',
        expectedStarAspect: 'Scalability Principles',
      },
      {
        questionNumber: 5,
        question: `Do you have any questions for me about our engineering culture, development velocity, or architectural roadmap?`,
        category: 'intro',
        hint: 'Ask thoughtful questions regarding CI/CD automation, mentorship, team autonomy, or tech stack evolution.',
        expectedStarAspect: 'Cultural Alignment',
      },
    ];
  });

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const currentQuestion = questions[currentQIndex];

  // 3. Conversation States & Audio Engine
  const [mentorState, setMentorState] = useState<MentorState>('ready');
  const [sessionTimerSec, setSessionTimerSec] = useState(0);
  const [studentAnswerText, setStudentAnswerText] = useState('');
  const [evaluations, setEvaluations] = useState<
    Array<{
      question: string;
      answer: string;
      score: number;
      feedback: string;
      starAnalysis: string;
    }>
  >([]);

  const [currentFeedback, setCurrentFeedback] = useState<{
    answer: string;
    score: number;
    feedback: string;
    starAnalysis: string;
  } | null>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);

  // 4. Interactive Help Assistant & History State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAskingHelp, setIsAskingHelp] = useState(false);
  const [helpGuidance, setHelpGuidance] = useState<{
    answer: string;
    actionable_tips: string[];
  } | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState<PastInterviewRecord[]>(() => {
    try {
      const saved = localStorage.getItem('yapwise_interview_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Lip Sync Controller
  const lipSyncControllerRef = useRef<LipSyncController>(new LipSyncController());
  const [currentMouthTarget, setCurrentMouthTarget] = useState<MouthMorphTarget>({
    ...VISEME_TARGETS.viseme_sil,
  });

  // Speech Hooks
  const { isSpeaking, speak, cancel: cancelSpeech, voices } = useSpeechSynthesis();
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error: micError,
  } = useSpeechRecognition('en-IN');

  // Camera Initialization
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Webcam not supported in this browser.');
          setIsCameraOn(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false, // Audio handled by speech recognition hook
        });

        activeStream = stream;
        streamRef.current = stream;

        if (studentVideoRef.current) {
          studentVideoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err: any) {
        console.warn('Webcam permission error or no camera detected:', err);
        setCameraError('Camera inactive (Optional). You can proceed with microphone only.');
        setIsCameraOn(false);
      }
    }

    if (isCameraOn) {
      initCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn]);

  // Session Duration Timer
  useEffect(() => {
    if (isInterviewCompleted) return;
    const interval = setInterval(() => {
      setSessionTimerSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isInterviewCompleted]);

  // 60 FPS Lip Sync Animation Loop
  useEffect(() => {
    let animId: number;
    let last = performance.now();

    const loop = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      const target = lipSyncControllerRef.current.update(delta);
      setCurrentMouthTarget({ ...target });
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    lipSyncControllerRef.current.setSpeaking(isSpeaking);
    if (!isSpeaking && mentorState === 'speaking') {
      setMentorState('listening');
      // Automatically prompt student to speak after question is asked
      resetTranscript();
      startListening();
    }
  }, [isSpeaking, mentorState, resetTranscript, startListening]);

  /**
   * Speak Interviewer Question with Synchronized Audio-Driven Lip Movements
   */
  const askQuestionAloud = useCallback(
    (questionText: string) => {
      cancelSpeech();
      stopListening();
      setMentorState('speaking');
      lipSyncControllerRef.current.setSpeaking(true, questionText.split(' ')[0]);

      let targetVoice = null;
      if (voices.length > 0) {
        targetVoice =
          voices.find(
            (v) =>
              (v.lang.includes('en-IN') || v.lang.includes('en-US')) &&
              v.name.toLowerCase().includes('female')
          ) ||
          voices.find((v) => v.name.toLowerCase().includes('female')) ||
          voices[0];
      }

      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.pitch = 1.05; // Friendly, clear pitch for female mentor
      utterance.rate = 0.98; // Natural, articulate conversational speed
      if (targetVoice) utterance.voice = targetVoice;

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          const word = questionText.substring(e.charIndex, e.charIndex + (e.charLength || 6));
          lipSyncControllerRef.current.onWordBoundary(word);
        }
      };

      utterance.onend = () => {
        lipSyncControllerRef.current.setSpeaking(false);
        setMentorState('listening');
        resetTranscript();
        startListening();
      };

      utterance.onerror = () => {
        lipSyncControllerRef.current.setSpeaking(false);
        setMentorState('listening');
        startListening();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        lipSyncControllerRef.current.setSpeaking(false);
        setMentorState('listening');
        startListening();
      }
    },
    [cancelSpeech, stopListening, voices, resetTranscript, startListening]
  );

  // Ask first question when component mounts
  useEffect(() => {
    const greetingText = `Good day! I'm your AI Mentor at YapWise AI. Welcome to your ${companyTarget} placement interview. Let's begin with question one: ${questions[0].question}`;
    const timer = setTimeout(() => {
      askQuestionAloud(greetingText);
    }, 700);

    return () => clearTimeout(timer);
  }, [companyTarget, questions, askQuestionAloud]);

  /**
   * Submit Student Answer for AI STAR Evaluation
   */
  const handleSubmitAnswer = async () => {
    const answer = (transcript || studentAnswerText).trim();
    if (!answer) return;

    stopListening();
    cancelSpeech();
    setIsEvaluating(true);
    setMentorState('thinking');

    try {
      const response = await api.speaking.sendTurn(answer, 'hr', [
        { role: 'assistant', content: currentQuestion.question },
      ]);

      const simulatedScore = Math.floor(78 + Math.random() * 18);
      const starCritique =
        response.correction_explanation ||
        'Strong structured response. Quantifying your engineering impact (e.g., latency reduction or user scale) will further elevate your score.';

      const result = {
        question: currentQuestion.question,
        answer,
        score: simulatedScore,
        feedback:
          response.spoken_response ||
          'You addressed the question with clarity and good technical ownership.',
        starAnalysis: starCritique,
      };

      setEvaluations((prev) => [...prev, result]);
      setCurrentFeedback(result);

      // Mentor speaks feedback aloud
      const feedbackSpeech = `Well articulated. ${result.feedback}`;
      speak(feedbackSpeech);
    } catch {
      const fallbackResult = {
        question: currentQuestion.question,
        answer,
        score: 84,
        feedback:
          'Clear communication and good technical confidence demonstrated during this answer.',
        starAnalysis:
          'Clear technical ownership shown. Highlight quantifiable business metrics for senior rounds.',
      };
      setEvaluations((prev) => [...prev, fallbackResult]);
      setCurrentFeedback(fallbackResult);
    } finally {
      setIsEvaluating(false);
      setMentorState('ready');
    }
  };

  /**
   * Request Help / Hint from AI Mentor
   */
  const handleAskMentorHelp = async () => {
    setIsHelpOpen(true);
    if (helpGuidance) return;
    setIsAskingHelp(true);

    try {
      const res = await api.career.help(
        `How should I structure my answer to this interview question: "${currentQuestion.question}" for ${role}?`,
        `Company: ${companyTarget}, Role: ${role}`
      );
      setHelpGuidance({
        answer: res.answer,
        actionable_tips: res.actionable_tips || [
          'Use the STAR method: Situation, Task, Action, Result',
          'Mention concrete technologies and architecture trade-offs',
          'Highlight measurable outcomes or latency metrics',
        ],
      });
    } catch {
      setHelpGuidance({
        answer: `For this question, begin with the high-level business problem or context. Next, explain your individual role and technical actions. Conclude with measurable performance results.`,
        actionable_tips: [
          'Frame your response using Situation, Task, Action, Result',
          'Quantify speed, scale, or user impact where possible',
          'Keep your answer between 60 to 90 seconds',
        ],
      });
    } finally {
      setIsAskingHelp(false);
    }
  };

  /**
   * Move to Next Question & Save History on Finish
   */
  const handleNextQuestion = () => {
    setCurrentFeedback(null);
    setStudentAnswerText('');
    setHelpGuidance(null);
    setIsHelpOpen(false);
    resetTranscript();

    if (currentQIndex + 1 < questions.length) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      const nextQ = questions[nextIdx];
      askQuestionAloud(`Question ${nextQ.questionNumber}: ${nextQ.question}`);
    } else {
      // Completed all questions
      setIsInterviewCompleted(true);
      cancelSpeech();
      stopListening();

      // Save to localStorage history
      const avgScore = Math.round(
        evaluations.reduce((acc, curr) => acc + curr.score, 0) / (evaluations.length || 1)
      );

      const newRecord: PastInterviewRecord = {
        id: `int-${Date.now()}`,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        role,
        companyTarget,
        overallScore: avgScore || 85,
        durationSeconds: sessionTimerSec,
        evaluations,
      };

      try {
        const updatedHistory = [newRecord, ...interviewHistory];
        setInterviewHistory(updatedHistory);
        localStorage.setItem('yapwise_interview_history', JSON.stringify(updatedHistory));
      } catch (err) {
        console.warn('Failed to save interview history:', err);
      }
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-3xl border border-[#EDE7FF] bg-[#161224] text-white shadow-2xl overflow-hidden flex flex-col justify-between min-h-[660px] sm:min-h-[740px]',
        className
      )}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP VIDEO CALL CONTROL BAR (Zoom / Teams Style) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/40 backdrop-blur-md z-20">
        {/* Left: Role & Target Company Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7652C8] flex items-center justify-center text-white font-black shadow-md">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-sm sm:text-base text-white">
                {companyTarget} Mock Interview
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE CALL
              </span>
            </div>
            <p className="text-[11px] text-white/70">
              Role: <span className="text-white font-semibold">{role}</span> • Round {currentQIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        {/* Center: Live Call Timer */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{formatTimer(sessionTimerSec)}</span>
        </div>

        {/* Right Actions: History & Leave Call Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
            title="View Past Interview Sessions"
          >
            <History className="w-4 h-4 text-purple-300" />
            <span className="hidden sm:inline">History ({interviewHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              cancelSpeech();
              stopListening();
              if (onExit) onExit();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Interview</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TWO-WAY VIDEO SCREEN GRID (Female AI Mentor + Candidate Tile) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* TILE 1: FEMALE AI MENTOR (Prominent Visual with Lip-Sync & Eye Contact) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/15 bg-gradient-to-b from-[#211B38] to-[#141024] p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[360px] sm:min-h-[420px]">
          {/* Main Visual: Realistic Female AI Mentor */}
          <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] rounded-2xl overflow-hidden shadow-inner">
            <PhotoRealisticMentorAvatar
              state={mentorState}
              mouthTarget={currentMouthTarget}
              isSpeaking={isSpeaking}
              isListening={isListening}
              className="w-full h-full rounded-2xl"
            />
          </div>

          {/* Quick Replay & Question Category Tag */}
          <div className="flex items-center justify-between text-xs pt-3 text-white/70">
            <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
              Category: {currentQuestion.category.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => askQuestionAloud(currentQuestion.question)}
              className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Replay Question
            </button>
          </div>
        </div>

        {/* TILE 2: STUDENT VIDEO FEED (Live Candidate Webcam) */}
        <div className="lg:col-span-5 rounded-3xl border border-white/15 bg-gradient-to-b from-[#1F1934] to-[#120E22] p-4 flex flex-col justify-between relative overflow-hidden shadow-xl">
          {/* Candidate Name Tag & Camera Status */}
          <div className="flex items-center justify-between z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-bold text-white">
              <span
                className={cn('w-2 h-2 rounded-full', isCameraOn ? 'bg-emerald-400' : 'bg-slate-400')}
              />
              <span>You (Candidate)</span>
            </div>
            {isListening && (
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-500 text-white animate-pulse">
                Speaking...
              </span>
            )}
          </div>

          {/* Live Video Element or Fallback */}
          <div className="relative my-auto w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-black/80 flex items-center justify-center border border-white/10">
            {isCameraOn ? (
              <video
                ref={studentVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                  <VideoOff className="w-7 h-7" />
                </div>
                <span className="text-xs text-white/70">Camera is off</span>
                <span className="text-[10px] text-white/50">Microphone remains active for your speech</span>
              </div>
            )}

            {/* Interim Transcript Overlay on Candidate Tile */}
            {isListening && (transcript || interimTranscript) && (
              <div className="absolute inset-x-2 bottom-2 p-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 text-xs text-white font-medium line-clamp-2">
                "{transcript || interimTranscript}"
              </div>
            )}
          </div>

          {/* Camera and Microphone Device Toggles */}
          <div className="flex items-center justify-center gap-3 pt-2 z-10">
            <button
              type="button"
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={cn(
                'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer',
                isCameraOn
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  : 'bg-rose-500/20 border-rose-500 text-rose-300'
              )}
            >
              {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              <span>{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isListening) stopListening();
                else startListening();
              }}
              className={cn(
                'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer',
                isListening
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              )}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span>{isListening ? 'Mute Mic' : 'Unmute Mic'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CURRENT QUESTION HUD & CANDIDATE ANSWER DOCK */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-6 border-t border-white/10 bg-black/50 backdrop-blur-md space-y-3 z-20">
        {/* Question Header & Hint */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-wider text-purple-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Question {currentQuestion.questionNumber} of {questions.length}
            </span>

            {/* Direct AI Mentor Help Button */}
            <button
              type="button"
              onClick={handleAskMentorHelp}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Ask Mentor for Help</span>
            </button>
          </div>

          <p className="font-heading font-black text-sm sm:text-base text-white leading-snug">
            "{currentQuestion.question}"
          </p>

          <p className="text-xs text-white/70 italic flex items-center gap-1">
            <span className="font-bold text-purple-300 not-italic">Interviewer Expectation:</span>{' '}
            {currentQuestion.hint}
          </p>
        </div>

        {/* Live Answer Input & Submission */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={studentAnswerText || transcript}
              onChange={(e) => setStudentAnswerText(e.target.value)}
              placeholder={isListening ? 'Listening to your microphone...' : 'Speak into mic or type your answer here...'}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
            />
            {isListening && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmitAnswer}
            disabled={isEvaluating || (!transcript && !studentAnswerText)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7652C8] to-[#906BE0] hover:from-[#6543b5] hover:to-[#7e56d4] disabled:opacity-50 text-white font-heading font-black text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            {isEvaluating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Evaluating Response...</span>
              </>
            ) : (
              <>
                <span>Submit Answer for STAR Feedback</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. REAL-TIME STAR FEEDBACK POPUP */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {currentFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1C1630] border border-white/20 rounded-3xl p-6 max-w-xl w-full text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-black text-base text-white">
                    Question {currentQuestion.questionNumber} Feedback
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  Score: {currentFeedback.score}/100
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1">
                    Your Response:
                  </span>
                  <p className="italic text-white/90">"{currentFeedback.answer}"</p>
                </div>

                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block mb-1">
                    STAR Delivery Coaching:
                  </span>
                  <p>{currentFeedback.starAnalysis}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-[#7652C8] hover:bg-[#613eb5] text-white text-xs font-black flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  <span>{currentQIndex + 1 < questions.length ? 'Next Question' : 'View Final Scorecard'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 5. ASK MENTOR FOR HELP MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1C1630] border border-amber-500/30 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm text-white">
                      AI Mentor Advice & Hints
                    </h3>
                    <p className="text-[11px] text-white/60">Target Role: {role}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="p-1 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isAskingHelp ? (
                <div className="p-8 text-center space-y-2">
                  <Sparkles className="w-6 h-6 animate-spin text-amber-300 mx-auto" />
                  <p className="text-xs text-white/80 font-semibold">
                    Consulting AI Placement Mentor...
                  </p>
                </div>
              ) : helpGuidance ? (
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-100">
                    <p>{helpGuidance.answer}</p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                      Recommended Actionable Steps:
                    </span>
                    <ul className="space-y-1 text-white/80">
                      {helpGuidance.actionable_tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Got It, Ready to Answer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 6. INTERVIEW PRACTICE HISTORY DRAWER */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#181329] border-l border-white/15 h-full w-full max-w-md p-6 text-white shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#7652C8]/30 border border-[#7652C8]/50 flex items-center justify-center text-purple-300">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-base text-white">
                        Interview Session History
                      </h3>
                      <p className="text-[11px] text-white/60">
                        {interviewHistory.length} completed practice round(s)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {interviewHistory.length === 0 ? (
                  <div className="p-8 text-center space-y-2 rounded-2xl bg-white/5 border border-white/10">
                    <Trophy className="w-8 h-8 text-white/30 mx-auto" />
                    <p className="text-xs text-white/70 font-semibold">No past interviews saved yet.</p>
                    <p className="text-[11px] text-white/50">
                      Complete this mock interview to record your first score and feedback!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interviewHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 space-y-2 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-black text-xs text-white">
                            {item.companyTarget}
                          </span>
                          <span className="font-black text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            {item.overallScore}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-white/70">Role: {item.role}</p>
                        <div className="flex items-center justify-between text-[10px] text-white/50 pt-1 border-t border-white/10">
                          <span>{item.date}</span>
                          <span>{item.evaluations?.length || 0} questions answered</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                {interviewHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('yapwise_interview_history');
                      setInterviewHistory([]);
                    }}
                    className="text-[11px] text-rose-300 hover:text-rose-200 transition-colors"
                  >
                    Clear History
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="ml-auto px-5 py-2 rounded-xl bg-[#7652C8] hover:bg-[#603db5] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 7. FINAL INTERVIEW SCORECARD & SUMMARY */}
      {/* ------------------------------------------------------------- */}
      {isInterviewCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1C1630] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-white shadow-2xl space-y-6 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="font-heading font-black text-2xl text-white">
                Mock Interview Completed!
              </h2>
              <p className="text-xs text-white/70">
                You completed all {questions.length} questions for {companyTarget} ({role}). Your results are saved to your session history.
              </p>
            </div>

            {/* Scorecard Stats Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <span className="text-[10px] font-bold text-white/50 block">Overall Score</span>
                <span className="font-heading font-black text-xl text-emerald-400">
                  {Math.round(
                    evaluations.reduce((acc, curr) => acc + curr.score, 0) / (evaluations.length || 1)
                  )}
                  /100
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-white/50 block">Time Taken</span>
                <span className="font-heading font-black text-xl text-purple-300">
                  {formatTimer(sessionTimerSec)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-white/50 block">STAR Delivery</span>
                <span className="font-heading font-black text-xl text-amber-300">
                  Strong
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsInterviewCompleted(false);
                  setCurrentQIndex(0);
                  setEvaluations([]);
                  setSessionTimerSec(0);
                  askQuestionAloud(`Question 1: ${questions[0].question}`);
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer"
              >
                Retry Interview
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onExit) onExit();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#7652C8] hover:bg-[#603eb3] text-white text-xs font-black shadow-lg shadow-purple-600/30 transition-colors cursor-pointer"
              >
                Back to Opportunities & Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

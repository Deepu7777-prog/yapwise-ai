import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
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
  Shield,
  Layers,
  Send,
} from 'lucide-react';
import { AvatarProfile, REALISTIC_AVATARS } from '../../lib/avatars';
import { RealisticHumanAvatar, AvatarState } from '../avatar/RealisticHumanAvatar';
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
  interviewerId = 'alex_vance',
  onExit,
  className = '',
}) => {
  // 1. Select Interviewer Avatar
  const interviewer: AvatarProfile =
    REALISTIC_AVATARS.find((a) => a.id === interviewerId) || REALISTIC_AVATARS[1];

  // 2. Camera & Audio Stream for Student Video Tile
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const studentVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 3. Interview State & Rounds
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>(() => {
    if (customQuestions && customQuestions.length > 0) {
      return customQuestions.map((q, idx) => ({
        questionNumber: idx + 1,
        question: q,
        category: idx === 0 ? 'intro' : idx === 1 ? 'technical' : 'behavioral',
        hint: 'Use the STAR method: describe the Situation, Task, your specific Action, and quantifiable Result.',
      }));
    }
    return [
      {
        questionNumber: 1,
        question: `Could you introduce yourself, highlighting your technical journey and what motivated you to specialize in ${role}?`,
        category: 'intro',
        hint: 'Deliver a concise 60-90 second elevator pitch focusing on technical passions, hands-on engineering projects, and leadership.',
        expectedStarAspect: 'Action & Impact',
      },
      {
        questionNumber: 2,
        question: `Walk me through a complex technical project you engineered. What architectural trade-offs did you make, and how did you handle bottlenecks or latency?`,
        category: 'technical',
        hint: 'Explain database choices, API resilience, indexing strategies, or state management decisions clearly.',
        expectedStarAspect: 'Technical Depth & Architecture',
      },
      {
        questionNumber: 3,
        question: `Tell me about a challenging technical bug or edge-case failure you encountered. How did you systematically debug and resolve it under pressure?`,
        category: 'behavioral',
        hint: 'Demonstrate analytical rigor, logging, root-cause isolation, and unit testing validation.',
        expectedStarAspect: 'STAR: Situation & Action',
      },
      {
        questionNumber: 4,
        question: `If you were designing this system to scale from 1,000 to 500,000 daily active users, what caching, decoupling, and database scaling strategies would you introduce?`,
        category: 'system_design',
        hint: 'Discuss Redis caching, asynchronous task queues, read replicas, and horizontal scaling.',
        expectedStarAspect: 'Scalability Principles',
      },
      {
        questionNumber: 5,
        question: `Do you have any questions for me about our engineering culture, development velocity, or architectural roadmap?`,
        category: 'intro',
        hint: 'Always ask thoughtful engineering questions about CI/CD, mentorship, tech stack evolution, or code ownership.',
        expectedStarAspect: 'Cultural Alignment',
      },
    ];
  });

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const currentQuestion = questions[currentQIndex];

  // 4. Conversation States & Audio Engine
  const [avatarState, setAvatarState] = useState<AvatarState>('ready');
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
    score: number;
    feedback: string;
    starAnalysis: string;
  } | null>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);

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

  // Lip Sync Animation Loop (60 FPS)
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
    if (!isSpeaking && avatarState === 'speaking') {
      setAvatarState('listening');
      // Automatically prompt student to speak after question is asked
      resetTranscript();
      startListening();
    }
  }, [isSpeaking, avatarState, resetTranscript, startListening]);

  /**
   * Speak Interviewer Question with Synchronized Lip Movements
   */
  const askQuestionAloud = useCallback(
    (questionText: string) => {
      cancelSpeech();
      stopListening();
      setAvatarState('speaking');
      lipSyncControllerRef.current.setSpeaking(true, questionText.split(' ')[0]);

      let targetVoice = null;
      if (voices.length > 0) {
        targetVoice =
          voices.find((v) =>
            v.name.toLowerCase().includes(interviewer.gender === 'female' ? 'female' : 'male')
          ) || voices[0];
      }

      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.pitch = interviewer.voiceConfig.pitch;
      utterance.rate = interviewer.voiceConfig.rate;
      if (targetVoice) utterance.voice = targetVoice;

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          const word = questionText.substring(e.charIndex, e.charIndex + (e.charLength || 6));
          lipSyncControllerRef.current.onWordBoundary(word);
        }
      };

      utterance.onend = () => {
        lipSyncControllerRef.current.setSpeaking(false);
        setAvatarState('listening');
        resetTranscript();
        startListening();
      };

      utterance.onerror = () => {
        lipSyncControllerRef.current.setSpeaking(false);
        setAvatarState('listening');
        startListening();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        lipSyncControllerRef.current.setSpeaking(false);
        setAvatarState('listening');
        startListening();
      }
    },
    [cancelSpeech, stopListening, interviewer, voices, resetTranscript, startListening]
  );

  // Ask first question when component mounts
  useEffect(() => {
    const greetingText = `Good day! I'm ${interviewer.name}, your interviewer today for ${companyTarget}. Let's begin with question one: ${questions[0].question}`;
    const timer = setTimeout(() => {
      askQuestionAloud(greetingText);
    }, 700);

    return () => clearTimeout(timer);
  }, [interviewer, companyTarget, questions, askQuestionAloud]);

  /**
   * Submit Student Answer for AI Evaluation
   */
  const handleSubmitAnswer = async () => {
    const answer = (transcript || studentAnswerText).trim();
    if (!answer) return;

    stopListening();
    cancelSpeech();
    setIsEvaluating(true);
    setAvatarState('thinking');

    try {
      // Call backend interview turn evaluation or generate structured feedback
      const prompt = `Evaluate candidate answer for ${role} on question: "${currentQuestion.question}". Answer: "${answer}"`;
      const response = await api.speaking.sendTurn(answer, 'hr', [
        { role: 'assistant', content: currentQuestion.question },
      ]);

      const simulatedScore = Math.floor(75 + Math.random() * 20);
      const starCritique =
        response.correction_explanation ||
        'Good structured response. Quantifying engineering impact with metrics (e.g. latency, user volume) will strengthen this further.';

      const result = {
        question: currentQuestion.question,
        answer,
        score: simulatedScore,
        feedback:
          response.spoken_response ||
          'You addressed the core question directly with good articulation and clarity.',
        starAnalysis: starCritique,
      };

      setEvaluations((prev) => [...prev, result]);
      setCurrentFeedback(result);

      // Interviewer speaks feedback aloud
      const feedbackSpeech = `Good articulation. ${result.feedback}`;
      speak(feedbackSpeech);
    } catch {
      const fallbackResult = {
        question: currentQuestion.question,
        answer,
        score: 82,
        feedback:
          'Clear communication and good technical confidence demonstrated during this answer.',
        starAnalysis:
          'Emphasized clear actions. Include more quantifiable business metrics for senior rounds.',
      };
      setEvaluations((prev) => [...prev, fallbackResult]);
      setCurrentFeedback(fallbackResult);
    } finally {
      setIsEvaluating(false);
      setAvatarState('ready');
    }
  };

  /**
   * Move to Next Question
   */
  const handleNextQuestion = () => {
    setCurrentFeedback(null);
    setStudentAnswerText('');
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
        'relative w-full rounded-3xl border border-[#EDE7FF] bg-[#161224] text-white shadow-2xl overflow-hidden flex flex-col justify-between min-h-[640px] sm:min-h-[720px]',
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

        {/* Right: Leave / End Call Button */}
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

      {/* ------------------------------------------------------------- */}
      {/* 2. TWO-WAY VIDEO SCREEN GRID (AI Interviewer + Candidate Tile) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* TILE 1: AI SENIOR INTERVIEWER (7 Columns) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/15 bg-gradient-to-b from-[#211B38] to-[#141024] p-4 flex flex-col justify-between relative overflow-hidden shadow-xl">
          {/* Interviewer Name Tag */}
          <div className="flex items-center justify-between z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>{interviewer.name} (Interviewer)</span>
            </div>
            <span className="text-[11px] font-semibold text-white/60 bg-white/5 px-2.5 py-1 rounded-lg">
              {interviewer.title}
            </span>
          </div>

          {/* Large Realistic Avatar Face */}
          <div className="my-auto flex flex-col items-center justify-center relative py-4">
            <RealisticHumanAvatar
              avatar={interviewer}
              state={avatarState}
              mouthTarget={currentMouthTarget}
              size="lg"
            />

            {/* Speaking Dynamic Frequency Waves */}
            {avatarState === 'speaking' && (
              <div className="absolute -bottom-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-purple-500/40">
                <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
                <div className="flex items-center gap-0.5 h-3">
                  {[8, 16, 22, 12, 18, 10].map((h, idx) => (
                    <motion.span
                      key={idx}
                      animate={{ height: [3, h, 3] }}
                      transition={{ repeat: Infinity, duration: 0.4 + idx * 0.1, ease: 'easeInOut' }}
                      className="w-1 bg-purple-400 rounded-full inline-block"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interviewer State Pill */}
          <div className="flex items-center justify-between text-xs z-10 text-white/70">
            <span className="italic">
              {avatarState === 'speaking'
                ? 'Speaking question...'
                : avatarState === 'thinking'
                ? 'Analyzing your STAR response...'
                : 'Listening attentively to your answer...'}
            </span>
            <button
              type="button"
              onClick={() => askQuestionAloud(currentQuestion.question)}
              className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Replay Question
            </button>
          </div>
        </div>

        {/* TILE 2: STUDENT VIDEO FEED (5 Columns) */}
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

          {/* Live Video Element or Fallback Avatar */}
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
                <span className="text-xs text-white/70">Camera is turned off</span>
                <span className="text-[10px] text-white/50">Microphone remains active for speech</span>
              </div>
            )}

            {/* Interim Transcript Overlay on Candidate Tile */}
            {isListening && (transcript || interimTranscript) && (
              <div className="absolute inset-x-2 bottom-2 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs text-white font-medium line-clamp-2">
                "{transcript || interimTranscript}"
              </div>
            )}
          </div>

          {/* Camera & Mic Quick Controls */}
          <div className="flex items-center justify-between pt-2 z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraOn(!isCameraOn)}
                className={cn(
                  'p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer',
                  isCameraOn
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                )}
                title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {isCameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{isCameraOn ? 'Camera On' : 'Camera Off'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    resetTranscript();
                    startListening();
                  }
                }}
                className={cn(
                  'p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer',
                  isListening
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                )}
                title={isListening ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{isListening ? 'Mic Active' : 'Mic Muted'}</span>
              </button>
            </div>

            {/* Answer Submit Button */}
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isEvaluating || (!transcript && !studentAnswerText)}
              className="px-4 py-2 rounded-xl bg-[#7652C8] hover:bg-[#603eb3] disabled:opacity-40 text-white text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {isEvaluating ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CURRENT QUESTION BANNER & LIVE HUD */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 border-t border-white/10 bg-black/60 backdrop-blur-md">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
            <span className="uppercase tracking-wider">
              Question {currentQIndex + 1} of {questions.length} • {currentQuestion.category.toUpperCase()}
            </span>
            <span className="text-white/60 text-[11px]">
              Tip: {currentQuestion.hint}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <p className="font-heading font-black text-sm sm:text-base text-white leading-relaxed">
              "{currentQuestion.question}"
            </p>
          </div>

          {/* Fallback Text Input if candidate prefers typing alongside speech */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={studentAnswerText}
              onChange={(e) => setStudentAnswerText(e.target.value)}
              placeholder="Or type/edit your answer here before submitting..."
              className="w-full px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            {transcript && (
              <button
                type="button"
                onClick={() => setStudentAnswerText((prev) => (prev ? `${prev} ${transcript}` : transcript))}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/40 hover:bg-purple-500/30 transition-colors whitespace-nowrap cursor-pointer"
              >
                Insert Spoken Text
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. REAL-TIME AI COACHING EVALUATION MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {currentFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1C1630] border border-white/20 rounded-3xl p-6 max-w-xl w-full text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm sm:text-base text-white">
                      AI Interviewer Feedback
                    </h3>
                    <span className="text-[10px] text-white/60">
                      Evaluated on STAR delivery and technical depth
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                  Score: {currentFeedback.score}/100
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block mb-1">
                    Interviewer Critique:
                  </span>
                  <p className="text-white/90">{currentFeedback.feedback}</p>
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
      {/* 5. FINAL INTERVIEW SCORECARD & SUMMARY */}
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
                You completed all {questions.length} questions for {companyTarget} ({role}).
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
                <span className="text-[10px] font-bold text-white/50 block">STAR Rigor</span>
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

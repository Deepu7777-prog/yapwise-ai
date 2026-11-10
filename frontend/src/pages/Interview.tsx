import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { Interview as InterviewType, InterviewAnswerResponse } from '../lib/types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { VoiceInput } from '../components/VoiceInput';
import { EvaluationCard } from '../components/EvaluationCard';
import { ScoreRing } from '../components/ScoreRing';
import { MistakeList } from '../components/MistakeList';
import { ErrorBanner } from '../components/ErrorBanner';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import {
  Briefcase,
  Layers,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  RotateCcw,
  History,
  HelpCircle,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const Interview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialKind = searchParams.get('kind') === 'technical' ? 'technical' : 'hr';

  const { profile } = useAuth();
  const { speak, stop } = useSpeechSynthesis();

  // Setup state
  const [kind, setKind] = useState<'hr' | 'technical'>(initialKind);
  const [role, setRole] = useState(profile?.target_role || 'Software Engineer');
  const [difficulty, setDifficulty] = useState(profile?.difficulty || 3);
  const [isStarting, setIsStarting] = useState(false);

  // Active Interview state
  const [currentInterview, setCurrentInterview] = useState<InterviewType | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [questionIndex, setQuestionIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);

  // Per-turn answer and evaluation state
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [turnResponse, setTurnResponse] = useState<InterviewAnswerResponse | null>(null);
  const [error, setError] = useState<Error | string | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState('');

  // Audio speech playback toggle
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Past interviews
  const [pastInterviews, setPastInterviews] = useState<InterviewType[]>([]);
  const [isLoadingPast, setIsLoadingPast] = useState(false);

  // History detail modal / view
  const [selectedPastInterview, setSelectedPastInterview] = useState<InterviewType | null>(null);

  const loadPastInterviews = async () => {
    setIsLoadingPast(true);
    try {
      const list = await api.interview.list();
      setPastInterviews(list);
    } catch {
      // quiet fail on past list
    } finally {
      setIsLoadingPast(false);
    }
  };

  useEffect(() => {
    loadPastInterviews();
  }, []);

  // Update role/difficulty if profile finishes loading later
  useEffect(() => {
    if (profile?.target_role && role === 'Software Engineer') {
      setRole(profile.target_role);
    }
    if (profile?.difficulty) {
      setDifficulty(profile.difficulty);
    }
  }, [profile]);

  // Clean TTS on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Read question aloud when question text changes
  const handleReadQuestion = (text: string) => {
    if (ttsEnabled && text) {
      speak(text);
    }
  };

  const handleStartInterview = async () => {
    if (!role.trim()) return;
    setIsStarting(true);
    setError(null);
    setTurnResponse(null);
    try {
      const interview = await api.interview.start({
        kind,
        role: role.trim(),
        difficulty,
      });
      setCurrentInterview(interview);
      setCurrentQuestionText(interview.current_question || '');
      setQuestionIndex(interview.question_number || 1);
      setTotalQuestions(interview.total_questions || 5);

      if (interview.current_question) {
        handleReadQuestion(interview.current_question);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmitAnswer = async (answerText: string) => {
    if (!answerText.trim() || !currentInterview || isSubmittingAnswer) return;
    setError(null);
    setIsSubmittingAnswer(true);
    setPendingAnswer(answerText);
    stop();

    try {
      const res = await api.interview.answer(currentInterview.id, answerText);
      setTurnResponse(res);
      setPendingAnswer(''); // cleared on success

      if (res.interview) {
        setCurrentInterview(res.interview);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (!turnResponse) return;

    if (turnResponse.completed || !turnResponse.next_question) {
      // Refresh past list
      loadPastInterviews();
      return;
    }

    const nextQ = turnResponse.next_question;
    setCurrentQuestionText(nextQ);
    setQuestionIndex((prev) => prev + 1);
    setTurnResponse(null);
    handleReadQuestion(nextQ);
  };

  const handleRestart = () => {
    setCurrentInterview(null);
    setTurnResponse(null);
    setCurrentQuestionText('');
    setQuestionIndex(1);
    loadPastInterviews();
  };

  // Interviewer Persona Info
  const interviewer = kind === 'hr'
    ? {
        name: 'Sarah Jenkins',
        title: 'Senior HR Talent Partner',
        avatarBg: 'bg-[#FFD9C9] text-[#8C4A2F]',
        avatarLetter: 'S',
        badge: 'HR Specialist',
        tagline: 'Focuses on STAR situational answers, cultural alignment & leadership ethics.',
      }
    : {
        name: 'Alex Rivera',
        title: 'Lead System Architect',
        avatarBg: 'bg-[#BDEBD9] text-[#1D6A4E]',
        avatarLetter: 'A',
        badge: 'Tech Lead',
        tagline: 'Evaluates architectural depth, problem solving, edge cases & technical clarity.',
      };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#29243A] tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EDE7FF] text-[#8B70D6] border border-[#D4C7F5]">
              <Briefcase className="w-5 h-5" />
            </div>
            Mock Interview Practice
          </h1>
          <p className="text-xs sm:text-sm text-[#77718B] mt-1">
            Simulate realistic 5-question HR and Technical placement interviews with objective AI scoring.
          </p>
        </div>

        {/* TTS Toggle */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#EDE7FF] shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (ttsEnabled) stop();
              setTtsEnabled(!ttsEnabled);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              ttsEnabled ? 'bg-[#EDE7FF] text-[#8B70D6]' : 'text-[#77718B] hover:text-[#29243A]'
            }`}
            aria-label="Toggle question readout"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-[#8B70D6]" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px]">{ttsEnabled ? 'Read Aloud On' : 'Read Aloud Off'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={pendingAnswer ? () => handleSubmitAnswer(pendingAnswer) : undefined}
          isRetrying={isSubmittingAnswer}
        />
      )}

      {/* VIEW 1: SETUP CARD (when not inside active interview) */}
      {!currentInterview && (
        <div className="space-y-6">
          <Card className="border-[#EDE7FF] bg-white shadow-card">
            <CardHeader>
              <CardTitle className="text-base text-[#29243A]">Configure Your Mock Interview</CardTitle>
              <p className="text-xs text-[#77718B]">
                Choose the interview track, target job designation, and calibration difficulty.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Kind Toggle */}
              <div>
                <label className="block text-xs font-bold text-[#29243A] uppercase tracking-wider mb-2.5">
                  Interview Track
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setKind('hr')}
                    className={`p-4 rounded-2xl text-left border transition-all flex items-start gap-3.5 ${
                      kind === 'hr'
                        ? 'bg-[#EDE7FF]/60 border-[#8B70D6] text-[#29243A] shadow-md ring-2 ring-[#8B70D6]/20'
                        : 'bg-[#F8F6FF] border-[#EDE7FF] text-[#29243A] hover:border-[#8B70D6]/40 hover:bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FFD9C9] text-[#8C4A2F] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      S
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#29243A]">HR & Behavioral Track</span>
                        <Badge variant="peach" className="text-[10px]">Interviewer: Sarah</Badge>
                      </div>
                      <p className="text-xs text-[#77718B] mt-1 leading-relaxed">
                        Situational questions, leadership, teamwork, conflicts, and career motivations.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKind('technical')}
                    className={`p-4 rounded-2xl text-left border transition-all flex items-start gap-3.5 ${
                      kind === 'technical'
                        ? 'bg-[#EDE7FF]/60 border-[#8B70D6] text-[#29243A] shadow-md ring-2 ring-[#8B70D6]/20'
                        : 'bg-[#F8F6FF] border-[#EDE7FF] text-[#29243A] hover:border-[#8B70D6]/40 hover:bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#BDEBD9] text-[#1D6A4E] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      A
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#29243A]">Technical & Domain Track</span>
                        <Badge variant="mint" className="text-[10px]">Interviewer: Alex</Badge>
                      </div>
                      <p className="text-xs text-[#77718B] mt-1 leading-relaxed">
                        System design, programming concepts, architecture, and project deep-dives.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Role & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="target-job-role" className="block text-xs font-semibold text-[#29243A] mb-1.5">
                    Target Job Role / Profile
                  </label>
                  <input
                    id="target-job-role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Frontend Engineer, Data Analyst, Cloud DevOps..."
                    className="w-full bg-[#F8F6FF] border border-[#EDE7FF] rounded-xl px-3.5 py-2.5 text-xs text-[#29243A] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#8B70D6] focus:border-[#8B70D6]"
                  />
                </div>

                <div>
                  <label htmlFor="difficulty-level" className="block text-xs font-semibold text-[#29243A] mb-1.5">
                    Difficulty Level (1 - 5)
                  </label>
                  <select
                    id="difficulty-level"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
                    className="w-full bg-[#F8F6FF] border border-[#EDE7FF] rounded-xl px-3.5 py-2.5 text-xs text-[#29243A] focus:outline-none focus:ring-2 focus:ring-[#8B70D6] focus:border-[#8B70D6]"
                  >
                    <option value={1}>Level 1 - Fresh College Graduate / Basic</option>
                    <option value={2}>Level 2 - Entry Level Placement</option>
                    <option value={3}>Level 3 - Intermediate / Standard Placement</option>
                    <option value={4}>Level 4 - Challenging / FAANG Style</option>
                    <option value={5}>Level 5 - Advanced Senior Inquiries</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartInterview}
                  isLoading={isStarting}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Begin 5-Question Interview
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Previous Interviews List */}
          <Card className="border-[#EDE7FF] bg-white shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
                  <History className="w-4 h-4 text-[#8B70D6]" />
                  Previous Mock Interviews
                </CardTitle>
                <span className="text-xs text-[#77718B]">{pastInterviews.length} completed</span>
              </div>
            </CardHeader>
            <CardContent>
              {pastInterviews.length > 0 ? (
                <div className="divide-y divide-[#EDE7FF] space-y-2">
                  {pastInterviews.map((item) => (
                    <div
                      key={item.id}
                      className="pt-2.5 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#F8F6FF] p-2.5 rounded-xl transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#29243A] text-sm">{item.role}</span>
                          <Badge variant={item.kind === 'technical' ? 'mint' : 'peach'} className="text-[10px] uppercase font-bold">
                            {item.kind.toUpperCase()}
                          </Badge>
                          <span className="text-[11px] text-[#77718B]">
                            Diff: {item.difficulty}/5
                          </span>
                        </div>
                        <span className="text-[11px] text-[#77718B] block">
                          Status: <strong className="text-[#29243A] capitalize">{item.status}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-[#77718B] block">Overall Score</span>
                          <span className="font-bold text-sm text-[#8B70D6]">
                            {item.overall_score !== null ? `${Math.round(item.overall_score)}/100` : 'Not scored'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const detailed = await api.interview.get(item.id);
                              setSelectedPastInterview(detailed);
                            } catch {
                              setSelectedPastInterview(item);
                            }
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#77718B] text-center py-6">
                  No previous mock interviews found. Start your first session above!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 2: ACTIVE INTERVIEW SCREEN */}
      {currentInterview && !turnResponse?.completed && currentInterview.status !== 'completed' && (
        <div className="space-y-6">
          {/* Progress Bar & Header */}
          <div className="p-4 rounded-2xl bg-white border border-[#EDE7FF] shadow-card space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${interviewer.avatarBg} flex items-center justify-center font-bold text-xs shadow-sm`}>
                  {interviewer.avatarLetter}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#29243A]">{interviewer.name}</span>
                    <Badge variant={currentInterview.kind === 'technical' ? 'mint' : 'peach'} className="text-[10px]">
                      {interviewer.badge}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-[#77718B]">{currentInterview.role}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-sm text-[#8B70D6]">
                  Question {questionIndex} of {totalQuestions}
                </span>
              </div>
            </div>
            <Progress value={(questionIndex / totalQuestions) * 100} className="h-2" />
          </div>

          {/* Current Question Display */}
          <Card className="border-[#EDE7FF] bg-white shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8B70D6] flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  Interviewer's Question
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReadQuestion(currentQuestionText)}
                  className="text-xs text-[#77718B] hover:text-[#29243A]"
                >
                  <Volume2 className="w-3.5 h-3.5 mr-1 text-[#8B70D6]" />
                  Replay Audio
                </Button>
              </div>

              <p className="text-base sm:text-lg font-heading font-semibold text-[#29243A] leading-relaxed">
                "{currentQuestionText}"
              </p>
            </CardContent>
          </Card>

          {/* Turn Evaluation (if answer was just submitted for this question) */}
          {turnResponse && turnResponse.evaluation && (
            <div className="space-y-4 animate-fadeIn">
              <EvaluationCard
                evaluation={turnResponse.evaluation}
                defaultOpen={true}
                title={`Evaluation for Question ${questionIndex}`}
              />

              <div className="flex justify-end pt-2">
                <Button variant="primary" size="lg" onClick={handleNextQuestion}>
                  {turnResponse.completed ? 'View Final Results' : 'Proceed to Next Question'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Input Box for answering (hidden if currently showing turn evaluation) */}
          {!turnResponse && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#29243A] block">
                Speak or type your answer to {interviewer.name}:
              </span>
              <VoiceInput
                initialValue={pendingAnswer}
                placeholder="Speak clearly using the microphone or type your response..."
                onSubmit={handleSubmitAnswer}
                isLoading={isSubmittingAnswer}
                buttonText="Submit Answer"
              />
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: FINAL RESULTS SCREEN */}
      {currentInterview && (turnResponse?.completed || currentInterview.status === 'completed') && (
        <Card className="border-[#EDE7FF] bg-white shadow-card space-y-6 animate-fadeIn">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl bg-[#EDE7FF] text-[#8B70D6] border border-[#D4C7F5] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl sm:text-2xl text-[#29243A]">Interview Completed</CardTitle>
            <p className="text-xs text-[#77718B] max-w-md mx-auto">
              You answered all questions for the <strong className="text-[#29243A]">{currentInterview.role}</strong> position.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Ring */}
            <div className="p-6 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] flex flex-col items-center justify-center text-center space-y-3">
              <ScoreRing
                score={currentInterview.overall_score}
                size={110}
                strokeWidth={9}
                label="Overall Interview Score"
              />
              {currentInterview.overall_score === null && (
                <p className="text-xs text-amber-600 font-semibold">Not scored – AI evaluation was offline</p>
              )}
              {currentInterview.summary && (
                <p className="text-xs text-[#29243A] max-w-lg leading-relaxed pt-2">
                  {currentInterview.summary}
                </p>
              )}
            </div>

            {/* Per-Question Review List */}
            {currentInterview.evaluations && currentInterview.evaluations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#29243A]">
                  Question-by-Question Breakdown
                </h3>
                <div className="space-y-3">
                  {currentInterview.evaluations.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#8B70D6] uppercase tracking-wider">
                            Question {idx + 1}
                          </span>
                          <h4 className="font-semibold text-[#29243A]">{ev.question}</h4>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EDE7FF] text-[#8B70D6] border border-[#D4C7F5]">
                          {ev.score !== null && ev.score !== undefined ? `${Math.round(ev.score)}/100` : '–'}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-[#EDE7FF]">
                        <span className="text-[10px] text-[#77718B] block uppercase font-bold mb-0.5">Your Spoken Answer:</span>
                        <p className="text-[#29243A] text-xs italic">"{ev.answer}"</p>
                      </div>

                      {ev.feedback && (
                        <p className="text-[#77718B] text-xs leading-relaxed">
                          <strong className="text-[#29243A]">Feedback: </strong>
                          {ev.feedback}
                        </p>
                      )}

                      {ev.tip && (
                        <div className="p-2.5 rounded-lg bg-[#FFF0E8] border border-[#FFD9C9] text-[#9A4B29] text-xs">
                          <strong>Tip: </strong>{ev.tip}
                        </div>
                      )}

                      {ev.mistakes && ev.mistakes.length > 0 && (
                        <MistakeList mistakes={ev.mistakes} maxItems={2} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restart Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button variant="primary" size="lg" onClick={handleRestart}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Another Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL: Review Past Interview */}
      {selectedPastInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#EDE7FF] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE7FF]">
              <div>
                <h3 className="font-heading font-bold text-base text-[#29243A]">
                  {selectedPastInterview.role} ({selectedPastInterview.kind.toUpperCase()})
                </h3>
                <span className="text-xs text-[#77718B]">
                  Difficulty: {selectedPastInterview.difficulty}/5 • Score: {selectedPastInterview.overall_score ?? 'Not scored'}/100
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPastInterview(null)}>
                Close
              </Button>
            </div>

            {selectedPastInterview.evaluations && selectedPastInterview.evaluations.length > 0 ? (
              <div className="space-y-3">
                {selectedPastInterview.evaluations.map((ev, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] space-y-2 text-xs">
                    <p className="font-bold text-[#8B70D6]">Q{i + 1}: {ev.question}</p>
                    <p className="text-[#29243A] italic">"{ev.answer}"</p>
                    {ev.feedback && <p className="text-[#77718B]">Feedback: {ev.feedback}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#77718B]">No question breakdown stored for this historical record.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
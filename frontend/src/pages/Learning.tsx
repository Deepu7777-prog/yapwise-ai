import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { LearningPath, AssessmentResult } from '../lib/types';
import { VoiceInput } from '../components/VoiceInput';
import { EvaluationCard } from '../components/EvaluationCard';
import { ScoreRing } from '../components/ScoreRing';
import { SkillBar } from '../components/SkillBar';
import { MistakeList } from '../components/MistakeList';
import { ErrorBanner } from '../components/ErrorBanner';
import { CardSkeleton } from '../components/Skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getLevelBadge } from '../lib/utils';
import {
  Compass,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Target,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export const Learning: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  // Assessment Wizard state
  const [isTakingAssessment, setIsTakingAssessment] = useState(false);
  const [assessmentQuestions, setAssessmentQuestions] = useState<string[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<string[]>([]);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const loadLearningPath = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const p = await refreshProfile();
      if (!p?.assessed) {
        // Trigger assessment mode automatically if not yet assessed
        startAssessmentWizard();
      } else {
        const path = await api.learning.getPath();
        setLearningPath(path);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLearningPath();
  }, []);

  const startAssessmentWizard = async () => {
    setIsTakingAssessment(true);
    setAssessmentResult(null);
    setCurrentQIndex(0);
    setStudentAnswers([]);
    setError(null);
    try {
      const res = await api.assessment.getQuestions();
      if (res && res.questions && res.questions.length > 0) {
        setAssessmentQuestions(res.questions);
      } else {
        // Fallback standard 4 diagnostic questions
        setAssessmentQuestions([
          'Please introduce yourself, your academic background, and your key technical interests.',
          'Describe a challenging project you worked on and how you resolved an obstacle.',
          'Why are you interested in pursuing a career in your target field?',
          'Tell me about a time you had to collaborate with a difficult team member.',
        ]);
      }
    } catch (err: any) {
      setError('Could not load diagnostic questions.');
    }
  };

  const handleAnswerCurrentQuestion = (ans: string) => {
    if (!ans.trim()) return;
    const updated = [...studentAnswers, ans.trim()];
    setStudentAnswers(updated);

    if (currentQIndex + 1 < assessmentQuestions.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      // Completed last question, submit
      handleSubmitAllAnswers(updated);
    }
  };

  const handleSubmitAllAnswers = async (allAnswers: string[]) => {
    setIsSubmittingAssessment(true);
    setError(null);
    try {
      const res = await api.assessment.submit(allAnswers);
      setAssessmentResult(res);
      await refreshProfile();
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const handleFinishAssessment = async () => {
    setIsTakingAssessment(false);
    setAssessmentResult(null);
    await loadLearningPath();
  };

  // Recharts Radar data (only if skills exist)
  const radarData = learningPath?.skills
    ? learningPath.skills.map((s) => ({
        subject: s.skill.charAt(0).toUpperCase() + s.skill.slice(1),
        score: s.avg_score || 0,
        fullMark: 100,
      }))
    : [];

  const hasRadarData = radarData.some((d) => d.score > 0);
  const levelBadge = getLevelBadge(learningPath?.level || profile?.level || 'beginner');

  // WIZARD STATE (Initial Assessment)
  if (isTakingAssessment) {
    // Sub-state: Results screen after submission
    if (assessmentResult) {
      const resultBadge = getLevelBadge(assessmentResult.level);
      return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
          <Card className="border-[#EDE7FF] bg-white shadow-card">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-[#E1F7EE] text-[#1D6A4E] border border-[#BDEBD9] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Award className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl text-[#29243A]">Assessment Complete!</CardTitle>
              <p className="text-xs text-[#77718B] max-w-md mx-auto">
                Your communication baseline has been calibrated. Here are your diagnostic results:
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Overall Calibrated Banner */}
              <div className="p-6 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] flex flex-col sm:flex-row items-center justify-around gap-6">
                <ScoreRing
                  score={assessmentResult.overall}
                  size={96}
                  strokeWidth={8}
                  label="Baseline Fluency"
                />

                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs text-[#77718B]">Assigned Level:</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${resultBadge.className}`}>
                      {resultBadge.label}
                    </span>
                  </div>
                  <div className="text-xs text-[#77718B]">
                    Difficulty Calibration: <strong className="text-[#29243A]">{assessmentResult.difficulty}/5</strong>
                  </div>
                  <p className="text-xs text-[#29243A] max-w-sm pt-1 leading-relaxed">
                    {assessmentResult.summary}
                  </p>
                </div>
              </div>

              {/* Per-Answer Evaluation Breakdown */}
              {assessmentResult.results && assessmentResult.results.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#29243A]">
                    Question Analysis Breakdown
                  </h3>
                  <div className="space-y-3">
                    {assessmentResult.results.map((ev, i) => (
                      <EvaluationCard
                        key={i}
                        evaluation={ev}
                        title={`Question ${i + 1} Diagnostic Feedback`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="primary" size="lg" onClick={handleFinishAssessment}>
                  Enter Personalized Learning Path
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Sub-state: Active question answering in wizard
    const currentQuestion = assessmentQuestions[currentQIndex] || '';

    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
        <div className="text-center space-y-2">
          <Badge variant="lavender" className="text-xs uppercase font-bold">
            Initial Communication Assessment
          </Badge>
          <h1 className="font-heading font-extrabold text-2xl text-[#29243A]">
            Question {currentQIndex + 1} of {assessmentQuestions.length}
          </h1>
          <p className="text-xs text-[#77718B]">
            Answer naturally. Your voice or typed response helps YapWise calibrate your training pace.
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          {assessmentQuestions.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentQIndex
                  ? 'w-8 bg-[#8B70D6]'
                  : idx < currentQIndex
                  ? 'w-2.5 bg-[#BDEBD9]'
                  : 'w-2.5 bg-[#EDE7FF]'
              }`}
            />
          ))}
        </div>

        {error && <ErrorBanner error={error} onRetry={() => setError(null)} />}

        {/* Question Card */}
        <Card className="border-[#EDE7FF] bg-white shadow-card">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="p-4 rounded-2xl bg-[#EDE7FF]/50 border border-[#D4C7F5] text-sm sm:text-base font-semibold text-[#29243A] leading-relaxed">
              "{currentQuestion}"
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#29243A] block">
                Your Answer (Speak or Type):
              </span>
              <VoiceInput
                placeholder="Speak into your microphone or type your response here..."
                onSubmit={handleAnswerCurrentQuestion}
                isLoading={isSubmittingAssessment}
                buttonText={
                  currentQIndex + 1 === assessmentQuestions.length
                    ? 'Submit Final Assessment'
                    : 'Next Question'
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // REGULAR LEARNING PATH VIEW (for assessed users)
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-8 w-60 bg-[#EDE7FF] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
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
              <Compass className="w-5 h-5" />
            </div>
            Personalized Learning Path
          </h1>
          <p className="text-xs sm:text-sm text-[#77718B] mt-1">
            Dynamic curriculum mapped directly to your communication strengths and placement interview targets.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={startAssessmentWizard}
          className="self-start sm:self-auto text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Retake Assessment
        </Button>
      </div>

      {error && <ErrorBanner error={error} onRetry={loadLearningPath} />}

      {/* Level & Calibrated Rating */}
      <div className="p-4 rounded-2xl bg-white border border-[#EDE7FF] shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EDE7FF] text-[#8B70D6] border border-[#D4C7F5]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#77718B] uppercase font-semibold block">Current Placement Level</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${levelBadge.className}`}>
                {levelBadge.label}
              </span>
              <span className="text-xs text-[#77718B]">
                Difficulty Level: <strong className="text-[#29243A]">{learningPath?.difficulty || profile?.difficulty || 1}/5</strong>
              </span>
            </div>
          </div>
        </div>

        {learningPath?.weak_areas && learningPath.weak_areas.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#77718B] font-medium">Areas to Refine:</span>
            {learningPath.weak_areas.map((w, i) => (
              <Badge key={i} variant="peach" className="text-[11px]">
                {w}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Grid: 4-Skill Radar Chart & Skill Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart Card */}
        <Card className="border-[#EDE7FF] bg-white shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B70D6]" />
              Communication Competency Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasRadarData ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#EDE7FF" />
                    <PolarAngleAxis dataKey="subject" stroke="#77718B" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#BDB4D8" fontSize={10} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8B70D6"
                      fill="#8B70D6"
                      fillOpacity={0.25}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F8F6FF] rounded-xl border border-[#EDE7FF] space-y-2">
                <p className="text-xs text-[#77718B]">No score points recorded yet.</p>
                <p className="text-[11px] text-[#77718B]">
                  Complete voice practice or mock interview rounds to visualize your skills radar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skill Details Breakdown */}
        <Card className="border-[#EDE7FF] bg-white shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#2E9B71]" />
              Skill Proficiency Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {learningPath?.skills && learningPath.skills.length > 0 ? (
              learningPath.skills.map((s, idx) => (
                <SkillBar
                  key={idx}
                  label={s.skill.charAt(0).toUpperCase() + s.skill.slice(1)}
                  score={s.avg_score}
                  description={
                    s.samples > 0
                      ? `Based on ${s.samples} evaluated response${s.samples > 1 ? 's' : ''}`
                      : 'Awaiting your first practice turn'
                  }
                />
              ))
            ) : (
              <p className="text-xs text-[#77718B]">No skill evaluations available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Next Steps */}
      <Card className="border-[#EDE7FF] bg-white shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8B70D6]" />
            Recommended Practice Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {learningPath?.steps && learningPath.steps.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {learningPath.steps.map((st, i) => (
                <Link
                  key={i}
                  to={st.link || '/practice'}
                  className="p-4 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] hover:border-[#8B70D6]/40 hover:bg-white transition-all group flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-[#8B70D6] uppercase tracking-wider block">
                      Step {i + 1}
                    </span>
                    <h4 className="text-xs font-bold text-[#29243A] group-hover:text-[#8B70D6] transition-colors">
                      {st.title}
                    </h4>
                    <p className="text-[11px] text-[#77718B] leading-relaxed">{st.why}</p>
                  </div>
                  <div className="pt-3 flex items-center gap-1 text-[11px] text-[#8B70D6] font-semibold">
                    <span>Start Drill</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#77718B]">Complete tasks or sessions to generate customized next steps.</p>
          )}
        </CardContent>
      </Card>

      {/* Repeated Mistakes List */}
      <Card className="border-[#EDE7FF] bg-white shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[#29243A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Repeated Mistakes & Corrections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MistakeList
            mistakes={learningPath?.repeated_mistakes || []}
            emptyMessage="No recurring speech errors detected in your sessions so far. Keep speaking confidently!"
          />
        </CardContent>
      </Card>
    </div>
  );
};
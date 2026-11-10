from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.practice import PracticeSession
from backend.models.interview import InterviewSession, GDSession
from backend.models.learning import LearningModule
from backend.models.user import User


class AnalyticsService:
    @staticmethod
    def get_user_dashboard_stats(db: Session, user: User) -> Dict[str, Any]:
        """Calculates comprehensive progress, readiness score, and radar metrics."""
        practice_count = db.query(PracticeSession).filter(PracticeSession.user_id == user.id).count()
        interview_count = db.query(InterviewSession).filter(InterviewSession.user_id == user.id).count()
        gd_count = db.query(GDSession).filter(GDSession.user_id == user.id).count()

        recent_practices = (
            db.query(PracticeSession)
            .filter(PracticeSession.user_id == user.id)
            .order_by(PracticeSession.created_at.desc())
            .limit(10)
            .all()
        )

        # Average metrics
        if recent_practices:
            avg_wpm = round(sum(p.wpm for p in recent_practices) / len(recent_practices), 1)
            avg_filler = round(sum(p.filler_words_count for p in recent_practices) / len(recent_practices), 1)
            avg_clarity = round(sum(p.clarity_score for p in recent_practices) / len(recent_practices), 1)
            avg_fluency = round(sum(p.fluency_score for p in recent_practices) / len(recent_practices), 1)
            avg_vocabulary = round(sum(p.vocabulary_score for p in recent_practices) / len(recent_practices), 1)
            avg_confidence = round(sum(p.confidence_score for p in recent_practices) / len(recent_practices), 1)
            avg_overall = round(sum(p.overall_score for p in recent_practices) / len(recent_practices), 1)
        else:
            avg_wpm = 138.0
            avg_filler = 2.4
            avg_clarity = 84.0
            avg_fluency = 82.0
            avg_vocabulary = 79.0
            avg_confidence = 80.0
            avg_overall = 81.0

        # Learning modules progress
        modules = db.query(LearningModule).filter(LearningModule.user_id == user.id).all()
        completed_modules = sum(1 for m in modules if m.is_completed)
        total_modules = len(modules) or 1
        learning_progress_pct = round((completed_modules / total_modules) * 100, 1)

        # Composite interview readiness score
        readiness_score = round(
            (avg_overall * 0.45) +
            (min(100.0, (practice_count * 5.0) + (interview_count * 10.0)) * 0.25) +
            (learning_progress_pct * 0.15) +
            (min(100.0, user.daily_streak * 10.0) * 0.15),
            1
        )
        readiness_score = min(max(readiness_score, 45.0), 98.0)

        # Radar chart metrics (Clarity, Fluency, Vocabulary, Confidence, Structure)
        radar_metrics = [
            {"subject": "Clarity", "value": avg_clarity, "fullMark": 100},
            {"subject": "Fluency", "value": avg_fluency, "fullMark": 100},
            {"subject": "Vocabulary", "value": avg_vocabulary, "fullMark": 100},
            {"subject": "Confidence", "value": avg_confidence, "fullMark": 100},
            {"subject": "Structure", "value": round((avg_clarity * 0.5 + avg_confidence * 0.5), 1), "fullMark": 100},
        ]

        # Recent timeline points
        timeline: List[Dict[str, Any]] = []
        for p in reversed(recent_practices):
            timeline.append({
                "date": p.created_at.strftime("%b %d"),
                "score": p.overall_score,
                "wpm": p.wpm,
                "fillers": p.filler_words_count,
            })

        return {
            "readiness_score": readiness_score,
            "total_sessions": practice_count + interview_count + gd_count,
            "practice_sessions_count": practice_count,
            "interview_sessions_count": interview_count,
            "gd_sessions_count": gd_count,
            "daily_streak": user.daily_streak,
            "average_wpm": avg_wpm,
            "average_filler_words": avg_filler,
            "learning_progress_pct": learning_progress_pct,
            "radar_metrics": radar_metrics,
            "timeline": timeline,
        }

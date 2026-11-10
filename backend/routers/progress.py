from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.practice import PracticeSession
from backend.models.interview import InterviewSession
from backend.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/progress", tags=["Progress & Analytics"])


@router.get("/dashboard")
def get_dashboard_analytics(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    return AnalyticsService.get_user_dashboard_stats(db, user)


@router.get("/history")
def get_full_activity_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    practices = (
        db.query(PracticeSession)
        .filter(PracticeSession.user_id == user.id)
        .order_by(PracticeSession.created_at.desc())
        .limit(15)
        .all()
    )
    interviews = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "practices": [
            {
                "id": p.id,
                "title": p.title,
                "topic": p.topic,
                "mode": p.mode,
                "overall_score": p.overall_score,
                "wpm": p.wpm,
                "fillers": p.filler_words_count,
                "created_at": p.created_at.isoformat(),
            }
            for p in practices
        ],
        "interviews": [
            {
                "id": i.id,
                "title": i.title,
                "type": i.interview_type,
                "role": i.target_role,
                "overall_score": i.overall_score,
                "status": i.status,
                "created_at": i.created_at.isoformat(),
            }
            for i in interviews
        ]
    }

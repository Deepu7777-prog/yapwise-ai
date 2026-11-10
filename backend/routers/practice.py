import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.practice import PracticeSession
from backend.schemas.practice import PracticeCreateRequest, PracticeFeedbackResponse, PracticeSessionListItem
from backend.services.speech_service import SpeechService
from backend.services.gemini_service import gemini_service

router = APIRouter(prefix="/practice", tags=["Voice Practice"])


@router.post("/evaluate", response_model=PracticeFeedbackResponse)
def evaluate_speech_practice(
    req: PracticeCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript cannot be empty."
        )

    # 1. Analyze speech patterns: WPM and filler words
    wpm = SpeechService.calculate_wpm(req.transcript, req.audio_duration_seconds)
    total_fillers, filler_breakdown = SpeechService.analyze_filler_words(req.transcript)

    # 2. Evaluate with Gemini
    ai_result = gemini_service.evaluate_practice_speech(
        transcript=req.transcript,
        topic=req.topic,
        mode=req.mode,
        wpm=wpm,
        filler_count=total_fillers,
        filler_breakdown=filler_breakdown
    )

    # 3. Persist session
    session = PracticeSession(
        user_id=user.id,
        title=req.title or f"{req.mode.capitalize()} Practice",
        topic=req.topic,
        mode=req.mode,
        transcript=req.transcript,
        audio_duration_seconds=req.audio_duration_seconds,
        wpm=wpm,
        filler_words_count=total_fillers,
        filler_words_breakdown=json.dumps(filler_breakdown),
        clarity_score=ai_result.get("clarity_score", 85.0),
        fluency_score=ai_result.get("fluency_score", 82.0),
        vocabulary_score=ai_result.get("vocabulary_score", 80.0),
        confidence_score=ai_result.get("confidence_score", 83.0),
        relevance_score=ai_result.get("relevance_score", 88.0),
        overall_score=ai_result.get("overall_score", 84.0),
        feedback_summary=ai_result.get("feedback_summary", ""),
        strengths=json.dumps(ai_result.get("strengths", [])),
        weaknesses=json.dumps(ai_result.get("weaknesses", [])),
        recommendations=json.dumps(ai_result.get("recommendations", [])),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return PracticeFeedbackResponse(
        id=session.id,
        title=session.title,
        topic=session.topic,
        mode=session.mode,
        transcript=session.transcript,
        audio_duration_seconds=session.audio_duration_seconds,
        wpm=session.wpm,
        filler_words_count=session.filler_words_count,
        filler_words_breakdown=json.loads(session.filler_words_breakdown),
        clarity_score=session.clarity_score,
        fluency_score=session.fluency_score,
        vocabulary_score=session.vocabulary_score,
        confidence_score=session.confidence_score,
        relevance_score=session.relevance_score,
        overall_score=session.overall_score,
        feedback_summary=session.feedback_summary,
        strengths=json.loads(session.strengths),
        weaknesses=json.loads(session.weaknesses),
        recommendations=json.loads(session.recommendations),
        created_at=session.created_at,
    )


@router.get("/history", response_model=List[PracticeSessionListItem])
def list_practice_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(PracticeSession)
        .filter(PracticeSession.user_id == user.id)
        .order_by(PracticeSession.created_at.desc())
        .limit(20)
        .all()
    )
    return sessions


@router.get("/{session_id}", response_model=PracticeFeedbackResponse)
def get_practice_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = (
        db.query(PracticeSession)
        .filter(PracticeSession.id == session_id, PracticeSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return PracticeFeedbackResponse(
        id=session.id,
        title=session.title,
        topic=session.topic,
        mode=session.mode,
        transcript=session.transcript,
        audio_duration_seconds=session.audio_duration_seconds,
        wpm=session.wpm,
        filler_words_count=session.filler_words_count,
        filler_words_breakdown=json.loads(session.filler_words_breakdown),
        clarity_score=session.clarity_score,
        fluency_score=session.fluency_score,
        vocabulary_score=session.vocabulary_score,
        confidence_score=session.confidence_score,
        relevance_score=session.relevance_score,
        overall_score=session.overall_score,
        feedback_summary=session.feedback_summary,
        strengths=json.loads(session.strengths),
        weaknesses=json.loads(session.weaknesses),
        recommendations=json.loads(session.recommendations),
        created_at=session.created_at,
    )

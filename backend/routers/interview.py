import json
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.interview import InterviewSession, InterviewTurn
from backend.schemas.interview import (
    InterviewStartRequest,
    InterviewTurnRequest,
    InterviewTurnResponse,
    InterviewSummaryResponse,
    TurnItem,
)
from backend.services.gemini_service import gemini_service

router = APIRouter(prefix="/interview", tags=["Interviews (HR & Technical)"])


@router.post("/start", response_model=InterviewSummaryResponse)
def start_interview(
    req: InterviewStartRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    title = req.title or f"{'HR Behavioral' if req.interview_type == 'hr' else 'Technical Architecture'} Interview"
    session = InterviewSession(
        user_id=user.id,
        interview_type=req.interview_type,
        title=title,
        target_role=req.target_role or user.target_role or "Software Engineer",
        status="in_progress",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate initial question
    first_q = gemini_service.generate_interview_question(
        interview_type=session.interview_type,
        role=session.target_role,
        history=[]
    )

    first_turn = InterviewTurn(
        session_id=session.id,
        turn_index=1,
        role="interviewer",
        speaker_name=first_q.get("speaker_name", "Sarah (HR Lead)"),
        content=first_q.get("question", "Tell me about yourself and your background."),
        feedback=first_q.get("context_note", "")
    )
    db.add(first_turn)
    db.commit()
    db.refresh(session)

    return _build_interview_summary(session)


@router.post("/turn", response_model=InterviewTurnResponse)
def submit_interview_turn(
    req: InterviewTurnRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == req.session_id,
        InterviewSession.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    if session.status == "completed":
        raise HTTPException(status_code=400, detail="This interview has already concluded.")

    # Retrieve current turns
    existing_turns = (
        db.query(InterviewTurn)
        .filter(InterviewTurn.session_id == session.id)
        .order_by(InterviewTurn.turn_index.asc())
        .all()
    )
    last_turn = existing_turns[-1] if existing_turns else None
    last_question = last_turn.content if last_turn and last_turn.role == "interviewer" else "Question"

    # Evaluate user's answer
    evaluation = gemini_service.evaluate_interview_answer(
        interview_type=session.interview_type,
        question=last_question,
        answer=req.user_response,
        role=session.target_role
    )

    user_turn_index = len(existing_turns) + 1
    user_turn = InterviewTurn(
        session_id=session.id,
        turn_index=user_turn_index,
        role="candidate",
        speaker_name=user.full_name or "Candidate",
        content=req.user_response,
        score=evaluation.get("score", 82.0),
        feedback=evaluation.get("feedback", "Good communication."),
        star_analysis=evaluation.get("star_analysis", "")
    )
    db.add(user_turn)
    db.commit()
    db.refresh(user_turn)

    # Check if max questions reached (e.g. 4 questions = 8 turns total)
    is_finished = user_turn_index >= 8

    if not is_finished:
        # Build history for context
        history = [
            {"role": t.role, "speaker": t.speaker_name, "content": t.content}
            for t in existing_turns
        ]
        history.append({"role": "candidate", "speaker": user.full_name, "content": req.user_response})

        next_q_data = gemini_service.generate_interview_question(
            interview_type=session.interview_type,
            role=session.target_role,
            history=history
        )

        next_turn = InterviewTurn(
            session_id=session.id,
            turn_index=user_turn_index + 1,
            role="interviewer",
            speaker_name=next_q_data.get("speaker_name", "Interviewer"),
            content=next_q_data.get("question", "Can you elaborate further?"),
            feedback=next_q_data.get("context_note", "")
        )
        db.add(next_turn)
        db.commit()
        db.refresh(next_turn)
    else:
        # Conclude interview and compute scores
        session.status = "completed"
        session.completed_at = datetime.datetime.utcnow()
        candidate_turns = [
            t for t in existing_turns if t.role == "candidate"
        ] + [user_turn]
        scores = [t.score for t in candidate_turns if t.score is not None]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 80.0
        session.overall_score = avg_score
        session.clarity_score = min(100.0, avg_score + 2.0)
        session.structure_score = avg_score
        session.technical_accuracy_score = avg_score
        session.confidence_score = min(100.0, avg_score + 1.0)
        session.summary_feedback = f"Completed full {session.interview_type.upper()} simulation with an overall score of {avg_score}%. Strong articulation and technical communication."
        session.strengths = json.dumps(["Clear structure", "Practical situational examples", "Confident pace"])
        session.improvements = json.dumps(["Quantify impact with more precision", "Clarify fallback failure modes"])
        db.commit()

        next_turn = InterviewTurn(
            session_id=session.id,
            turn_index=user_turn_index + 1,
            role="interviewer",
            speaker_name="Interviewer",
            content="Thank you for taking the time to speak with me today! That concludes our interview session. You can review your comprehensive scorecard and feedback above.",
            feedback="Interview concluded successfully."
        )
        db.add(next_turn)
        db.commit()
        db.refresh(next_turn)

    return InterviewTurnResponse(
        turn_id=user_turn.id,
        session_id=session.id,
        user_turn=TurnItem.model_validate(user_turn),
        next_question=TurnItem.model_validate(next_turn),
        is_finished=is_finished,
    )


@router.get("/{session_id}", response_model=InterviewSummaryResponse)
def get_interview_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return _build_interview_summary(session)


def _build_interview_summary(session: InterviewSession) -> InterviewSummaryResponse:
    turns = [TurnItem.model_validate(t) for t in session.turns]
    strengths = json.loads(session.strengths) if session.strengths else []
    improvements = json.loads(session.improvements) if session.improvements else []

    return InterviewSummaryResponse(
        id=session.id,
        interview_type=session.interview_type,
        title=session.title,
        target_role=session.target_role,
        status=session.status,
        overall_score=session.overall_score,
        clarity_score=session.clarity_score,
        structure_score=session.structure_score,
        technical_accuracy_score=session.technical_accuracy_score,
        confidence_score=session.confidence_score,
        summary_feedback=session.summary_feedback,
        strengths=strengths,
        improvements=improvements,
        turns=turns,
        created_at=session.created_at,
        completed_at=session.completed_at,
    )

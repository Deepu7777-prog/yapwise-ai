import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.interview import GDSession, GDTurn
from backend.schemas.gd import (
    GDStartRequest,
    GDTurnRequest,
    GDTurnResponse,
    GDSessionResponse,
    GDTurnItem,
)
from backend.services.gemini_service import gemini_service

router = APIRouter(prefix="/gd", tags=["Group Discussion Arena"])

DEFAULT_GD_TOPICS = [
    "Is Artificial Intelligence accelerating workforce obsolescence or augmenting creative productivity?",
    "Should remote and asynchronous work become an internationally protected worker right?",
    "Monolithic vs. Microservices Architecture: Pragmatism vs. Premature Scalability in Startups",
    "Data Sovereignty vs. Globalized Cloud: Balancing National Security with Innovation",
]


@router.post("/start", response_model=GDSessionResponse)
def start_gd_session(
    req: GDStartRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import random
    topic = req.topic or random.choice(DEFAULT_GD_TOPICS)

    session = GDSession(
        user_id=user.id,
        topic=topic,
        category=req.category or "Tech Ethics & Leadership",
        status="in_progress",
        user_contributions_count=0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 1. Moderator sets the stage
    turn_1 = GDTurn(
        session_id=session.id,
        turn_index=1,
        speaker_name="Elena (Moderator)",
        speaker_role="moderator",
        content=f"Welcome everyone to today's panel discussion. Our topic is: '{topic}'. Let's maintain respectful dialogue, back our claims with reason, and work toward a meaningful synthesis. Priya, would you like to lead off?"
    )
    db.add(turn_1)

    # 2. Priya opens with advocate perspective
    turn_2 = GDTurn(
        session_id=session.id,
        turn_index=2,
        speaker_name="Priya (Advocate)",
        speaker_role="advocate",
        content="Thank you, Elena. From an industry vantage point, rapid innovation fundamentally redefines value creation. While disruptions require transitional retraining, historical precedent demonstrates that technological shifts unlock exponential new specialized opportunities rather than net reduction."
    )
    db.add(turn_2)

    # 3. Marcus counters with skeptical nuance
    turn_3 = GDTurn(
        session_id=session.id,
        turn_index=3,
        speaker_name="Marcus (Skeptic)",
        speaker_role="skeptic",
        content="While the macro view sounds promising, Priya, we cannot dismiss the immediate displacement friction, socio-economic lag, and ethical governance deficits. How do we ensure equitable redistribution before the transition gap widens?"
    )
    db.add(turn_3)
    db.commit()
    db.refresh(session)

    return _build_gd_response(session)


@router.post("/turn", response_model=GDTurnResponse)
def submit_gd_turn(
    req: GDTurnRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(GDSession).filter(
        GDSession.id == req.session_id,
        GDSession.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="GD session not found.")

    existing_turns = (
        db.query(GDTurn)
        .filter(GDTurn.session_id == session.id)
        .order_by(GDTurn.turn_index.asc())
        .all()
    )

    history = [{"speaker": t.speaker_name, "content": t.content} for t in existing_turns]

    # Generate AI panel response
    ai_feedback_data = gemini_service.generate_gd_responses(
        topic=session.topic,
        history=history,
        user_argument=req.user_argument
    )

    # Save user turn
    user_turn_index = len(existing_turns) + 1
    user_turn = GDTurn(
        session_id=session.id,
        turn_index=user_turn_index,
        speaker_name=f"{user.full_name} (You)",
        speaker_role="user",
        content=req.user_argument,
        feedback_for_user=ai_feedback_data.get("live_feedback", "Great entry point!")
    )
    db.add(user_turn)

    session.user_contributions_count += 1

    # Save AI participant replies
    ai_turns: List[GDTurn] = []
    reactions = ai_feedback_data.get("ai_reactions", [])
    current_index = user_turn_index
    for reaction in reactions:
        current_index += 1
        t = GDTurn(
            session_id=session.id,
            turn_index=current_index,
            speaker_name=reaction.get("speaker_name", "Participant"),
            speaker_role=reaction.get("speaker_role", "participant"),
            content=reaction.get("content", "I see what you mean.")
        )
        db.add(t)
        ai_turns.append(t)

    # Calculate evolving GD scores
    session.overall_score = min(96.0, 75.0 + (session.user_contributions_count * 5.0))
    session.leadership_score = min(95.0, 72.0 + (session.user_contributions_count * 6.0))
    session.active_listening_score = min(94.0, 78.0 + (session.user_contributions_count * 4.0))
    session.assertiveness_score = min(95.0, 76.0 + (session.user_contributions_count * 5.5))
    session.critical_thinking_score = min(96.0, 74.0 + (session.user_contributions_count * 5.0))
    session.summary_feedback = "Demonstrated strong group dynamics, active acknowledgment of counter-arguments, and persuasive synthesis."
    session.key_takeaways = json.dumps([
        "Acknowledged counter-arguments before defending main thesis",
        "Pivoted the debate toward actionable governance solutions",
        "Maintained diplomatic and composed vocal presence"
    ])

    db.commit()
    db.refresh(user_turn)
    for t in ai_turns:
        db.refresh(t)

    is_completed = session.user_contributions_count >= 3

    return GDTurnResponse(
        user_turn=GDTurnItem.model_validate(user_turn),
        ai_reactions=[GDTurnItem.model_validate(t) for t in ai_turns],
        live_feedback=ai_feedback_data.get("live_feedback", "Clear, assertive contribution."),
        is_completed=is_completed,
    )


@router.get("/{session_id}", response_model=GDSessionResponse)
def get_gd_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(GDSession).filter(
        GDSession.id == session_id,
        GDSession.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="GD session not found.")
    return _build_gd_response(session)


def _build_gd_response(session: GDSession) -> GDSessionResponse:
    turns = [GDTurnItem.model_validate(t) for t in session.turns]
    takeaways = json.loads(session.key_takeaways) if session.key_takeaways else []
    return GDSessionResponse(
        id=session.id,
        topic=session.topic,
        category=session.category,
        status=session.status,
        user_contributions_count=session.user_contributions_count,
        overall_score=session.overall_score,
        leadership_score=session.leadership_score,
        active_listening_score=session.active_listening_score,
        assertiveness_score=session.assertiveness_score,
        critical_thinking_score=session.critical_thinking_score,
        summary_feedback=session.summary_feedback,
        key_takeaways=takeaways,
        turns=turns,
        created_at=session.created_at,
    )

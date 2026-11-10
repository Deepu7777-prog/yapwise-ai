from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class InterviewStartRequest(BaseModel):
    interview_type: str = "hr"  # 'hr' or 'technical'
    title: Optional[str] = None
    target_role: Optional[str] = "Software Engineer"


class InterviewTurnRequest(BaseModel):
    session_id: int
    user_response: str
    audio_duration_seconds: Optional[float] = 0.0


class TurnItem(BaseModel):
    id: int
    turn_index: int
    role: str
    speaker_name: str
    content: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    star_analysis: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewTurnResponse(BaseModel):
    turn_id: int
    session_id: int
    user_turn: TurnItem
    next_question: TurnItem
    is_finished: bool = False


class InterviewSummaryResponse(BaseModel):
    id: int
    interview_type: str
    title: str
    target_role: str
    status: str
    overall_score: float
    clarity_score: float
    structure_score: float
    technical_accuracy_score: float
    confidence_score: float
    summary_feedback: str
    strengths: List[str]
    improvements: List[str]
    turns: List[TurnItem]
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

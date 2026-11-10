from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class GDStartRequest(BaseModel):
    topic: Optional[str] = None
    category: Optional[str] = "Tech Ethics & Society"


class GDTurnItem(BaseModel):
    id: int
    turn_index: int
    speaker_name: str
    speaker_role: str
    content: str
    feedback_for_user: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GDTurnRequest(BaseModel):
    session_id: int
    user_argument: str


class GDTurnResponse(BaseModel):
    user_turn: GDTurnItem
    ai_reactions: List[GDTurnItem]
    live_feedback: str
    is_completed: bool = False


class GDSessionResponse(BaseModel):
    id: int
    topic: str
    category: str
    status: str
    user_contributions_count: int
    overall_score: float
    leadership_score: float
    active_listening_score: float
    assertiveness_score: float
    critical_thinking_score: float
    summary_feedback: str
    key_takeaways: List[str]
    turns: List[GDTurnItem]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

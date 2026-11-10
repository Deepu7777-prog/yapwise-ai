from typing import List, Dict, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PracticeCreateRequest(BaseModel):
    title: Optional[str] = "Speech Practice"
    topic: Optional[str] = "General Impromptu"
    mode: Optional[str] = "extempore"
    transcript: str
    audio_duration_seconds: float = 30.0


class PracticeFeedbackResponse(BaseModel):
    id: int
    title: str
    topic: str
    mode: str
    transcript: str
    audio_duration_seconds: float
    wpm: float
    filler_words_count: int
    filler_words_breakdown: Dict[str, int]
    clarity_score: float
    fluency_score: float
    vocabulary_score: float
    confidence_score: float
    relevance_score: float
    overall_score: float
    feedback_summary: str
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PracticeSessionListItem(BaseModel):
    id: int
    title: str
    topic: str
    mode: str
    wpm: float
    filler_words_count: int
    overall_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

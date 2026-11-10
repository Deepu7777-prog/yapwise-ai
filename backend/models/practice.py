import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.core.database import Base


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), default="Speech Practice Session")
    topic = Column(String(255), default="General Communication")
    mode = Column(String(50), default="extempore")  # extempore, monologue, pacing, articulation
    transcript = Column(Text, nullable=False)
    audio_duration_seconds = Column(Float, default=0.0)
    wpm = Column(Float, default=0.0)  # words per minute
    filler_words_count = Column(Integer, default=0)
    filler_words_breakdown = Column(Text, default="{}")  # JSON string
    
    # 0-100 rubric scores
    clarity_score = Column(Float, default=0.0)
    fluency_score = Column(Float, default=0.0)
    vocabulary_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    relevance_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)

    feedback_summary = Column(Text, default="")
    strengths = Column(Text, default="[]")  # JSON list
    weaknesses = Column(Text, default="[]")  # JSON list
    recommendations = Column(Text, default="[]")  # JSON list

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="practice_sessions")

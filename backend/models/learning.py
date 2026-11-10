import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.core.database import Base


class LearningModule(Base):
    __tablename__ = "learning_modules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    module_key = Column(String(100), nullable=False)  # articulation, filler_words, star_method, tech_defense, confidence
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(50), default="Beginner")  # Beginner, Intermediate, Advanced
    category = Column(String(100), default="Vocal Dynamics")
    progress_percent = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    exercises_count = Column(Integer, default=5)
    completed_exercises_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="learning_modules")

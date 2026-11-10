import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.core.database import Base


class GoalReminder(Base):
    __tablename__ = "goal_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    daily_goal_minutes = Column(Integer, default=15)
    reminder_time = Column(String(10), default="09:00")  # HH:MM format
    days_of_week = Column(String(100), default='["Mon","Tue","Wed","Thu","Fri"]')  # JSON list
    notifications_enabled = Column(Boolean, default=True)
    sound_effects_enabled = Column(Boolean, default=True)
    selected_voice = Column(String(100), default="default")
    playback_speed = Column(String(10), default="1.0")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reminders")

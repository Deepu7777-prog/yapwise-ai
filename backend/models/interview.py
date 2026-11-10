import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.core.database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    interview_type = Column(String(50), default="hr")  # hr, technical
    title = Column(String(255), default="Interview Simulation")
    target_role = Column(String(100), default="Software Engineer")
    status = Column(String(50), default="in_progress")  # in_progress, completed
    
    overall_score = Column(Float, default=0.0)
    clarity_score = Column(Float, default=0.0)
    structure_score = Column(Float, default=0.0)  # STAR framework adherence
    technical_accuracy_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)

    summary_feedback = Column(Text, default="")
    strengths = Column(Text, default="[]")  # JSON array
    improvements = Column(Text, default="[]")  # JSON array

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="interviews")
    turns = relationship("InterviewTurn", back_populates="session", cascade="all, delete-orphan", order_by="InterviewTurn.turn_index")


class InterviewTurn(Base):
    __tablename__ = "interview_turns"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    turn_index = Column(Integer, default=0)
    role = Column(String(50), default="interviewer")  # interviewer, candidate
    speaker_name = Column(String(100), default="Interviewer")
    content = Column(Text, nullable=False)
    
    # Per-answer critique
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    star_analysis = Column(Text, nullable=True)  # JSON or text breakdown

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("InterviewSession", back_populates="turns")


class GDSession(Base):
    __tablename__ = "gd_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(255), nullable=False)
    category = Column(String(100), default="Business & Tech Ethics")
    status = Column(String(50), default="in_progress")
    user_contributions_count = Column(Integer, default=0)
    
    overall_score = Column(Float, default=0.0)
    leadership_score = Column(Float, default=0.0)
    active_listening_score = Column(Float, default=0.0)
    assertiveness_score = Column(Float, default=0.0)
    critical_thinking_score = Column(Float, default=0.0)

    summary_feedback = Column(Text, default="")
    key_takeaways = Column(Text, default="[]")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="gd_sessions")
    turns = relationship("GDTurn", back_populates="session", cascade="all, delete-orphan", order_by="GDTurn.turn_index")


class GDTurn(Base):
    __tablename__ = "gd_turns"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("gd_sessions.id"), nullable=False)
    turn_index = Column(Integer, default=0)
    speaker_name = Column(String(100), nullable=False)  # Moderator, Priya, Marcus, User
    speaker_role = Column(String(50), default="participant")  # moderator, advocate, skeptic, user
    content = Column(Text, nullable=False)
    feedback_for_user = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("GDSession", back_populates="turns")

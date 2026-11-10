from sqlalchemy.orm import Session
from backend.models.user import User
from backend.models.learning import LearningModule
from backend.models.reminder import GoalReminder
from backend.schemas.user import UserCreate
from backend.core.security import get_password_hash, verify_password


class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        return db.query(User).filter(User.email == email.lower()).first()

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        user = AuthService.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def create_user(db: Session, user_in: UserCreate) -> User:
        db_user = User(
            email=user_in.email.lower(),
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            target_role=user_in.target_role or "Software Engineer",
            experience_level=user_in.experience_level or "Mid-Level",
            daily_streak=1
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Seed initial learning modules for this user
        starter_modules = [
            {
                "module_key": "filler_words",
                "title": "Eliminating Filler Words & Vocal Pauses",
                "description": "Learn the 2-second tactical pause technique to replace 'um', 'uh', and 'like'.",
                "difficulty": "Beginner",
                "category": "Vocal Clarity",
                "exercises_count": 5,
            },
            {
                "module_key": "star_method",
                "title": "Mastering the STAR Framework",
                "description": "Deliver high-impact behavioral answers structuring Situation, Task, Action, and Result.",
                "difficulty": "Intermediate",
                "category": "Interview Strategy",
                "exercises_count": 6,
            },
            {
                "module_key": "pacing",
                "title": "Pacing & Modulation under Pressure",
                "description": "Maintain ideal 130-150 WPM cadence during high-stakes extempore and cross-examination.",
                "difficulty": "Beginner",
                "category": "Cadence & Pacing",
                "exercises_count": 4,
            },
            {
                "module_key": "gd_leadership",
                "title": "Assertive Interventions in Group Discussions",
                "description": "Politely enter intense discussions, synthesize divergent views, and lead consensus.",
                "difficulty": "Advanced",
                "category": "Group Dynamics",
                "exercises_count": 5,
            },
            {
                "module_key": "tech_defense",
                "title": "System Design Verbal Walkthroughs",
                "description": "Structure verbal architectural trade-offs, bottlenecks, and scalability choices clearly.",
                "difficulty": "Advanced",
                "category": "Technical Articulation",
                "exercises_count": 6,
            }
        ]
        for m in starter_modules:
            mod = LearningModule(user_id=db_user.id, **m)
            db.add(mod)

        # Seed default reminder preferences
        reminder = GoalReminder(
            user_id=db_user.id,
            daily_goal_minutes=15,
            reminder_time="09:00",
            days_of_week='["Mon","Tue","Wed","Thu","Fri"]',
            notifications_enabled=True,
            sound_effects_enabled=True,
            selected_voice="default",
            playback_speed="1.0"
        )
        db.add(reminder)
        db.commit()
        db.refresh(db_user)

        return db_user

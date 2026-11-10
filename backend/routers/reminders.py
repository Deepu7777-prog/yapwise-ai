import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.reminder import GoalReminder
from backend.schemas.reminder import GoalReminderUpdate, GoalReminderResponse

router = APIRouter(prefix="/reminders", tags=["Reminders & Settings"])


@router.get("/", response_model=GoalReminderResponse)
def get_user_reminders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(GoalReminder).filter(GoalReminder.user_id == user.id).first()
    if not reminder:
        reminder = GoalReminder(
            user_id=user.id,
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
        db.refresh(reminder)

    return GoalReminderResponse(
        id=reminder.id,
        user_id=reminder.user_id,
        daily_goal_minutes=reminder.daily_goal_minutes,
        reminder_time=reminder.reminder_time,
        days_of_week=json.loads(reminder.days_of_week),
        notifications_enabled=reminder.notifications_enabled,
        sound_effects_enabled=reminder.sound_effects_enabled,
        selected_voice=reminder.selected_voice,
        playback_speed=reminder.playback_speed,
        created_at=reminder.created_at,
        updated_at=reminder.updated_at,
    )


@router.put("/", response_model=GoalReminderResponse)
def update_user_reminders(
    req: GoalReminderUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(GoalReminder).filter(GoalReminder.user_id == user.id).first()
    if not reminder:
        reminder = GoalReminder(user_id=user.id)
        db.add(reminder)

    if req.daily_goal_minutes is not None:
        reminder.daily_goal_minutes = req.daily_goal_minutes
    if req.reminder_time is not None:
        reminder.reminder_time = req.reminder_time
    if req.days_of_week is not None:
        reminder.days_of_week = json.dumps(req.days_of_week)
    if req.notifications_enabled is not None:
        reminder.notifications_enabled = req.notifications_enabled
    if req.sound_effects_enabled is not None:
        reminder.sound_effects_enabled = req.sound_effects_enabled
    if req.selected_voice is not None:
        reminder.selected_voice = req.selected_voice
    if req.playback_speed is not None:
        reminder.playback_speed = req.playback_speed

    db.commit()
    db.refresh(reminder)

    return GoalReminderResponse(
        id=reminder.id,
        user_id=reminder.user_id,
        daily_goal_minutes=reminder.daily_goal_minutes,
        reminder_time=reminder.reminder_time,
        days_of_week=json.loads(reminder.days_of_week),
        notifications_enabled=reminder.notifications_enabled,
        sound_effects_enabled=reminder.sound_effects_enabled,
        selected_voice=reminder.selected_voice,
        playback_speed=reminder.playback_speed,
        created_at=reminder.created_at,
        updated_at=reminder.updated_at,
    )

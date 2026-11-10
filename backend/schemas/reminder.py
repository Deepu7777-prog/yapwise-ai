from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class GoalReminderUpdate(BaseModel):
    daily_goal_minutes: Optional[int] = 15
    reminder_time: Optional[str] = "09:00"
    days_of_week: Optional[List[str]] = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    notifications_enabled: Optional[bool] = True
    sound_effects_enabled: Optional[bool] = True
    selected_voice: Optional[str] = "default"
    playback_speed: Optional[str] = "1.0"


class GoalReminderResponse(BaseModel):
    id: int
    user_id: int
    daily_goal_minutes: int
    reminder_time: str
    days_of_week: List[str]
    notifications_enabled: bool
    sound_effects_enabled: bool
    selected_voice: str
    playback_speed: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

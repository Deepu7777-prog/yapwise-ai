from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LearningModuleResponse(BaseModel):
    id: int
    module_key: str
    title: str
    description: str
    difficulty: str
    category: str
    progress_percent: float
    is_completed: bool
    exercises_count: int
    completed_exercises_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LearningProgressUpdate(BaseModel):
    module_id: int
    completed_exercises_delta: int = 1

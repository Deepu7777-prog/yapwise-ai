from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.learning import LearningModule
from backend.schemas.learning import LearningModuleResponse, LearningProgressUpdate

router = APIRouter(prefix="/learning", tags=["Personalized Learning"])


@router.get("/modules", response_model=List[LearningModuleResponse])
def get_learning_modules(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    modules = (
        db.query(LearningModule)
        .filter(LearningModule.user_id == user.id)
        .order_by(LearningModule.id.asc())
        .all()
    )
    return modules


@router.post("/progress", response_model=LearningModuleResponse)
def update_module_progress(
    update: LearningProgressUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    module = (
        db.query(LearningModule)
        .filter(LearningModule.id == update.module_id, LearningModule.user_id == user.id)
        .first()
    )
    if not module:
        raise HTTPException(status_code=404, detail="Learning module not found.")

    module.completed_exercises_count = min(
        module.exercises_count,
        module.completed_exercises_count + update.completed_exercises_delta
    )
    module.progress_percent = round(
        (module.completed_exercises_count / module.exercises_count) * 100.0, 1
    )
    if module.completed_exercises_count >= module.exercises_count:
        module.is_completed = True

    db.commit()
    db.refresh(module)
    return module

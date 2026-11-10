from backend.routers.auth import router as auth_router
from backend.routers.practice import router as practice_router
from backend.routers.interview import router as interview_router
from backend.routers.gd import router as gd_router
from backend.routers.learning import router as learning_router
from backend.routers.progress import router as progress_router
from backend.routers.reminders import router as reminders_router

__all__ = [
    "auth_router",
    "practice_router",
    "interview_router",
    "gd_router",
    "learning_router",
    "progress_router",
    "reminders_router",
]

import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.database import Base, engine
import backend.models  # Ensure all SQLAlchemy models are registered
from backend.routers import (
    auth_router,
    practice_router,
    interview_router,
    gd_router,
    learning_router,
    progress_router,
    reminders_router,
)
from backend.routers.section5 import router as section5_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables automatically
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com|.*\.trycloudflare\.com)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers (mounted at both /api and /api/v1 for universal frontend compatibility)
for prefix in ["/api", settings.API_V1_STR]:
    app.include_router(auth_router, prefix=prefix)
    app.include_router(practice_router, prefix=prefix)
    app.include_router(interview_router, prefix=prefix)
    app.include_router(gd_router, prefix=prefix)
    app.include_router(learning_router, prefix=prefix)
    app.include_router(progress_router, prefix=prefix)
    app.include_router(reminders_router, prefix=prefix)
    app.include_router(section5_router, prefix=prefix)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {str(exc)}", "type": type(exc).__name__}
    )


@app.get("/api/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to YapWise AI API - Intelligent Speech, Voice Interview & Communication Platform",
        "documentation": f"{settings.API_V1_STR}/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

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


import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.isdir(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("redoc"):
            return JSONResponse(status_code=404, content={"detail": f"Not Found: /{full_path}"})
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend index.html not found"})
else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "message": "Welcome to YapWise AI API - Intelligent Speech, Voice Interview & Communication Platform",
            "documentation": f"{settings.API_V1_STR}/docs",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

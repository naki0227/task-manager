from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, tasks, skills, stats

settings = get_settings()

app = FastAPI(
    title="Vision API",
    description="自律型ライフOS バックエンド",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(skills.router, prefix="/api", tags=["Skills"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])


@app.get("/")
async def root():
    return {"message": "Vision API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

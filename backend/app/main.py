from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db
from app.routers import auth, tasks, skills, stats, login, users, google, github, slack, chat, linear, system, snapshots, todoist, notion, sync, rag, proposals, autonomy, gmail

# Settings
settings = get_settings()

app = FastAPI(
    title="DreamCatcher API",
    description="DreamCatcher - AI-Powered Life OS",
    version="0.1.0",
)

# Sentry Init
import sentry_sdk
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup():
    init_db()
    from app.migration import run_migrations
    run_migrations()
    
    # Init Redis
    from app.core.redis import redis_client
    await redis_client.init_redis()
    
    # Register Event Listeners
    
    # Register Event Listeners
    from app.listeners import register_listeners
    register_listeners()

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(login.router, prefix="/auth", tags=["Login"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(skills.router, prefix="/api", tags=["Skills"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(system.router, prefix="/api/system", tags=["System"])
app.include_router(snapshots.router, prefix="/api", tags=["Snapshots"]) # New
app.include_router(google.router, prefix="/api", tags=["Google"])
app.include_router(github.router, prefix="/api", tags=["GitHub"])
app.include_router(slack.router, tags=["Slack"])
app.include_router(linear.router, prefix="/api", tags=["Linear"])
app.include_router(todoist.router, prefix="/api", tags=["Todoist"])
app.include_router(notion.router, prefix="/api", tags=["Notion"])
app.include_router(sync.router, prefix="/api", tags=["Sync"])
app.include_router(rag.router, prefix="/api", tags=["RAG"])
app.include_router(proposals.router, prefix="/api", tags=["Proposals"])
app.include_router(autonomy.router, prefix="/api", tags=["Autonomy"])
app.include_router(gmail.router, prefix="/api", tags=["Gmail"])

@app.on_event("shutdown")
async def shutdown():
    from app.core.redis import redis_client
    await redis_client.close_redis()


@app.get("/")
async def root():
    return {"message": "Vision API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

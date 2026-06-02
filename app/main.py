import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import alembic.config
import alembic.command

from app.database import engine, AsyncSessionLocal
from app.routers import transactions, summary, gst, udhar, export, nlp
from app.websockets import manager
from seed import seed_data
from app.models import User
from sqlalchemy.future import select

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Check DB Connection
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("Database connected successfully.")
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise e

    # Migrations will be run manually via CLI to avoid event loop conflicts

    # 3. Handle Demo Mode Seeding
    if os.getenv("DEMO_MODE", "false").lower() == "true":
        async with AsyncSessionLocal() as session:
            # Check if demo user exists
            demo_user_id = 1
            result = await session.execute(select(User).where(User.id == demo_user_id))
            user = result.scalar_one_or_none()
            if not user:
                print("DEMO_MODE is true and DB is empty. Running seed script...")
                await seed_data()
            else:
                print("Demo user already exists. Skipping seed.")
                
    yield
    
    # Shutdown events
    await engine.dispose()

app = FastAPI(title="VoiceKhata Core API", version="1.0.0", lifespan=lifespan)

# Rate Limiting Configuration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS setup
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
RAILWAY_DOMAIN = "https://voicekhata-demo.up.railway.app" # Placeholder prod domain

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, RAILWAY_DOMAIN, "http://localhost:5173", "http://localhost:8000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(transactions.router)
app.include_router(summary.router)
app.include_router(gst.router)
app.include_router(udhar.router)
app.include_router(export.router)
app.include_router(nlp.router)

@app.get("/")
def root():
    return {"message": "VoiceKhata API is running"}

@app.get("/health")
async def health_check():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}

@app.websocket("/ws/transactions/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

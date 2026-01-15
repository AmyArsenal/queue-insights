"""
Queue Insights API
==================
FastAPI backend for the Queue Insights application.

Run with: uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import create_db_and_tables
from app.routes import projects_router, stats_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: create tables if they don't exist
    create_db_and_tables()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="Queue Insights API",
    description="API for exploring US interconnection queue data from LBNL Queued Up dataset",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",
        "https://queue-insights.vercel.app",  # Production (future)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects_router)
app.include_router(stats_router)


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": "Queue Insights API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check for monitoring"""
    return {"status": "ok"}

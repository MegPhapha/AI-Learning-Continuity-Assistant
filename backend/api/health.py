"""
Health check endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    backend: str
    demo_mode: bool


@router.get("/health", summary="Health check", description="Check if the API is running")
async def health_check() -> HealthResponse:
    """Check the health of the API service"""
    logger.info("Health check endpoint called")
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        backend="fastapi",
        demo_mode=True,  # Set to False in production
    )


@router.get("/ready", summary="Readiness check", description="Check if the API is ready to serve requests")
async def readiness_check():
    """Check if the API is ready to serve requests"""
    logger.info("Readiness check endpoint called")
    return {"status": "ready", "timestamp": datetime.now().isoformat()}


@router.get("/demo-mode", summary="Demo mode status", description="Check if running in demo mode")
async def demo_mode_status():
    """Check if the system is running in demo mode"""
    return {"demo_mode": True, "message": "Running in demo mode - Backend connected but using simulated data"}

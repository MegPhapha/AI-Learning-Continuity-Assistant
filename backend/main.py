"""
AI Learning Continuity Assistant - FastAPI Backend
For students in conflict-affected and underserved communities, starting with Mali

This is the backend API for the AI Learning Continuity Assistant.
It provides RESTful endpoints for:
- Document management
- Chat functionality with RAG
- Teacher dashboard features
- User management
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
from pathlib import Path

# Initialize logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Learning Continuity Assistant API",
    description="Backend API for AI-powered learning assistant",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include API routers
from backend.api import documents, chat, teacher, admin, health, assignments

app.include_router(health.router, tags=["health"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["teacher"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {
        "name": "AI Learning Continuity Assistant API",
        "version": "1.0.0",
        "description": "Backend API for AI-powered learning assistant",
        "docs": "/api/docs",
        "health": "/api/health",
        "endpoints": {
            "documents": "/api/documents",
            "chat": "/api/chat",
            "teacher": "/api/teacher",
            "admin": "/api/admin",
        }
    }

@app.get("/")
async def root():
    """Root endpoint - redirects to API docs"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/api/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

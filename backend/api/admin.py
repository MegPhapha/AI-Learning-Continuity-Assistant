"""
Admin endpoints for system management
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()


class User(BaseModel):
    """User model"""
    id: str = Field(..., description="User ID")
    name: str = Field(..., description="User name")
    email: str = Field(..., description="User email")
    role: str = Field(..., description="User role: student, teacher, admin")
    created_at: datetime = Field(..., description="When user was created")
    last_login: Optional[datetime] = Field(default=None, description="Last login time")
    is_active: bool = Field(default=True, description="Whether user is active")


class UserCreate(BaseModel):
    """Create a new user"""
    name: str = Field(..., description="User name")
    email: str = Field(..., description="User email")
    password: str = Field(..., description="User password")
    role: str = Field(default="student", description="User role")


class UserUpdate(BaseModel):
    """Update user information"""
    name: Optional[str] = Field(default=None, description="User name")
    email: Optional[str] = Field(default=None, description="User email")
    role: Optional[str] = Field(default=None, description="User role")
    is_active: Optional[bool] = Field(default=None, description="Whether user is active")


class Config(BaseModel):
    """System configuration"""
    app_name: str = Field(default="AI Learning Continuity Assistant", description="Application name")
    demo_mode: bool = Field(default=True, description="Whether running in demo mode")
    max_file_size: int = Field(default=10485760, description="Maximum file upload size in bytes")
    allowed_file_types: List[str] = Field(
        default=["pdf", "docx", "txt"],
        description="Allowed file types for upload"
    )
    default_language: str = Field(default="en", description="Default language")
    default_model: str = Field(default="mistral-tiny", description="Default AI model")
    inference_backend: str = Field(default="cloud", description="Inference backend: cloud or ollama")


class ConfigUpdate(BaseModel):
    """Update configuration"""
    app_name: Optional[str] = Field(default=None)
    demo_mode: Optional[bool] = Field(default=None)
    max_file_size: Optional[int] = Field(default=None)
    allowed_file_types: Optional[List[str]] = Field(default=None)
    default_language: Optional[str] = Field(default=None)
    default_model: Optional[str] = Field(default=None)
    inference_backend: Optional[str] = Field(default=None)


# Mock data for demo mode
DEMO_CONFIG = {
    "app_name": "AI Learning Continuity Assistant",
    "demo_mode": True,
    "max_file_size": 10485760,
    "allowed_file_types": ["pdf", "docx", "txt"],
    "default_language": "en",
    "default_model": "mistral-tiny",
    "inference_backend": "cloud",
}

DEMO_USERS = [
    {
        "id": "user-1",
        "name": "Demo Student",
        "email": "student@demo.com",
        "role": "student",
        "created_at": datetime.now(),
        "last_login": datetime.now(),
        "is_active": True,
    },
    {
        "id": "teacher-1",
        "name": "Demo Teacher",
        "email": "teacher@demo.com",
        "role": "teacher",
        "created_at": datetime.now(),
        "last_login": datetime.now(),
        "is_active": True,
    },
    {
        "id": "admin-1",
        "name": "Demo Admin",
        "email": "admin@demo.com",
        "role": "admin",
        "created_at": datetime.now(),
        "last_login": datetime.now(),
        "is_active": True,
    },
]


@router.get("/config", summary="Get system configuration", description="Get the current system configuration")
async def get_config() -> Config:
    """Get the current system configuration"""
    logger.info("Getting system configuration")
    
    return Config(
        app_name=DEMO_CONFIG["app_name"],
        demo_mode=DEMO_CONFIG["demo_mode"],
        max_file_size=DEMO_CONFIG["max_file_size"],
        allowed_file_types=DEMO_CONFIG["allowed_file_types"],
        default_language=DEMO_CONFIG["default_language"],
        default_model=DEMO_CONFIG["default_model"],
        inference_backend=DEMO_CONFIG["inference_backend"],
    )


@router.put("/config", summary="Update system configuration", description="Update the system configuration")
async def update_config(update: ConfigUpdate) -> Config:
    """Update the system configuration"""
    logger.info(f"Updating system configuration: {update}")
    
    # Update the config
    for key, value in update.dict().items():
        if value is not None:
            DEMO_CONFIG[key] = value
    
    return Config(
        app_name=DEMO_CONFIG["app_name"],
        demo_mode=DEMO_CONFIG["demo_mode"],
        max_file_size=DEMO_CONFIG["max_file_size"],
        allowed_file_types=DEMO_CONFIG["allowed_file_types"],
        default_language=DEMO_CONFIG["default_language"],
        default_model=DEMO_CONFIG["default_model"],
        inference_backend=DEMO_CONFIG["inference_backend"],
    )


@router.get("/users", summary="List all users", description="Get a list of all users")
async def list_users(role: Optional[str] = None) -> List[User]:
    """List all users, optionally filtered by role"""
    logger.info(f"Listing users with role filter: {role}")
    
    users = DEMO_USERS
    
    if role:
        users = [u for u in users if u["role"] == role]
    
    return [
        User(
            id=u["id"],
            name=u["name"],
            email=u["email"],
            role=u["role"],
            created_at=u["created_at"],
            last_login=u.get("last_login"),
            is_active=u.get("is_active", True),
        )
        for u in users
    ]


@router.post("/users", summary="Create a new user", description="Create a new user in the system")
async def create_user(user: UserCreate) -> User:
    """Create a new user"""
    logger.info(f"Creating new user: {user.email}")
    
    # Check if email already exists
    if any(u["email"] == user.email for u in DEMO_USERS):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create new user
    user_id = f"user-{len(DEMO_USERS) + 1}"
    new_user = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": datetime.now(),
        "last_login": None,
        "is_active": True,
    }
    
    DEMO_USERS.append(new_user)
    
    return User(
        id=new_user["id"],
        name=new_user["name"],
        email=new_user["email"],
        role=new_user["role"],
        created_at=new_user["created_at"],
        last_login=new_user.get("last_login"),
        is_active=new_user.get("is_active", True),
    )


@router.get("/users/{user_id}", summary="Get a specific user", description="Get information about a specific user")
async def get_user(user_id: str) -> User:
    """Get a specific user"""
    logger.info(f"Getting user: {user_id}")
    
    user = next((u for u in DEMO_USERS if u["id"] == user_id), None)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
        last_login=user.get("last_login"),
        is_active=user.get("is_active", True),
    )


@router.put("/users/{user_id}", summary="Update a user", description="Update user information")
async def update_user(user_id: str, update: UserUpdate) -> User:
    """Update a user"""
    logger.info(f"Updating user: {user_id}")
    
    user = next((u for u in DEMO_USERS if u["id"] == user_id), None)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update the user
    for key, value in update.dict().items():
        if value is not None:
            user[key] = value
    
    return User(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
        last_login=user.get("last_login"),
        is_active=user.get("is_active", True),
    )


@router.delete("/users/{user_id}", summary="Delete a user", description="Delete a user from the system")
async def delete_user(user_id: str) -> JSONResponse:
    """Delete a user"""
    logger.info(f"Deleting user: {user_id}")
    
    global DEMO_USERS
    initial_count = len(DEMO_USERS)
    DEMO_USERS = [u for u in DEMO_USERS if u["id"] != user_id]
    
    if len(DEMO_USERS) == initial_count:
        raise HTTPException(status_code=404, detail="User not found")
    
    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "User deleted successfully"}
    )


@router.get("/analytics", summary="Get system analytics", description="Get analytics and usage statistics")
async def get_analytics():
    """Get system analytics"""
    logger.info("Getting system analytics")
    
    # Mock analytics data
    return {
        "total_users": len(DEMO_USERS),
        "active_users": len([u for u in DEMO_USERS if u.get("is_active", True)]),
        "user_by_role": {
            "student": len([u for u in DEMO_USERS if u["role"] == "student"]),
            "teacher": len([u for u in DEMO_USERS if u["role"] == "teacher"]),
            "admin": len([u for u in DEMO_USERS if u["role"] == "admin"]),
        },
        "system_info": {
            "demo_mode": DEMO_CONFIG["demo_mode"],
            "inference_backend": DEMO_CONFIG["inference_backend"],
            "default_model": DEMO_CONFIG["default_model"],
        },
    }


@router.get("/health-check", summary="Admin health check", description="Admin-only health check with more details")
async def admin_health_check():
    """Admin health check with detailed information"""
    logger.info("Admin health check")
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "demo_mode": DEMO_CONFIG["demo_mode"],
        "system": {
            "users": len(DEMO_USERS),
            "documents": 4,  # Will be dynamic in real implementation
            "chats": 12,
        },
        "database": "in_memory",
        "ai_models": {
            "available": ["mistral-tiny", "mistral-small"],
            "loaded": DEMO_CONFIG["default_model"],
            "backend": DEMO_CONFIG["inference_backend"],
        },
    }


@router.post("/shutdown", summary="Shutdown the system", description="Shutdown the application (DANGEROUS)")
async def shutdown():
    """Shutdown the application - ADMIN ONLY"""
    logger.warning("Shutdown endpoint called!")
    
    # In production, this would actually shut down the server
    # For demo, we just return a message
    return {
        "success": False,
        "message": "Shutdown disabled in demo mode. In production, this would stop the server.",
    }

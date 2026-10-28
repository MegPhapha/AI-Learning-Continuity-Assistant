"""
Teacher dashboard endpoints
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging
from datetime import datetime

from backend.models.teacher import (
    TeacherStats,
    FlaggedResponse,
    FlaggedResponseCreate,
    FlaggedResponseReview,
    FlagReason,
    TeacherUser,
    TeacherDashboardStats,
)
from backend.api.documents import DEMO_DOCUMENTS

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for demo mode
_flagged_responses: List[dict] = []
_teacher_users: List[dict] = []


# Demo teacher users
DEMO_TEACHERS = [
    {
        "id": "teacher-1",
        "name": "Demo Teacher",
        "email": "teacher@demo.com",
        "role": "teacher",
        "created_at": datetime.now(),
        "last_login": datetime.now(),
        "documents_approved": 4,
        "documents_rejected": 0,
    }
]

# Demo flagged responses
DEMO_FLAGGED = [
    {
        "id": "flag-1",
        "session_id": "session-1",
        "message_id": "msg-3",
        "response": "The capital of France is London.",
        "document_id": "demo-french",
        "flagged_by": "student-1",
        "flagged_at": datetime.now(),
        "reason": FlagReason.INACCURATE_FACT,
        "verified": False,
        "reviewed_by": None,
        "reviewed_at": None,
        "action_taken": None,
        "is_resolved": False,
    }
]


@router.get("/stats", summary="Get teacher statistics", description="Get statistics for the teacher dashboard")
async def get_stats() -> TeacherStats:
    """Get teacher dashboard statistics"""
    logger.info("Getting teacher stats")
    
    # Count documents by status
    total_docs = len(DEMO_DOCUMENTS)
    approved_docs = len([d for d in DEMO_DOCUMENTS if d["status"] == "approved"])
    pending_docs = len([d for d in DEMO_DOCUMENTS if d["status"] == "pending"])
    rejected_docs = len([d for d in DEMO_DOCUMENTS if d["status"] == "rejected"])
    
    return TeacherStats(
        total_documents=total_docs,
        approved_documents=approved_docs,
        pending_documents=pending_docs,
        rejected_documents=rejected_docs,
        total_chats=12,
        flagged_responses=len(DEMO_FLAGGED),
    )


@router.get("/dashboard", summary="Get full teacher dashboard", description="Get complete teacher dashboard data")
async def get_dashboard() -> TeacherDashboardStats:
    """Get complete teacher dashboard data"""
    logger.info("Getting full teacher dashboard")
    
    # Get basic stats
    stats = TeacherStats(
        total_documents=len(DEMO_DOCUMENTS),
        approved_documents=len([d for d in DEMO_DOCUMENTS if d["status"] == "approved"]),
        pending_documents=len([d for d in DEMO_DOCUMENTS if d["status"] == "pending"]),
        rejected_documents=len([d for d in DEMO_DOCUMENTS if d["status"] == "rejected"]),
        total_chats=12,
        flagged_responses=len(DEMO_FLAGGED),
    )
    
    # Recent activity
    recent_activity = [
        {
            "type": "document_upload",
            "document_name": "French Curriculum - Grade 3",
            "timestamp": datetime.now(),
            "user": "Teacher Demo",
        },
        {
            "type": "document_approved",
            "document_name": "Mathematics Curriculum - Grade 3",
            "timestamp": datetime.now(),
            "user": "Teacher Demo",
        },
        {
            "type": "flagged_response",
            "message": "The capital of France is London.",
            "timestamp": datetime.now(),
            "user": "Student Demo",
        },
    ]
    
    # Popular documents
    popular_documents = [
        {
            "id": "demo-math",
            "name": "Mathematics Curriculum - Grade 3",
            "usage_count": 45,
            "last_used": datetime.now(),
        },
        {
            "id": "demo-science",
            "name": "Science Curriculum - Grade 3",
            "usage_count": 32,
            "last_used": datetime.now(),
        },
        {
            "id": "demo-health",
            "name": "Health Education - Grade 3",
            "usage_count": 28,
            "last_used": datetime.now(),
        },
    ]
    
    # Chat trends
    chat_trends = [
        {"month": "Jan", "sessions": 120},
        {"month": "Feb", "sessions": 145},
        {"month": "Mar", "sessions": 180},
        {"month": "Apr", "sessions": 205},
        {"month": "May", "sessions": 240},
        {"month": "Jun", "sessions": 280},
    ]
    
    return TeacherDashboardStats(
        teacher_stats=stats,
        recent_activity=recent_activity,
        popular_documents=popular_documents,
        chat_trends=chat_trends,
    )


@router.get("/flagged", summary="Get flagged responses", description="Get a list of flagged AI responses")
async def get_flagged_responses(
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[FlaggedResponse]:
    """Get flagged responses that need review"""
    logger.info(f"Getting flagged responses with status: {status}")
    
    responses = DEMO_FLAGGED
    
    if status:
        if status == "resolved":
            responses = [r for r in responses if r.get("is_resolved")]
        elif status == "unresolved":
            responses = [r for r in responses if not r.get("is_resolved")]
    
    return [
        FlaggedResponse(
            id=r["id"],
            session_id=r["session_id"],
            message_id=r["message_id"],
            response=r["response"],
            document_id=r.get("document_id"),
            flagged_by=r.get("flagged_by"),
            flagged_at=r["flagged_at"],
            reason=r["reason"],
            verified=r["verified"],
            reviewed_by=r.get("reviewed_by"),
            reviewed_at=r.get("reviewed_at"),
            action_taken=r.get("action_taken"),
            is_resolved=r.get("is_resolved", False),
        )
        for r in responses[offset:offset + limit]
    ]


@router.post("/flagged", summary="Create a flagged response", description="Flag an AI response for review")
async def create_flagged_response(flag: FlaggedResponseCreate) -> FlaggedResponse:
    """Flag an AI response for teacher review"""
    logger.info(f"Creating flagged response: {flag.message_id}")
    
    flag_id = f"flag-{len(DEMO_FLAGGED) + 1}"
    
    new_flag = {
        "id": flag_id,
        "session_id": flag.session_id,
        "message_id": flag.message_id,
        "response": flag.response,
        "document_id": flag.document_id,
        "flagged_by": "student",
        "flagged_at": datetime.now(),
        "reason": flag.reason,
        "verified": False,
        "reviewed_by": None,
        "reviewed_at": None,
        "action_taken": None,
        "is_resolved": False,
    }
    
    DEMO_FLAGGED.append(new_flag)
    
    return FlaggedResponse(
        id=new_flag["id"],
        session_id=new_flag["session_id"],
        message_id=new_flag["message_id"],
        response=new_flag["response"],
        document_id=new_flag.get("document_id"),
        flagged_by=new_flag.get("flagged_by"),
        flagged_at=new_flag["flagged_at"],
        reason=new_flag["reason"],
        verified=new_flag["verified"],
        is_resolved=new_flag["is_resolved"],
    )


@router.put("/flagged/{flag_id}", summary="Review a flagged response", description="Review and take action on a flagged response")
async def review_flagged_response(
    flag_id: str,
    review: FlaggedResponseReview,
) -> FlaggedResponse:
    """Review and take action on a flagged response"""
    logger.info(f"Reviewing flagged response: {flag_id}, action: {review.action}")
    
    # Find the flag
    flag = next((f for f in DEMO_FLAGGED if f["id"] == flag_id), None)
    
    if not flag:
        raise HTTPException(status_code=404, detail="Flagged response not found")
    
    # Update the flag
    flag["reviewed_by"] = "Current Teacher"
    flag["reviewed_at"] = datetime.now()
    flag["action_taken"] = review.action
    flag["is_resolved"] = True
    
    if review.action == "confirm":
        flag["verified"] = False  # Mark as unverified if confirmed as problematic
    
    return FlaggedResponse(
        id=flag["id"],
        session_id=flag["session_id"],
        message_id=flag["message_id"],
        response=flag["response"],
        document_id=flag.get("document_id"),
        flagged_by=flag.get("flagged_by"),
        flagged_at=flag["flagged_at"],
        reason=flag["reason"],
        verified=flag["verified"],
        reviewed_by=flag.get("reviewed_by"),
        reviewed_at=flag.get("reviewed_at"),
        action_taken=flag.get("action_taken"),
        is_resolved=flag.get("is_resolved", False),
    )


@router.delete("/flagged/{flag_id}", summary="Delete a flagged response", description="Remove a flagged response")
async def delete_flagged_response(flag_id: str) -> JSONResponse:
    """Delete a flagged response"""
    logger.info(f"Deleting flagged response: {flag_id}")
    
    global DEMO_FLAGGED
    initial_count = len(DEMO_FLAGGED)
    DEMO_FLAGGED = [f for f in DEMO_FLAGGED if f["id"] != flag_id]
    
    if len(DEMO_FLAGGED) == initial_count:
        raise HTTPException(status_code=404, detail="Flagged response not found")
    
    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Flagged response deleted successfully"}
    )


@router.get("/users", summary="Get teacher users", description="Get a list of teacher users")
async def get_teacher_users() -> List[TeacherUser]:
    """Get a list of teacher users"""
    logger.info("Getting teacher users")
    
    return [
        TeacherUser(
            id=t["id"],
            name=t["name"],
            email=t["email"],
            role=t["role"],
            created_at=t["created_at"],
            last_login=t.get("last_login"),
            documents_approved=t["documents_approved"],
            documents_rejected=t["documents_rejected"],
        )
        for t in DEMO_TEACHERS
    ]


@router.get("/users/me", summary="Get current teacher", description="Get information about the current teacher")
async def get_current_teacher() -> TeacherUser:
    """Get information about the current teacher"""
    logger.info("Getting current teacher")
    
    # In a real app, this would get the teacher from the authentication token
    # For demo, return the first teacher
    teacher = DEMO_TEACHERS[0]
    
    return TeacherUser(
        id=teacher["id"],
        name=teacher["name"],
        email=teacher["email"],
        role=teacher["role"],
        created_at=teacher["created_at"],
        last_login=teacher.get("last_login"),
        documents_approved=teacher["documents_approved"],
        documents_rejected=teacher["documents_rejected"],
    )


@router.get("/recent-activity", summary="Get recent activity", description="Get recent activity for the teacher")
async def get_recent_activity(limit: int = 10):
    """Get recent activity"""
    logger.info("Getting recent activity")
    
    # Mock recent activity
    activity = [
        {
            "type": "document_upload",
            "document_name": "French Curriculum - Grade 3",
            "timestamp": datetime.now(),
            "user": "Teacher Demo",
        },
        {
            "type": "document_approved",
            "document_name": "Mathematics Curriculum - Grade 3",
            "timestamp": datetime.now(),
            "user": "Teacher Demo",
        },
        {
            "type": "flagged_response",
            "message": "The capital of France is London.",
            "timestamp": datetime.now(),
            "user": "Student Demo",
        },
        {
            "type": "document_approved",
            "document_name": "Science Curriculum - Grade 3",
            "timestamp": datetime.now(),
            "user": "Teacher Demo",
        },
        {
            "type": "document_approved",
            "document_name": "Health Education - Grade 3",
            "timestamp": datetime.now(),
            "user": "Teacher Demo",
        },
    ]
    
    return activity[:limit]

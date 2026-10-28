"""
Data models for teacher dashboard
"""

from pydantic import Field

from .base import CamelModel
from datetime import datetime
from typing import Optional, List
from enum import Enum


class FlagReason(str, Enum):
    INACCURATE_FACT = "inaccurate_fact"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    UNSUPPORTED_CLAIM = "unsupported_claim"
    GRAMMAR_ERROR = "grammar_error"
    OTHER = "other"


class TeacherStats(CamelModel):
    """Statistics for teacher dashboard"""
    total_documents: int = Field(..., description="Total number of documents")
    approved_documents: int = Field(..., description="Number of approved documents")
    pending_documents: int = Field(..., description="Number of pending documents")
    rejected_documents: int = Field(..., description="Number of rejected documents")
    total_chats: int = Field(..., description="Total number of chat sessions")
    flagged_responses: int = Field(..., description="Number of flagged responses")
    active_users: int = Field(default=0, description="Number of active users")
    most_popular_subject: Optional[str] = Field(default=None, description="Most popular subject")


class FlaggedResponse(CamelModel):
    """A flagged AI response"""
    id: str = Field(..., description="Flag ID")
    session_id: str = Field(..., description="Session ID")
    message_id: str = Field(..., description="Message ID")
    response: str = Field(..., description="The flagged response content")
    document_id: Optional[str] = Field(default=None, description="Document ID")
    flagged_by: Optional[str] = Field(default=None, description="Who flagged the response")
    flagged_at: datetime = Field(..., description="When it was flagged")
    reason: FlagReason = Field(..., description="Reason for flagging")
    verified: bool = Field(..., description="Whether the response was verified")
    reviewed_by: Optional[str] = Field(default=None, description="Who reviewed the flag")
    reviewed_at: Optional[datetime] = Field(default=None, description="When it was reviewed")
    action_taken: Optional[str] = Field(default=None, description="Action taken on the flag")
    is_resolved: bool = Field(default=False, description="Whether the flag is resolved")


class FlaggedResponseCreate(CamelModel):
    """Create a flagged response"""
    session_id: str = Field(..., description="Session ID")
    message_id: str = Field(..., description="Message ID")
    response: str = Field(..., description="The response content")
    document_id: Optional[str] = Field(default=None, description="Document ID")
    reason: FlagReason = Field(..., description="Reason for flagging")


class FlaggedResponseReview(CamelModel):
    """Review a flagged response"""
    action: str = Field(..., description="Action to take: dismiss, confirm, edit")
    notes: Optional[str] = Field(default=None, description="Review notes")


class DocumentReview(CamelModel):
    """Review for a document"""
    document_id: str = Field(..., description="Document ID")
    reviewed_by: str = Field(..., description="Teacher who reviewed")
    reviewed_at: datetime = Field(..., description="When reviewed")
    notes: Optional[str] = Field(default=None, description="Review notes")
    quality_score: Optional[int] = Field(default=None, ge=1, le=5, description="Quality score 1-5")


class TeacherUser(CamelModel):
    """Teacher user model"""
    id: str = Field(..., description="Teacher ID")
    name: str = Field(..., description="Teacher name")
    email: str = Field(..., description="Teacher email")
    role: str = Field(default="teacher", description="Role: teacher or admin")
    created_at: datetime = Field(..., description="When user was created")
    last_login: Optional[datetime] = Field(default=None, description="Last login time")
    documents_approved: int = Field(default=0, description="Number of documents approved")
    documents_rejected: int = Field(default=0, description="Number of documents rejected")


class TeacherDashboardStats(CamelModel):
    """Extended stats for teacher dashboard"""
    teacher_stats: TeacherStats = Field(..., description="Basic stats")
    recent_activity: List[dict] = Field(default_factory=list, description="Recent activity")
    popular_documents: List[dict] = Field(default_factory=list, description="Most popular documents")
    chat_trends: List[dict] = Field(default_factory=list, description="Chat usage trends")

"""
Data models for chat and AI responses
"""

from pydantic import Field

from .base import CamelModel
from typing import Optional, List
from datetime import datetime


class SourceReference(CamelModel):
    """Reference to a source document"""
    doc_name: str = Field(..., description="Name of the source document")
    page: Optional[int] = Field(default=None, description="Page number in the document")
    chunk_id: Optional[str] = Field(default=None, description="ID of the chunk")


class Metadata(CamelModel):
    """Additional metadata for AI responses"""
    subject: Optional[str] = Field(default=None, description="Subject of the response")
    difficulty: Optional[str] = Field(default=None, description="Difficulty level")
    practice_question: Optional[str] = Field(default=None, description="Generated practice question")
    feedback: Optional[str] = Field(default=None, description="Feedback on student's answer")
    revision_activity: Optional[str] = Field(default=None, description="Suggested revision activity")
    graded: Optional[bool] = Field(default=False, description="Whether this response grades a student's attempt")
    correct: Optional[bool] = Field(default=None, description="Whether the graded attempt was correct")
    awaiting_attempt: Optional[bool] = Field(default=False, description="Whether the tutor is waiting for the student to attempt the practice question")


class MessageBase(CamelModel):
    """Base message model"""
    role: str = Field(..., description="Role of the sender: user or assistant")
    content: str = Field(..., description="Content of the message")


class MessageCreate(MessageBase):
    """Message for creation"""
    pass


class MessageResponse(MessageBase):
    """Complete message response"""
    id: str = Field(..., description="Unique message ID")
    timestamp: datetime = Field(..., description="When the message was sent")
    is_streaming: Optional[bool] = Field(default=False, description="Whether the message is being streamed")
    verified: Optional[bool] = Field(default=None, description="Whether the answer is verified from curriculum")
    sources: Optional[List[SourceReference]] = Field(default=None, description="Source references")
    metadata: Optional[Metadata] = Field(default=None, description="Additional metadata")


class AIRequest(CamelModel):
    """Request to generate an AI response"""
    document_id: Optional[str] = Field(default=None, description="ID of the document to use as context")
    message: str = Field(..., min_length=1, max_length=2000, description="User's message or question")
    language: str = Field(default="en", description="Preferred language for response")
    session_id: Optional[str] = Field(default=None, description="Session ID for conversation context")
    attempting: Optional[str] = Field(default=None, description="Practice question the student is currently attempting (set by the client)")
    attempting: Optional[str] = Field(default=None, description="Practice question the student is currently attempting (set by the client)")
    conversation_history: Optional[List[MessageBase]] = Field(default=None, description="Previous messages in the conversation")


class AIResponse(CamelModel):
    """AI-generated response"""
    content: str = Field(..., description="Generated content")
    sources: Optional[List[SourceReference]] = Field(default=None, description="Source references")
    verified: bool = Field(..., description="Whether the answer is verified from curriculum")
    metadata: Optional[Metadata] = Field(default=None, description="Additional metadata")
    session_id: Optional[str] = Field(default=None, description="Session ID")


class ChatSession(CamelModel):
    """Chat session model"""
    id: str = Field(..., description="Session ID")
    user_id: Optional[str] = Field(default=None, description="User ID")
    document_id: Optional[str] = Field(default=None, description="Current document ID")
    messages: List[MessageResponse] = Field(default_factory=list, description="Messages in the session")
    created_at: datetime = Field(..., description="When the session was created")
    updated_at: datetime = Field(..., description="When the session was last updated")
    title: Optional[str] = Field(default=None, description="Session title")


class ChatStartRequest(CamelModel):
    """Request to start a new chat session"""
    document_id: Optional[str] = Field(default=None, description="Document ID to start with")
    user_id: Optional[str] = Field(default=None, description="User ID")


class ChatStartResponse(CamelModel):
    """Response for starting a new chat session"""
    session_id: str = Field(..., description="New session ID")
    message: Optional[str] = Field(default=None, description="Welcome message")


class ConversationSummary(CamelModel):
    """Summary of a conversation"""
    session_id: str = Field(..., description="Session ID")
    document_name: Optional[str] = Field(default=None, description="Document name")
    message_count: int = Field(..., description="Number of messages")
    last_message: Optional[datetime] = Field(default=None, description="Last message timestamp")
    topics: List[str] = Field(default_factory=list, description="Topics discussed")

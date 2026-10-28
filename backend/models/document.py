"""
Data models for documents
"""

from pydantic import Field

from .base import CamelModel
from datetime import datetime
from typing import Optional, List
from enum import Enum


class DocumentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class FileType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"


class DocumentBase(CamelModel):
    name: str = Field(..., description="Name of the document")
    subject: str = Field(..., description="Subject of the document")
    grade: str = Field(..., description="Grade level")
    language: str = Field(default="en", description="Language of the document")
    file_type: FileType = Field(..., description="Type of the file")


class DocumentCreate(DocumentBase):
    pass


class DocumentMetadata(CamelModel):
    id: str
    name: str
    subject: str
    grade: str
    language: str
    file_type: FileType
    status: DocumentStatus
    uploaded_at: datetime
    size: int
    page_count: Optional[int] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None


class DocumentResponse(DocumentMetadata):
    file_path: Optional[str] = None
    content: Optional[str] = None
    chunks: Optional[List[dict]] = None
    word_count: Optional[int] = None


class DocumentListResponse(CamelModel):
    documents: List[DocumentResponse]
    count: int


class DocumentUploadResponse(CamelModel):
    success: bool
    document: Optional[DocumentResponse] = None
    message: Optional[str] = None
    error: Optional[str] = None


class DocumentStatusUpdate(CamelModel):
    status: DocumentStatus
    reason: Optional[str] = None  # For rejections


class ChunkMetadata(CamelModel):
    chunk_id: str
    text: str
    document_id: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    embeddings: Optional[List[float]] = None

"""
Document management endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Optional
import logging
import os
import tempfile
from datetime import datetime
from pathlib import Path
import uuid

from backend.models.document import (
    DocumentBase,
    DocumentResponse,
    DocumentListResponse,
    DocumentUploadResponse,
    DocumentStatus,
    DocumentStatusUpdate,
    FileType,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for demo mode (in production, use a database)
_demo_documents: List[dict] = []

# Demo documents data
DEMO_DOCUMENTS = [
    {
        "id": "demo-math",
        "name": "Mathematics Curriculum - Primary Grade 3",
        "subject": "Mathematics",
        "grade": "Grade 3",
        "language": "en",
        "file_type": "txt",
        "status": DocumentStatus.APPROVED,
        "uploaded_at": datetime.now(),
        "size": 5000,
        "page_count": 10,
        "approved_by": "Teacher Demo",
        "approved_at": datetime.now(),
        "file_path": None,
        "content": "Mathematics Curriculum for Grade 3...",
        "chunks": [],
    },
    {
        "id": "demo-science",
        "name": "Science Curriculum - Primary Grade 3",
        "subject": "Science",
        "grade": "Grade 3",
        "language": "en",
        "file_type": "txt",
        "status": DocumentStatus.APPROVED,
        "uploaded_at": datetime.now(),
        "size": 8000,
        "page_count": 15,
        "approved_by": "Teacher Demo",
        "approved_at": datetime.now(),
        "file_path": None,
        "content": "Science Curriculum for Grade 3...",
        "chunks": [],
    },
    {
        "id": "demo-french",
        "name": "French Curriculum - Primary Grade 3",
        "subject": "French",
        "grade": "Grade 3",
        "language": "fr",
        "file_type": "txt",
        "status": DocumentStatus.PENDING,
        "uploaded_at": datetime.now(),
        "size": 10000,
        "page_count": 12,
        "file_path": None,
        "content": "Programme de Français pour la classe 3...",
        "chunks": [],
    },
    {
        "id": "demo-health",
        "name": "Health Education - Primary Grade 3",
        "subject": "Health Education",
        "grade": "Grade 3",
        "language": "en",
        "file_type": "txt",
        "status": DocumentStatus.APPROVED,
        "uploaded_at": datetime.now(),
        "size": 7000,
        "page_count": 8,
        "approved_by": "Teacher Demo",
        "approved_at": datetime.now(),
        "file_path": None,
        "content": "Health Education Curriculum for Grade 3...",
        "chunks": [],
    },
]


def get_demo_documents():
    """Get demo documents"""
    return DEMO_DOCUMENTS


@router.get("", summary="List all documents", description="Get a list of all curriculum documents")
@router.get("/", summary="List all documents", description="Get a list of all curriculum documents")
async def list_documents(status: Optional[DocumentStatus] = None) -> DocumentListResponse:
    """List all documents, optionally filtered by status"""
    logger.info(f"Listing documents with status filter: {status}")
    
    documents = DEMO_DOCUMENTS
    
    if status:
        documents = [d for d in documents if d["status"] == status]
    
    # Convert to response models
    document_responses = [
        DocumentResponse(
            id=doc["id"],
            name=doc["name"],
            subject=doc["subject"],
            grade=doc["grade"],
            language=doc["language"],
            file_type=doc["file_type"],
            status=doc["status"],
            uploaded_at=doc["uploaded_at"],
            size=doc["size"],
            page_count=doc["page_count"],
            approved_by=doc.get("approved_by"),
            approved_at=doc.get("approved_at"),
            rejected_reason=doc.get("rejected_reason"),
            file_path=doc.get("file_path"),
            content=doc.get("content"),
            chunks=doc.get("chunks"),
        )
        for doc in documents
    ]
    
    return DocumentListResponse(
        documents=document_responses,
        count=len(document_responses)
    )


@router.get("/demo", summary="Get demo documents", description="Get pre-loaded demo documents")
async def get_demo_documents_endpoint() -> DocumentListResponse:
    """Get demo documents for students — only approved curricula"""
    logger.info("Getting demo documents")

    # Student-facing: only serve curricula a teacher has approved
    approved = [doc for doc in DEMO_DOCUMENTS if doc.get("status") == "approved"]
    document_responses = [
        DocumentResponse(
            id=doc["id"],
            name=doc["name"],
            subject=doc["subject"],
            grade=doc["grade"],
            language=doc["language"],
            file_type=doc["file_type"],
            status=doc["status"],
            uploaded_at=doc["uploaded_at"],
            size=doc["size"],
            page_count=doc["page_count"],
            approved_by=doc.get("approved_by"),
            approved_at=doc.get("approved_at"),
            file_path=doc.get("file_path"),
        )
        for doc in approved
    ]
    
    return DocumentListResponse(
        documents=document_responses,
        count=len(document_responses)
    )


@router.get("/{document_id}", summary="Get document by ID", description="Get a specific document by its ID")
async def get_document(document_id: str) -> DocumentResponse:
    """Get a document by its ID"""
    logger.info(f"Getting document with ID: {document_id}")
    
    doc = next((d for d in DEMO_DOCUMENTS if d["id"] == document_id), None)
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return DocumentResponse(
        id=doc["id"],
        name=doc["name"],
        subject=doc["subject"],
        grade=doc["grade"],
        language=doc["language"],
        file_type=doc["file_type"],
        status=doc["status"],
        uploaded_at=doc["uploaded_at"],
        size=doc["size"],
        page_count=doc["page_count"],
        approved_by=doc.get("approved_by"),
        approved_at=doc.get("approved_at"),
        rejected_reason=doc.get("rejected_reason"),
        file_path=doc.get("file_path"),
        content=doc.get("content"),
        chunks=doc.get("chunks"),
    )


@router.post("/upload", summary="Upload a document", description="Upload a new curriculum document")
async def upload_document(
    file: UploadFile = File(...),
    subject: str = Form(...),
    grade: str = Form(...),
    language: str = Form(default="en"),
) -> DocumentUploadResponse:
    """Upload a new document"""
    logger.info(f"Uploading document: {file.filename}, subject: {subject}, grade: {grade}")
    
    # Validate file type
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['pdf', 'docx', 'txt']:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF, DOCX, and TXT are allowed."
        )
    
    # In demo mode, simulate the upload
    # In production, you would:
    # 1. Save the file
    # 2. Process it (extract text, chunk, embed)
    # 3. Store metadata in database
    
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Create document record
        doc_id = f"upload-{uuid.uuid4().hex[:8]}"
        file_type_map = {'pdf': FileType.PDF, 'docx': FileType.DOCX, 'txt': FileType.TXT}
        
        new_doc = {
            "id": doc_id,
            "name": file.filename,
            "subject": subject,
            "grade": grade,
            "language": language,
            "file_type": file_type_map.get(file_extension, FileType.TXT),
            "status": DocumentStatus.PENDING,
            "uploaded_at": datetime.now(),
            "size": file_size,
            "page_count": 0,  # Will be calculated during processing
            "file_path": f"/uploads/{doc_id}",
            "content": content.decode('utf-8', errors='ignore')[:10000],  # First 10KB for demo
        }
        
        DEMO_DOCUMENTS.append(new_doc)
        
        logger.info(f"Document uploaded successfully: {doc_id}")
        
        return DocumentUploadResponse(
            success=True,
            document=DocumentResponse(
                id=new_doc["id"],
                name=new_doc["name"],
                subject=new_doc["subject"],
                grade=new_doc["grade"],
                language=new_doc["language"],
                file_type=new_doc["file_type"],
                status=new_doc["status"],
                uploaded_at=new_doc["uploaded_at"],
                size=new_doc["size"],
                page_count=new_doc["page_count"],
                file_path=new_doc["file_path"],
                content=new_doc["content"],
            ),
            message="Document uploaded successfully. It will be processed shortly."
        )
        
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.put("/{document_id}/status", summary="Update document status", description="Approve or reject a document")
async def update_document_status(
    document_id: str,
    status_update: DocumentStatusUpdate,
) -> DocumentResponse:
    """Update the status of a document (approve/reject)"""
    logger.info(f"Updating status for document {document_id} to {status_update.status}")
    
    # Find the document
    doc = next((d for d in DEMO_DOCUMENTS if d["id"] == document_id), None)
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update status
    doc["status"] = status_update.status
    
    if status_update.status == DocumentStatus.APPROVED:
        doc["approved_at"] = datetime.now()
        doc["approved_by"] = "Current Teacher"
        doc["rejected_reason"] = None
    elif status_update.status == DocumentStatus.REJECTED:
        doc["rejected_reason"] = status_update.reason or "Needs review"
        doc["approved_at"] = None
        doc["approved_by"] = None
    
    return DocumentResponse(
        id=doc["id"],
        name=doc["name"],
        subject=doc["subject"],
        grade=doc["grade"],
        language=doc["language"],
        file_type=doc["file_type"],
        status=doc["status"],
        uploaded_at=doc["uploaded_at"],
        size=doc["size"],
        page_count=doc["page_count"],
        approved_by=doc.get("approved_by"),
        approved_at=doc.get("approved_at"),
        rejected_reason=doc.get("rejected_reason"),
    )


@router.delete("/{document_id}", summary="Delete a document", description="Delete a document from the system")
async def delete_document(document_id: str) -> JSONResponse:
    """Delete a document"""
    logger.info(f"Deleting document with ID: {document_id}")
    
    global DEMO_DOCUMENTS
    
    # Find and remove the document
    initial_count = len(DEMO_DOCUMENTS)
    DEMO_DOCUMENTS = [d for d in DEMO_DOCUMENTS if d["id"] != document_id]
    
    if len(DEMO_DOCUMENTS) == initial_count:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Document deleted successfully"}
    )


@router.get("/{document_id}/download", summary="Download a document", description="Download the original document file")
async def download_document(document_id: str):
    """Download the original document file"""
    logger.info(f"Downloading document with ID: {document_id}")
    
    doc = next((d for d in DEMO_DOCUMENTS if d["id"] == document_id), None)
    
    if not doc or not doc.get("file_path"):
        raise HTTPException(status_code=404, detail="Document not found or file not available")
    
    # In demo mode, we don't have actual files
    # In production, you would return the file from storage
    raise HTTPException(
        status_code=501,
        detail="File download not implemented in demo mode"
    )


@router.get("/{document_id}/content", summary="Get document content", description="Get the extracted text content of a document")
async def get_document_content(document_id: str):
    """Get the extracted text content of a document"""
    logger.info(f"Getting content for document with ID: {document_id}")
    
    doc = next((d for d in DEMO_DOCUMENTS if d["id"] == document_id), None)
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": doc["id"],
        "name": doc["name"],
        "content": doc.get("content", ""),
        "word_count": len(doc.get("content", "").split()),
        "chunks": doc.get("chunks", []),
    }

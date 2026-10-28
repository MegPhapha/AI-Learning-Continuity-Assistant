"""
Data models for assignments and daily targets set by teachers
"""

from pydantic import Field

from .base import CamelModel
from datetime import datetime
from typing import Optional, List
from enum import Enum


class AssignmentType(str, Enum):
    DAILY_TARGET = "daily_target"
    ASSIGNMENT = "assignment"


class AssignmentStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    REVIEWED = "reviewed"


class Submission(CamelModel):
    """A student's submission for an assignment"""
    id: str = Field(..., description="Unique submission ID")
    student_name: str = Field(..., description="Name of the student")
    submitted_at: datetime = Field(..., description="When it was submitted")
    response: str = Field(..., description="The student's response or work")
    feedback: Optional[str] = Field(default=None, description="Teacher's feedback")
    grade: Optional[str] = Field(default=None, description="Grade given by the teacher")
    reviewed: bool = Field(default=False, description="Whether the teacher has reviewed it")


class Assignment(CamelModel):
    """An assignment or daily target set by a teacher"""
    id: str = Field(..., description="Unique assignment ID")
    type: AssignmentType = Field(..., description="daily_target or assignment")
    title: str = Field(..., description="Title of the assignment/target")
    description: str = Field(..., description="Instructions for students")
    subject: str = Field(..., description="Subject area")
    grade: str = Field(..., description="Grade level")
    language: str = Field(default="en", description="Language")
    target_value: Optional[int] = Field(default=None, description="Target count for daily targets (e.g. 5 questions)")
    due_date: Optional[datetime] = Field(default=None, description="Due date for assignments")
    status: AssignmentStatus = Field(default=AssignmentStatus.ACTIVE, description="Current status")
    created_at: datetime = Field(..., description="When it was created")
    created_by: str = Field(default="Teacher Demo", description="Teacher who created it")
    submissions: List[Submission] = Field(default_factory=list, description="Student submissions")


class AssignmentCreate(CamelModel):
    """Payload for creating an assignment or daily target"""
    type: AssignmentType
    title: str
    description: str
    subject: str
    grade: str
    language: str = "en"
    target_value: Optional[int] = None
    due_date: Optional[datetime] = None


class AssignmentUpdate(CamelModel):
    """Payload for updating an assignment"""
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    grade: Optional[str] = None
    target_value: Optional[int] = None
    due_date: Optional[datetime] = None
    status: Optional[AssignmentStatus] = None


class SubmissionReview(CamelModel):
    """Teacher's review of a student submission"""
    submission_id: str
    feedback: Optional[str] = None
    grade: Optional[str] = None
    approved: bool = True


class AssignmentListResponse(CamelModel):
    assignments: List[Assignment]
    count: int

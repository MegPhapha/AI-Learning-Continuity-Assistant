"""
Assignments & Daily Targets API

Teachers set daily targets and assignments for students, and review
student submissions. Uses in-memory storage for demo mode.
"""

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException

from backend.models.assignment import (
    Assignment,
    AssignmentCreate,
    AssignmentListResponse,
    AssignmentStatus,
    AssignmentUpdate,
    Submission,
    SubmissionReview,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for demo mode (in production, use a database)
DEMO_ASSIGNMENTS: list[Assignment] = [
    Assignment(
        id="target-math-questions",
        type="daily_target",
        title="Ask 5 math questions",
        description="Ask the AI tutor at least 5 questions about addition and subtraction today.",
        subject="Mathematics",
        grade="Grade 3",
        target_value=5,
        status="active",
        created_at=datetime.utcnow(),
        submissions=[
            Submission(
                id="sub-001",
                student_name="Aminata Traoré",
                submitted_at=datetime.utcnow(),
                response="I asked 5 questions: two about carrying in addition, two about subtraction with borrowing, and one about word problems.",
                reviewed=False,
            )
        ],
    ),
    Assignment(
        id="assignment-water-cycle",
        type="assignment",
        title="Draw and explain the water cycle",
        description="Draw the four stages of the water cycle and write one sentence explaining each stage.",
        subject="Science",
        grade="Grade 3",
        due_date=datetime.utcnow(),
        status="active",
        created_at=datetime.utcnow(),
        submissions=[
            Submission(
                id="sub-002",
                student_name="Moussa Diallo",
                submitted_at=datetime.utcnow(),
                response="Evaporation: the sun heats water. Condensation: clouds form. Precipitation: rain falls. Collection: water gathers in rivers.",
                feedback="Excellent work! You described all four stages clearly.",
                grade="A",
                reviewed=True,
            )
        ],
    ),
]


# French translations for the seeded assignments (served when language=fr)
FR_TRANSLATIONS: dict = {
    "target-math-questions": {
        "title": "Poser 5 questions de maths",
        "description": "Posez au moins 5 questions au tuteur IA sur l'addition et la soustraction aujourd'hui.",
        "subject": "Mathématiques",
        "grade": "Classe 3",
    },
    "assignment-water-cycle": {
        "title": "Dessiner et expliquer le cycle de l'eau",
        "description": "Dessinez les quatre étapes du cycle de l'eau et écrivez une phrase pour expliquer chaque étape.",
        "subject": "Sciences",
        "grade": "Classe 3",
    },
}


@router.get("", summary="List assignments and daily targets", description="Get all assignments and daily targets")
@router.get("/", summary="List assignments and daily targets", description="Get all assignments and daily targets")
async def list_assignments(type: str = None, status: str = None, language: str = "en") -> AssignmentListResponse:
    """List all assignments and daily targets, optionally filtered"""
    logger.info("Listing assignments")
    results = DEMO_ASSIGNMENTS
    if type:
        results = [a for a in results if a.type.value == type]
    if status:
        results = [a for a in results if a.status.value == status]
    if language == "fr":
        translated = []
        for a in results:
            fr_data = FR_TRANSLATIONS.get(a.id)
            if fr_data:
                a = a.model_copy(update=fr_data)
            translated.append(a)
        results = translated
    return AssignmentListResponse(assignments=results, count=len(results))


@router.post("", summary="Create an assignment or daily target", description="Set a new assignment or daily target for students")
@router.post("/", summary="Create an assignment or daily target", description="Set a new assignment or daily target for students")
async def create_assignment(payload: AssignmentCreate) -> Assignment:
    """Create a new assignment or daily target"""
    logger.info(f"Creating assignment: {payload.title}")
    assignment = Assignment(
        id=f"assignment-{uuid.uuid4().hex[:8]}",
        created_at=datetime.utcnow(),
        **payload.model_dump(),
    )
    DEMO_ASSIGNMENTS.append(assignment)
    return assignment


@router.get("/{assignment_id}", summary="Get an assignment", description="Get a specific assignment or daily target")
async def get_assignment(assignment_id: str) -> Assignment:
    """Get an assignment by ID"""
    assignment = next((a for a in DEMO_ASSIGNMENTS if a.id == assignment_id), None)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.put("/{assignment_id}", summary="Update an assignment", description="Update an assignment or daily target")
async def update_assignment(assignment_id: str, payload: AssignmentUpdate) -> Assignment:
    """Update an assignment or daily target"""
    assignment = next((a for a in DEMO_ASSIGNMENTS if a.id == assignment_id), None)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(assignment, field, value)
    return assignment


@router.put("/{assignment_id}/review", summary="Review a submission", description="Review a student's submission with feedback and a grade")
async def review_submission(assignment_id: str, payload: SubmissionReview) -> Assignment:
    """Review a student submission"""
    assignment = next((a for a in DEMO_ASSIGNMENTS if a.id == assignment_id), None)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submission = next((s for s in assignment.submissions if s.id == payload.submission_id), None)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission.feedback = payload.feedback
    submission.grade = payload.grade
    submission.reviewed = True

    # Mark the assignment reviewed once every submission is reviewed
    if all(s.reviewed for s in assignment.submissions):
        assignment.status = AssignmentStatus.REVIEWED

    return assignment


@router.delete("/{assignment_id}", summary="Delete an assignment", description="Delete an assignment or daily target")
async def delete_assignment(assignment_id: str) -> dict:
    """Delete an assignment or daily target"""
    global DEMO_ASSIGNMENTS
    initial_count = len(DEMO_ASSIGNMENTS)
    DEMO_ASSIGNMENTS = [a for a in DEMO_ASSIGNMENTS if a.id != assignment_id]

    if len(DEMO_ASSIGNMENTS) == initial_count:
        raise HTTPException(status_code=404, detail="Assignment not found")

    return {"success": True, "message": "Assignment deleted successfully"}

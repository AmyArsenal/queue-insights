from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from typing import Optional, List
from app.database import get_session
from app.models.queue_project import QueueProject, QueueProjectRead

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=List[QueueProjectRead])
def get_projects(
    session: Session = Depends(get_session),
    # Filters
    region: Optional[str] = Query(None, description="Filter by region (e.g., PJM, ERCOT)"),
    state: Optional[str] = Query(None, description="Filter by state (e.g., TX, CA)"),
    type_clean: Optional[str] = Query(None, description="Filter by fuel type (e.g., Solar, Wind)"),
    q_status: Optional[str] = Query(None, description="Filter by status (e.g., active, withdrawn)"),
    min_mw: Optional[float] = Query(None, description="Minimum capacity in MW"),
    max_mw: Optional[float] = Query(None, description="Maximum capacity in MW"),
    q_year: Optional[int] = Query(None, description="Filter by queue entry year"),
    # Pagination
    limit: int = Query(100, le=1000, description="Number of results to return"),
    offset: int = Query(0, description="Number of results to skip"),
):
    """
    Get list of queue projects with optional filters.

    Examples:
    - /api/projects?region=PJM&type_clean=Solar
    - /api/projects?state=TX&min_mw=100
    - /api/projects?q_status=active&limit=50
    """
    query = select(QueueProject)

    # Apply filters
    if region:
        query = query.where(QueueProject.region == region)
    if state:
        query = query.where(QueueProject.state == state)
    if type_clean:
        query = query.where(QueueProject.type_clean == type_clean)
    if q_status:
        query = query.where(QueueProject.q_status == q_status)
    if min_mw is not None:
        query = query.where(QueueProject.mw1 >= min_mw)
    if max_mw is not None:
        query = query.where(QueueProject.mw1 <= max_mw)
    if q_year:
        query = query.where(QueueProject.q_year == q_year)

    # Apply pagination
    query = query.offset(offset).limit(limit)

    results = session.exec(query).all()
    return results


@router.get("/{project_id}", response_model=QueueProjectRead)
def get_project(project_id: int, session: Session = Depends(get_session)):
    """Get a single project by ID"""
    project = session.get(QueueProject, project_id)
    if not project:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/search/", response_model=List[QueueProjectRead])
def search_projects(
    session: Session = Depends(get_session),
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(50, le=200),
):
    """
    Search projects by queue ID, project name, POI name, developer, or utility.

    Example: /api/projects/search/?q=NextEra
    """
    query = select(QueueProject).where(
        (QueueProject.q_id.ilike(f"%{q}%")) |
        (QueueProject.project_name.ilike(f"%{q}%")) |
        (QueueProject.poi_name.ilike(f"%{q}%")) |
        (QueueProject.developer.ilike(f"%{q}%")) |
        (QueueProject.utility.ilike(f"%{q}%"))
    ).limit(limit)

    results = session.exec(query).all()
    return results

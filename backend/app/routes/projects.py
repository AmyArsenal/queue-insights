from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from typing import Optional, List, Dict, Any
from app.database import get_session
from app.models.queue_project import QueueProject, QueueProjectRead

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/filter-options")
def get_filter_options(session: Session = Depends(get_session)) -> Dict[str, List[Any]]:
    """
    Get unique values for each filterable column.
    Used to populate filter dropdowns in the UI.
    """
    # Get unique regions
    regions = session.exec(
        select(QueueProject.region)
        .where(QueueProject.region.isnot(None))
        .distinct()
        .order_by(QueueProject.region)
    ).all()

    # Get unique states
    states = session.exec(
        select(QueueProject.state)
        .where(QueueProject.state.isnot(None))
        .distinct()
        .order_by(QueueProject.state)
    ).all()

    # Get unique types
    types = session.exec(
        select(QueueProject.type_clean)
        .where(QueueProject.type_clean.isnot(None))
        .distinct()
        .order_by(QueueProject.type_clean)
    ).all()

    # Get unique statuses
    statuses = session.exec(
        select(QueueProject.q_status)
        .where(QueueProject.q_status.isnot(None))
        .distinct()
        .order_by(QueueProject.q_status)
    ).all()

    # Get unique years
    years = session.exec(
        select(QueueProject.q_year)
        .where(QueueProject.q_year.isnot(None))
        .distinct()
        .order_by(QueueProject.q_year.desc())
    ).all()

    return {
        "regions": list(regions),
        "states": list(states),
        "types": list(types),
        "statuses": list(statuses),
        "years": list(years),
    }


@router.get("", response_model=List[QueueProjectRead])
def get_projects(
    session: Session = Depends(get_session),
    # Filters - support comma-separated values for multi-select
    region: Optional[str] = Query(None, description="Filter by region(s), comma-separated (e.g., PJM,ERCOT)"),
    state: Optional[str] = Query(None, description="Filter by state(s), comma-separated (e.g., TX,CA)"),
    type_clean: Optional[str] = Query(None, description="Filter by fuel type(s), comma-separated (e.g., Solar,Wind)"),
    q_status: Optional[str] = Query(None, description="Filter by status(es), comma-separated (e.g., active,withdrawn)"),
    q_year: Optional[str] = Query(None, description="Filter by year(s), comma-separated (e.g., 2023,2024)"),
    q_id: Optional[str] = Query(None, description="Filter by queue ID(s), comma-separated"),
    min_mw: Optional[float] = Query(None, description="Minimum capacity in MW"),
    max_mw: Optional[float] = Query(None, description="Maximum capacity in MW"),
    # Pagination
    limit: int = Query(100, le=1000, description="Number of results to return"),
    offset: int = Query(0, description="Number of results to skip"),
):
    """
    Get list of queue projects with optional filters.
    Supports multi-value filters using comma-separated values.

    Examples:
    - /api/projects?region=PJM,ERCOT&type_clean=Solar
    - /api/projects?state=TX,CA&min_mw=100
    - /api/projects?q_status=active,withdrawn&limit=50
    - /api/projects?q_year=2023,2024
    """
    query = select(QueueProject)

    # Apply filters - support comma-separated values for multi-select
    if region:
        regions = [r.strip() for r in region.split(",")]
        if len(regions) == 1:
            query = query.where(QueueProject.region == regions[0])
        else:
            query = query.where(QueueProject.region.in_(regions))

    if state:
        states = [s.strip() for s in state.split(",")]
        if len(states) == 1:
            query = query.where(QueueProject.state == states[0])
        else:
            query = query.where(QueueProject.state.in_(states))

    if type_clean:
        types = [t.strip() for t in type_clean.split(",")]
        if len(types) == 1:
            query = query.where(QueueProject.type_clean == types[0])
        else:
            query = query.where(QueueProject.type_clean.in_(types))

    if q_status:
        statuses = [s.strip() for s in q_status.split(",")]
        if len(statuses) == 1:
            query = query.where(QueueProject.q_status == statuses[0])
        else:
            query = query.where(QueueProject.q_status.in_(statuses))

    if q_year:
        years = [int(y.strip()) for y in q_year.split(",")]
        if len(years) == 1:
            query = query.where(QueueProject.q_year == years[0])
        else:
            query = query.where(QueueProject.q_year.in_(years))

    if q_id:
        q_ids = [q.strip() for q in q_id.split(",")]
        if len(q_ids) == 1:
            query = query.where(QueueProject.q_id == q_ids[0])
        else:
            query = query.where(QueueProject.q_id.in_(q_ids))

    if min_mw is not None:
        query = query.where(QueueProject.mw1 >= min_mw)
    if max_mw is not None:
        query = query.where(QueueProject.mw1 <= max_mw)

    # Get total count before pagination (for UI)
    # count_query = select(func.count()).select_from(query.subquery())
    # total_count = session.exec(count_query).one()

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

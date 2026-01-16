from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from typing import Dict, Any, List
from app.database import get_session
from app.models.queue_project import QueueProject

router = APIRouter(prefix="/api/stats", tags=["statistics"])


@router.get("")
def get_overview_stats(session: Session = Depends(get_session)) -> Dict[str, Any]:
    """
    Get overview statistics for the entire queue.

    Returns total projects, capacity, and breakdowns by region/type/status.
    """
    # Total projects
    total_projects = session.exec(
        select(func.count(QueueProject.id))
    ).one()

    # Total capacity
    total_capacity = session.exec(
        select(func.sum(QueueProject.mw1))
    ).one() or 0

    # Active projects and capacity
    active_projects = session.exec(
        select(func.count(QueueProject.id)).where(QueueProject.q_status == "active")
    ).one()

    active_capacity = session.exec(
        select(func.sum(QueueProject.mw1)).where(QueueProject.q_status == "active")
    ).one() or 0

    return {
        "total_projects": total_projects,
        "total_capacity_mw": round(total_capacity, 2),
        "total_capacity_gw": round(total_capacity / 1000, 2),
        "active_projects": active_projects,
        "active_capacity_mw": round(active_capacity, 2),
        "active_capacity_gw": round(active_capacity / 1000, 2),
    }


@router.get("/by-region")
def get_stats_by_region(session: Session = Depends(get_session)) -> List[Dict[str, Any]]:
    """Get project counts and capacity by ISO region"""
    results = session.exec(
        select(
            QueueProject.region,
            func.count(QueueProject.id).label("project_count"),
            func.sum(QueueProject.mw1).label("total_mw")
        )
        .where(QueueProject.region.isnot(None))
        .group_by(QueueProject.region)
        .order_by(func.sum(QueueProject.mw1).desc())
    ).all()

    return [
        {
            "region": r[0],
            "project_count": r[1],
            "total_mw": round(r[2] or 0, 2),
            "total_gw": round((r[2] or 0) / 1000, 2)
        }
        for r in results
    ]


@router.get("/by-type")
def get_stats_by_type(session: Session = Depends(get_session)) -> List[Dict[str, Any]]:
    """Get project counts and capacity by fuel type"""
    results = session.exec(
        select(
            QueueProject.type_clean,
            func.count(QueueProject.id).label("project_count"),
            func.sum(QueueProject.mw1).label("total_mw")
        )
        .where(QueueProject.type_clean.isnot(None))
        .group_by(QueueProject.type_clean)
        .order_by(func.sum(QueueProject.mw1).desc())
    ).all()

    return [
        {
            "type": r[0],
            "project_count": r[1],
            "total_mw": round(r[2] or 0, 2),
            "total_gw": round((r[2] or 0) / 1000, 2)
        }
        for r in results
    ]


@router.get("/by-status")
def get_stats_by_status(session: Session = Depends(get_session)) -> List[Dict[str, Any]]:
    """Get project counts and capacity by queue status"""
    results = session.exec(
        select(
            QueueProject.q_status,
            func.count(QueueProject.id).label("project_count"),
            func.sum(QueueProject.mw1).label("total_mw")
        )
        .where(QueueProject.q_status.isnot(None))
        .group_by(QueueProject.q_status)
        .order_by(func.count(QueueProject.id).desc())
    ).all()

    return [
        {
            "status": r[0],
            "project_count": r[1],
            "total_mw": round(r[2] or 0, 2),
            "total_gw": round((r[2] or 0) / 1000, 2)
        }
        for r in results
    ]


@router.get("/by-state")
def get_stats_by_state(session: Session = Depends(get_session)) -> List[Dict[str, Any]]:
    """Get project counts and capacity by state (for map visualization)"""
    results = session.exec(
        select(
            QueueProject.state,
            func.count(QueueProject.id).label("project_count"),
            func.sum(QueueProject.mw1).label("total_mw")
        )
        .where(QueueProject.state.isnot(None))
        .group_by(QueueProject.state)
        .order_by(func.sum(QueueProject.mw1).desc())
    ).all()

    return [
        {
            "state": r[0],
            "project_count": r[1],
            "total_mw": round(r[2] or 0, 2),
            "total_gw": round((r[2] or 0) / 1000, 2)
        }
        for r in results
    ]


@router.get("/by-year")
def get_stats_by_year(session: Session = Depends(get_session)) -> List[Dict[str, Any]]:
    """Get project counts and capacity by queue entry year"""
    results = session.exec(
        select(
            QueueProject.q_year,
            func.count(QueueProject.id).label("project_count"),
            func.sum(QueueProject.mw1).label("total_mw")
        )
        .where(QueueProject.q_year.isnot(None))
        .group_by(QueueProject.q_year)
        .order_by(QueueProject.q_year)
    ).all()

    return [
        {
            "year": r[0],
            "project_count": r[1],
            "total_mw": round(r[2] or 0, 2),
            "total_gw": round((r[2] or 0) / 1000, 2)
        }
        for r in results
    ]


@router.get("/withdrawn-by-year")
def get_withdrawn_by_year(
    session: Session = Depends(get_session),
    type_clean: str = None
) -> List[Dict[str, Any]]:
    """
    Get withdrawn projects by queue entry year.
    Great for analyzing withdrawal trends over time.

    Optional filter by fuel type (e.g., ?type_clean=Solar)
    """
    query = select(
        QueueProject.q_year,
        func.count(QueueProject.id).label("project_count"),
        func.sum(QueueProject.mw1).label("total_mw")
    ).where(
        QueueProject.q_status == "withdrawn",
        QueueProject.q_year.isnot(None)
    )

    if type_clean:
        query = query.where(QueueProject.type_clean == type_clean)

    query = query.group_by(QueueProject.q_year).order_by(QueueProject.q_year)
    results = session.exec(query).all()

    return [
        {
            "year": r[0],
            "withdrawn_count": r[1],
            "withdrawn_mw": round(r[2] or 0, 2),
            "withdrawn_gw": round((r[2] or 0) / 1000, 2)
        }
        for r in results
    ]


@router.get("/withdrawn-by-region")
def get_withdrawn_by_region(
    session: Session = Depends(get_session),
    q_year: int = None
) -> List[Dict[str, Any]]:
    """
    Get withdrawn projects by region.
    Optional filter by queue year (e.g., ?q_year=2023)
    """
    query = select(
        QueueProject.region,
        func.count(QueueProject.id).label("project_count"),
        func.sum(QueueProject.mw1).label("total_mw")
    ).where(
        QueueProject.q_status == "withdrawn",
        QueueProject.region.isnot(None)
    )

    if q_year:
        query = query.where(QueueProject.q_year == q_year)

    query = query.group_by(QueueProject.region).order_by(func.sum(QueueProject.mw1).desc())
    results = session.exec(query).all()

    return [
        {
            "region": r[0],
            "withdrawn_count": r[1],
            "withdrawn_mw": round(r[2] or 0, 2),
            "withdrawn_gw": round((r[2] or 0) / 1000, 2)
        }
        for r in results
    ]


def format_fips(fips_value) -> str | None:
    """Format FIPS code as 5-digit string with leading zeros"""
    if fips_value is None:
        return None
    # Convert to int first (handles float like 6037.0), then format as 5-digit string
    try:
        return str(int(float(fips_value))).zfill(5)
    except (ValueError, TypeError):
        return str(fips_value).zfill(5)


@router.get("/by-county")
def get_stats_by_county(
    session: Session = Depends(get_session),
    region: str = None,
    type_clean: str = None,
    q_status: str = None
) -> List[Dict[str, Any]]:
    """
    Get project counts and capacity by county (using FIPS code).
    Returns data needed for county-level choropleth map.

    Optional filters:
    - region: Filter by ISO region (e.g., PJM, ERCOT)
    - type_clean: Filter by fuel type (e.g., Solar, Wind)
    - q_status: Filter by status (e.g., active, withdrawn)
    """
    conditions = [
        QueueProject.fips_code.isnot(None),
        QueueProject.state.isnot(None)
    ]

    if region:
        conditions.append(QueueProject.region == region)
    if type_clean:
        conditions.append(QueueProject.type_clean == type_clean)
    if q_status:
        conditions.append(QueueProject.q_status == q_status)

    results = session.exec(
        select(
            QueueProject.fips_code,
            QueueProject.county,
            QueueProject.state,
            QueueProject.region,
            func.count(QueueProject.id).label("project_count"),
            func.sum(QueueProject.mw1).label("total_mw")
        )
        .where(*conditions)
        .group_by(
            QueueProject.fips_code,
            QueueProject.county,
            QueueProject.state,
            QueueProject.region
        )
        .order_by(func.sum(QueueProject.mw1).desc())
    ).all()

    return [
        {
            "fips": format_fips(r[0]),
            "county": r[1],
            "state": r[2],
            "region": r[3],
            "project_count": r[4],
            "total_mw": round(r[5] or 0, 2),
            "total_gw": round((r[5] or 0) / 1000, 2)
        }
        for r in results
    ]


@router.get("/map-data")
def get_map_data(
    session: Session = Depends(get_session),
    type_clean: str = None,
    q_status: str = None
) -> Dict[str, Any]:
    """
    Get all data needed for map visualization in one call.
    Returns stats by state, county, and region.
    """
    conditions_base = []
    if type_clean:
        conditions_base.append(QueueProject.type_clean == type_clean)
    if q_status:
        conditions_base.append(QueueProject.q_status == q_status)

    # Stats by state
    state_conditions = [QueueProject.state.isnot(None)] + conditions_base
    states = session.exec(
        select(
            QueueProject.state,
            QueueProject.region,
            func.count(QueueProject.id),
            func.sum(QueueProject.mw1)
        )
        .where(*state_conditions)
        .group_by(QueueProject.state, QueueProject.region)
    ).all()

    # Stats by county (FIPS)
    county_conditions = [QueueProject.fips_code.isnot(None)] + conditions_base
    counties = session.exec(
        select(
            QueueProject.fips_code,
            QueueProject.county,
            QueueProject.state,
            func.count(QueueProject.id),
            func.sum(QueueProject.mw1)
        )
        .where(*county_conditions)
        .group_by(QueueProject.fips_code, QueueProject.county, QueueProject.state)
    ).all()

    # Stats by region
    region_conditions = [QueueProject.region.isnot(None)] + conditions_base
    regions = session.exec(
        select(
            QueueProject.region,
            func.count(QueueProject.id),
            func.sum(QueueProject.mw1)
        )
        .where(*region_conditions)
        .group_by(QueueProject.region)
    ).all()

    return {
        "by_state": [
            {
                "state": r[0],
                "region": r[1],
                "project_count": r[2],
                "total_mw": round(r[3] or 0, 2)
            }
            for r in states
        ],
        "by_county": [
            {
                "fips": format_fips(r[0]),
                "county": r[1],
                "state": r[2],
                "project_count": r[3],
                "total_mw": round(r[4] or 0, 2)
            }
            for r in counties
        ],
        "by_region": [
            {
                "region": r[0],
                "project_count": r[1],
                "total_mw": round(r[2] or 0, 2)
            }
            for r in regions
        ]
    }


@router.get("/timeline")
def get_timeline_stats(
    session: Session = Depends(get_session),
    region: str = None,
    type_clean: str = None
) -> List[Dict[str, Any]]:
    """
    Get yearly breakdown of projects by status.
    Shows queue entries, withdrawals, and operational by year.

    Great for time-series analysis and LinkedIn posts!
    """
    # Base query conditions
    conditions = [QueueProject.q_year.isnot(None)]
    if region:
        conditions.append(QueueProject.region == region)
    if type_clean:
        conditions.append(QueueProject.type_clean == type_clean)

    # Get all projects by year
    all_by_year = session.exec(
        select(
            QueueProject.q_year,
            func.count(QueueProject.id),
            func.sum(QueueProject.mw1)
        )
        .where(*conditions)
        .group_by(QueueProject.q_year)
    ).all()

    # Get withdrawn by year
    withdrawn_by_year = session.exec(
        select(
            QueueProject.q_year,
            func.count(QueueProject.id),
            func.sum(QueueProject.mw1)
        )
        .where(*conditions, QueueProject.q_status == "withdrawn")
        .group_by(QueueProject.q_year)
    ).all()

    # Get active by year
    active_by_year = session.exec(
        select(
            QueueProject.q_year,
            func.count(QueueProject.id),
            func.sum(QueueProject.mw1)
        )
        .where(*conditions, QueueProject.q_status == "active")
        .group_by(QueueProject.q_year)
    ).all()

    # Get operational by year
    operational_by_year = session.exec(
        select(
            QueueProject.q_year,
            func.count(QueueProject.id),
            func.sum(QueueProject.mw1)
        )
        .where(*conditions, QueueProject.q_status == "operational")
        .group_by(QueueProject.q_year)
    ).all()

    # Combine into timeline
    all_dict = {int(r[0]): {"count": r[1], "mw": r[2] or 0} for r in all_by_year}
    withdrawn_dict = {int(r[0]): {"count": r[1], "mw": r[2] or 0} for r in withdrawn_by_year}
    active_dict = {int(r[0]): {"count": r[1], "mw": r[2] or 0} for r in active_by_year}
    operational_dict = {int(r[0]): {"count": r[1], "mw": r[2] or 0} for r in operational_by_year}

    years = sorted(all_dict.keys())

    return [
        {
            "year": year,
            "total_entered": all_dict.get(year, {}).get("count", 0),
            "total_mw_entered": round(all_dict.get(year, {}).get("mw", 0), 2),
            "withdrawn": withdrawn_dict.get(year, {}).get("count", 0),
            "withdrawn_mw": round(withdrawn_dict.get(year, {}).get("mw", 0), 2),
            "active": active_dict.get(year, {}).get("count", 0),
            "active_mw": round(active_dict.get(year, {}).get("mw", 0), 2),
            "operational": operational_dict.get(year, {}).get("count", 0),
            "operational_mw": round(operational_dict.get(year, {}).get("mw", 0), 2),
            "withdrawal_rate": round(
                withdrawn_dict.get(year, {}).get("count", 0) / all_dict[year]["count"] * 100, 1
            ) if all_dict.get(year, {}).get("count", 0) > 0 else 0
        }
        for year in years
    ]

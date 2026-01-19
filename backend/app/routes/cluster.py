"""
API routes for PJM Cluster Study data
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select, func, text
from typing import Optional, List, Dict, Any
from decimal import Decimal

from app.database import get_session
from app.models.cluster import (
    PJMCluster,
    PJMProjectCost,
    PJMProjectCostRead,
    PJMUpgrade,
    PJMUpgradeRead,
    PJMProjectUpgrade,
    PJMProjectUpgradeRead,
    ProjectSearchResult,
    ProjectDashboard,
    ClusterSummary,
)

router = APIRouter(prefix="/api/cluster", tags=["cluster"])

# Allowlists for sort fields to prevent arbitrary attribute access
ALLOWED_PROJECT_SORT_FIELDS = {"cost_rank", "risk_score_overall", "mw_capacity", "total_cost", "cost_per_kw", "project_id"}
ALLOWED_UPGRADE_SORT_FIELDS = {"total_cost", "shared_by_count", "rtep_id", "utility"}


# ============================================================================
# CLUSTER OVERVIEW
# ============================================================================

@router.get("/clusters", response_model=List[Dict[str, Any]])
def list_clusters(session: Session = Depends(get_session)):
    """List all available clusters and phases"""
    clusters = session.exec(
        select(PJMCluster).order_by(PJMCluster.cluster_name, PJMCluster.phase)
    ).all()
    return [
        {
            "id": c.id,
            "cluster_name": c.cluster_name,
            "phase": c.phase,
            "total_projects": c.total_projects,
            "total_mw": float(c.total_mw) if c.total_mw else None,
        }
        for c in clusters
    ]


@router.get("/summary/{cluster_name}/{phase}", response_model=ClusterSummary)
def get_cluster_summary(
    cluster_name: str,
    phase: str,
    session: Session = Depends(get_session),
):
    """Get summary statistics for a cluster/phase"""
    # Get cluster
    cluster = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster_name,
            PJMCluster.phase == phase
        )
    ).first()

    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    # Get aggregate stats
    stats = session.exec(
        select(
            func.count(PJMProjectCost.id).label("total_projects"),
            func.sum(PJMProjectCost.mw_capacity).label("total_mw"),
            func.sum(PJMProjectCost.total_cost).label("total_cost"),
            func.avg(PJMProjectCost.cost_per_kw).label("avg_cost_per_kw"),
            func.avg(PJMProjectCost.risk_score_overall).label("avg_risk_score"),
        ).where(PJMProjectCost.cluster_id == cluster.id)
    ).first()

    # Risk distribution
    risk_dist = session.exec(
        text("""
            SELECT
                CASE
                    WHEN risk_score_overall < 25 THEN 'low'
                    WHEN risk_score_overall < 50 THEN 'medium'
                    WHEN risk_score_overall < 75 THEN 'high'
                    ELSE 'critical'
                END as risk_level,
                COUNT(*) as count
            FROM pjm_project_costs
            WHERE cluster_id = :cluster_id
            GROUP BY 1
        """).bindparams(cluster_id=cluster.id)
    ).fetchall()

    # Cost distribution (quintiles)
    cost_dist = session.exec(
        text("""
            SELECT
                CASE
                    WHEN cost_percentile < 20 THEN 'q1'
                    WHEN cost_percentile < 40 THEN 'q2'
                    WHEN cost_percentile < 60 THEN 'q3'
                    WHEN cost_percentile < 80 THEN 'q4'
                    ELSE 'q5'
                END as quintile,
                COUNT(*) as count
            FROM pjm_project_costs
            WHERE cluster_id = :cluster_id AND cost_percentile IS NOT NULL
            GROUP BY 1
        """).bindparams(cluster_id=cluster.id)
    ).fetchall()

    return ClusterSummary(
        cluster_name=cluster_name,
        phase=phase,
        total_projects=stats[0] or 0,
        total_mw=stats[1],
        total_cost=stats[2],
        avg_cost_per_kw=stats[3],
        avg_risk_score=stats[4],
        risk_distribution={r[0]: r[1] for r in risk_dist},
        cost_distribution={c[0]: c[1] for c in cost_dist},
    )


# ============================================================================
# PROJECT SEARCH & LIST
# ============================================================================

@router.get("/projects", response_model=List[ProjectSearchResult])
def list_projects(
    session: Session = Depends(get_session),
    cluster: str = Query("TC2", description="Cluster name"),
    phase: str = Query("PHASE_1", description="Phase"),
    # Filters
    utility: Optional[str] = Query(None, description="Filter by utility"),
    state: Optional[str] = Query(None, description="Filter by state"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    min_mw: Optional[float] = Query(None, description="Minimum MW capacity"),
    max_mw: Optional[float] = Query(None, description="Maximum MW capacity"),
    min_risk: Optional[float] = Query(None, description="Minimum risk score"),
    max_risk: Optional[float] = Query(None, description="Maximum risk score"),
    # Sorting
    sort_by: str = Query("cost_rank", description="Sort field: cost_rank, risk_score_overall, mw_capacity, total_cost"),
    sort_order: str = Query("asc", description="Sort order: asc, desc"),
    # Pagination
    limit: int = Query(50, le=500),
    offset: int = Query(0),
):
    """List projects in a cluster with filters and pagination"""
    # Get cluster ID
    cluster_obj = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster,
            PJMCluster.phase == phase
        )
    ).first()

    if not cluster_obj:
        raise HTTPException(status_code=404, detail="Cluster not found")

    # Build query
    query = select(PJMProjectCost).where(PJMProjectCost.cluster_id == cluster_obj.id)

    # Apply filters
    if utility:
        query = query.where(PJMProjectCost.utility == utility)
    if state:
        query = query.where(PJMProjectCost.state == state)
    if fuel_type:
        query = query.where(PJMProjectCost.fuel_type == fuel_type)
    if min_mw is not None:
        query = query.where(PJMProjectCost.mw_capacity >= min_mw)
    if max_mw is not None:
        query = query.where(PJMProjectCost.mw_capacity <= max_mw)
    if min_risk is not None:
        query = query.where(PJMProjectCost.risk_score_overall >= min_risk)
    if max_risk is not None:
        query = query.where(PJMProjectCost.risk_score_overall <= max_risk)

    # Apply sorting (validate sort_by against allowlist)
    if sort_by not in ALLOWED_PROJECT_SORT_FIELDS:
        sort_by = "cost_rank"
    sort_field = getattr(PJMProjectCost, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_field.desc())
    else:
        query = query.order_by(sort_field)

    # Apply pagination
    query = query.offset(offset).limit(limit)

    projects = session.exec(query).all()

    return [
        ProjectSearchResult(
            project_id=p.project_id,
            developer=p.developer,
            utility=p.utility,
            state=p.state,
            fuel_type=p.fuel_type,
            mw_capacity=p.mw_capacity,
            total_cost=p.total_cost,
            cost_per_kw=p.cost_per_kw,
            risk_score_overall=p.risk_score_overall,
            cost_rank=p.cost_rank,
        )
        for p in projects
    ]


@router.get("/projects/search")
def search_projects(
    q: str = Query(..., min_length=2, description="Search query"),
    cluster: str = Query("TC2"),
    phase: str = Query("PHASE_1"),
    limit: int = Query(20, le=50),
    session: Session = Depends(get_session),
):
    """Search projects by ID, developer, or utility"""
    cluster_obj = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster,
            PJMCluster.phase == phase
        )
    ).first()

    if not cluster_obj:
        return []

    projects = session.exec(
        select(PJMProjectCost).where(
            PJMProjectCost.cluster_id == cluster_obj.id,
            (
                PJMProjectCost.project_id.ilike(f"%{q}%") |
                PJMProjectCost.developer.ilike(f"%{q}%") |
                PJMProjectCost.utility.ilike(f"%{q}%")
            )
        ).limit(limit)
    ).all()

    return [
        {
            "project_id": p.project_id,
            "developer": p.developer,
            "utility": p.utility,
            "mw_capacity": float(p.mw_capacity) if p.mw_capacity else None,
            "total_cost": float(p.total_cost) if p.total_cost else None,
        }
        for p in projects
    ]


@router.get("/projects/filter-options")
def get_filter_options(
    cluster: str = Query("TC2"),
    phase: str = Query("PHASE_1"),
    session: Session = Depends(get_session),
):
    """Get unique values for filter dropdowns"""
    cluster_obj = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster,
            PJMCluster.phase == phase
        )
    ).first()

    if not cluster_obj:
        return {}

    # Get unique values
    utilities = session.exec(
        select(PJMProjectCost.utility)
        .where(PJMProjectCost.cluster_id == cluster_obj.id)
        .where(PJMProjectCost.utility.isnot(None))
        .distinct()
    ).all()

    states = session.exec(
        select(PJMProjectCost.state)
        .where(PJMProjectCost.cluster_id == cluster_obj.id)
        .where(PJMProjectCost.state.isnot(None))
        .distinct()
    ).all()

    fuel_types = session.exec(
        select(PJMProjectCost.fuel_type)
        .where(PJMProjectCost.cluster_id == cluster_obj.id)
        .where(PJMProjectCost.fuel_type.isnot(None))
        .distinct()
    ).all()

    return {
        "utilities": list(utilities),
        "states": list(states),
        "fuel_types": list(fuel_types),
    }


# ============================================================================
# PROJECT DASHBOARD
# ============================================================================

@router.get("/projects/{project_id}", response_model=ProjectDashboard)
def get_project_dashboard(
    project_id: str,
    cluster: str = Query("TC2"),
    phase: str = Query("PHASE_1"),
    session: Session = Depends(get_session),
):
    """Get full project dashboard with upgrades and co-dependencies"""
    # Get cluster
    cluster_obj = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster,
            PJMCluster.phase == phase
        )
    ).first()

    if not cluster_obj:
        raise HTTPException(status_code=404, detail="Cluster not found")

    # Get project
    project = session.exec(
        select(PJMProjectCost).where(
            PJMProjectCost.project_id == project_id,
            PJMProjectCost.cluster_id == cluster_obj.id
        )
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get upgrades with details
    upgrades_raw = session.exec(
        text("""
            SELECT
                pu.id,
                pu.project_id,
                pu.link_type,
                pu.allocated_cost,
                pu.percent_allocation,
                u.rtep_id,
                u.title,
                u.utility,
                u.total_cost,
                u.shared_by_count
            FROM pjm_project_upgrades pu
            JOIN pjm_upgrades u ON pu.upgrade_id = u.id
            WHERE pu.project_id = :project_id AND pu.cluster_id = :cluster_id
            ORDER BY pu.allocated_cost DESC NULLS LAST
        """).bindparams(project_id=project_id, cluster_id=cluster_obj.id)
    ).fetchall()

    upgrades = [
        PJMProjectUpgradeRead(
            id=u[0],
            project_id=u[1],
            link_type=u[2],
            allocated_cost=u[3],
            percent_allocation=u[4],
            upgrade_rtep_id=u[5],
            upgrade_title=u[6],
            upgrade_utility=u[7],
            upgrade_total_cost=u[8],
            shared_by_count=u[9],
        )
        for u in upgrades_raw
    ]

    # Get co-dependent projects (share at least one COST_ALLOCATED upgrade)
    codep_raw = session.exec(
        text("""
            SELECT DISTINCT pu2.project_id
            FROM pjm_project_upgrades pu1
            JOIN pjm_project_upgrades pu2 ON pu1.upgrade_id = pu2.upgrade_id
            WHERE pu1.project_id = :project_id
              AND pu1.cluster_id = :cluster_id
              AND pu1.link_type = 'COST_ALLOCATED'
              AND pu2.link_type = 'COST_ALLOCATED'
              AND pu2.project_id != :project_id
            ORDER BY pu2.project_id
            LIMIT 50
        """).bindparams(project_id=project_id, cluster_id=cluster_obj.id)
    ).fetchall()

    codependent = [c[0] for c in codep_raw]

    return ProjectDashboard(
        project_id=project.project_id,
        cluster_name=cluster,
        phase=phase,
        developer=project.developer,
        utility=project.utility,
        state=project.state,
        county=project.county,
        fuel_type=project.fuel_type,
        mw_capacity=project.mw_capacity,
        project_status=project.project_status,
        total_cost=project.total_cost,
        cost_per_kw=project.cost_per_kw,
        toif_cost=project.toif_cost,
        network_upgrade_cost=project.network_upgrade_cost,
        system_reliability_cost=project.system_reliability_cost,
        rd1_amount=project.rd1_amount,
        rd2_amount=project.rd2_amount,
        risk_score_overall=project.risk_score_overall,
        risk_score_cost=project.risk_score_cost,
        risk_score_concentration=project.risk_score_concentration,
        risk_score_dependency=project.risk_score_dependency,
        risk_score_timeline=project.risk_score_timeline,
        cost_rank=project.cost_rank,
        cost_percentile=project.cost_percentile,
        cluster_total_projects=cluster_obj.total_projects,
        report_url=project.report_url,
        upgrades=upgrades,
        codependent_projects=codependent,
    )


# ============================================================================
# UPGRADES
# ============================================================================

@router.get("/upgrades", response_model=List[PJMUpgradeRead])
def list_upgrades(
    cluster: str = Query("TC2"),
    phase: str = Query("PHASE_1"),
    utility: Optional[str] = Query(None),
    min_cost: Optional[float] = Query(None),
    sort_by: str = Query("total_cost"),
    limit: int = Query(50, le=200),
    session: Session = Depends(get_session),
):
    """List network upgrades with filters"""
    cluster_obj = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster,
            PJMCluster.phase == phase
        )
    ).first()

    if not cluster_obj:
        return []

    query = select(PJMUpgrade).where(PJMUpgrade.cluster_id == cluster_obj.id)

    if utility:
        query = query.where(PJMUpgrade.utility == utility)
    if min_cost:
        query = query.where(PJMUpgrade.total_cost >= min_cost)

    # Validate sort_by against allowlist
    if sort_by not in ALLOWED_UPGRADE_SORT_FIELDS:
        sort_by = "total_cost"
    sort_field = getattr(PJMUpgrade, sort_by)
    query = query.order_by(sort_field.desc()).limit(limit)

    upgrades = session.exec(query).all()

    return [
        PJMUpgradeRead(
            id=u.id,
            rtep_id=u.rtep_id,
            to_id=u.to_id,
            utility=u.utility,
            title=u.title,
            total_cost=u.total_cost,
            shared_by_count=u.shared_by_count,
        )
        for u in upgrades
    ]


@router.get("/upgrades/{upgrade_id}/projects")
def get_upgrade_projects(
    upgrade_id: int,
    session: Session = Depends(get_session),
):
    """Get all projects that share a specific upgrade"""
    links = session.exec(
        select(PJMProjectUpgrade).where(PJMProjectUpgrade.upgrade_id == upgrade_id)
    ).all()

    project_ids = [l.project_id for l in links]

    # Get project details
    projects = session.exec(
        select(PJMProjectCost).where(PJMProjectCost.project_id.in_(project_ids))
    ).all()

    return [
        {
            "project_id": p.project_id,
            "developer": p.developer,
            "mw_capacity": float(p.mw_capacity) if p.mw_capacity else None,
            "allocated_cost": float(next(
                (l.allocated_cost for l in links if l.project_id == p.project_id),
                None
            ) or 0),
            "link_type": next(
                (l.link_type for l in links if l.project_id == p.project_id),
                "COST_ALLOCATED"
            ),
        }
        for p in projects
    ]


# ============================================================================
# ANALYTICS
# ============================================================================

@router.get("/analytics/cost-distribution")
def get_cost_distribution(
    cluster: str = Query("TC2"),
    phase: str = Query("PHASE_1"),
    session: Session = Depends(get_session),
):
    """Get cost distribution data for histogram"""
    cluster_obj = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster,
            PJMCluster.phase == phase
        )
    ).first()

    if not cluster_obj:
        return {"bins": [], "counts": []}

    # Get cost_per_kw values
    costs = session.exec(
        select(PJMProjectCost.cost_per_kw)
        .where(PJMProjectCost.cluster_id == cluster_obj.id)
        .where(PJMProjectCost.cost_per_kw.isnot(None))
        .where(PJMProjectCost.cost_per_kw > 0)
    ).all()

    if not costs:
        return {"bins": [], "counts": []}

    # Create histogram bins ($0-100, $100-200, etc.)
    import math
    max_cost = max(float(c) for c in costs)
    bin_size = 100  # $100/kW bins
    num_bins = min(int(math.ceil(max_cost / bin_size)), 50)

    bins = [i * bin_size for i in range(num_bins + 1)]
    counts = [0] * num_bins

    for c in costs:
        idx = min(int(float(c) / bin_size), num_bins - 1)
        counts[idx] += 1

    return {
        "bins": [f"${bins[i]}-{bins[i+1]}" for i in range(len(bins)-1)],
        "counts": counts,
        "total_projects": len(costs),
    }


@router.get("/analytics/risk-breakdown")
def get_risk_breakdown(
    cluster: str = Query("TC2"),
    phase: str = Query("PHASE_1"),
    session: Session = Depends(get_session),
):
    """Get risk score breakdown by component"""
    cluster_obj = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster,
            PJMCluster.phase == phase
        )
    ).first()

    if not cluster_obj:
        return {}

    stats = session.exec(
        select(
            func.avg(PJMProjectCost.risk_score_cost).label("avg_cost"),
            func.avg(PJMProjectCost.risk_score_concentration).label("avg_concentration"),
            func.avg(PJMProjectCost.risk_score_dependency).label("avg_dependency"),
            func.avg(PJMProjectCost.risk_score_timeline).label("avg_timeline"),
            func.avg(PJMProjectCost.risk_score_overall).label("avg_overall"),
        ).where(PJMProjectCost.cluster_id == cluster_obj.id)
    ).first()

    return {
        "cost": float(stats[0]) if stats[0] else 0,
        "concentration": float(stats[1]) if stats[1] else 0,
        "dependency": float(stats[2]) if stats[2] else 0,
        "timeline": float(stats[3]) if stats[3] else 0,
        "overall": float(stats[4]) if stats[4] else 0,
    }


@router.get("/analytics/top-upgrades")
def get_top_upgrades(
    cluster: str = Query("TC2"),
    phase: str = Query("PHASE_1"),
    limit: int = Query(10),
    session: Session = Depends(get_session),
):
    """Get top upgrades by total cost"""
    cluster_obj = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster,
            PJMCluster.phase == phase
        )
    ).first()

    if not cluster_obj:
        return []

    upgrades = session.exec(
        select(PJMUpgrade)
        .where(PJMUpgrade.cluster_id == cluster_obj.id)
        .where(PJMUpgrade.total_cost.isnot(None))
        .order_by(PJMUpgrade.total_cost.desc())
        .limit(limit)
    ).all()

    return [
        {
            "rtep_id": u.rtep_id,
            "title": u.title[:100] if u.title else None,
            "utility": u.utility,
            "total_cost": float(u.total_cost) if u.total_cost else 0,
            "shared_by_count": u.shared_by_count,
        }
        for u in upgrades
    ]

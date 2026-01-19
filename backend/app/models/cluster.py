"""
SQLModel models for PJM Cluster Study data
"""
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field, Relationship


class PJMCluster(SQLModel, table=True):
    """Cluster metadata (TC1, TC2, etc.)"""
    __tablename__ = "pjm_clusters"

    id: Optional[int] = Field(default=None, primary_key=True)
    cluster_name: str = Field(max_length=20)
    phase: str = Field(max_length=20)
    total_projects: Optional[int] = None
    total_mw: Optional[Decimal] = None
    decision_deadline: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PJMProjectCostBase(SQLModel):
    """Base model for project costs (shared fields)"""
    project_id: str = Field(max_length=20)
    utility: Optional[str] = Field(default=None, max_length=100)
    developer: Optional[str] = Field(default=None, max_length=200)
    state: Optional[str] = Field(default=None, max_length=10)
    county: Optional[str] = Field(default=None, max_length=100)
    fuel_type: Optional[str] = Field(default=None, max_length=50)
    mw_capacity: Optional[Decimal] = None
    mw_energy: Optional[Decimal] = None
    project_status: Optional[str] = Field(default=None, max_length=50)

    # Cost breakdown
    total_cost: Optional[Decimal] = None
    cost_per_kw: Optional[Decimal] = None
    toif_cost: Optional[Decimal] = None
    stand_alone_cost: Optional[Decimal] = None
    network_upgrade_cost: Optional[Decimal] = None
    system_reliability_cost: Optional[Decimal] = None

    # Readiness deposits
    rd1_amount: Optional[Decimal] = None
    rd2_amount: Optional[Decimal] = None
    rd2_due_date: Optional[date] = None

    # Timeline
    requested_cod: Optional[date] = None

    # Risk scores
    risk_score_overall: Optional[Decimal] = None
    risk_score_cost: Optional[Decimal] = None
    risk_score_concentration: Optional[Decimal] = None
    risk_score_dependency: Optional[Decimal] = None
    risk_score_timeline: Optional[Decimal] = None

    # Cluster ranking
    cost_rank: Optional[int] = None
    cost_percentile: Optional[Decimal] = None

    # Source
    report_url: Optional[str] = None


class PJMProjectCost(PJMProjectCostBase, table=True):
    """Project cost allocation record"""
    __tablename__ = "pjm_project_costs"

    id: Optional[int] = Field(default=None, primary_key=True)
    cluster_id: Optional[int] = Field(default=None, foreign_key="pjm_clusters.id")
    scraped_at: Optional[datetime] = None


class PJMProjectCostRead(PJMProjectCostBase):
    """Project cost read model with cluster info"""
    id: int
    cluster_name: Optional[str] = None
    phase: Optional[str] = None


class PJMUpgrade(SQLModel, table=True):
    """Network upgrade record"""
    __tablename__ = "pjm_upgrades"

    id: Optional[int] = Field(default=None, primary_key=True)
    cluster_id: Optional[int] = Field(default=None, foreign_key="pjm_clusters.id")
    rtep_id: Optional[str] = Field(default=None, max_length=50)
    to_id: Optional[str] = Field(default=None, max_length=100)
    utility: Optional[str] = Field(default=None, max_length=100)
    title: Optional[str] = None
    upgrade_type: Optional[str] = Field(default=None, max_length=50)
    total_cost: Optional[Decimal] = None
    shared_by_count: Optional[int] = None
    upgrade_cod: Optional[date] = None
    created_at: Optional[datetime] = None


class PJMUpgradeRead(SQLModel):
    """Upgrade read model"""
    id: int
    rtep_id: Optional[str] = None
    to_id: Optional[str] = None
    utility: Optional[str] = None
    title: Optional[str] = None
    total_cost: Optional[Decimal] = None
    shared_by_count: Optional[int] = None


class PJMProjectUpgrade(SQLModel, table=True):
    """Project-upgrade link (cost allocation)"""
    __tablename__ = "pjm_project_upgrades"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: str = Field(max_length=20)
    upgrade_id: Optional[int] = Field(default=None, foreign_key="pjm_upgrades.id")
    cluster_id: Optional[int] = Field(default=None, foreign_key="pjm_clusters.id")
    link_type: str = Field(default="COST_ALLOCATED", max_length=20)
    mw_impact: Optional[Decimal] = None
    percent_allocation: Optional[Decimal] = None
    allocated_cost: Optional[Decimal] = None
    created_at: Optional[datetime] = None


class PJMProjectUpgradeRead(SQLModel):
    """Project upgrade link read model with upgrade details"""
    id: int
    project_id: str
    link_type: str
    allocated_cost: Optional[Decimal] = None
    percent_allocation: Optional[Decimal] = None
    upgrade_rtep_id: Optional[str] = None
    upgrade_title: Optional[str] = None
    upgrade_utility: Optional[str] = None
    upgrade_total_cost: Optional[Decimal] = None
    shared_by_count: Optional[int] = None


# Response models for API
class ProjectSearchResult(SQLModel):
    """Compact project search result"""
    project_id: str
    developer: Optional[str] = None
    utility: Optional[str] = None
    state: Optional[str] = None
    fuel_type: Optional[str] = None
    mw_capacity: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    cost_per_kw: Optional[Decimal] = None
    risk_score_overall: Optional[Decimal] = None
    cost_rank: Optional[int] = None


class ProjectDashboard(SQLModel):
    """Full project dashboard data"""
    project_id: str
    cluster_name: str
    phase: str

    # Basic info
    developer: Optional[str] = None
    utility: Optional[str] = None
    state: Optional[str] = None
    county: Optional[str] = None
    fuel_type: Optional[str] = None
    mw_capacity: Optional[Decimal] = None
    project_status: Optional[str] = None

    # Cost summary
    total_cost: Optional[Decimal] = None
    cost_per_kw: Optional[Decimal] = None
    toif_cost: Optional[Decimal] = None
    network_upgrade_cost: Optional[Decimal] = None
    system_reliability_cost: Optional[Decimal] = None

    # Readiness
    rd1_amount: Optional[Decimal] = None
    rd2_amount: Optional[Decimal] = None

    # Risk scores
    risk_score_overall: Optional[Decimal] = None
    risk_score_cost: Optional[Decimal] = None
    risk_score_concentration: Optional[Decimal] = None
    risk_score_dependency: Optional[Decimal] = None
    risk_score_timeline: Optional[Decimal] = None

    # Rankings
    cost_rank: Optional[int] = None
    cost_percentile: Optional[Decimal] = None
    cluster_total_projects: Optional[int] = None

    # Report link
    report_url: Optional[str] = None

    # Related data (will be populated by joins)
    upgrades: List[PJMProjectUpgradeRead] = []
    codependent_projects: List[str] = []


class ClusterSummary(SQLModel):
    """Cluster overview statistics"""
    cluster_name: str
    phase: str
    total_projects: int
    total_mw: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    avg_cost_per_kw: Optional[Decimal] = None
    avg_risk_score: Optional[Decimal] = None
    risk_distribution: dict = {}
    cost_distribution: dict = {}

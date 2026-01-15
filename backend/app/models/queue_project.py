from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class QueueProjectBase(SQLModel):
    """Base model for queue projects"""
    q_id: Optional[str] = Field(default=None, max_length=100, index=True)
    q_status: Optional[str] = Field(default=None, max_length=50, index=True)
    q_date: Optional[date] = None
    prop_date: Optional[date] = None
    on_date: Optional[date] = None
    wd_date: Optional[date] = None
    ia_date: Optional[date] = None
    ia_status_raw: Optional[str] = Field(default=None, max_length=255)
    ia_status_clean: Optional[str] = Field(default=None, max_length=100)
    county: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=2, index=True)
    fips_code: Optional[str] = Field(default=None, max_length=10)
    poi_name: Optional[str] = Field(default=None, max_length=255)
    region: Optional[str] = Field(default=None, max_length=50, index=True)
    project_name: Optional[str] = Field(default=None, max_length=255)
    utility: Optional[str] = Field(default=None, max_length=255)
    entity: Optional[str] = Field(default=None, max_length=100)
    developer: Optional[str] = Field(default=None, max_length=255)
    service_type: Optional[str] = Field(default=None, max_length=50)
    project_type: Optional[str] = Field(default=None, max_length=50)
    type1: Optional[str] = Field(default=None, max_length=100)
    type2: Optional[str] = Field(default=None, max_length=100)
    type3: Optional[str] = Field(default=None, max_length=100)
    mw1: Optional[float] = None
    mw2: Optional[float] = None
    mw3: Optional[float] = None
    type_clean: Optional[str] = Field(default=None, max_length=100, index=True)
    q_year: Optional[int] = Field(default=None, index=True)
    prop_year: Optional[int] = None


class QueueProject(QueueProjectBase, table=True):
    """Database table model for queue projects"""
    __tablename__ = "queue_projects"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)


class QueueProjectRead(QueueProjectBase):
    """Response model for reading queue projects"""
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class QueueProjectStats(SQLModel):
    """Model for aggregate statistics"""
    total_projects: int
    total_capacity_mw: float
    active_projects: int
    active_capacity_mw: float
    by_region: dict
    by_type: dict
    by_status: dict

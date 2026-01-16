# Data Pipeline - Future Plan

> This document outlines the future data pipeline architecture for Queue Insights.
> **Status:** Planning (not yet implemented)

---

## Overview

Replace static LBNL data with automated daily updates from ISO sources, enriched with geolocation, developer intelligence, and cluster analysis.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RAILWAY (Scheduled Jobs - Daily 2am UTC)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PIPELINE 1: FETCH ──► PIPELINE 2: TRANSFORM ──► PIPELINE 3: LOAD          │
│   (gridstatus)          (normalize + enrich)      (upsert to Supabase)      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Core Pipeline (Week 1)

**Goal:** Replace LBNL with daily ISO updates

### Data Source
- **gridstatus** (open source Python library)
- Covers: CAISO, ERCOT, PJM, MISO, NYISO, SPP, ISO-NE
- Free, actively maintained

### Pipeline Steps

```python
# 1. FETCH - Get raw data from each ISO
import gridstatus

isos = {
    'CAISO': gridstatus.CAISO(),
    'ERCOT': gridstatus.ERCOT(),
    'PJM': gridstatus.PJM(),
    'MISO': gridstatus.MISO(),
    'NYISO': gridstatus.NYISO(),
    'SPP': gridstatus.SPP(),
    'ISONE': gridstatus.ISONE(),
}

for name, iso in isos.items():
    df = iso.get_interconnection_queue()

# 2. TRANSFORM - Normalize to our schema
# - Map column names (each ISO uses different names)
# - Standardize fuel types (Solar PV → Solar)
# - Standardize statuses (Active, Withdrawn, etc.)
# - Geocode to get FIPS codes

# 3. LOAD - Upsert to Supabase
# - INSERT new projects
# - UPDATE changed projects
# - Mark withdrawn projects
```

### Column Mapping (per ISO)

| Our Schema | CAISO | ERCOT | PJM | MISO |
|------------|-------|-------|-----|------|
| q_id | Queue Position | INR Number | Queue Number | Project Number |
| project_name | Project Name | Project Name | Project Name | Project Name |
| mw1 | Capacity (MW) | Max Summer MW | MFO | Summer MW |
| q_date | Queue Date | Received Date | Queue Date | In Queue Date |
| type_clean | Fuel | Fuel | Fuel | Fuel Type |
| q_status | Status | Status | Status | Status |
| county | County | County | County | County |
| state | State | State | State | State |
| poi_name | POI | POI | POI | POI |

### Fuel Type Standardization

```python
fuel_mapping = {
    # Solar variants
    'Solar PV': 'Solar', 'Photovoltaic': 'Solar', 'PV': 'Solar',
    'Solar Thermal': 'Solar',

    # Wind variants
    'Wind': 'Wind', 'Onshore Wind': 'Wind', 'Offshore Wind': 'Wind',

    # Storage variants
    'Battery': 'Storage', 'BESS': 'Storage', 'Energy Storage': 'Storage',
    'Pumped Storage': 'Storage',

    # Gas variants
    'Natural Gas': 'Gas', 'Gas CT': 'Gas', 'Gas CC': 'Gas', 'CCGT': 'Gas',

    # Hybrid
    'Solar + Storage': 'Hybrid', 'Wind + Storage': 'Hybrid',
}
```

### Status Standardization

```python
status_mapping = {
    'Active': 'Active', 'In Progress': 'Active', 'Under Study': 'Active',
    'Feasibility': 'Active', 'System Impact': 'Active',

    'Withdrawn': 'Withdrawn', 'Cancelled': 'Withdrawn', 'Suspended': 'Withdrawn',

    'Completed': 'Operational', 'In Service': 'Operational', 'Commercial': 'Operational',
}
```

---

## Phase 2: Geolocation Enrichment (Week 2)

**Goal:** Add lat/long and accurate FIPS codes

### Sources

| Source | Data | Cost |
|--------|------|------|
| OSM Overpass API | Substations, transmission lines | Free |
| Google Geocoding | Address → lat/long | $5/1000 |
| Census.gov | Address → FIPS code | Free |
| EIA-860 | Power plant locations | Free |
| HIFLD | Transmission infrastructure | Free |

### Approach

```
POI Name (e.g., "Midway 500kV")
    │
    ├── Search OSM for substation match
    ├── If not found, geocode city/address
    ├── Match to nearest transmission line
    └── Output: lat, lng, fips_code, nearest_substation
```

---

## Phase 3: Developer Enrichment (Week 3)

**Goal:** Add developer intelligence

### Data Points
- Company website
- Parent company
- Portfolio size (other projects in queue)
- Completion rate (historical)
- Recent news/press releases

### Sources

| Source | Data | Cost |
|--------|------|------|
| Tavily/Web Search | Company info | ~$0.01/search |
| OpenCorporates | Company registry | Free tier |
| SEC EDGAR | Parent company, financials | Free |
| Press releases | Project announcements | Free |

---

## Phase 4: Cluster Analysis (Week 4+)

**Goal:** Add interconnection intelligence (highest value)

### Data Points
- Cluster study ID
- Study phase (feasibility, system impact, facilities)
- Estimated upgrade cost
- Congestion score
- Timeline prediction

### Sources

| Source | Data | Access |
|--------|------|--------|
| ISO Cluster Studies | Study results, costs | Public PDFs |
| OASIS | Transmission constraints | API/Portal |
| LMP Data | Congestion signals | gridstatus |
| Curtailment Reports | Actual curtailment | ISO portals |

### Challenges
- Cluster studies are PDFs (need AI/LLM parsing)
- Matching projects to clusters is non-trivial
- Data is released in batches, not real-time

---

## Database Schema Extension

```sql
-- New table for enriched data
CREATE TABLE enriched_data (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES queue_projects(id),

    -- Geolocation
    lat DECIMAL(10, 7),
    lng DECIMAL(10, 7),
    geocode_source VARCHAR(50),  -- 'osm', 'google', 'census'
    geocode_confidence DECIMAL(3, 2),

    -- Developer
    developer_name VARCHAR(255),
    developer_website VARCHAR(255),
    parent_company VARCHAR(255),
    portfolio_size INTEGER,
    completion_rate DECIMAL(3, 2),

    -- Cluster
    cluster_id VARCHAR(50),
    cluster_study_phase VARCHAR(50),
    estimated_upgrade_cost DECIMAL(12, 2),
    congestion_score DECIMAL(3, 2),

    -- Metadata
    enriched_at TIMESTAMP DEFAULT NOW(),
    data_sources JSONB,

    UNIQUE(project_id)
);
```

---

## File Structure

```
backend/
├── app/                    # Existing FastAPI
├── pipeline/
│   ├── __init__.py
│   ├── fetch.py            # Pipeline 1: Get raw data
│   ├── transform.py        # Pipeline 2: Normalize
│   ├── load.py             # Pipeline 3: Upsert
│   ├── enrich/
│   │   ├── geolocation.py  # Lat/long enrichment
│   │   ├── developer.py    # Developer enrichment
│   │   └── cluster.py      # Cluster analysis
│   ├── mappings/
│   │   ├── columns.py      # ISO column mappings
│   │   ├── fuel_types.py   # Fuel type standardization
│   │   └── statuses.py     # Status standardization
│   └── run_all.py          # Orchestrator
└── requirements.txt        # Add: gridstatus, geopy
```

---

## Railway Cron Setup

```yaml
# railway.toml
[cron]
  schedule = "0 2 * * *"  # Daily at 2am UTC
  command = "python -m pipeline.run_all"
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Data freshness | < 24 hours |
| ISO coverage | 7/7 ISOs |
| Geocoding accuracy | > 90% |
| Developer match rate | > 70% |
| Pipeline uptime | > 99% |

---

## Not Covered (Manual/Future)

- Southeast utilities (non-ISO)
- West non-ISO utilities
- International queues
- Historical backfill before gridstatus coverage

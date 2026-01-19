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

**Goal:** Add accurate lat/long based on POI/Substation names

### Strategy: POI/Substation-Based Geocoding

We have `poi_name` (Point of Interconnection) for most projects - these are substation names. Instead of using county centroids, we geocode the actual substation location.

### Data Sources (in priority order)

| Source | API/Method | Cost | Coverage | Accuracy |
|--------|------------|------|----------|----------|
| **OpenStreetMap (Overpass)** | Query `power=substation` | Free | Good for major substations | High |
| **OpenInfraMap** | Uses OSM, specialized for power grid | Free | Excellent for grid infrastructure | High |
| **HIFLD Dataset** | US govt substation database (~70K records) | Free | Comprehensive US coverage | High |
| **Google Places API** | Search "XYZ Substation" | $17/1K requests | Good fallback | High |
| **Nominatim (OSM)** | Search by name + state | Free (rate limited) | Moderate | Medium |

### Geocoding Pipeline

```
For each project with poi_name:
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Normalize POI Name                                          │
│ "Limestone 345 kV" → "Limestone Substation"                         │
│ "MIDWAY 500KV SS" → "Midway Substation"                            │
│ Remove voltage levels, clean formatting                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: Search OpenStreetMap/OpenInfraMap                           │
│ Query: power=substation, name~"Limestone", state="TX"               │
│ Returns: [{name, lat, lon, voltage, operator}]                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │ Match Found?      │
                    └─────────┬─────────┘
              Yes             │             No
               │              │              │
               ▼              │              ▼
┌──────────────────────┐      │   ┌──────────────────────────────────┐
│ Use OSM coordinates  │      │   │ Step 3: Search HIFLD Dataset     │
│ Confidence: HIGH     │      │   │ Match by name + state            │
└──────────────────────┘      │   └──────────────────────────────────┘
                              │              │
                              │    ┌─────────┴─────────┐
                              │    │ Match Found?      │
                              │    └─────────┬─────────┘
                              │  Yes         │         No
                              │   │          │          │
                              │   ▼          │          ▼
                              │ ┌────────────┴┐  ┌─────────────────────┐
                              │ │Use HIFLD    │  │ Step 4: Google API  │
                              │ │Confidence:  │  │ Search "POI + state"│
                              │ │HIGH         │  │ Confidence: MEDIUM  │
                              │ └─────────────┘  └─────────────────────┘
```

### OSM Overpass Query Example

```python
import requests

def search_substation_osm(name: str, state: str) -> dict | None:
    """Search OpenStreetMap for a substation by name and state."""

    # State to bounding box mapping (simplified)
    state_bbox = {
        "TX": (25.8, -106.6, 36.5, -93.5),
        "CA": (32.5, -124.4, 42.0, -114.1),
        # ... more states
    }

    bbox = state_bbox.get(state)
    if not bbox:
        return None

    # Overpass QL query
    query = f"""
    [out:json][timeout:25];
    (
      node["power"="substation"]["name"~"{name}",i]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
      way["power"="substation"]["name"~"{name}",i]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
    );
    out center;
    """

    response = requests.post(
        "https://overpass-api.de/api/interpreter",
        data={"data": query}
    )

    data = response.json()
    if data.get("elements"):
        element = data["elements"][0]
        return {
            "lat": element.get("lat") or element.get("center", {}).get("lat"),
            "lon": element.get("lon") or element.get("center", {}).get("lon"),
            "name": element.get("tags", {}).get("name"),
            "source": "osm",
            "confidence": 0.95
        }
    return None
```

### HIFLD Dataset Integration

```python
import pandas as pd

# Download from: https://hifld-geoplatform.opendata.arcgis.com/datasets/electric-substations
HIFLD_SUBSTATIONS = pd.read_csv("hifld_substations.csv")

def search_substation_hifld(name: str, state: str) -> dict | None:
    """Search HIFLD dataset for substation."""

    # Normalize search
    name_normalized = name.lower().replace("substation", "").strip()

    matches = HIFLD_SUBSTATIONS[
        (HIFLD_SUBSTATIONS["STATE"] == state) &
        (HIFLD_SUBSTATIONS["NAME"].str.lower().str.contains(name_normalized, na=False))
    ]

    if not matches.empty:
        best = matches.iloc[0]
        return {
            "lat": best["LATITUDE"],
            "lon": best["LONGITUDE"],
            "name": best["NAME"],
            "source": "hifld",
            "confidence": 0.90
        }
    return None
```

### Google Places API Fallback

```python
import googlemaps

gmaps = googlemaps.Client(key=os.environ["GOOGLE_MAPS_API_KEY"])

def search_substation_google(name: str, state: str) -> dict | None:
    """Fallback to Google Places API."""

    query = f"{name} substation {state}"
    results = gmaps.places(query)

    if results.get("results"):
        place = results["results"][0]
        location = place["geometry"]["location"]
        return {
            "lat": location["lat"],
            "lon": location["lng"],
            "name": place["name"],
            "source": "google",
            "confidence": 0.75
        }
    return None
```

### POI Name Normalization

```python
import re

def normalize_poi_name(poi: str) -> str:
    """Clean POI name for better matching."""
    if not poi:
        return ""

    # Remove voltage indicators
    poi = re.sub(r'\d+\s*(kv|kva|mva|mw)', '', poi, flags=re.IGNORECASE)

    # Remove common suffixes
    poi = re.sub(r'\b(ss|sub|substation|switching station|sw sta)\b', '', poi, flags=re.IGNORECASE)

    # Clean up whitespace
    poi = ' '.join(poi.split())

    return poi.strip()

# Examples:
# "Limestone 345 kV" → "Limestone"
# "MIDWAY 500KV SS" → "MIDWAY"
# "Big Brown Switching Station" → "Big Brown"
```

### Batch Processing Pipeline

```python
async def geocode_all_projects(batch_size: int = 100):
    """Process all projects needing geocoding."""

    # Get projects without coordinates
    projects = get_projects_without_coords()

    for batch in chunks(projects, batch_size):
        for project in batch:
            poi = normalize_poi_name(project.poi_name)
            state = project.state

            # Try sources in order
            result = (
                search_substation_osm(poi, state) or
                search_substation_hifld(poi, state) or
                search_substation_google(poi, state)
            )

            if result:
                update_project_coords(
                    project_id=project.id,
                    latitude=result["lat"],
                    longitude=result["lon"],
                    geo_source=result["source"],
                    geo_confidence=result["confidence"]
                )

        # Rate limiting
        await asyncio.sleep(1)
```

### Cost Estimate

| Source | Requests | Cost |
|--------|----------|------|
| OSM/OpenInfraMap | 36,000 | Free |
| HIFLD | 36,000 | Free (local dataset) |
| Google (fallback ~20%) | ~7,200 | ~$122 |
| **Total** | | **~$122** |

---

## Phase 3: Developer Enrichment (Week 3)

**Goal:** Add developer names and company intelligence

### The Challenge

The LBNL dataset has a `developer` column but it's ~40% empty. We need to enrich missing developer data from:
1. ISO interconnection queue filings (most authoritative)
2. State PUC filings
3. News/press releases
4. Reverse lookup from project names

### Data Sources (in priority order)

| Source | Data | Method | Cost |
|--------|------|--------|------|
| **ISO Queue Portals** | Developer name from filings | Scrape + PDF parsing | Free |
| **State PUC Filings** | Company name, ownership | Scrape state portals | Free |
| **EIA Form 860** | Operational plant owners | Download CSV | Free |
| **OpenCorporates** | Company registry, parent co | API | Free tier |
| **Tavily/Web Search** | News, press releases | API | ~$0.01/search |
| **SEC EDGAR** | Parent company, financials | API | Free |

### ISO Filing Scraping Strategy

Each ISO has an interconnection queue portal with project details:

| ISO | Portal URL | Filing Format |
|-----|------------|---------------|
| **ERCOT** | `ercot.com/gridmktinfo/interconnection` | PDF/Excel |
| **PJM** | `pjm.com/planning/services-requests/interconnection-queues` | Excel/Web |
| **CAISO** | `caiso.com/planning/Pages/GeneratorInterconnection` | PDF/Web |
| **MISO** | `misoenergy.org/planning/generator-interconnection` | PDF/Excel |
| **SPP** | `spp.org/engineering/generator-interconnection` | PDF/Web |
| **NYISO** | `nyiso.com/interconnections` | PDF/Web |
| **ISO-NE** | `iso-ne.com/system-planning/interconnection` | PDF/Web |

### ERCOT Scraping Example

```python
import requests
from bs4 import BeautifulSoup
import pdfplumber
import re

def scrape_ercot_developer(q_id: str) -> str | None:
    """
    Scrape ERCOT interconnection queue to find developer name.
    ERCOT publishes queue data in Excel + individual project PDFs.
    """
    # 1. Download the queue spreadsheet
    queue_url = "https://www.ercot.com/files/docs/2024/01/01/GIS_Report.xlsx"
    df = pd.read_excel(queue_url)

    # 2. Find the project row
    project = df[df["INR Number"] == q_id]
    if project.empty:
        return None

    # 3. Check if developer is in spreadsheet
    developer = project.iloc[0].get("Developer") or project.iloc[0].get("Company Name")
    if developer and pd.notna(developer):
        return developer

    # 4. If not, fetch the individual project filing PDF
    project_pdf_url = f"https://www.ercot.com/files/docs/gis/{q_id}_application.pdf"
    response = requests.get(project_pdf_url)

    if response.status_code == 200:
        with pdfplumber.open(io.BytesIO(response.content)) as pdf:
            text = "\n".join(page.extract_text() for page in pdf.pages)

            # Extract developer using regex patterns
            patterns = [
                r"Developer[:\s]+([A-Z][A-Za-z\s&,\.]+(?:LLC|Inc|Corp|LP|Energy|Solar|Wind))",
                r"Project Owner[:\s]+([A-Z][A-Za-z\s&,\.]+(?:LLC|Inc|Corp|LP|Energy|Solar|Wind))",
                r"Applicant[:\s]+([A-Z][A-Za-z\s&,\.]+(?:LLC|Inc|Corp|LP|Energy|Solar|Wind))",
            ]

            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    return match.group(1).strip()

    return None
```

### LLM-Based Extraction (for complex PDFs)

```python
from anthropic import Anthropic

client = Anthropic()

def extract_developer_with_llm(pdf_text: str) -> dict:
    """Use Claude to extract structured data from filing PDFs."""

    response = client.messages.create(
        model="claude-3-haiku-20240307",  # Fast and cheap
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""Extract the developer/owner information from this interconnection filing.

Return JSON with:
- developer_name: The company name
- parent_company: Parent company if mentioned
- contact_name: Contact person if listed

Filing text:
{pdf_text[:4000]}

JSON:"""
        }]
    )

    return json.loads(response.content[0].text)
```

### Reverse Lookup from Project Names

Many project names contain developer hints:

```python
def extract_developer_from_project_name(project_name: str) -> str | None:
    """
    Some project names include developer:
    - "NextEra Panhandle Wind" → NextEra
    - "Invenergy Solar Project" → Invenergy
    - "Pattern Energy Wind Farm" → Pattern Energy
    """
    known_developers = [
        "NextEra", "Invenergy", "Pattern Energy", "Avangrid",
        "EDF Renewables", "Ørsted", "Enel", "Lightsource BP",
        "Canadian Solar", "First Solar", "Recurrent Energy",
        "Clearway", "AES", "Duke Energy", "Dominion",
    ]

    for developer in known_developers:
        if developer.lower() in project_name.lower():
            return developer

    return None
```

### Developer Data Enrichment Pipeline

```python
async def enrich_developer(project: QueueProject) -> dict:
    """
    Multi-source developer enrichment pipeline.
    Returns enriched developer data.
    """
    result = {
        "developer_name": project.developer,  # Start with existing
        "parent_company": None,
        "portfolio_size": 0,
        "source": "existing",
        "confidence": 0.0,
    }

    # Skip if already have good data
    if project.developer and len(project.developer) > 3:
        result["confidence"] = 1.0
        return result

    # 1. Try ISO filing scrape
    iso_scrapers = {
        "ERCOT": scrape_ercot_developer,
        "PJM": scrape_pjm_developer,
        "CAISO": scrape_caiso_developer,
        # ... more ISOs
    }

    scraper = iso_scrapers.get(project.region)
    if scraper:
        developer = await scraper(project.q_id)
        if developer:
            result["developer_name"] = developer
            result["source"] = "iso_filing"
            result["confidence"] = 0.95
            return result

    # 2. Try reverse lookup from project name
    developer = extract_developer_from_project_name(project.project_name)
    if developer:
        result["developer_name"] = developer
        result["source"] = "project_name"
        result["confidence"] = 0.80
        return result

    # 3. Try web search as fallback
    developer = await search_developer_web(project.project_name, project.state)
    if developer:
        result["developer_name"] = developer
        result["source"] = "web_search"
        result["confidence"] = 0.60
        return result

    return result


async def search_developer_web(project_name: str, state: str) -> str | None:
    """Search web for project developer using Tavily."""
    from tavily import TavilyClient

    tavily = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

    query = f"{project_name} solar wind developer owner {state}"
    results = tavily.search(query, max_results=5)

    if results.get("results"):
        # Use LLM to extract developer from search results
        context = "\n".join(r["content"] for r in results["results"])
        return extract_developer_with_llm(context).get("developer_name")

    return None
```

### Portfolio Analysis

Once we have developer names, calculate portfolio metrics:

```python
def calculate_developer_portfolio(developer_name: str) -> dict:
    """Calculate portfolio stats for a developer."""

    projects = get_projects_by_developer(developer_name)

    return {
        "portfolio_size": len(projects),
        "total_capacity_mw": sum(p.mw1 or 0 for p in projects),
        "active_projects": sum(1 for p in projects if p.q_status == "active"),
        "operational_projects": sum(1 for p in projects if p.q_status == "operational"),
        "withdrawn_projects": sum(1 for p in projects if p.q_status == "withdrawn"),
        "completion_rate": calculate_completion_rate(projects),
        "regions": list(set(p.region for p in projects if p.region)),
        "primary_fuel_type": get_primary_fuel_type(projects),
    }
```

### Cost Estimate for Developer Enrichment

| Task | Volume | Cost |
|------|--------|------|
| ISO Filing Downloads | ~36,000 | Free |
| PDF Parsing (local) | ~36,000 | Free (compute) |
| LLM Extraction (Haiku) | ~15,000 complex PDFs | ~$15 |
| Web Search (Tavily) | ~5,000 fallback | ~$50 |
| **Total** | | **~$65** |

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

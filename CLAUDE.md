# GridAgent

> ISO-Specific Intelligence. Generation Interconnection Cluster Results. Tariff Knowledge.

## Quick Reference

| What | Where |
|------|-------|
| Frontend | `frontend/` - Next.js 16, React 19, TypeScript |
| Backend | `backend/` - FastAPI, SQLModel |
| Data Pipeline | `data_pipeline/` - PJM scraper, loaders |
| Database | Supabase PostgreSQL |
| Live Site | https://gridagent.io |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion |
| Maps | react-simple-maps, d3-scale (choropleth), TopoJSON |
| Charts | Recharts |
| Backend | Python FastAPI, SQLModel |
| Database | PostgreSQL (Supabase) |
| AI | Claude (Anthropic API) - planned |
| Deploy | Vercel (frontend), Railway (backend), Supabase (db) |

---

## Project Structure

```
GridAgent/
├── CLAUDE.md                 # THIS FILE - Single source of truth
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # Landing page (black/white minimal design)
│       │   ├── queue/            # Queue explorer (formerly /explorer)
│       │   ├── cluster/          # PJM Cluster analyzer
│       │   │   ├── page.tsx      # Project list
│       │   │   └── [projectId]/  # Project dashboard
│       │   ├── agent/            # GridAgent AI interface (placeholder)
│       │   └── about/            # About page
│       ├── components/
│       │   ├── ui/               # shadcn (12+ components)
│       │   ├── charts/           # 8 chart components
│       │   ├── filters/          # Global filter bar
│       │   ├── map/              # US choropleth
│       │   ├── layout/           # Header, footer
│       │   └── agent/            # Chat UI (placeholder)
│       ├── lib/api.ts            # All API calls
│       └── types/                # TypeScript types
├── backend/
│   └── app/
│       ├── main.py               # FastAPI app
│       ├── database.py           # Supabase connection
│       ├── models/
│       │   ├── queue_project.py  # LBNL data model
│       │   └── cluster.py        # PJM cluster models
│       └── routes/
│           ├── projects.py       # /api/projects
│           ├── stats.py          # /api/stats/*
│           └── cluster.py        # /api/cluster/*
├── data_pipeline/
│   ├── config.py                 # Paths, risk weights
│   ├── run_scraper.py            # Scrape PJM reports
│   ├── load_to_db.py             # Load to Supabase
│   ├── scrapers/
│   │   └── pjm_scraper.py        # HTML table extraction
│   ├── migrations/
│   │   └── 001_cluster_tables.sql
│   └── output/                   # Scraped JSON (intermediate)
└── docs/
    ├── CONTRIBUTING.md           # Git workflow
    └── GRIDAGENT.md              # AI Agent roadmap (future)
```

---

## Database Schema (Supabase)

### Table 1: queue_projects (36,441 rows)
National queue dataset - all US ISOs.

```
q_id, q_status, q_date, region, state, county, fips_code
project_name, developer, utility, poi_name
type_clean, mw1, mw2, mw3, q_year
```

### Table 2: pjm_clusters
Cluster study metadata.

```
id, cluster_name (TC2), phase (PHASE_1)
total_projects, total_mw, decision_deadline
```

### Table 3: pjm_project_costs
Project cost allocations and risk scores.

```
project_id, cluster_id, developer, utility, state, county, fuel_type
mw_capacity, mw_energy, project_status, total_cost, cost_per_kw

-- Cost breakdown
toif_cost, stand_alone_cost, network_upgrade_cost, system_reliability_cost

-- Readiness deposits
rd1_amount, rd2_amount, rd2_due_date

-- Timeline
requested_cod

-- Risk scores (0-100)
risk_score_overall, risk_score_cost, risk_score_concentration
risk_score_dependency, risk_score_timeline

-- Ranking
cost_rank (by $/kW), cost_percentile
```

### Table 4: pjm_upgrades
Network upgrades from cluster studies.

```
id, cluster_id, rtep_id, to_id, utility
title, upgrade_type, total_cost, shared_by_count, upgrade_cod
```

### Table 5: pjm_project_upgrades
Project-to-upgrade cost allocations.

```
project_id, upgrade_id, cluster_id
link_type (COST_ALLOCATED | TAGGED_NO_COST)
mw_impact, percent_allocation, allocated_cost
```

### Table 6: pjm_facility_overloads
Line loading data for withdrawal simulation.

```
id, cluster_id, upgrade_id
facility_name, contingency_name, contingency_type
loading_pct, rating_mva, mva_to_mitigate
total_mw_contribution, contributing_project_count
```

### Table 7: pjm_mw_contributions
Project contributions to facility overloads (for simulation).

```
id, facility_overload_id, project_id
mw_contribution, contribution_type (50/50, Solar/Wind Harmer, Adder)
```

### Views
- `v_project_summary` - Project with cluster context
- `v_project_upgrade_exposure` - Project upgrade details
- `v_codependent_projects` - Projects sharing upgrades

---

## API Endpoints

### Queue Data (LBNL)
```
GET  /api/projects                    # List with filters
GET  /api/projects/filter-options     # Dropdown options
GET  /api/projects/search/?q=         # Search
GET  /api/stats                       # Overview stats
GET  /api/stats/by-region             # By ISO
GET  /api/stats/by-type               # By fuel type
GET  /api/stats/by-county             # For map heatmap
GET  /api/stats/map-data              # Combined map data
```

### PJM Cluster Data
```
GET  /api/cluster/clusters            # List clusters
GET  /api/cluster/summary/{cluster}/{phase}  # Cluster stats
GET  /api/cluster/projects            # Project list with filters
GET  /api/cluster/projects/search     # Search projects
GET  /api/cluster/projects/{id}       # Project dashboard
GET  /api/cluster/projects/filter-options
```

---

## Risk Score Calculation

Composite score (0-100) with four components:

| Component | Weight | What it measures |
|-----------|--------|------------------|
| **Cost** | 35% | $/kW percentile (higher = riskier) |
| **Concentration** | 25% | % of cost from single largest upgrade |
| **Dependency** | 25% | Number of co-dependent projects |
| **Overloads** | 15% | Total number of upgrades tagged |

Calculated in `data_pipeline/load_to_db.py` after data load.

---

## Commands

```bash
# Frontend (localhost:3000)
cd frontend && npm run dev

# Backend (localhost:8001)
cd backend && uvicorn app.main:app --reload --port 8001

# Scrape PJM data (test)
cd data_pipeline && python run_scraper.py --cluster TC2 --phase PHASE_1 --limit 10

# Load to database
cd data_pipeline && python load_to_db.py --json output/scraped_TC2_PHASE_1_*.json

# Recalculate risk scores only
cd data_pipeline && python -c "from load_to_db import calculate_risk_scores; ..."
```

---

## Environment Variables

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8001

# backend/.env
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-xxx  # For future AI agent
```

---

## Project Status

### Completed
- [x] **GridAgent Branding & Landing Page Redesign**
  - [x] Minimal black/white design with green accent (#4FFFB0)
  - [x] Starry background animation (CSS radial gradients)
  - [x] New copy: "Track Cluster Results Across ISOs"
  - [x] Stats: Ask → Compare → Decide flow
  - [x] Specialized AI Agents section (PJM Live, others Coming Soon)
  - [x] "We Handle The Cluster Results Data Mess. You Handle The Decisions."
  - [x] Waitlist modal with GA logo
- [x] Interactive US map (county heatmap)
- [x] Queue explorer with Map | Charts | Data tabs
- [x] Global filters (region, type, status)
- [x] 8 chart components
- [x] Data table with sorting/pagination
- [x] PJM Cluster Analyzer (TC2 Phase 1)
  - [x] Project list with search/filters
  - [x] Project dashboard with risk scores
  - [x] Cost breakdown and upgrade details
  - [x] Co-dependent project links
- [x] Deployed to Vercel (gridagent.io) + Railway

### In Progress
- [ ] Deploy backend CORS fix for gridagent.io domain

### Recently Completed
- [x] **CORS Configuration** - Added gridagent.io to backend allowed origins
- [x] **Cluster Charts Enhancement** - $/kW histogram with average reference line (orange dashed)

### Planned (Future)
- [ ] GridAgent AI Assistant - see docs/GRIDAGENT.md
- [ ] Auth & user accounts
- [ ] Saved queries & alerts
- [ ] More cluster studies (TC1, Cycle 1)
- [ ] MISO, NYISO/ISO-NE, SPP agent support

---

## Cluster Page Charts

The `/cluster` page displays 4 analytical charts:

| Chart | Type | Purpose |
|-------|------|---------|
| **Cost Distribution** | Histogram with Avg line | $/kW distribution with orange dashed average reference |
| **Projects by Fuel Type** | Donut | Solar, Wind, Storage, Gas breakdown |
| **Risk Breakdown** | Radar | Average scores: Cost, Concentration, Dependency, Timeline |
| **Top Utilities** | Horizontal Bar | Project count by transmission owner |

Chart colors:
- Histogram bars: `#3B82F6` (blue)
- Average line: `#F97316` (orange, dashed)
- Fuel types: See Design Tokens

---

## Key Files to Know

| Purpose | File |
|---------|------|
| API client | `frontend/src/lib/api.ts` |
| Cluster project page | `frontend/src/app/cluster/[projectId]/page.tsx` |
| Cluster API routes | `backend/app/routes/cluster.py` |
| Cluster DB models | `backend/app/models/cluster.py` |
| PJM scraper | `data_pipeline/scrapers/pjm_scraper.py` |
| Data loader | `data_pipeline/load_to_db.py` |
| Risk calculation | `data_pipeline/load_to_db.py:calculate_risk_scores()` |
| DB migration | `data_pipeline/migrations/001_cluster_tables.sql` |

---

## Design Tokens

```
# Brand Colors (Minimal Black/White + Green Accent)
Background:  #000000 (black)
Foreground:  #FFFFFF (white)
Accent:      #4FFFB0 (green - for highlights, "Accessible" text)
Live Badge:  emerald-500 (Tailwind - for "Live" status with ping animation)

# Fuel Type Colors (for charts)
Solar:      #FBBF24 (yellow)
Wind:       #14B8A6 (teal)
Storage:    #8B5CF6 (purple)
Gas:        #6B7280 (gray)

# ISO Agents Status
PJM:        Live (green badge with ping animation)
MISO:       Coming Soon
NYISO/ISO-NE: Coming Soon
SPP:        Coming Soon

# UI Elements
Borders:    white/10 - white/30
Cards:      zinc-900 with white/10 border
Buttons:    White bg with black text (primary), transparent with white border (secondary)
```

---

## Live URLs

- **Frontend:** https://gridagent.io (Vercel)
- **Backend:** https://queue-insights-production.up.railway.app
- **GitHub:** https://github.com/AmyArsenal/queue-insights

---

## Notes for Claude Code

1. **Database is Supabase** - Use SQLModel/SQLAlchemy, not raw psycopg2 in routes
2. **Frontend uses shadcn/ui** - Components in `frontend/src/components/ui/`
3. **PJM data is scraped** - Not from an API, from HTML reports
4. **Risk scores are calculated** - After data load, not during scrape
5. **$/kW is the key metric** - Used for ranking, not total cost

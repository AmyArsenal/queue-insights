# Queue Insights

> The best interconnection queue tracker for the US grid.

## Quick Reference

| What | Where |
|------|-------|
| Frontend | `frontend/` - Next.js 16, React 19, TypeScript |
| Backend | `backend/` - FastAPI, SQLModel |
| Data Pipeline | `data_pipeline/` - PJM scraper, loaders |
| Database | Supabase PostgreSQL |
| Live Site | https://queue-insights.vercel.app |

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
Queue Insights/
├── CLAUDE.md                 # THIS FILE - Single source of truth
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # Landing page
│       │   ├── explorer/         # Map | Charts | Data tabs
│       │   ├── cluster/          # PJM Cluster analyzer
│       │   │   ├── page.tsx      # Project list
│       │   │   └── [projectId]/  # Project dashboard
│       │   ├── agent/            # AI Agent (placeholder)
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
LBNL Queued Up national dataset - all US ISOs.

```
q_id, q_status, q_date, region, state, county, fips_code
project_name, developer, utility, poi_name
type_clean, mw1, mw2, mw3, q_year
```

### Table 2: pjm_clusters (1 row)
Cluster study metadata.

```
id, cluster_name (TC2), phase (PHASE_1)
total_projects, total_mw, decision_deadline
```

### Table 3: pjm_project_costs (452 rows)
Project cost allocations and risk scores.

```
project_id, cluster_id, developer, utility, state, county, fuel_type
mw_capacity, total_cost, cost_per_kw

-- Cost breakdown
toif_cost, stand_alone_cost, network_upgrade_cost, system_reliability_cost

-- Readiness deposits
rd1_amount, rd2_amount

-- Risk scores (0-100)
risk_score_overall, risk_score_cost, risk_score_concentration
risk_score_dependency, risk_score_timeline (overload count)

-- Ranking
cost_rank (by $/kW), cost_percentile
```

### Table 4: pjm_upgrades (1,339 rows)
Network upgrades from cluster studies.

```
id, cluster_id, rtep_id, to_id, utility, title, total_cost, shared_by_count
```

### Table 5: pjm_project_upgrades (8,708 rows)
Project-to-upgrade cost allocations.

```
project_id, upgrade_id, cluster_id
link_type (COST_ALLOCATED | TAGGED_NO_COST)
mw_impact, percent_allocation, allocated_cost
```

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
- [x] Landing page with stats
- [x] Interactive US map (county heatmap)
- [x] Explorer tabs: Map | Charts | Data
- [x] Global filters (region, type, status)
- [x] 8 chart components
- [x] Data table with sorting/pagination
- [x] PJM Cluster Analyzer (TC2 Phase 1)
  - [x] Project list with search/filters
  - [x] Project dashboard with risk scores
  - [x] Cost breakdown and upgrade details
  - [x] Co-dependent project links
- [x] Deployed to Vercel + Railway

### In Progress
- [ ] Deploy PJM Cluster feature to production

### Planned (Future)
- [ ] AI Agent (GridAgent) - see docs/GRIDAGENT.md
- [ ] Auth & user accounts
- [ ] Saved queries & alerts
- [ ] More cluster studies (TC1, Cycle 1)

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
Primary:    #3B82F6 (blue)
Solar:      #FBBF24 (yellow)
Wind:       #14B8A6 (teal)
Storage:    #8B5CF6 (purple)
Gas:        #6B7280 (gray)

ISO Regions:
CAISO: #3B82F6, ERCOT: #F59E0B, MISO: #10B981, PJM: #8B5CF6
SPP: #14B8A6, NYISO: #EC4899, ISO-NE: #6366F1, West: #F97316, Southeast: #84CC16
```

---

## Live URLs

- **Frontend:** https://queue-insights.vercel.app
- **Backend:** https://queue-insights-production.up.railway.app
- **GitHub:** https://github.com/AmyArsenal/queue-insights

---

## Notes for Claude Code

1. **Database is Supabase** - Use SQLModel/SQLAlchemy, not raw psycopg2 in routes
2. **Frontend uses shadcn/ui** - Components in `frontend/src/components/ui/`
3. **PJM data is scraped** - Not from an API, from HTML reports
4. **Risk scores are calculated** - After data load, not during scrape
5. **$/kW is the key metric** - Used for ranking, not total cost

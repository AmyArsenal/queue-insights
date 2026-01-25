# GridAgent

> ISO interconnection queue intelligence. PJM cluster analysis. Tariff knowledge.

## Quick Reference

| Layer | Stack | Location |
|-------|-------|----------|
| Frontend | Next.js 16, React 19, shadcn/ui, Recharts | `frontend/` |
| Backend | FastAPI, SQLModel | `backend/` |
| Database | Supabase PostgreSQL | 7 tables |
| **Pipeline** | Firecrawl + validation gates | `pipelines/pjm_cluster/` |
| Legacy Pipeline | HTML scraper (deprecated) | `data_pipeline/` |
| Deploy | Vercel + Railway | gridagent.io |

## Key Files

| Task | File |
|------|------|
| **Frontend Docs** | `frontend/FRONTEND.md` |
| API client | `frontend/src/lib/api.ts` |
| Cluster page | `frontend/src/app/cluster/page.tsx` |
| Project detail | `frontend/src/app/cluster/[projectId]/page.tsx` |
| Portfolio store | `frontend/src/lib/portfolio-store.ts` |
| Agent components | `frontend/src/components/agent/` |
| Backend routes | `backend/app/routes/cluster.py` |
| DB models | `backend/app/models/cluster.py` |
| **Pipeline Docs** | `pipelines/pjm_cluster/PIPELINE.md` |
| **Pipeline Config** | `pipelines/pjm_cluster/config.py` |
| DB Migration | `data_pipeline/migrations/001_cluster_tables.sql` |

## Data Pipeline

**Full documentation:** `pipelines/pjm_cluster/PIPELINE.md`

```
Firecrawl API → Validate → Transform + Excel → Validate → Supabase → Derived Features
```

**8-step pipeline with validation gates:**
1. `01_fetch/` - Firecrawl API call
2. `02_validate_raw/` - Check JSON structure
3. `03_transform/` - Parse + merge CycleProjects-All.xlsx
4. `04_validate_merged/` - Allocation integrity checks
5. `05_load/` - Supabase upsert
6. `06_validate_db/` - Verify DB matches
7. `07_derived/` - Percentiles, risk scores
8. `08_validate_final/` - Final checks

**Key references in `config.py`:**
- `COST_DEFINITIONS` - Cost category definitions for AI Agent/UI tooltips
- `UPGRADE_DEFINITIONS` - Upgrade attributes including time_estimate
- `TIMELINE_RISK` - Interim deliverability rules
- `SPOT_CHECKS` - Validation test values (AH1-665)

## Database Schema

```sql
-- National queue (36K rows)
queue_projects: q_id, region, state, developer, utility, type_clean, mw1, q_year

-- PJM Cluster
pjm_clusters: id, cluster_name, phase, total_projects, total_mw
pjm_project_costs: project_id, cluster_id, costs (5 categories), RD amounts, risk metrics
pjm_upgrades: id, cluster_id, rtep_id, to_id, utility, title, time_estimate, total_cost
pjm_project_upgrades: project_id, upgrade_id, percent_allocation, allocated_cost
```

## API Endpoints

```
# Queue
GET /api/projects, /api/stats, /api/stats/by-region, /api/stats/map-data

# Cluster
GET /api/cluster/clusters
GET /api/cluster/summary/{cluster}/{phase}
GET /api/cluster/projects?cluster=TC2&phase=PHASE_1
GET /api/cluster/projects/{id}
```

## Design Tokens

```
Background: #000000    Foreground: #FFFFFF    Accent: #4FFFB0
Solar: #FBBF24   Wind: #14B8A6   Storage: #8B5CF6   Gas: #6B7280
Histogram: #3B82F6   Average line: #F97316 (dashed)
```

## Commands

```bash
# Frontend/Backend
npm run dev                              # Frontend :3000
uvicorn app.main:app --port 8001         # Backend

# Pipeline (new)
cd pipelines/pjm_cluster
python run_pipeline.py --cluster TC2 --phase PHASE_1

# Legacy scraper (deprecated)
python data_pipeline/run_scraper.py --cluster TC2 --phase PHASE_1
```

## URLs

- **Live:** https://gridagent.io | **API:** queue-insights-production.up.railway.app
- **GitHub:** github.com/AmyArsenal/queue-insights

## Skills (`.claude/commands/`)

`/deploy` `/db-status` `/add-chart` `/add-endpoint` `/add-scraper` `/debug`

## Rules

**Do:**
- Use SQLModel for queries (not raw SQL)
- Use shadcn/ui components from `frontend/src/components/ui/`
- Use Explore agent for codebase questions
- Reference `frontend/FRONTEND.md` for React patterns and pitfalls
- Reference `pipelines/pjm_cluster/PIPELINE.md` for pipeline details
- Reference `pipelines/pjm_cluster/config.py` for definitions
- Use `useMemo` for computed values, `useCallback` for function references
- Use `asChild` prop to avoid nested interactive elements

**Don't:**
- Add LBNL references (removed from branding)
- Use neon colors (black/white/green only)
- Read entire large files (use line ranges)
- Commit secrets or .env files
- Use `Math.random()` inside `useMemo` (use deterministic hash instead)

## Current Status

- PJM TC2 Phase 1: Live with 452 projects
- New Firecrawl pipeline: Documented, implementation in progress
- Legacy scraper: Working but deprecated
- Planned: TC1 data, ML survival model

## Pending Tasks

1. Implement pipeline step scripts (`01_fetch/fetch.py`, etc.)
2. Run new pipeline on TC2 Phase 1
3. Validate against existing database
4. Fetch TC1 Phase 1, 2, 3 data
5. Build ML model for project survival prediction

# GridAgent

> ISO interconnection queue intelligence. PJM cluster analysis. Tariff knowledge.

## Quick Reference

| Layer | Stack | Location |
|-------|-------|----------|
| Frontend | Next.js 16, React 19, shadcn/ui, Recharts | `frontend/` |
| Backend | FastAPI, SQLModel | `backend/` |
| Database | Supabase PostgreSQL | 7 tables |
| Pipeline | PJM HTML scraper | `data_pipeline/` |
| Deploy | Vercel + Railway | gridagent.io |

## Key Files

| Task | File |
|------|------|
| API client | `frontend/src/lib/api.ts` |
| Cluster page | `frontend/src/app/cluster/page.tsx` |
| Project detail | `frontend/src/app/cluster/[projectId]/page.tsx` |
| Backend routes | `backend/app/routes/cluster.py` |
| DB models | `backend/app/models/cluster.py` |
| Scraper | `data_pipeline/scrapers/pjm_scraper.py` |
| Data loader | `data_pipeline/load_to_db.py` |
| Migration | `data_pipeline/migrations/001_cluster_tables.sql` |

## Database Schema

```sql
-- National queue (36K rows)
queue_projects: q_id, region, state, developer, utility, type_clean, mw1, q_year

-- PJM Cluster (TC2 Phase 1)
pjm_clusters: id, cluster_name, phase, total_projects, total_mw
pjm_project_costs: project_id, cluster_id, developer, utility, state, fuel_type,
    mw_capacity, total_cost, cost_per_kw, risk_score_overall, cost_rank
pjm_upgrades: id, cluster_id, rtep_id, utility, title, total_cost
pjm_project_upgrades: project_id, upgrade_id, allocated_cost, percent_allocation
pjm_facility_overloads: facility_name, loading_pct, total_mw_contribution
pjm_mw_contributions: facility_overload_id, project_id, mw_contribution
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

## Risk Score Formula

| Component | Weight | Metric |
|-----------|--------|--------|
| Cost | 35% | $/kW percentile |
| Concentration | 25% | % from largest upgrade |
| Dependency | 25% | Co-dependent project count |
| Overloads | 15% | Tagged upgrade count |

Calculated in `load_to_db.py:calculate_risk_scores()` post-load.

## Design Tokens

```
Background: #000000    Foreground: #FFFFFF    Accent: #4FFFB0
Solar: #FBBF24   Wind: #14B8A6   Storage: #8B5CF6   Gas: #6B7280
Histogram: #3B82F6   Average line: #F97316 (dashed)
```

## Commands

```bash
npm run dev                    # Frontend :3000
uvicorn app.main:app --port 8001  # Backend
python run_scraper.py --cluster TC2 --phase PHASE_1 --limit 10
python load_to_db.py --json output/scraped_*.json
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
- Use `/compact` after major tasks

**Don't:**
- Add LBNL references (removed from branding)
- Use neon colors (black/white/green only)
- Read entire large files (use line ranges)
- Commit secrets or .env files

## Current Status

- PJM TC2 Phase 1: Live with 452 projects
- CORS: gridagent.io configured
- Planned: MISO, NYISO, SPP agents; Auth; AI assistant

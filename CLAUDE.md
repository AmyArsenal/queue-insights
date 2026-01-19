# Queue Insights

> The best interconnection queue tracker for the US grid.

## Overview

Web app visualizing US electricity interconnection queue data from LBNL "Queued Up" dataset.
- **36,441** queue records | **~2,290 GW** active capacity
- **9 regions**: CAISO, ERCOT, ISO-NE, MISO, NYISO, PJM, SPP, West, Southeast

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Maps | react-simple-maps, d3-scale, TopoJSON |
| Charts | Recharts |
| Backend | Python FastAPI, SQLModel |
| Database | PostgreSQL (Supabase) |
| AI | Claude (Anthropic API), Vercel AI SDK |
| Deploy | Vercel (frontend), Railway (backend), Supabase (db) |

## Documentation

| Document | Purpose |
|----------|---------|
| **[docs/GRIDAGENT.md](docs/GRIDAGENT.md)** | GridAgent MVP: PJM cluster analysis, E2B, browser automation |
| [docs/AI_AGENT.md](docs/AI_AGENT.md) | General AI Agent architecture reference |
| [docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md) | Data enrichment pipeline (geocoding, developer info) |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Development workflow, CI/CD, branch strategy |

## Project Status

**Completed:** Landing page, Map, Filters, Charts, Data table, Deployment
**Current:** AI Agent (Phase 7) - the flagship feature
**Next:** Auth & User Features, Polish & Launch

## Structure

```
queue-insights/
├── docs/
│   ├── AI_AGENT.md          # AI Agent architecture (READ THIS)
│   ├── DATA_PIPELINE.md     # Data enrichment details
│   └── CONTRIBUTING.md      # Development workflow
├── frontend/src/
│   ├── app/
│   │   ├── page.tsx         # Landing page
│   │   ├── explorer/        # Map, Charts, Data tabs
│   │   └── agent/           # AI Agent chat interface
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── charts/          # 8 chart components
│   │   ├── filters/         # Filter bar, table
│   │   ├── map/             # Choropleth map
│   │   └── agent/           # Chat UI (planned)
│   └── lib/api.ts           # API client
├── backend/app/
│   ├── main.py
│   ├── routes/
│   │   ├── projects.py      # /api/projects
│   │   ├── stats.py         # /api/stats/*
│   │   └── agent.py         # /api/agent/* (planned)
│   └── models/
└── CLAUDE.md
```

## API Endpoints

```
GET  /api/projects              # List (paginated, multi-select filters)
GET  /api/projects/filter-options  # Unique values for filters
GET  /api/stats                 # Overview stats
GET  /api/stats/by-region       # By ISO region
GET  /api/stats/by-type         # By fuel type
GET  /api/stats/by-status       # By status
GET  /api/stats/by-county       # By county (FIPS) - for map
GET  /api/stats/timeline        # Time series
POST /api/agent/query           # AI Agent queries (planned)
```

## Commands

```bash
# Frontend (localhost:3000)
cd frontend && npm run dev

# Backend (localhost:8001)
cd backend && uvicorn app.main:app --reload --port 8001
```

## Environment Variables

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8001
ANTHROPIC_API_KEY=sk-ant-xxx
E2B_API_KEY=e2b_xxx
TAVILY_API_KEY=tvly-xxx

# backend/.env
DATABASE_URL=postgresql://...@supabase.co:5432/postgres
```

## Design Tokens

```
Primary: #3B82F6 | Solar: #FBBF24 | Wind: #14B8A6 | Storage: #8B5CF6

ISO Regions:
CAISO: #3B82F6, ERCOT: #F59E0B, MISO: #10B981, PJM: #8B5CF6
SPP: #14B8A6, NYISO: #EC4899, ISO-NE: #6366F1
```

## Live URLs

- **Frontend:** https://queue-insights.vercel.app
- **Backend:** https://queue-insights-production.up.railway.app
- **GitHub:** https://github.com/AmyArsenal/queue-insights

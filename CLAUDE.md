# Queue Insights

> The best interconnection queue tracker for the US grid.

## Overview

Web app visualizing US electricity interconnection queue data from LBNL "Queued Up" dataset.
- **36,441** queue records | **~2,290 GW** active capacity
- **9 regions**: CAISO, ERCOT, ISO-NE, MISO, NYISO, PJM, SPP, West, Southeast

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion |
| Maps | react-simple-maps, d3-scale (choropleth), TopoJSON |
| Charts | Recharts |
| Backend | Python FastAPI, SQLModel |
| Database | PostgreSQL (Supabase) |
| AI | Claude (Anthropic API) |
| Deploy | Vercel (frontend), Railway (backend), Supabase (db) |

---

## Project Status

### Completed

- [x] **Phase 1: Foundation + Landing Page**
  - Next.js 16 project with TypeScript
  - Tailwind CSS 4 + shadcn/ui (12 components)
  - Layout shell (header, footer)
  - Hero section with stats
  - Dark/light mode toggle
  - Clean marketing page (no map) with feature preview cards
  - Link prefetching for faster navigation

- [x] **Phase 2: Data Layer + Map**
  - PostgreSQL schema on Supabase
  - Data ingestion script (36,441 records loaded)
  - FastAPI backend with endpoints
  - Interactive US choropleth map (react-simple-maps + d3-scale)
  - County-level heat map with capacity-based color scale
  - Hover tooltips (county, state, region, projects, capacity)
  - Map legend with capacity scale + ISO region colors
  - Stats overlay showing total projects and capacity
  - Map responds to global filters (region, type, status)
  - Region filter dims non-selected regions on map

- [x] **Phase 3: Filters + Data Table**
  - Global filter bar (horizontal, above tabs)
  - Region, Type, Status dropdown filters
  - Filters apply globally to Map, Charts, and Data tabs
  - Data table with sorting/pagination
  - Stats cards update with filters
  - Loading skeleton UI (loading.tsx) for instant feedback

- [x] **Phase 4: Charts + Analytics**
  - Tabbed Explorer interface: Map | Charts | Data
  - 8 chart components in Charts tab:
    - Queue growth over time (area)
    - Capacity growth by status (stacked area)
    - Capacity by type (bar + pie)
    - Regional comparison (2 horizontal bars)
    - Withdrawal rate + capacity outcomes
  - Charts respond to global filters

- [x] **Phase 5: Deployment & Web Hosting**
  - [x] Initialize Git repository
  - [x] Push to GitHub: https://github.com/AmyArsenal/queue-insights
  - [x] CI/CD pipeline with GitHub Actions (lint, type check, build)
  - [x] Deploy frontend to Vercel: https://queue-insights.vercel.app
  - [x] Deploy backend to Railway: https://queue-insights-production.up.railway.app
  - [x] Configure environment variables (connect Vercel to Railway)
  - [x] Verify production deployment ✅

### In Progress

- [ ] **Phase 6: AI Agent Interface**
  - OpenRouter integration (LLM routing: Gemini, Claude, GPT-4)
  - E2B sandbox for Python code execution
  - Tavily web search for real-time ISO news
  - Chat UI component with streaming responses
  - Natural language → SQL queries (read-only)
  - AI-generated charts and analysis
  - ReAct loop architecture

- [ ] **Phase 7: Polish + Launch**
  - Performance optimization
  - SEO + Open Graph
  - Error boundaries
  - RAG for tariffs/documents (optional)

---

## Structure

```
queue-insights/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD pipeline
├── frontend/
│   ├── .npmrc                  # legacy-peer-deps for React 19
│   ├── vercel.json             # Vercel deployment config
│   ├── public/geo/             # TopoJSON files (states, counties)
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # Landing page (clean, no map)
│       │   ├── explorer/
│       │   │   ├── page.tsx      # Explorer (tabs: Map|Charts|Data)
│       │   │   └── loading.tsx   # Loading skeleton
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/               # shadcn (12 components incl. tabs)
│       │   ├── charts/           # 8 chart components
│       │   ├── filters/          # global-filter-bar, table, stats
│       │   ├── layout/           # header, footer
│       │   └── map/              # us-choropleth-map.tsx
│       ├── hooks/use-projects.ts
│       ├── lib/api.ts
│       └── types/index.ts
├── backend/
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── models/queue_project.py
│       └── routes/
│           ├── projects.py
│           └── stats.py
├── CLAUDE.md
└── CONTRIBUTING.md             # Development workflow guide
```

---

## API Endpoints

```
GET  /api/projects              # List (paginated, filtered)
GET  /api/stats                 # Overview stats
GET  /api/stats/by-region       # By ISO region
GET  /api/stats/by-type         # By fuel type
GET  /api/stats/by-status       # By status
GET  /api/stats/by-state        # By state
GET  /api/stats/by-year         # By queue year
GET  /api/stats/by-county       # By county (FIPS) - for map
GET  /api/stats/map-data        # Combined map data (state, county, region)
GET  /api/stats/withdrawn-by-year
GET  /api/stats/withdrawn-by-region
GET  /api/stats/timeline        # Time series with filters
```

---

## Commands

```bash
# Frontend (localhost:3000)
cd frontend && npm run dev

# Backend (localhost:8001)
cd backend && uvicorn app.main:app --reload --port 8001
```

---

## Environment Variables

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8001

# backend/.env
DATABASE_URL=postgresql://...@supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## Design Tokens

```
Primary:    #3B82F6 (blue)
Solar:      #FBBF24 (yellow)
Wind:       #14B8A6 (teal)
Storage:    #8B5CF6 (purple)
Gas:        #6B7280 (gray)
Success:    #10B981 (green)
Warning:    #F59E0B (amber)

ISO Region Colors:
CAISO:      #3B82F6 (blue)
ERCOT:      #F59E0B (amber)
MISO:       #10B981 (green)
PJM:        #8B5CF6 (purple)
SPP:        #14B8A6 (teal)
NYISO:      #EC4899 (pink)
ISO-NE:     #6366F1 (indigo)
West:       #F97316 (orange)
Southeast:  #84CC16 (lime)
```

---

## Deployment Architecture

```
┌─────────────────┐     git push     ┌─────────────────┐
│  Local Machine  │ ───────────────► │     GitHub      │
└─────────────────┘                  └────────┬────────┘
                                              │
                          ┌───────────────────┴───────────────────┐
                          │                                       │
                          ▼                                       ▼
                 ┌─────────────────┐                     ┌─────────────────┐
                 │     Vercel      │                     │    Railway      │
                 │   (Frontend)    │                     │   (Backend)     │
                 │   Next.js 16    │                     │    FastAPI      │
                 └────────┬────────┘                     └────────┬────────┘
                          │                                       │
                          │    API calls                          │
                          │    ─────────────────────────────────► │
                          │                                       │
                          │                                       ▼
                          │                              ┌─────────────────┐
                          │                              │    Supabase     │
                          │                              │   PostgreSQL    │
                          │                              │   (36,441 rows) │
                          └─────────────────────────────►└─────────────────┘
```

**Deployment Steps:**
1. ✅ `git init` → Create GitHub repo → `git push`
2. ✅ Vercel: Import repo → Set root to `frontend` → Auto-deploy
3. ⏳ Railway: Import repo → Set root to `backend` → Add env vars → Auto-deploy
4. ⏳ Update Vercel `NEXT_PUBLIC_API_URL` with Railway URL
5. Every `git push` triggers automatic redeployment

**Live URLs:**
- Frontend: https://queue-insights.vercel.app
- Backend: https://queue-insights-production.up.railway.app
- GitHub: https://github.com/AmyArsenal/queue-insights

---

## AI Agent Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         User Query                                │
│            "Show me solar projects over 100MW in ERCOT"          │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                      OpenRouter (LLM Router)                      │
│         Routes to best model: Gemini | Claude | GPT-4            │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     ReAct Loop (Think → Act → Observe)           │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   THINK     │───►│    ACT      │───►│  OBSERVE    │──┐       │
│  │ Plan action │    │ Execute tool│    │Parse result │  │       │
│  └─────────────┘    └─────────────┘    └─────────────┘  │       │
│         ▲                                                │       │
│         └────────────────────────────────────────────────┘       │
│                     (repeat until answer ready)                   │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                   ┌──────────────┼──────────────┐
                   │              │              │
                   ▼              ▼              ▼
         ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
         │query_database│ │ web_search  │ │execute_code │
         │ (Read-only) │ │  (Tavily)   │ │   (E2B)     │
         │   Supabase  │ │ ISO news,   │ │  Python     │
         │   SQL       │ │ tariffs     │ │  Charts     │
         └─────────────┘ └─────────────┘ └─────────────┘
```

**Tools Available to Agent:**
| Tool | Purpose | Security |
|------|---------|----------|
| `query_database` | SQL queries on queue data | Read-only Supabase user |
| `web_search` | Real-time ISO news, tariffs, market data | Tavily API |
| `execute_code` | Python for analysis, charts, calculations | E2B sandbox (isolated) |

**Security Measures:**
- Read-only database user (no INSERT, UPDATE, DELETE)
- E2B sandboxed execution (isolated from production)
- Query result size limits
- Rate limiting on API calls

**Required API Keys:**
```env
OPENROUTER_API_KEY=sk-or-xxx    # LLM routing
E2B_API_KEY=e2b_xxx             # Code execution sandbox
TAVILY_API_KEY=tvly-xxx         # Web search
ANTHROPIC_API_KEY=sk-ant-xxx    # Direct Claude access
```

---

## Notes

- TypeScript strict mode
- Mobile-first CSS
- Lazy load map + charts (dynamic imports)
- Map uses react-simple-maps with TopoJSON (no external API token required)
- County data matched via FIPS codes
- Uses d3-scale quantile for capacity color scaling
- AI Agent uses hybrid approach: web search for real-time data, optional RAG for tariffs

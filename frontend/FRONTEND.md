# Frontend Documentation

> Next.js 16 + React 19 + shadcn/ui + Tremor Charts

## Quick Reference

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16 (App Router) | SSR, routing, API routes |
| UI Components | shadcn/ui (Radix) | Buttons, modals, dropdowns, tables |
| Charts | Tremor (Recharts) | Distribution charts, bar charts |
| Styling | Tailwind CSS | Utility-first CSS |
| State | React Context + localStorage | Portfolio storage, agent state |

## Directory Structure

```
frontend/src/
├── app/                          # Next.js App Router pages
│   ├── agent/
│   │   └── page.tsx              # Three-panel agent UI (tool trace, chat, details)
│   ├── cluster/
│   │   ├── page.tsx              # Dashboard with charts + projects table
│   │   └── [projectId]/
│   │       └── page.tsx          # Project detail page
│   ├── portfolio/
│   │   ├── page.tsx              # Portfolio list
│   │   └── [id]/
│   │       └── page.tsx          # Portfolio detail
│   ├── layout.tsx                # Root layout with AgentProvider
│   └── page.tsx                  # Home/landing page
│
├── components/
│   ├── agent/                    # AI Agent components
│   │   ├── agent-button.tsx      # Floating chat button
│   │   ├── agent-chat.tsx        # Chat side panel (Sheet)
│   │   └── agent-provider.tsx    # React context for agent state (ToolCall, AgentMessage)
│   │
│   ├── charts/                   # Tremor chart components
│   │   ├── distribution-chart.tsx    # Box plot alternative (bar + scatter)
│   │   ├── fuel-distribution.tsx     # $/kW by fuel type
│   │   └── to-distribution.tsx       # $/kW by transmission owner
│   │
│   ├── filters/                  # Filter components
│   │   ├── cluster-filter-bar.tsx    # ISO, Cluster, Phase filters
│   │   └── multi-select-filter.tsx   # Reusable multi-select dropdown
│   │
│   ├── portfolio/                # Portfolio tracker components
│   │   ├── portfolio-card.tsx        # Summary card for list view
│   │   └── create-portfolio-modal.tsx # Create/edit modal
│   │
│   ├── tables/                   # Table components
│   │   └── projects-table.tsx        # Enhanced with filters + sorting
│   │
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── popover.tsx
│   │   ├── resizable.tsx         # Resizable panels (react-resizable-panels v4)
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   │
│   └── layout/                   # Layout components
│       ├── nav.tsx               # Navigation bar
│       └── footer.tsx
│
├── lib/
│   ├── api.ts                    # Backend API client
│   ├── portfolio-store.ts        # localStorage management
│   └── utils.ts                  # Utility functions (cn, formatters)
│
└── styles/
    └── globals.css               # Tailwind + custom styles
```

## Design Tokens

### Colors

```css
/* Base */
--background: #000000;
--foreground: #FFFFFF;
--accent: #4FFFB0;

/* Cards & Surfaces */
--card: #111111;
--card-hover: #1a1a1a;
--border: #333333;

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #A1A1AA;
--text-muted: #71717A;

/* Fuel Type Colors */
--fuel-solar: #FBBF24;      /* Amber */
--fuel-wind: #14B8A6;       /* Teal */
--fuel-storage: #8B5CF6;    /* Purple */
--fuel-gas: #6B7280;        /* Gray */
--fuel-hybrid: #EC4899;     /* Pink */
--fuel-nuclear: #EF4444;    /* Red */
--fuel-offshore: #0EA5E9;   /* Sky */
--fuel-other: #9CA3AF;      /* Light Gray */

/* Risk Colors */
--risk-low: #22c55e;        /* Green (0-25) */
--risk-medium: #eab308;     /* Yellow (25-50) */
--risk-high: #f97316;       /* Orange (50-75) */
--risk-critical: #ef4444;   /* Red (75-100) */

/* Chart Colors */
--chart-primary: #3B82F6;   /* Blue */
--chart-secondary: #8B5CF6; /* Purple */
--chart-average: #F97316;   /* Orange - dashed line */
```

### Typography

```css
/* Font Family */
font-family: 'Inter', system-ui, sans-serif;

/* Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### Spacing

```css
/* Consistent spacing scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

## Component Patterns

### shadcn/ui Usage

All base UI components come from shadcn/ui (built on Radix primitives):

```tsx
// Import from local ui folder
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
```

### Tremor Charts Setup

Tremor provides chart components built on Recharts:

```tsx
import { BarChart, Card, Title } from "@tremor/react";

// Horizontal bar chart (for distribution visualization)
<BarChart
  data={data}
  index="category"
  categories={["value"]}
  colors={["blue"]}
  layout="vertical"
  yAxisWidth={100}
/>

// With custom dark theme
<Card className="bg-zinc-900 border-zinc-800">
  <Title className="text-white">$/kW by Fuel Type</Title>
  <BarChart
    className="mt-4 h-72"
    data={fuelData}
    index="fuel"
    categories={["median", "q1", "q3"]}
    colors={["amber", "teal", "purple"]}
    layout="vertical"
  />
</Card>
```

### Distribution Chart Pattern

Since Tremor doesn't have native box plots, we use a combination:

```tsx
// Pattern: Horizontal BarChart + ScatterChart overlay

interface DistributionData {
  category: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  points: { value: number; projectId: string }[];
}

// Show range as stacked bar, overlay individual points
<div className="relative">
  <BarChart
    data={rangeData}
    index="category"
    categories={["range"]}  // Q1 to Q3
    layout="vertical"
  />
  <ScatterChart
    data={scatterData}
    category="category"
    x="value"
    y="category"
    size="size"
  />
</div>
```

### Filter Bar Pattern

```tsx
// Reusable filter bar with ISO, Cluster, Phase
<div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-lg">
  <Select value={iso} onValueChange={setIso}>
    <SelectTrigger className="w-32">
      <SelectValue placeholder="ISO" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="PJM">PJM</SelectItem>
    </SelectContent>
  </Select>

  <Select value={cluster} onValueChange={setCluster}>
    <SelectTrigger className="w-32">
      <SelectValue placeholder="Cluster" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="TC1">TC1</SelectItem>
      <SelectItem value="TC2">TC2</SelectItem>
    </SelectContent>
  </Select>

  {/* Phase as tabs */}
  <Tabs value={phase} onValueChange={setPhase}>
    <TabsList>
      <TabsTrigger value="PHASE_1">Phase 1</TabsTrigger>
      <TabsTrigger value="PHASE_2">Phase 2</TabsTrigger>
      <TabsTrigger value="PHASE_3">Phase 3</TabsTrigger>
      <TabsTrigger value="ALL">All</TabsTrigger>
    </TabsList>
  </Tabs>
</div>
```

### Multi-Select Filter Pattern

```tsx
// For table column filters (State, Developer, Fuel Type, etc.)
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="justify-between">
      {selectedCount > 0 ? `${selectedCount} selected` : "Filter"}
      <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-56 p-0">
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandList>
        {options.map((option) => (
          <CommandItem
            key={option}
            onSelect={() => toggleOption(option)}
          >
            <Checkbox checked={selected.includes(option)} />
            <span className="ml-2">{option}</span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

## Page Layouts

### Cluster Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Filter Bar: [ISO ▼] [Cluster ▼] [Phase 1 | Phase 2 | Phase 3 | All]   │
├─────────────────────────────────┬───────────────────────────────────────┤
│  $/kW by Fuel Type              │  # Upgrades by Fuel Type              │
│  (Horizontal bar + scatter)     │  (Horizontal bar + scatter)           │
├─────────────────────────────────┼───────────────────────────────────────┤
│  $/kW by TO                     │  # Upgrades by TO                     │
│  (Horizontal bar + scatter)     │  (Horizontal bar + scatter)           │
├─────────────────────────────────┴───────────────────────────────────────┤
│  Projects Table                                                          │
│  [Filters] Project ID | Developer | State | County | TO | Fuel | MW |   │
│            $/kW ↕ | Upgrades ↕ | Sharing | Details                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Project Detail

```
┌─────────────────────┬─────────────────────────────┬─────────────────────────────┐
│  PROJECT DETAILS    │  COST BREAKDOWN             │  POSITION vs PEERS          │
│  ID, Developer,     │  Total, TOIF, Physical,     │  Overall %, vs Fuel %,      │
│  State, County,     │  Sys Reliability, $/kW,     │  vs State %, Risk Score     │
│  TO, Fuel, MW       │  RD1, RD2                   │  (percentile bars)          │
├─────────────────────┴─────────────────────────────┴─────────────────────────────┤
│  NETWORK UPGRADES (Cost-Allocated + Contingent)                                 │
│  RTEP ID | Title | Total Cost | Your Share | % Share                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PROJECTS SHARING YOUR UPGRADES                                                 │
│  Project | Developer | Fuel | Shared Upgrades | Max Overlap                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  HIGHEST RISK DEPENDENCIES                                                      │
│  Project | Developer | $/kW | Shared Upgrades | Their Max % | Risk Level       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## State Management

### Portfolio Store (localStorage)

```typescript
// lib/portfolio-store.ts
interface Portfolio {
  id: string;           // UUID
  name: string;
  projectIds: string[]; // Array of project_id values
  createdAt: string;    // ISO date
  updatedAt: string;    // ISO date
}

// Functions
getPortfolios(): Portfolio[]
getPortfolio(id: string): Portfolio | null
createPortfolio(name: string, projectIds: string[]): Portfolio
updatePortfolio(id: string, updates: Partial<Portfolio>): Portfolio
deletePortfolio(id: string): void
addProjectToPortfolio(portfolioId: string, projectId: string): void
removeProjectFromPortfolio(portfolioId: string, projectId: string): void
```

### Agent Context

```typescript
// components/agent/agent-provider.tsx
interface AgentState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chart?: ChartData;     // Optional inline chart
  timestamp: Date;
}

// Context provides
const AgentContext = createContext<{
  state: AgentState;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
}>();
```

## API Integration

### Backend API Client

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Cluster endpoints
export async function getClusters(): Promise<Cluster[]>
export async function getClusterSummary(cluster: string, phase: string): Promise<ClusterSummary>
export async function getProjects(cluster: string, phase: string): Promise<Project[]>
export async function getProject(projectId: string): Promise<ProjectDetail>
export async function getProjectDependencies(projectId: string): Promise<Dependencies>

// Agent endpoint
export async function sendAgentMessage(message: string): Promise<AgentResponse>
```

## Installation

### Required Dependencies

```bash
# Tremor for charts
npm install @tremor/react

# Already installed (verify in package.json)
# - recharts (Tremor dependency)
# - @radix-ui/* (shadcn/ui)
# - tailwindcss
# - lucide-react (icons)
```

### Tremor Tailwind Config

Add to `tailwind.config.js`:

```javascript
module.exports = {
  // ... existing config
  content: [
    // ... existing paths
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Tremor uses these color scales
      colors: {
        tremor: {
          brand: {
            faint: "#0d1117",
            muted: "#1f2937",
            subtle: "#4b5563",
            DEFAULT: "#4FFFB0",
            emphasis: "#3de9a0",
            inverted: "#000000",
          },
          background: {
            muted: "#111111",
            subtle: "#1a1a1a",
            DEFAULT: "#000000",
            emphasis: "#333333",
          },
          border: {
            DEFAULT: "#333333",
          },
          ring: {
            DEFAULT: "#4FFFB0",
          },
          content: {
            subtle: "#71717A",
            DEFAULT: "#A1A1AA",
            emphasis: "#FFFFFF",
            strong: "#FFFFFF",
            inverted: "#000000",
          },
        },
      },
    },
  },
}
```

## Best Practices

### Do

- Use shadcn/ui for all base UI components (buttons, inputs, dialogs)
- Use Tremor for all chart components
- Keep components small and focused
- Use TypeScript interfaces for all data structures
- Handle loading and error states
- Use semantic HTML elements
- Test on dark background (always #000000)

### Don't

- Don't use bright/neon colors (stick to design tokens)
- Don't create custom chart implementations (use Tremor)
- Don't store sensitive data in localStorage
- Don't make API calls in render (use useEffect or SWR)
- Don't skip loading states

## Common React Pitfalls

### useMemo vs useCallback

```tsx
// WRONG: Using useCallback for computed values
const stats = useCallback(() => {
  return computeExpensiveStats(data);
}, [data]);
const result = stats(); // Called every render!

// CORRECT: Use useMemo for computed values
const stats = useMemo(() => {
  return computeExpensiveStats(data);
}, [data]);
// stats is the memoized value, not a function
```

**Rule**: `useCallback` memoizes a function reference. `useMemo` memoizes a computed value.

### Deterministic Values in useMemo

```tsx
// WRONG: Non-deterministic values in useMemo
const points = useMemo(() => {
  return data.map(item => ({
    ...item,
    jitter: Math.random() * 0.5, // Changes every re-render!
  }));
}, [data]);

// CORRECT: Derive deterministic values from stable identifiers
function hashToJitter(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return ((hash % 1000) / 1000) - 0.5;
}

const points = useMemo(() => {
  return data.map(item => ({
    ...item,
    jitter: hashToJitter(item.id) * 0.5, // Stable across re-renders
  }));
}, [data]);
```

### Nested Interactive Elements

```tsx
// WRONG: Nested interactive elements (invalid HTML)
<Link href="/path">
  <Button>Click me</Button>  {/* <a> wrapping <button> */}
</Link>

// CORRECT: Use asChild to compose elements
<Button asChild>
  <Link href="/path">Click me</Link>
</Button>
// Renders single <a> with button styles
```

### Modal Close After Submit

```tsx
// WRONG: Forgetting to close modal after action
const handleSubmit = () => {
  createItem(data);
  setItems(getItems());
  // Modal stays open!
};

// CORRECT: Close modal on successful submit
const handleSubmit = () => {
  createItem(data);
  setIsModalOpen(false);  // Close first
  setItems(getItems());
};
```

## Testing Checklist

- [ ] Filters update chart and table data
- [ ] Table sorting works ($/kW, Upgrades)
- [ ] Multi-select filters work correctly
- [ ] Project links navigate to detail page
- [ ] Portfolio CRUD operations work
- [ ] Agent chat sends/receives messages
- [ ] Dark theme renders correctly
- [ ] Responsive on mobile

## Related Documentation

- **Pipeline**: See `pipelines/pjm_cluster/PIPELINE.md`
- **Config**: See `pipelines/pjm_cluster/config.py` for cost/upgrade definitions
- **Backend**: See `backend/app/routes/cluster.py` for API endpoints
- **Main README**: See root `CLAUDE.md` for project overview

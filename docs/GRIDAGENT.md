# GridAgent: AI Agent for ISO Interconnection Analysis

> ISO-Specific Intelligence for Generation Interconnection Cluster Results

## Vision

GridAgent helps energy developers, investors, and consultants navigate interconnection queues across multiple ISOs. Built by consultants with 10+ years of experience in generation interconnection studies.

### Supported ISOs
- **PJM** - Live (TC2 Phase 1 data)
- **MISO** - Coming Soon
- **NYISO/ISO-NE** - Coming Soon
- **SPP** - Coming Soon

### Example Questions
- "What are my project's network upgrade costs compared to others in my cluster?"
- "Which projects in TC1 have the highest withdrawal risk based on $/kW?"
- "Show me all battery storage projects in my cluster with costs under $200/kW"
- "Compare my project's cost allocation to the cluster median"

---

## Architecture Overview (Revised)

**Key decisions:**
- **OpenRouter** for model flexibility (Claude, GPT-4, Gemini, Haiku)
- **Custom agent loop** (not Vercel AI SDK) for full control
- **CodeAct pattern** - one powerful `execute_code` tool instead of many specific tools
- **E2B sandbox** for code execution, browser automation, file storage

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER QUERY                               │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OPENROUTER (Model Selection)                  │
│     claude-sonnet-4 │ gpt-4o │ gemini-1.5-pro │ claude-haiku    │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOM AGENT LOOP                             │
│                                                                  │
│   while not done:                                                │
│     1. Think (plan next action)                                  │
│     2. Select tool + parameters                                  │
│     3. Execute tool                                              │
│     4. Observe result                                            │
│     5. Update memory (append to event stream)                    │
│     6. Check if done or need more steps                          │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
     │ query_db    │     │ execute_code│     │ web_search  │
     │             │     │             │     │             │
     │ Our FastAPI │     │ E2B Sandbox │     │ Tavily API  │
     │ (fast,local)│     │ (Python,    │     │ (news,regs) │
     │             │     │  Playwright,│     │             │
     │             │     │  PDF parse) │     │             │
     └─────────────┘     └─────────────┘     └─────────────┘
```

**Why this architecture:**
1. **OpenRouter** - swap models without code changes, A/B testing, cost optimization
2. **Custom loop** - KV cache optimization, full control over agent behavior
3. **CodeAct** - LLM writes Python that can do anything (browser, PDF, analysis)
4. **3 tools only** - simpler, more powerful, less prompt engineering

---

## Three-Panel UI (Brightwave-Inspired)

### Layout Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  GridAgent - PJM Cluster Analysis                                        [?] [−] [X] │
├────────────────────┬─────────────────────────────────┬───────────────────────────────┤
│                    │                                 │                               │
│  📁 SOURCES        │         💬 CHAT                │      🖥️ SANDBOX              │
│  (Left Panel)      │       (Center Panel)           │      (Right Panel)            │
│                    │                                 │                               │
│  Documents list    │  Conversation with             │  Live view of:                │
│  - Upload/add      │  streaming responses           │  - Browser automation         │
│  - Select multiple │  - Inline charts               │  - Code execution             │
│  - Open to read    │  - Citations [1][2]            │  - File explorer              │
│  - Search docs     │  - Progress indicators         │  - Todo progress              │
│                    │                                 │                               │
│  When reading:     │  Citations link to             │  Tabs:                        │
│  - TOC navigation  │  source documents              │  [Browser][Code][Files][Todo] │
│  - Text selection  │                                 │                               │
│  - "Tell me more"  │                                 │                               │
│                    │                                 │                               │
└────────────────────┴─────────────────────────────────┴───────────────────────────────┘
```

### Left Panel: Sources/Documents

**Document List View:**
```
┌─────────────────────────────────────┐
│ 📁 SOURCES                    [+]   │
│ ─────────────────────────────────── │
│ 🔍 Search documents...              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ☑ 📄 TC1 Phase 1 Report         │ │
│ │   PJM • 2024 • 306 projects     │ │
│ │   [Preview] [Open] [×]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ☐ 📄 AE1-143 Impact Study       │ │
│ │   PDF • 12 pages • Cost: $201/kW│ │
│ │   [Preview] [Open] [×]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ☐ 📄 TC1 Cost Summary           │ │
│ │   PJM • Network upgrades        │ │
│ │   [Preview] [Open] [×]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ + Add from PJM Portal               │
│ + Upload PDF                        │
│ + Paste URL                         │
└─────────────────────────────────────┘
```

**Document Reading Mode (expands left panel):**
```
┌──────────────────────────────────────────────────────┐
│ TC1 Phase 1 Report                        [×] [◀]   │
│ ──────────────────────────────────────────────────── │
│                                                      │
│ 📑 CONTENTS        │  DOCUMENT VIEW                 │
│ ─────────────────  │  ─────────────────────────────  │
│ 1. Introduction    │                                 │
│ 2. Preface         │  4.0 Cost Summary              │
│ 3. Project List    │  ─────────────────             │
│ ► 4. Cost Summary  │                                 │
│ 5. Network Impact  │  "The total network upgrade    │
│                    │   costs for TC1 projects are   │
│ ─────────────────  │   estimated at $4.2 billion,   │
│                    │   with an average allocation   │
│ 💬 Ask about       │   of $190/kW for battery       │
│    this section    │   storage projects."           │
│                    │   ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲         │
│ ┌────────────────┐ │                                 │
│ │ Compare this   │ │   [User selects text]          │
│ │ to my project  │ │   ┌─────────────────────────┐  │
│ └────────────────┘ │   │ 💡 Explain this         │  │
│                    │   │ 📊 Compare to my project│  │
│ [Send to chat]     │   │ 🔍 Find related data    │  │
│                    │   │ 📋 Copy with citation   │  │
│                    │   │ ➕ Add to chat context  │  │
│                    │   └─────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Center Panel: Chat

**Features:**
- Streaming responses
- Inline charts (Recharts)
- Inline tables
- Citations [1], [2] that link to source documents
- Progress indicators for multi-step tasks
- Markdown rendering

```
┌─────────────────────────────────────┐
│ 💬 CHAT                             │
│ ─────────────────────────────────── │
│                                     │
│ You: What's the withdrawal risk     │
│ for battery projects in TC1?        │
│                                     │
│ GridAgent:                          │
│ ─────────────────────────────────── │
│ 📊 Querying database...        ✓    │
│ 🌐 Fetching PJM TC1 data...    ✓    │
│ 🐍 Analyzing costs...          ●    │
│                                     │
│ ## Withdrawal Risk Analysis         │
│                                     │
│ Based on the TC1 Phase 1 Report     │
│ [1], I analyzed 47 battery storage  │
│ projects:                           │
│                                     │
│ | Risk   | Count | Avg $/kW |       │
│ |--------|-------|----------|       │
│ | High   | 8     | $342     |       │
│ | Medium | 22    | $198     |       │
│ | Low    | 17    | $89      |       │
│                                     │
│ [Chart: Cost Distribution]          │
│ ┌─────────────────────────────────┐ │
│ │ ████████░░░░░░░░░░░░ High       │ │
│ │ ████████████████████ Medium    │ │
│ │ ██████████████░░░░░░ Low       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Your project AE1-143 is in the      │
│ **Medium risk tier** at $201/kW [2] │
│                                     │
│ **Sources:**                        │
│ [1] TC1_PH1_Executive_Summary       │
│ [2] AE1-143 Impact Study            │
│                                     │
├─────────────────────────────────────┤
│ [Ask about PJM cluster analysis...] │
│                              [Send] │
└─────────────────────────────────────┘
```

### Right Panel: Sandbox

**Tabs: [Browser] [Code] [Files] [Todo]**

**Browser Tab:**
```
┌─────────────────────────────────────┐
│ 🌐 BROWSER                          │
│ ─────────────────────────────────── │
│ URL: pjm.com/planning/project-...   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │   [Live screenshot or stream    │ │
│ │    of browser automation]       │ │
│ │                                 │ │
│ │   ┌─────────────────────────┐   │ │
│ │   │ PJM Cluster Reports     │   │ │
│ │   │ ───────────────────     │   │ │
│ │   │ > TC1 Phase 1           │   │ │
│ │   │   TC2 Phase 1           │   │ │
│ │   │   Cycle 1               │   │ │
│ │   └─────────────────────────┘   │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Status: Navigating to TC1 reports   │
│ ████████████░░░░░░░░ 60%            │
└─────────────────────────────────────┘
```

**Code Tab:**
```
┌─────────────────────────────────────┐
│ 🐍 CODE EXECUTION                   │
│ ─────────────────────────────────── │
│                                     │
│ ```python                           │
│ import pandas as pd                 │
│                                     │
│ # Load TC1 battery projects         │
│ df = pd.DataFrame(projects)         │
│                                     │
│ # Calculate risk tiers              │
│ df['risk'] = df['cost_per_kw'].apply│
│     lambda x: 'High' if x > 300     │
│     else 'Medium' if x > 150        │
│     else 'Low'                      │
│ )                                   │
│                                     │
│ # Summary stats                     │
│ print(df.groupby('risk').agg({      │
│     'queue_id': 'count',            │
│     'cost_per_kw': 'mean'           │
│ }))                                 │
│ ```                                 │
│                                     │
│ ─────────────────────────────────── │
│ OUTPUT:                             │
│                                     │
│        count    mean                │
│ High      8   342.5                 │
│ Medium   22   198.3                 │
│ Low      17    89.1                 │
│                                     │
│ ✓ Executed in 0.3s                  │
└─────────────────────────────────────┘
```

**Files Tab:**
```
┌─────────────────────────────────────┐
│ 📁 FILES                            │
│ ─────────────────────────────────── │
│                                     │
│ /workspace                          │
│ ├── 📄 todo.md                      │
│ ├── 📄 scratchpad.md                │
│ ├── 📁 results/                     │
│ │   ├── tc1_analysis.csv            │
│ │   ├── risk_chart.png              │
│ │   └── cost_comparison.json        │
│ └── 📁 cache/                       │
│     ├── tc1_summary.pdf             │
│     └── ae1143_impact.pdf           │
│                                     │
│ [Download All] [Clear Cache]        │
└─────────────────────────────────────┘
```

**Todo Tab:**
```
┌─────────────────────────────────────┐
│ ✅ TODO PROGRESS                    │
│ ─────────────────────────────────── │
│                                     │
│ ## Current Task                     │
│ Analyze withdrawal risk for TC1    │
│ battery projects                    │
│                                     │
│ ## Completed                        │
│ ✓ Query database for PJM battery   │
│ ✓ Fetch TC1 Phase 1 report         │
│ ✓ Extract cost allocations         │
│                                     │
│ ## In Progress                      │
│ ● Calculate risk tiers              │
│                                     │
│ ## Pending                          │
│ ○ Generate comparison chart         │
│ ○ Find user's project in data       │
│ ○ Write summary with citations      │
│                                     │
│ Last updated: 2 seconds ago         │
└─────────────────────────────────────┘
```

---

## Component Structure

```
frontend/src/components/agent/
├── agent-layout.tsx           # Three-panel layout container
├── panels/
│   ├── sources-panel.tsx      # Left: document list
│   ├── document-viewer.tsx    # Left: reading mode with text selection
│   ├── chat-panel.tsx         # Center: conversation
│   ├── sandbox-panel.tsx      # Right: tabs container
│   ├── browser-view.tsx       # Right tab: live browser
│   ├── code-view.tsx          # Right tab: code execution
│   ├── files-view.tsx         # Right tab: file explorer
│   └── todo-view.tsx          # Right tab: progress
├── chat/
│   ├── message.tsx            # Individual message with citations
│   ├── tool-indicator.tsx     # Progress for tool execution
│   ├── inline-chart.tsx       # Recharts in chat
│   └── citation-link.tsx      # Clickable [1] links
├── documents/
│   ├── document-card.tsx      # Document in list
│   ├── text-selection.tsx     # "Tell me more" popup
│   └── toc-sidebar.tsx        # Table of contents
└── shared/
    ├── resizable-panels.tsx   # Drag to resize
    └── loading-states.tsx     # Skeletons
```

---

## Implementation Phases (Revised)

| Phase | What | Deliverable |
|-------|------|-------------|
| **1** | Chat + DB query only | Basic chat that queries our 36K projects |
| **1.5** | OpenRouter integration | Model switching, test Claude vs GPT-4 |
| **2** | E2B code execution | Python analysis, charts in sandbox |
| **3** | Web search (Tavily) | PJM news, FERC filings |
| **4** | Browser in E2B | PJM portal navigation with live view |
| **5** | Three-panel UI | Sources panel, document reader, sandbox view |
| **6** | Document interaction | Text selection, "tell me more", citations |

---

## Tools (Simplified CodeAct Pattern)

Only 3 tools - the LLM writes code to do complex tasks:

```typescript
const tools = {
  query_db: {
    description: "Query our interconnection queue database (36K projects)",
    parameters: z.object({
      filters: z.object({
        regions: z.array(z.string()).optional(),
        states: z.array(z.string()).optional(),
        types: z.array(z.string()).optional(),
        statuses: z.array(z.string()).optional(),
        min_mw: z.number().optional(),
        max_mw: z.number().optional(),
        years: z.array(z.number()).optional(),
      }).optional(),
      aggregation: z.enum(['raw', 'by_region', 'by_type', 'by_status', 'by_year']).optional(),
      limit: z.number().default(100),
    }),
  },

  execute_code: {
    description: `Execute Python code in sandbox. Available:
    - pandas, numpy, matplotlib for analysis
    - playwright for browser automation
    - pdfplumber for PDF parsing
    - requests for HTTP
    Files persist in /workspace/`,
    parameters: z.object({
      code: z.string(),
      description: z.string(),
    }),
  },

  web_search: {
    description: "Search web for PJM news, FERC filings, tariff updates",
    parameters: z.object({
      query: z.string(),
      domains: z.array(z.string()).optional(),
    }),
  },
};
```

---

## OpenRouter Integration

```typescript
// lib/openrouter.ts
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export type ModelId =
  | 'anthropic/claude-sonnet-4'
  | 'anthropic/claude-3-haiku'
  | 'openai/gpt-4o'
  | 'google/gemini-1.5-pro';

export async function chat(
  messages: Message[],
  model: ModelId = 'anthropic/claude-sonnet-4',
  tools?: Tool[],
) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://gridagent.io',
      'X-Title': 'GridAgent',
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      stream: true,
    }),
  });

  return response;
}

// Model selection based on task
export function selectModel(task: string): ModelId {
  if (task.includes('extract') || task.includes('simple')) {
    return 'anthropic/claude-3-haiku'; // Fast, cheap
  }
  if (task.includes('long document') || task.includes('pdf')) {
    return 'google/gemini-1.5-pro'; // 1M context
  }
  return 'anthropic/claude-sonnet-4'; // Default best
}
```

---

## Custom Agent Loop

```typescript
// lib/agent-loop.ts
export async function runAgent(
  userMessage: string,
  context: AgentContext,
  onUpdate: (update: AgentUpdate) => void,
) {
  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...context.history,
    { role: 'user', content: userMessage },
  ];

  let done = false;
  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (!done && iterations < MAX_ITERATIONS) {
    iterations++;

    // 1. Get LLM response
    const response = await chat(messages, context.model, tools);

    // 2. Check if done or need tool call
    if (response.finish_reason === 'stop') {
      done = true;
      onUpdate({ type: 'message', content: response.content });
      continue;
    }

    if (response.finish_reason === 'tool_calls') {
      for (const toolCall of response.tool_calls) {
        onUpdate({ type: 'tool_start', tool: toolCall.name });

        // 3. Execute tool
        const result = await executeToolCall(toolCall, context);

        onUpdate({ type: 'tool_result', tool: toolCall.name, result });

        // 4. Append to messages (append-only for KV cache)
        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: [toolCall],
        });
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }
  }

  return messages;
}
```

---

## System Prompt (PJM-Focused)

```typescript
const SYSTEM_PROMPT = `You are GridAgent, an AI analyst for PJM interconnection queue data.

## Your Capabilities
1. query_db: Query our database of 36,000+ interconnection projects
2. execute_code: Run Python in sandbox (pandas, playwright, pdfplumber)
3. web_search: Search for PJM news and FERC filings

## PJM Domain Knowledge

### Queue Structure
- Queue IDs: {Window}{Number} (e.g., AE1-143, AG2-056)
- Transition Clusters: TC1 (AE1-AG1), TC2 (AG2-AH1)
- New Cycles: Cycle 1 (2024), Cycle 2 (2025)

### Cost Metrics
- $/kW = Total Cost / MW Capacity (key withdrawal predictor)
- Network Upgrades: Main cost driver (~$227/kW for active projects)
- POI Upgrades: Stable at ~$12/kW
- Average TC1 Battery: $190/kW
- High risk threshold: >$300/kW

### PJM Portal URLs
- Queue: https://www.pjm.com/planning/services-requests/interconnection-queues
- TC1: https://www.pjm.com/pjmfiles/pub/planning/project-queues/Cluster-Reports/TC1/
- Impact Studies: https://www.pjm.com/pjmfiles/pub/planning/project-queues/impact_studies/

## Guidelines
1. Always query our database first for basic project info
2. Use execute_code with playwright for PJM portal navigation
3. Use execute_code with pdfplumber for PDF extraction
4. Calculate $/kW and compare to averages
5. Always cite sources with [1], [2] notation
6. Save intermediate results to /workspace/ for persistence

## Example: Browser Automation
\`\`\`python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://www.pjm.com/planning/...")
    # Extract data...
    page.screenshot(path="/workspace/screenshot.png")
    browser.close()
\`\`\`
`;
```

---

## Environment Variables

```env
# frontend/.env.local
OPENROUTER_API_KEY=sk-or-xxx     # Model routing
E2B_API_KEY=e2b_xxx              # Sandbox execution
TAVILY_API_KEY=tvly-xxx          # Web search
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## Cost Estimates (Revised)

| Service | Free Tier | Paid (Scale) |
|---------|-----------|--------------|
| OpenRouter | $5 credit | ~$50/month |
| E2B | 100 hrs free | ~$16/month |
| Tavily | 1000/month free | Free for MVP |
| **Total MVP** | **~Free** | **~$70/month** |

---

## Security

1. **Database**: Read-only queries
2. **E2B Sandbox**: Isolated, ephemeral, auto-destroyed
3. **Browser**: Sandboxed, no user credentials
4. **Code**: No access outside /workspace/
5. **Rate Limiting**: 10 requests/minute per user

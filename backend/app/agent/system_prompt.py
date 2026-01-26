"""
GridAgent System Prompt Builder
===============================

This module builds dynamic system prompts for the GridAgent.
Uses ReACT (Reasoning + Acting) framework for structured thinking.

Architecture:
- Core identity (static)
- Tool definitions (static)
- Domain knowledge (dynamically injected per query)
- ReACT instructions (static)
- Output rules (static)

The prompt is built fresh for each query, injecting only relevant
knowledge sections to minimize tokens while maximizing accuracy.
"""

from typing import Dict, List, Optional
from datetime import datetime

from .pjm_knowledge import (
    route_query,
    get_knowledge_for_query,
    get_ips_url,
    get_cycle_status_url,
    format_committees_for_prompt,
    GOLD_MINE_URLS,
    DATABASE_SCHEMA,
    OUTPUT_RULES,
    COMMITTEES_MEETINGS,
)


# =============================================================================
# CORE IDENTITY - Static (always included)
# =============================================================================

CORE_IDENTITY = """
<identity>
You are GridAgent, an expert AI analyst specializing in PJM interconnection queue intelligence.

You have the expertise of a senior consultant with 10+ years of experience in:
- PJM generation interconnection process
- Transmission planning and cost allocation
- Cluster study analysis
- Investment due diligence for renewable energy projects

Your mission: Help developers, investors, and analysts understand interconnection
costs, risks, timelines, and optimize their queue positions.
</identity>
"""


# =============================================================================
# TOOL DEFINITIONS - Static (schemas for function calling)
# =============================================================================

TOOL_DEFINITIONS = """
<tools>
You have access to these tools. Use them strategically.

## 1. query_db
Query the GridAgent database of 36,000+ interconnection projects.

```json
{
    "name": "query_db",
    "description": "Execute SQL query against PJM project database",
    "parameters": {
        "query": "SQL SELECT statement (read-only)",
        "explain": "Brief explanation of what you're looking for"
    }
}
```

USE FOR:
- Project lookups by ID (AG2-535, AH1-665)
- Cost percentile calculations
- Benchmark comparisons (avg by fuel, state, TO)
- Withdrawal rate analysis
- Upgrade sharing analysis

IMPORTANT: Always use this for benchmarks - NEVER hardcode thresholds.

## 2. firecrawl_scrape
Scrape a web page to get current PJM information.

```json
{
    "name": "firecrawl_scrape",
    "description": "Scrape a URL and extract content",
    "parameters": {
        "url": "Full URL to scrape",
        "purpose": "What information you're looking for"
    }
}
```

USE FOR:
- Latest IPS meeting documents (timelines, deadlines, updates)
- Committee meeting materials (TEAC, PC, MIC)
- Tariff and manual references
- Cluster-specific FAQs and result documents

## 3. execute_code
Run Python code in a sandboxed E2B environment.

```json
{
    "name": "execute_code",
    "description": "Execute Python code in secure sandbox",
    "parameters": {
        "code": "Python code to execute",
        "purpose": "What the code accomplishes"
    }
}
```

AVAILABLE PACKAGES:
- pandas, numpy - Data manipulation
- matplotlib, seaborn - Visualizations (returns base64 PNG)
- pdfplumber - PDF text extraction
- requests - HTTP requests
- openpyxl - Excel file handling

USE FOR:
- Creating charts and visualizations (matplotlib plots returned as images)
- Complex data analysis and transformations
- PDF parsing with pdfplumber
- Statistical analysis

EXAMPLE - Generate a chart:
```python
import matplotlib.pyplot as plt
import pandas as pd

data = {'fuel': ['Solar', 'Wind', 'Storage'], 'avg_cost': [450, 380, 620]}
df = pd.DataFrame(data)
plt.figure(figsize=(8, 5))
plt.bar(df['fuel'], df['avg_cost'], color=['#FBBF24', '#14B8A6', '#8B5CF6'])
plt.title('Average $/kW by Fuel Type')
plt.ylabel('$/kW')
plt.show()  # This returns the image
```

NOTE: Files do NOT persist between separate tool calls (each call is a fresh sandbox).

## 4. firecrawl_search
Search the web using Firecrawl.

```json
{
    "name": "firecrawl_search",
    "description": "Search web via Firecrawl API",
    "parameters": {
        "query": "Search query string",
        "limit": "Max results (default 5)"
    }
}
```

USE FOR:
- Recent PJM announcements
- FERC filing searches
- Finding specific documents
- Industry news

NOTE: For authoritative PJM data, prefer firecrawl_scrape on official committee pages.

## 5. firecrawl_map
Map all URLs on a website.

```json
{
    "name": "firecrawl_map",
    "description": "Map all URLs on a website",
    "parameters": {
        "url": "Base URL to map"
    }
}
```

USE FOR:
- Finding all meeting folders on a committee page
- Discovering all documents in a directory
- Building site maps for navigation
</tools>
"""


# =============================================================================
# SOURCE PRIORITY - Where to find what
# =============================================================================

SOURCE_PRIORITY = """
<source_priority>
## PJM Information Source Priority

### For TIMELINES, DEADLINES, CLUSTER UPDATES, SCHEDULES:
**→ FIRST: IPS (Interconnection Process Subcommittee) Meetings**
- URL: https://www.pjm.com/committees-and-groups/subcommittees/ips
- Look for: cycle-schedule-update.pdf, queue-statistics.pdf
- Always find the LATEST meeting folder (sort by date, take most recent)
- Meeting folders: /committees-groups/subcommittees/ips/{year}/{YYYYMMDD}/

### For CLUSTER-SPECIFIC FAQs, RESULT DOCUMENTS:
**→ Cycle Service Request Status Page**
- URL: https://www.pjm.com/planning/m/cycle-service-request-status
- Contains: FAQs by topic, links to cluster result documents
- Use for: Questions about specific cluster-phase study results

### For RULES, PROCESS DETAILS, REQUIREMENTS:
**→ PJM Manuals, Tariffs, OATT**
- Manual 14H: Cluster/Cycle process (MOST IMPORTANT)
- Manual 14A: General interconnection process
- OATT Part VII, Subpart D: Tariff requirements
- URL: https://www.pjm.com/library/governing-documents

### For RTEP PROJECTS, UPGRADE STATUS:
**→ TEAC (Transmission Expansion Advisory Committee)**
- URL: https://www.pjm.com/committees-and-groups/committees/teac
- Look for: rtep-project.pdf, reliability-analysis.pdf

### For PROJECT DATA, COSTS, BENCHMARKS:
**→ GridAgent Database (query_db tool)**
- 36K+ interconnection projects
- Cost breakdowns, percentiles, risk scores
- ALWAYS use for numeric comparisons

### For NEWS, ANNOUNCEMENTS, FERC FILINGS:
**→ Web Search (Tavily)**
- Use when looking for recent announcements
- Good for FERC docket searches
- Note: Results may be stale for internal PJM data
</source_priority>
"""


# =============================================================================
# REACT FRAMEWORK - Core reasoning loop
# =============================================================================

REACT_FRAMEWORK = """
<reasoning_framework>
## ReACT Framework (Reasoning + Acting)

For EVERY response, follow this structured approach:

### Step 1: THINK
Before taking any action, analyze the query:
```
<think>
Query understanding: [What is the user really asking?]
Source needed: [Which PJM source has this info?]
Data needed: [What data do I need to answer?]
Tool strategy: [Which tools, in what order?]
</think>
```

### Step 2: ACT
Execute tools in strategic order:
```
<act>
Tool: [tool_name]
Purpose: [why this tool, what you expect to learn]
Input: [parameters]
</act>
```

### Step 3: OBSERVE
Process tool results:
```
<observe>
Result: [key findings from tool]
Sufficient: [Do I have enough to answer? Yes/No]
Next step: [If no, what else do I need?]
</observe>
```

### Step 4: REPEAT or RESPOND
- If more data needed: Go back to Step 2
- If sufficient: Proceed to final response

### Tool Call Order by Query Type

**TIMELINE / DEADLINE / SCHEDULE questions:**
1. firecrawl_scrape → Latest IPS meeting (find most recent folder)
2. Look for cycle-schedule-update.pdf content
3. query_db → If need project-specific deadlines

**CLUSTER RESULT / FAQ questions:**
1. firecrawl_scrape → cycle-service-request-status page
2. query_db → Get relevant database data
3. firecrawl_scrape → Specific cluster report if needed

**PROJECT-SPECIFIC questions:**
1. query_db → Get project details
2. query_db → Get benchmarks (cluster averages, percentiles)
3. firecrawl_scrape → Only if need official document reference

**COST ANALYSIS:**
1. query_db → Get project costs
2. query_db → Get percentiles and benchmarks (NEVER hardcode)
3. execute_code → Create comparison charts

**PROCESS / RULES questions:**
1. firecrawl_scrape → Relevant manual (M14H for cluster process)
2. firecrawl_scrape → OATT if tariff reference needed
</reasoning_framework>
"""


# =============================================================================
# CRITICAL RULES - Non-negotiable behaviors
# =============================================================================

CRITICAL_RULES = """
<critical_rules>
## Non-Negotiable Rules

### 1. NEVER Hardcode Thresholds
```
WRONG: if cost_per_kw > 300: risk = "High"
RIGHT: if cost_per_kw > percentiles.p90: risk = f"Top 10% in cluster"
```
Always query database for current percentiles.

### 2. Use Correct Sources
| Question Type | Primary Source |
|---------------|----------------|
| Timelines, deadlines | Latest IPS meeting |
| Cluster FAQs, results | cycle-service-request-status |
| Rules, process | Manuals, OATT |
| RTEP, upgrades | TEAC meetings |
| Project data | query_db |

### 3. Show Your Data
Never make claims without data. Always include:
- Actual numbers from database
- Comparison to cluster averages
- Percentile position
- Source citations

### 4. Consultant-Quality Output
Structure every response with:
- Executive Summary (2-3 sentences)
- Data/Analysis (tables with actual numbers)
- Benchmarking (vs peers)
- Recommendations (actionable)
- Sources (numbered citations)

### 5. Cite All Sources
```
[1] IPS Meeting {date}, cycle-schedule-update.pdf
[2] GridAgent Database, {count} projects analyzed
[3] Manual 14H, Section X.X
```

### 6. Acknowledge Uncertainty
If data is incomplete or stale:
- Say so explicitly
- Suggest where to find current data
- Don't make up numbers

### 7. Find LATEST Meeting Documents
When scraping committee pages:
- Extract meeting folder URLs (format: /YYYYMMDD/)
- Sort by date descending
- Take the LATEST one
- Check document dates in filename/header
</critical_rules>
"""


# =============================================================================
# PROMPT BUILDER FUNCTIONS
# =============================================================================

def build_system_prompt(
    user_query: str,
    include_full_schema: bool = False,
    conversation_context: Optional[str] = None,
) -> str:
    """
    Build a dynamic system prompt based on the user's query.

    This is the main entry point for prompt generation. It:
    1. Routes the query to determine relevant knowledge
    2. Injects only the needed domain knowledge
    3. Adds ReACT framework instructions
    4. Adds output rules

    Args:
        user_query: The user's question
        include_full_schema: Whether to include full DB schema (for complex queries)
        conversation_context: Previous conversation for context

    Returns:
        Complete system prompt string
    """
    sections = []

    # 1. Core identity (always)
    sections.append(CORE_IDENTITY)

    # 2. Tool definitions (always)
    sections.append(TOOL_DEFINITIONS)

    # 3. Source priority (always - this is critical)
    sections.append(SOURCE_PRIORITY)

    # 4. Dynamic knowledge injection
    routing = route_query(user_query)
    dynamic_knowledge = get_knowledge_for_query(user_query)

    # Add scrape targets as explicit instructions
    scrape_instructions = build_scrape_instructions(routing, user_query)
    if scrape_instructions:
        sections.append(scrape_instructions)

    # Add relevant domain knowledge
    sections.append(f"<domain_knowledge>\n{dynamic_knowledge}\n</domain_knowledge>")

    # 5. Database schema (conditionally)
    if include_full_schema or "DATABASE" in routing["knowledge_sections"]:
        sections.append(f"<database_schema>\n{DATABASE_SCHEMA}\n</database_schema>")

    # 6. Committee URLs
    sections.append(format_committees_for_prompt())

    # 7. ReACT framework (always)
    sections.append(REACT_FRAMEWORK)

    # 8. Critical rules (always)
    sections.append(CRITICAL_RULES)

    # 9. Output rules (always)
    sections.append(f"<output_rules>\n{OUTPUT_RULES}\n</output_rules>")

    # 10. Current context
    context_section = build_context_section(conversation_context)
    if context_section:
        sections.append(context_section)

    # 11. Query-specific instructions
    query_instructions = build_query_instructions(user_query, routing)
    sections.append(query_instructions)

    return "\n\n".join(sections)


def build_scrape_instructions(routing: dict, user_query: str) -> str:
    """Build explicit scraping instructions based on query type."""
    query_lower = user_query.lower()
    lines = ["<scrape_instructions>"]
    lines.append("## Recommended Scraping Strategy")

    # Timeline/deadline/schedule → IPS first
    if any(word in query_lower for word in ["timeline", "deadline", "schedule", "when", "date", "milestone"]):
        lines.append("\n### For Timeline/Deadline Questions:")
        lines.append(f"1. **FIRST** scrape IPS meeting page: {COMMITTEES_MEETINGS['IPS']['url']}")
        lines.append("2. Find the LATEST meeting folder (most recent YYYYMMDD)")
        lines.append("3. Look for: cycle-schedule-update.pdf, queue-statistics.pdf")

    # Cluster FAQ/results → cycle-service-request-status
    elif any(word in query_lower for word in ["faq", "result", "report", "posting", "model"]):
        lines.append("\n### For Cluster FAQ/Result Questions:")
        lines.append(f"1. Scrape: {GOLD_MINE_URLS['CYCLE_STATUS']['url']}")
        lines.append("2. Find relevant FAQ or document link")

    # Process/rules → Manuals
    elif any(word in query_lower for word in ["rule", "process", "requirement", "tariff", "how does"]):
        lines.append("\n### For Process/Rules Questions:")
        lines.append("1. Reference Manual 14H for cluster process")
        lines.append("2. Reference OATT Part VII for tariff requirements")
        lines.append("3. URLs available in domain_knowledge section")

    # RTEP/upgrades → TEAC
    elif any(word in query_lower for word in ["rtep", "upgrade status", "construction"]):
        lines.append("\n### For RTEP/Upgrade Questions:")
        lines.append(f"1. Scrape TEAC page: {COMMITTEES_MEETINGS['TEAC']['url']}")
        lines.append("2. Find latest meeting materials")

    # Default: use database primarily
    else:
        lines.append("\n### Default Strategy:")
        lines.append("1. Use query_db for project data and benchmarks")
        lines.append("2. Scrape PJM pages only if need official references")

    lines.append("</scrape_instructions>")
    return "\n".join(lines)


def build_context_section(conversation_context: Optional[str]) -> str:
    """Build context section from previous conversation."""
    if not conversation_context:
        return ""

    return f"""
<conversation_context>
Previous context from this conversation:
{conversation_context}
</conversation_context>
"""


def build_query_instructions(user_query: str, routing: dict) -> str:
    """Build query-specific instructions based on intent."""
    lines = ["<current_query>"]
    lines.append(f"User Query: {user_query}")
    lines.append(f"Timestamp: {datetime.now().isoformat()}")
    lines.append("")
    lines.append("Detected intents:")

    for section in routing["knowledge_sections"]:
        lines.append(f"  - {section}")

    lines.append("")
    lines.append("Recommended tools:")
    for tool in routing["tools_needed"]:
        lines.append(f"  - {tool}")

    lines.append("")
    lines.append("Begin your response with <think> to show your reasoning.")
    lines.append("</current_query>")

    return "\n".join(lines)


# =============================================================================
# SPECIALIZED PROMPTS - For specific task types
# =============================================================================

def build_project_analysis_prompt(project_id: str) -> str:
    """Build a specialized prompt for project analysis."""
    return build_system_prompt(
        user_query=f"Analyze project {project_id} - costs, risks, upgrades, benchmarks",
        include_full_schema=True,
    )


def build_cluster_overview_prompt(cluster: str, phase: str) -> str:
    """Build a specialized prompt for cluster overview."""
    return build_system_prompt(
        user_query=f"Overview of {cluster} {phase} - timeline, statistics, key metrics",
        include_full_schema=True,
    )


def build_comparison_prompt(project_ids: List[str]) -> str:
    """Build a specialized prompt for comparing projects."""
    projects_str = ", ".join(project_ids)
    return build_system_prompt(
        user_query=f"Compare projects {projects_str} - costs, risks, shared upgrades",
        include_full_schema=True,
    )


# =============================================================================
# PROMPT TEMPLATES - For common queries
# =============================================================================

QUERY_TEMPLATES = {
    "project_lookup": """
        Find all details for project {project_id}:
        1. Query database for project details
        2. Get cluster percentiles for benchmarking
        3. List upgrades and sharing partners
        4. Calculate risk position
    """,

    "cluster_status": """
        Get current timeline for {cluster} {phase}:
        1. Scrape latest IPS meeting for schedule updates
        2. Query database for project counts and statistics
        3. Summarize key deadlines and milestones
    """,

    "cost_analysis": """
        Analyze costs for {subject}:
        1. Query database for cost breakdown
        2. Calculate percentiles vs cluster (NEVER hardcode thresholds)
        3. Compare to fuel type average
        4. Identify cost drivers (which upgrades)
    """,

    "timeline_check": """
        Get current timeline for {cluster}:
        1. Scrape latest IPS meeting for cycle-schedule-update
        2. Compare to any previous schedule
        3. Highlight any delays or changes
    """,
}


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_tool_schemas() -> List[dict]:
    """Return tool schemas for OpenRouter/Claude function calling."""
    return [
        {
            "name": "query_db",
            "description": "Execute a read-only SQL query against the PJM project database. Use for project lookups, cost analysis, benchmarking, and statistics. ALWAYS use this for numeric thresholds - never hardcode.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "SQL SELECT query to execute"
                    },
                    "explain": {
                        "type": "string",
                        "description": "Brief explanation of what this query finds"
                    }
                },
                "required": ["query", "explain"]
            }
        },
        {
            "name": "firecrawl_scrape",
            "description": "Scrape a web page to extract content. Use for PJM official pages, IPS meetings (for timelines), TEAC (for RTEP), and manual/tariff references.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Full URL to scrape"
                    },
                    "purpose": {
                        "type": "string",
                        "description": "What information you're looking for"
                    }
                },
                "required": ["url", "purpose"]
            }
        },
        {
            "name": "firecrawl_search",
            "description": "Search the web using Firecrawl. Good for finding PJM announcements, FERC filings, industry news. For authoritative PJM data, prefer firecrawl_scrape on official pages.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results (default 5)"
                    }
                },
                "required": ["query"]
            }
        },
        {
            "name": "firecrawl_map",
            "description": "Map all URLs on a website. Use to find meeting folders, discover documents in a directory, or build navigation maps.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Base URL to map"
                    }
                },
                "required": ["url"]
            }
        },
        {
            "name": "execute_code",
            "description": "Execute Python code in secure E2B sandbox. Available: pandas, numpy, matplotlib, seaborn, pdfplumber, requests, openpyxl. Matplotlib plots return as base64 PNG images. Each call is a fresh sandbox.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "Python code to execute. Use plt.show() to return charts as images."
                    },
                    "purpose": {
                        "type": "string",
                        "description": "What this code accomplishes"
                    }
                },
                "required": ["code", "purpose"]
            }
        }
    ]


def estimate_prompt_tokens(prompt: str) -> int:
    """Rough estimate of token count (Claude ~4 chars/token)."""
    return len(prompt) // 4


def get_minimal_prompt(user_query: str) -> str:
    """
    Build a minimal prompt for simple queries.
    Uses less tokens for basic lookups.
    """
    return f"""
{CORE_IDENTITY}

{TOOL_DEFINITIONS}

<query>{user_query}</query>

## Source Priority
| Question Type | Primary Source |
|---------------|----------------|
| Timelines, deadlines, schedules | IPS meetings: {get_ips_url()} |
| Cluster FAQs, result docs | Cycle status: {get_cycle_status_url()} |
| Rules, process details | Manual 14H, OATT |
| Project data, benchmarks | query_db (NEVER hardcode thresholds) |

Use ReACT: Think first, then act with appropriate tools, observe results, respond.
"""


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "build_system_prompt",
    "build_project_analysis_prompt",
    "build_cluster_overview_prompt",
    "build_comparison_prompt",
    "get_tool_schemas",
    "get_minimal_prompt",
    "estimate_prompt_tokens",
    "QUERY_TEMPLATES",
]

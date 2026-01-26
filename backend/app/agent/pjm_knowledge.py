"""
PJM Knowledge Base - GridAgent's Expert Brain
==============================================

This is GridAgent's comprehensive knowledge of PJM interconnection.
Equivalent to 10+ years of consulting experience in generation interconnection.

KEY PRINCIPLES:
1. ALWAYS use https://www.pjm.com/planning/m/cycle-service-request-status for cluster questions
2. NEVER hardcode risk thresholds - query database for percentiles
3. Domain knowledge (process, rules) is static; benchmarks are dynamic

Architecture:
- GOLD_MINE_URLS: Primary sources to ALWAYS check
- INTERCONNECTION_PROCESS: Full lifecycle (static knowledge)
- COST_CATEGORIES: Definitions (static)
- DEPOSIT_REQUIREMENTS: Formulas from tariff (static)
- DYNAMIC_BENCHMARKING: How to calculate from database
- COMMITTEES_MEETINGS: Where to find updates
- TARIFF_MANUALS: Reference documents
- MARKET_BASICS: Fundamental concepts
- INTENT_ROUTING: Map queries to tools
"""

from typing import Dict, List, Optional, Set
from datetime import datetime


# =============================================================================
# GOLD MINE URLS - PRIMARY SOURCES (ALWAYS CHECK THESE FIRST)
# =============================================================================

GOLD_MINE_URLS = {
    "CYCLE_STATUS": {
        "url": "https://www.pjm.com/planning/m/cycle-service-request-status",
        "description": "Cluster-specific FAQs, result documents, model postings",
        "use_for": [
            "FAQs about specific cluster-phase results",
            "Links to cluster result documents",
            "Model posting information",
            "Cost report links",
            "Application checklists",
        ],
        "scrape_priority": 2,  # Use for FAQs and result docs, NOT timelines
        "contains": [
            "FAQs by topic (organized by cluster)",
            "Links to cluster reports",
            "Model posting announcements",
            "Application checklists",
            "Contact information",
        ],
        "NOT_FOR": [
            "Timelines → Use IPS meetings instead",
            "Deadlines → Use IPS meetings instead",
            "Schedule updates → Use IPS meetings instead",
        ],
    },
    "QUEUE_DATA": {
        "url": "https://www.pjm.com/planning/services-requests/interconnection-queues",
        "description": "Queue search and downloadable data",
        "files": {
            "queue_spreadsheet": "https://www.pjm.com/-/media/DotCom/planning/services-requests/interconnection-queues/queue.ashx",
            "cycle_projects": "https://www.pjm.com/-/media/DotCom/planning/services-requests/interconnection-queues/CycleProjects-All.xlsx",
        },
    },
    "CLUSTER_REPORTS": {
        "url": "https://www.pjm.com/pjmfiles/pub/planning/project-queues/Cluster-Reports/",
        "description": "Official cluster study reports",
        "clusters": {
            "TC1": "https://www.pjm.com/pjmfiles/pub/planning/project-queues/Cluster-Reports/TC1/",
            "TC2": "https://www.pjm.com/pjmfiles/pub/planning/project-queues/Cluster-Reports/TC2/",
        },
    },
}


# =============================================================================
# SCRAPING STRATEGY - HOW TO GET LATEST DATA
# =============================================================================

SCRAPING_STRATEGY = """
## Firecrawl Scraping Strategy

### For TIMELINES, DEADLINES, SCHEDULE UPDATES → IPS MEETINGS FIRST:
```
PRIMARY SOURCE: IPS (Interconnection Process Subcommittee) Meetings
URL: https://www.pjm.com/committees-and-groups/subcommittees/ips

Steps:
1. Scrape the IPS committee page
2. Extract meeting folder URLs (format: /YYYYMMDD/)
3. Sort by date descending, take the LATEST
4. Look for: cycle-schedule-update.pdf, queue-statistics.pdf

Pattern: /committees-groups/subcommittees/ips/{year}/{YYYYMMDD}/

Key documents:
- cycle-schedule-update.pdf → Current timeline and milestones
- queue-statistics.pdf → Queue trends and withdrawal rates
- retool-update.pdf → Process improvements
```

### For CLUSTER FAQs, RESULT DOCUMENTS → Cycle Status Page:
```
URL: https://www.pjm.com/planning/m/cycle-service-request-status

Use for:
- FAQs about specific cluster-phase study results
- Links to official cluster result documents
- Model posting information
- Cost report document links

NOT FOR: Timelines, deadlines, schedule updates (use IPS instead)
```

### For RULES, PROCESS DETAILS → Manuals & Tariffs:
```
Manual 14H: Cluster/Cycle Process (MOST IMPORTANT)
Manual 14A: General Interconnection Process
OATT Part VII, Subpart D: Tariff requirements

URL: https://www.pjm.com/library/governing-documents
```

### For RTEP/UPGRADE STATUS → TEAC Meetings:
```
URL: https://www.pjm.com/committees-and-groups/committees/teac

Look for: rtep-project.pdf, reliability-analysis.pdf
```

### Document Freshness Rules:
```
- ALWAYS check document date in filename or header
- If > 30 days old, warn user and suggest checking for newer
- For schedules, monthly update expected (IPS meets monthly)
- For queue data, weekly update expected (Fridays)
```
"""


# =============================================================================
# DYNAMIC BENCHMARKING - NEVER HARDCODE THRESHOLDS
# =============================================================================

DYNAMIC_BENCHMARKING = """
## Dynamic Benchmarking Rules

### CRITICAL: Never Hardcode Risk Thresholds

WRONG (Static):
```python
if cost_per_kw > 300:
    risk = "High"
```

RIGHT (Dynamic):
```python
# Query database for current cluster percentiles
percentiles = query_db(
    query_type="stats",
    cluster="TC2",
    phase="PHASE_1",
    metric="cost_per_kw_percentiles"
)

# Use actual distribution from data
if project.cost_per_kw > percentiles.p90:
    risk = f"Critical (top 10% in cluster, above ${percentiles.p90:.0f}/kW)"
elif project.cost_per_kw > percentiles.p75:
    risk = f"High (top 25% in cluster, above ${percentiles.p75:.0f}/kW)"
...
```

### Benchmarks That MUST Be Queried from Database

| Metric | Query Example |
|--------|---------------|
| $/kW percentiles | `SELECT PERCENTILE_CONT(0.25, 0.5, 0.75, 0.9) FROM costs WHERE cluster=X` |
| Avg by fuel type | `SELECT fuel_type, AVG(cost_per_kw) FROM costs GROUP BY fuel_type` |
| Avg by state | `SELECT state, AVG(cost_per_kw) FROM costs GROUP BY state` |
| Avg by TO | `SELECT utility, AVG(cost_per_kw) FROM costs GROUP BY utility` |
| Withdrawal rate | `SELECT COUNT(*) WHERE status='Withdrawn' / COUNT(*)` |
| Upgrade concentration | Query pjm_project_upgrades for % allocations |

### Example: Risk Assessment Response

```markdown
## Risk Assessment for AG2-535

### Cost Benchmarking (from current TC2 Phase 1 data)

| Metric | Your Project | Cluster Average | Percentile |
|--------|--------------|-----------------|------------|
| $/kW | $2,997 | $187 | 99th (top 1%) |
| Total Cost | $59.9M | $12.3M | 98th |

### Comparison to Peers
Based on {query: count of TC2 Phase 1 Storage projects}:
- Your project is in the **top 1%** most expensive Storage projects
- Average Storage project: ${query: avg cost for Storage}
- Your excess: ${your cost - average}

### Risk Factors
1. **Cost Risk**: Top 1% = Critical (based on actual distribution)
2. **Concentration**: {query: max upgrade % allocation}
...
```

### What Should Be STATIC (Domain Knowledge)

These don't need database queries - they're from tariff/rules:
- Deposit formulas (RD1 = $4,000 × MWe)
- Timeline durations (Phase I = 120 days)
- Process steps (Feasibility → SIS → Facilities)
- Cost category definitions (TOIF, Network Upgrades)
- Market basics (Capacity vs Energy)
"""


# =============================================================================
# INTERCONNECTION PROCESS - Full Lifecycle (STATIC)
# =============================================================================

INTERCONNECTION_LIFECYCLE = """
## PJM Interconnection Process Lifecycle

### Pre-Application
- Site Selection: Identify POI, check hosting capacity
- Pre-Application Study (Optional): $10,000, 45 days

### Application & Queue
- Application fee based on MW
- Site control required (lease, ownership, option)
- Queue position assigned by date + completeness

### Cluster Study Process (Current - 2024+)
```
Application Deadline → Phase I (120 days) → DP1 (30 days)
→ Phase II (180 days) → DP2 (30 days)
→ Phase III (180 days) → DP3 (30 days) → GIA Execution
```

### Post-GIA
- Construction of network upgrades (2-7 years)
- Generator construction
- Witness testing
- Commercial Operation Date (COD)

### Key Tariff Reference: OATT Part VII, Subpart D
"""


# =============================================================================
# COST CATEGORIES - Definitions (STATIC)
# =============================================================================

COST_CATEGORIES = """
## PJM Interconnection Cost Categories

### 1. TOIF (Transmission Owner Interconnection Facilities)
- Definition: Direct connection equipment at POI
- Examples: Breakers, switches, metering, protection
- Who Pays: 100% project developer

### 2. Physical Network Upgrades
- Definition: Upgrades to physically connect project
- Examples: New lines to POI, transformer additions
- Who Pays: Allocated based on direct flow impact

### 3. System Reliability Network Upgrades
- Definition: Upgrades for grid reliability with new generation
- Examples: Line rebuilds, new substations, SVC/STATCOM
- Who Pays: Allocated across multiple projects

### 4. Affected System Upgrades
- Definition: Upgrades in neighboring systems (MISO, NYISO)
- Who Pays: Projects causing cross-border impacts

### Cost Allocation Formula (Simplified):
```
Allocation_A = (Flow_Impact_A / Total_Flow_Impact) × Upgrade_Cost
```
"""


# =============================================================================
# DEPOSIT REQUIREMENTS - From Tariff (STATIC)
# =============================================================================

DEPOSIT_REQUIREMENTS = """
## PJM Deposit Requirements

### Application Deposits
| Deposit | Amount | When Due |
|---------|--------|----------|
| M1 | $10,000 + $500/MW | Application |
| M2 | $10,000 + $500/MW | Study start |

### Readiness Deposits (Cluster Process)
| Deposit | Formula | When Due |
|---------|---------|----------|
| RD1 | $4,000 × MWe | Phase I start |
| RD2 | max(10% × Network Upgrades, RD1) - RD1 | Decision Point I |
| RD3 | max(20% × Network Upgrades, RD1+RD2) - RD1 - RD2 | Decision Point II |

### Example: 100 MW Project with $20M Network Upgrades
```
RD1 = $4,000 × 100 = $400,000
RD2 = max(10% × $20M, $400K) - $400K = $1,600,000
RD3 = max(20% × $20M, $2M) - $2M = $2,000,000
Total at GIA: $4,000,000 (20% of network upgrades)
```
"""


# =============================================================================
# COMMITTEES & MEETINGS - Where to Find Updates
# =============================================================================

COMMITTEES_MEETINGS = {
    "IPS": {
        "name": "Interconnection Process Subcommittee",
        "url": "https://www.pjm.com/committees-and-groups/subcommittees/ips",
        "frequency": "Monthly",
        "folder_pattern": "/committees-groups/subcommittees/ips/{year}/{YYYYMMDD}/",
        "key_documents": [
            "cycle-schedule-update.pdf",
            "queue-statistics.pdf",
            "retool-update.pdf",
        ],
        "topics": ["Timelines", "Queue status", "Process updates"],
    },
    "TEAC": {
        "name": "Transmission Expansion Advisory Committee",
        "url": "https://www.pjm.com/committees-and-groups/committees/teac",
        "frequency": "Monthly",
        "key_documents": ["rtep-project.pdf", "reliability-analysis.pdf"],
        "topics": ["RTEP projects", "Upgrade status", "Cost estimates"],
    },
    "PC": {
        "name": "Planning Committee",
        "url": "https://www.pjm.com/committees-and-groups/committees/pc",
        "frequency": "Monthly",
        "topics": ["RTEP approval", "Planning criteria"],
    },
    "MIC": {
        "name": "Market Implementation Committee",
        "url": "https://www.pjm.com/committees-and-groups/committees/mic",
        "topics": ["Cost allocation", "Capacity market"],
    },
}

# Transmission Owner Supplemental Meetings
TO_SUPPLEMENTAL = {
    "AEP": {"name": "American Electric Power", "states": ["OH", "WV", "VA", "IN", "KY"]},
    "DOMINION": {"name": "Dominion Energy Virginia", "states": ["VA", "NC"]},
    "COMED": {"name": "Commonwealth Edison", "states": ["IL"]},
    "PECO": {"name": "PECO Energy", "states": ["PA"]},
    "PSEG": {"name": "Public Service Electric & Gas", "states": ["NJ"]},
    "BGE": {"name": "Baltimore Gas & Electric", "states": ["MD"]},
    "PPL": {"name": "PPL Electric Utilities", "states": ["PA"]},
    "JCPL": {"name": "Jersey Central Power & Light", "states": ["NJ"]},
    "PEPCO": {"name": "Potomac Electric Power", "states": ["MD", "DC"]},
}


# =============================================================================
# TARIFF & MANUALS - Reference Documents (STATIC)
# =============================================================================

TARIFF_MANUALS = {
    "OATT": {
        "name": "Open Access Transmission Tariff",
        "url": "https://www.pjm.com/library/governing-documents",
        "key_sections": {
            "Part VII": "Interconnection Procedures",
            "Subpart D": "Cluster Study Process",
            "Section 309": "System Impact Study",
            "Section 314": "Interconnection Agreement",
        },
    },
    "MANUALS": {
        "M14A": {"name": "Interconnection Process", "url": "https://www.pjm.com/-/media/DotCom/documents/manuals/m14a.ashx"},
        "M14B": {"name": "Transmission Planning", "url": "https://www.pjm.com/-/media/DotCom/documents/manuals/m14b.ashx"},
        "M14H": {"name": "Cycle/Cluster Process (CRITICAL)", "url": "https://www.pjm.com/-/media/DotCom/documents/manuals/m14h.ashx"},
        "M21": {"name": "Capacity Testing", "url": "https://www.pjm.com/-/media/DotCom/documents/manuals/m21.ashx"},
    },
}


# =============================================================================
# MARKET BASICS - Fundamental Concepts (STATIC)
# =============================================================================

MARKET_BASICS = """
## PJM Market Fundamentals

### Capacity vs Energy Markets
| Aspect | Capacity Market | Energy Market |
|--------|-----------------|---------------|
| What's Sold | Availability (MW) | Generation (MWh) |
| Timeframe | 3 years ahead (RPM) | Real-time & Day-ahead |
| Price Unit | $/MW-day | $/MWh |

### Capacity Interconnection Rights (CIRs)
- CIRs = Right to sell capacity in RPM auction
- Full CIRs: Pass Generator Deliverability test
- Interim CIRs: Reduced until upgrades complete

### Generator Deliverability (GD) Test
- Tests if generator can deliver capacity to load
- PASS → Full CIRs
- FAIL → Interim CIRs

### Key Terms
- ICAP: Installed Capacity (nameplate)
- UCAP: Unforced Capacity (ICAP × availability)
- MWe: Energy MW
- MWc: Capacity MW
- LMP: Locational Marginal Price
"""


# =============================================================================
# INVESTOR PERSPECTIVE - Risk Factors (DYNAMIC FROM DB)
# =============================================================================

INVESTOR_PERSPECTIVE = """
## Risk Assessment Guidelines (Query Database for Actuals)

### Cost Risk - ALWAYS QUERY DATABASE
```
DO NOT use hardcoded thresholds like ">$300/kW = High Risk"

INSTEAD, query current cluster percentiles:
- p25, p50, p75, p90 for cost_per_kw
- Compare project to its cluster peers
- Report as "top X% in cluster"
```

### Key Risk Factors to Analyze
1. **Cost Percentile**: Where does project rank in its cluster?
2. **Concentration**: What % of cost is from single upgrade?
3. **Upgrade Sharing**: How many projects share the upgrade?
4. **Timeline Risk**: When is upgrade in-service?
5. **Deliverability**: Full or Interim CIRs?

### Investor Questions to Answer
- What's the $/kW and how does it compare to cluster average?
- What's the deposit requirement timeline?
- What upgrades is the project dependent on?
- What's the probability of cost increase (query historical changes)?
- What's the withdrawal rate for similar projects?

### Analysis Framework (All from Database)
```python
# Get peer comparison
peer_stats = query_db(
    "SELECT percentile_rank(cost_per_kw) as percentile,
            AVG(cost_per_kw) FILTER (WHERE fuel_type = 'Solar') as solar_avg,
            COUNT(*) FILTER (WHERE status = 'Withdrawn') / COUNT(*) as withdrawal_rate
     FROM pjm_project_costs
     WHERE cluster_name = 'TC2'"
)
```
"""


# =============================================================================
# DATABASE SCHEMA - For query_db Tool
# =============================================================================

DATABASE_SCHEMA = """
## GridAgent Database Schema

### Table: pjm_project_costs
| Column | Type | Description |
|--------|------|-------------|
| project_id | VARCHAR | Queue ID (e.g., AG2-535) |
| cluster_name | VARCHAR | TC1, TC2, etc. |
| phase | VARCHAR | PHASE_1, PHASE_2, PHASE_3 |
| developer | VARCHAR | Developer company |
| utility | VARCHAR | Transmission Owner |
| state | VARCHAR | Two-letter state code |
| county | VARCHAR | County name |
| fuel_type | VARCHAR | Solar, Wind, Storage, Gas |
| mw_capacity | DECIMAL | Capacity MW |
| project_status | VARCHAR | Active, Withdrawn |
| toif_cost | DECIMAL | TOIF cost |
| physical_cost | DECIMAL | Physical network upgrades |
| system_reliability_cost | DECIMAL | System reliability |
| total_cost | DECIMAL | Sum of all costs |
| cost_per_kw | DECIMAL | $/kW |
| rd1_amount, rd2_amount | DECIMAL | Deposits |
| risk_score_overall | DECIMAL | 0-100 |
| cost_rank | INT | Rank in cluster |
| cost_percentile | DECIMAL | 0-1 |

### Table: pjm_upgrades
| Column | Type | Description |
|--------|------|-------------|
| rtep_id | VARCHAR | RTEP project ID |
| utility | VARCHAR | TO |
| title | TEXT | Description |
| total_cost | DECIMAL | Cost |
| time_estimate | VARCHAR | Timeline |
| shared_by_count | INT | Projects sharing |

### Table: pjm_project_upgrades
| Column | Type | Description |
|--------|------|-------------|
| project_id | VARCHAR | Queue ID |
| upgrade_id | INT | FK to upgrades |
| link_type | VARCHAR | COST_ALLOCATED or CONTINGENT |
| percent_allocation | DECIMAL | % allocated |
| allocated_cost | DECIMAL | $ allocated |

### Common Queries

```sql
-- Get percentile benchmarks for a cluster
SELECT
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY cost_per_kw) as p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY cost_per_kw) as median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY cost_per_kw) as p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY cost_per_kw) as p90
FROM pjm_project_costs
WHERE cluster_name = 'TC2' AND phase = 'PHASE_1';

-- Benchmark by fuel type
SELECT fuel_type, COUNT(*), AVG(cost_per_kw), MIN(cost_per_kw), MAX(cost_per_kw)
FROM pjm_project_costs
WHERE cluster_name = 'TC2'
GROUP BY fuel_type;

-- Withdrawal analysis
SELECT
    status,
    COUNT(*) as count,
    AVG(cost_per_kw) as avg_cost
FROM pjm_project_costs
WHERE cluster_name = 'TC2'
GROUP BY status;
```
"""


# =============================================================================
# OUTPUT FORMATTING RULES
# =============================================================================

OUTPUT_RULES = """
## Consultant-Style Output Rules

### Response Structure
```markdown
## Executive Summary
[2-3 sentence key finding]

## Data Analysis
[Tables with actual numbers from database]

## Benchmarking
[Comparison to cluster peers - from DB queries]

## Risk Assessment
[Based on percentile position, not hardcoded thresholds]

## Recommendations
[Actionable next steps]

## Sources
[1] PJM Cycle Status Page, accessed {date}
[2] IPS Meeting {date}, cycle-schedule-update.pdf
[3] GridAgent Database, {count} projects analyzed
```

### Table Format (Always Include Actuals)
| Metric | Your Project | Cluster Average | Cluster Median | Percentile |
|--------|--------------|-----------------|----------------|------------|
| $/kW | ${actual} | ${from DB} | ${from DB} | {from DB}th |

### Chart Guidelines
- Cost distributions → Histogram with your project marked
- Comparisons → Bar chart by category
- Trends → Line chart over time
- Always label axes and include source
"""


# =============================================================================
# INTENT ROUTING - Map Queries to Knowledge + Tools
# =============================================================================

INTENT_KEYWORDS = {
    # Timeline/Schedule → IPS meetings (NOT GOLD_MINE)
    "timeline": ["IPS"],
    "schedule": ["IPS"],
    "deadline": ["IPS"],
    "when": ["IPS"],
    "date": ["IPS"],
    "milestone": ["IPS"],

    # Cluster FAQs/Results → Cycle Status page
    "faq": ["CYCLE_STATUS"],
    "result": ["CYCLE_STATUS", "DATABASE"],
    "report": ["CYCLE_STATUS"],
    "model posting": ["CYCLE_STATUS"],

    # Cluster/Phase general → DATABASE primarily
    "cluster": ["DATABASE"],
    "cycle": ["DATABASE", "IPS"],
    "tc1": ["DATABASE"],
    "tc2": ["DATABASE"],
    "phase": ["DATABASE"],
    "decision point": ["IPS", "DEPOSIT_REQUIREMENTS"],
    "status": ["DATABASE", "IPS"],

    # Cost/Risk → DATABASE for benchmarks (NEVER hardcode)
    "cost": ["DATABASE", "COST_CATEGORIES"],
    "$/kw": ["DATABASE"],
    "risk": ["DATABASE", "INVESTOR_PERSPECTIVE"],
    "benchmark": ["DATABASE"],
    "compare": ["DATABASE"],
    "percentile": ["DATABASE"],
    "average": ["DATABASE"],

    # Upgrades → DATABASE + TEAC
    "upgrade": ["DATABASE", "TEAC"],
    "rtep": ["TEAC"],
    "network": ["DATABASE", "COST_CATEGORIES"],
    "construction": ["TEAC"],

    # Process/Rules → Manuals & Tariffs
    "process": ["TARIFF_MANUALS", "INTERCONNECTION_LIFECYCLE"],
    "application": ["INTERCONNECTION_LIFECYCLE"],
    "deposit": ["DEPOSIT_REQUIREMENTS"],
    "tariff": ["TARIFF_MANUALS"],
    "manual": ["TARIFF_MANUALS"],
    "rules": ["TARIFF_MANUALS"],
    "how does": ["TARIFF_MANUALS", "INTERCONNECTION_LIFECYCLE"],
    "requirement": ["TARIFF_MANUALS"],

    # Market → Static knowledge
    "capacity": ["MARKET_BASICS"],
    "energy": ["MARKET_BASICS"],
    "cir": ["MARKET_BASICS"],
    "deliverability": ["MARKET_BASICS"],

    # Project-specific → DATABASE
    "project": ["DATABASE"],
    "ag": ["DATABASE"],
    "ah": ["DATABASE"],
    "queue": ["DATABASE"],
}


def route_query(query: str) -> dict:
    """
    Route a user query to relevant knowledge and tools.

    Source Priority:
    - Timelines/deadlines/schedules → IPS meetings (PRIMARY)
    - Cluster FAQs/result docs → cycle-service-request-status
    - Rules/process → Manuals, OATT
    - RTEP/upgrades → TEAC meetings
    - Project data/benchmarks → DATABASE
    """
    query_lower = query.lower()
    knowledge_sections = set()
    tools_needed = set()
    scrape_targets = []

    # Check keywords
    for keyword, sections in INTENT_KEYWORDS.items():
        if keyword in query_lower:
            knowledge_sections.update(sections)

    # IPS → For timelines, deadlines, schedules (HIGHEST PRIORITY)
    if "IPS" in knowledge_sections:
        tools_needed.add("firecrawl_scrape")
        scrape_targets.append({
            "url": COMMITTEES_MEETINGS["IPS"]["url"],
            "purpose": "Get latest IPS meeting for timelines, schedules, deadlines",
            "priority": 1,
            "instructions": "Find LATEST meeting folder, look for cycle-schedule-update.pdf",
        })

    # CYCLE_STATUS → For cluster FAQs and result documents
    if "CYCLE_STATUS" in knowledge_sections:
        tools_needed.add("firecrawl_scrape")
        scrape_targets.append({
            "url": GOLD_MINE_URLS["CYCLE_STATUS"]["url"],
            "purpose": "Get cluster-specific FAQs, result document links",
            "priority": 2,
        })

    # DATABASE → For project data, costs, benchmarks
    if "DATABASE" in knowledge_sections:
        tools_needed.add("query_db")

    # TEAC → For RTEP projects, upgrade status
    if "TEAC" in knowledge_sections:
        tools_needed.add("firecrawl_scrape")
        scrape_targets.append({
            "url": COMMITTEES_MEETINGS["TEAC"]["url"],
            "purpose": "Get RTEP project updates, upgrade construction status",
            "priority": 2,
        })

    # TARIFF_MANUALS → For rules, process details
    if "TARIFF_MANUALS" in knowledge_sections:
        tools_needed.add("firecrawl_scrape")
        # Add manual URL if needed
        scrape_targets.append({
            "url": TARIFF_MANUALS["MANUALS"]["M14H"]["url"],
            "purpose": "Get cluster process rules from Manual 14H",
            "priority": 3,
        })

    # Complex analysis needs code execution
    if any(word in query_lower for word in ["chart", "plot", "analyze", "distribution", "visualization"]):
        tools_needed.add("execute_code")

    # Default → Use database for project data
    if not knowledge_sections:
        knowledge_sections = {"DATABASE"}
        tools_needed = {"query_db"}

    return {
        "knowledge_sections": list(knowledge_sections),
        "tools_needed": list(tools_needed),
        "scrape_targets": scrape_targets,
    }


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_knowledge_for_query(query: str) -> str:
    """Build dynamic knowledge section based on query."""
    routing = route_query(query)
    sections = []

    section_map = {
        "INTERCONNECTION_LIFECYCLE": INTERCONNECTION_LIFECYCLE,
        "COST_CATEGORIES": COST_CATEGORIES,
        "DEPOSIT_REQUIREMENTS": DEPOSIT_REQUIREMENTS,
        "MARKET_BASICS": MARKET_BASICS,
        "INVESTOR_PERSPECTIVE": INVESTOR_PERSPECTIVE,
        "DATABASE": DATABASE_SCHEMA,
        "DYNAMIC_BENCHMARKING": DYNAMIC_BENCHMARKING,
    }

    # Always include scraping strategy and dynamic benchmarking
    sections.append(SCRAPING_STRATEGY)
    sections.append(DYNAMIC_BENCHMARKING)

    for section_name in routing["knowledge_sections"]:
        if section_name in section_map:
            sections.append(section_map[section_name])

    sections.append(OUTPUT_RULES)

    return "\n\n".join(sections)


def get_ips_url() -> str:
    """Return the IPS committee URL (primary for timelines)."""
    return COMMITTEES_MEETINGS["IPS"]["url"]


def get_cycle_status_url() -> str:
    """Return the cycle status URL (for FAQs and result docs)."""
    return GOLD_MINE_URLS["CYCLE_STATUS"]["url"]


def format_committees_for_prompt() -> str:
    """Format committee URLs for system prompt with source priority."""
    lines = ["## PJM Data Sources (By Priority)"]

    lines.append("\n### For TIMELINES/DEADLINES/SCHEDULES:")
    lines.append(f"- **IPS Meetings (PRIMARY)**: {COMMITTEES_MEETINGS['IPS']['url']}")
    lines.append("  → Find latest meeting, look for cycle-schedule-update.pdf")

    lines.append("\n### For CLUSTER FAQs/RESULT DOCUMENTS:")
    lines.append(f"- **Cycle Status Page**: {GOLD_MINE_URLS['CYCLE_STATUS']['url']}")
    lines.append("  → FAQs by cluster, links to result docs")

    lines.append("\n### For RULES/PROCESS DETAILS:")
    lines.append(f"- **Manual 14H**: {TARIFF_MANUALS['MANUALS']['M14H']['url']}")
    lines.append("  → Cluster/cycle process rules")

    lines.append("\n### For RTEP/UPGRADES:")
    lines.append(f"- **TEAC Meetings**: {COMMITTEES_MEETINGS['TEAC']['url']}")
    lines.append("  → RTEP project status, upgrade construction")

    lines.append("\n### All Committee Pages:")
    for key, info in COMMITTEES_MEETINGS.items():
        lines.append(f"- **{info['name']}**: {info['url']}")

    return "\n".join(lines)

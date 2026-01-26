"""
GridAgent - AI Assistant for PJM Interconnection Intelligence
=============================================================

This module provides the core AI agent capabilities:
- pjm_knowledge: Domain expertise and source routing
- system_prompt: Dynamic prompt building with ReACT framework
- tools: Tool definitions and execution

Usage:
    from app.agent import build_system_prompt, route_query, get_tool_schemas, execute_tool

    # Build a dynamic prompt for a user query
    prompt = build_system_prompt("What is the timeline for TC2 Phase 1?")

    # Get tool schemas for function calling
    tools = get_tool_schemas()

    # Execute a tool
    result = await execute_tool("query_db", query="SELECT * FROM pjm_clusters")
"""

from .pjm_knowledge import (
    route_query,
    get_knowledge_for_query,
    get_ips_url,
    get_cycle_status_url,
    format_committees_for_prompt,
    GOLD_MINE_URLS,
    COMMITTEES_MEETINGS,
    TARIFF_MANUALS,
)

from .system_prompt import (
    build_system_prompt,
    build_project_analysis_prompt,
    build_cluster_overview_prompt,
    build_comparison_prompt,
    get_tool_schemas,
    get_minimal_prompt,
    estimate_prompt_tokens,
    QUERY_TEMPLATES,
)

from .tools import (
    query_db,
    firecrawl_scrape,
    firecrawl_search,
    firecrawl_map,
    execute_code,
    execute_tool,
    parse_tool_calls,
    format_tool_result_for_claude,
    TOOLS,
)

__all__ = [
    # Knowledge
    "route_query",
    "get_knowledge_for_query",
    "get_ips_url",
    "get_cycle_status_url",
    "format_committees_for_prompt",
    "GOLD_MINE_URLS",
    "COMMITTEES_MEETINGS",
    "TARIFF_MANUALS",
    # Prompts
    "build_system_prompt",
    "build_project_analysis_prompt",
    "build_cluster_overview_prompt",
    "build_comparison_prompt",
    "get_tool_schemas",
    "get_minimal_prompt",
    "estimate_prompt_tokens",
    "QUERY_TEMPLATES",
    # Tools
    "query_db",
    "firecrawl_scrape",
    "firecrawl_search",
    "firecrawl_map",
    "execute_code",
    "execute_tool",
    "parse_tool_calls",
    "format_tool_result_for_claude",
    "TOOLS",
]

"""
API routes for GridAgent - AI Assistant for PJM Interconnection Intelligence

This module provides the API endpoints for the GridAgent chat interface.
Uses OpenRouter for LLM calls with ReACT loop for tool execution.
"""
import os
import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func
from typing import Optional, List, Dict, Any, Literal, AsyncGenerator
from pydantic import BaseModel
from decimal import Decimal
import httpx

from app.database import get_session
from app.models.cluster import PJMCluster, PJMProjectCost, PJMUpgrade, PJMProjectUpgrade
from app.models.queue_project import QueueProject

# Import the new agent module
from app.agent import (
    build_system_prompt,
    get_tool_schemas,
    execute_tool,
    parse_tool_calls,
    format_tool_result_for_claude,
)

router = APIRouter(prefix="/api/agent", tags=["agent"])

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "anthropic/claude-sonnet-4"
MAX_TOOL_ITERATIONS = 10  # Prevent infinite loops


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ChartRequest(BaseModel):
    """Parameterized chart query request"""
    dataset: Literal["cluster", "queue"] = "cluster"
    metric: str = "cost_per_kw"  # cost_per_kw, mw_capacity, total_cost, risk_score_overall, count
    aggregation: Literal["avg", "sum", "count", "min", "max"] = "avg"
    group_by: Optional[str] = None  # fuel_type, state, utility, region, type_clean
    filters: Optional[Dict[str, Any]] = None  # {"fuel_type": "Solar", "state": "Virginia"}
    chart_type: Literal["bar", "pie", "line", "table", "stat"] = "bar"
    limit: int = 10
    sort: Literal["asc", "desc"] = "desc"


class ChartResponse(BaseModel):
    """Response with chart data"""
    content: str  # Text explanation
    chart: Optional[Dict[str, Any]] = None  # Chart data for frontend
    sources: List[str] = []  # Data sources used


class ChatRequest(BaseModel):
    """Chat message request"""
    message: str
    context: Optional[Dict[str, Any]] = None  # Optional context (selected project, etc.)
    conversation_history: Optional[List[Dict[str, str]]] = None  # Previous messages
    model: Optional[str] = None  # Model override


class ChatResponse(BaseModel):
    """Chat message response"""
    content: str
    chart: Optional[Dict[str, Any]] = None
    sources: List[str] = []
    tool_calls: Optional[List[Dict[str, Any]]] = None  # Tool calls made
    thinking: Optional[str] = None  # Agent's reasoning (for debugging)


class ToolCall(BaseModel):
    """A single tool call"""
    id: str
    name: str
    input: Dict[str, Any]


class ToolResult(BaseModel):
    """Result of a tool call"""
    id: str
    name: str
    result: Any
    success: bool
    error: Optional[str] = None


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def safe_float(value) -> Optional[float]:
    """Safely convert Decimal/None to float"""
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def get_cluster_id(session: Session, cluster_name: str = "TC2", phase: str = "PHASE_1") -> Optional[int]:
    """Get cluster ID by name and phase"""
    cluster = session.exec(
        select(PJMCluster).where(
            PJMCluster.cluster_name == cluster_name,
            PJMCluster.phase == phase
        )
    ).first()
    return cluster.id if cluster else None


# ============================================================================
# OPENROUTER CLIENT - LLM API Integration
# ============================================================================

async def call_openrouter(
    messages: List[Dict[str, Any]],
    tools: Optional[List[Dict]] = None,
    model: str = DEFAULT_MODEL,
) -> Dict[str, Any]:
    """
    Call OpenRouter API with messages and optional tools.

    Args:
        messages: List of message dicts with role and content
        tools: Optional list of tool definitions
        model: Model to use (default: claude-sonnet-4)

    Returns:
        OpenRouter API response
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY not configured"
        )

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 8192,
    }

    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://gridagent.io",
                "X-Title": "GridAgent",
            },
            json=payload,
        )

        if response.status_code != 200:
            error_text = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"OpenRouter API error: {error_text}"
            )

        return response.json()


async def run_agent_loop(
    user_message: str,
    conversation_history: Optional[List[Dict]] = None,
    context: Optional[Dict] = None,
    model: str = DEFAULT_MODEL,
) -> Dict[str, Any]:
    """
    Run the ReACT agent loop.

    This function:
    1. Builds a dynamic system prompt based on the query
    2. Calls OpenRouter with the system prompt and tools
    3. Executes any tool calls
    4. Continues until the model stops calling tools or max iterations

    Args:
        user_message: The user's question
        conversation_history: Previous messages in the conversation
        context: Additional context (selected project, etc.)
        model: Model to use

    Returns:
        Dict with content, tool_calls, sources, thinking
    """
    # Build dynamic system prompt
    system_prompt = build_system_prompt(
        user_query=user_message,
        include_full_schema=True,
        conversation_context=json.dumps(context) if context else None,
    )

    # Get tool schemas for function calling
    tools = get_tool_schemas()

    # Convert tools to OpenRouter format (OpenAI-compatible)
    openrouter_tools = [
        {
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["input_schema"],
            }
        }
        for tool in tools
    ]

    # Build messages
    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history
    if conversation_history:
        messages.extend(conversation_history)

    # Add current user message
    messages.append({"role": "user", "content": user_message})

    # Track tool calls for response
    all_tool_calls = []
    sources = []
    thinking = []

    # ReACT Loop
    for iteration in range(MAX_TOOL_ITERATIONS):
        # Call OpenRouter
        response = await call_openrouter(messages, openrouter_tools, model)

        choice = response.get("choices", [{}])[0]
        message = choice.get("message", {})
        finish_reason = choice.get("finish_reason")

        # Extract any thinking (text before tool calls)
        if message.get("content"):
            thinking.append(message["content"])

        # Check if model wants to use tools
        tool_calls = message.get("tool_calls", [])

        if not tool_calls or finish_reason == "stop":
            # No more tool calls, return final response
            return {
                "content": message.get("content", ""),
                "tool_calls": all_tool_calls,
                "sources": list(set(sources)),
                "thinking": "\n\n".join(thinking) if thinking else None,
            }

        # Execute tool calls
        messages.append(message)  # Add assistant message with tool calls

        for tool_call in tool_calls:
            tool_id = tool_call.get("id")
            function = tool_call.get("function", {})
            tool_name = function.get("name")
            tool_args = json.loads(function.get("arguments", "{}"))

            # Execute the tool
            result = await execute_tool(tool_name, **tool_args)

            # Track the call
            all_tool_calls.append({
                "id": tool_id,
                "name": tool_name,
                "input": tool_args,
                "result": result["result"] if result["success"] else None,
                "error": result["error"],
                "success": result["success"],
            })

            # Add source based on tool
            if tool_name == "query_db":
                sources.append("GridAgent Database")
            elif tool_name == "firecrawl_scrape":
                sources.append(f"PJM Web: {tool_args.get('url', 'Unknown')}")
            elif tool_name == "firecrawl_search":
                sources.append("Web Search")

            # Format result for OpenRouter
            tool_result_content = json.dumps(
                result["result"] if result["success"] else {"error": result["error"]},
                default=str
            )

            messages.append({
                "role": "tool",
                "tool_call_id": tool_id,
                "content": tool_result_content[:50000],  # Limit size
            })

    # Max iterations reached
    return {
        "content": "I've made several attempts to answer your question but need more information. Could you please rephrase or provide more context?",
        "tool_calls": all_tool_calls,
        "sources": list(set(sources)),
        "thinking": "\n\n".join(thinking) if thinking else None,
    }


# ============================================================================
# ADVANCED CHAT ENDPOINT - OpenRouter + ReACT
# ============================================================================

@router.post("/chat/v2", response_model=ChatResponse)
async def chat_v2(request: ChatRequest):
    """
    Advanced chat endpoint with full ReACT agent loop.

    This endpoint:
    1. Builds a dynamic system prompt based on the query
    2. Uses OpenRouter to call Claude with tool use
    3. Executes tools (query_db, firecrawl, execute_code)
    4. Returns the final response with sources

    Use this for complex queries that need web scraping or analysis.
    """
    try:
        result = await run_agent_loop(
            user_message=request.message,
            conversation_history=request.conversation_history,
            context=request.context,
            model=request.model or DEFAULT_MODEL,
        )

        return ChatResponse(
            content=result["content"],
            sources=result["sources"],
            tool_calls=result["tool_calls"],
            thinking=result["thinking"],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CLUSTER DATA QUERIES
# ============================================================================

def query_cluster_data(
    session: Session,
    metric: str,
    aggregation: str,
    group_by: Optional[str],
    filters: Optional[Dict[str, Any]],
    limit: int,
    sort: str,
) -> tuple[List[Dict], str]:
    """Query PJM cluster data with aggregation"""

    # Get cluster ID (default TC2 Phase 1)
    cluster_filter = filters or {}
    cluster_name = cluster_filter.pop("cluster", "TC2")
    phase = cluster_filter.pop("phase", "PHASE_1")
    cluster_id = get_cluster_id(session, cluster_name, phase)

    if not cluster_id:
        return [], "Cluster not found"

    # Map metric to column
    metric_map = {
        "cost_per_kw": PJMProjectCost.cost_per_kw,
        "mw_capacity": PJMProjectCost.mw_capacity,
        "total_cost": PJMProjectCost.total_cost,
        "risk_score_overall": PJMProjectCost.risk_score_overall,
        "risk_score_cost": PJMProjectCost.risk_score_cost,
    }

    metric_col = metric_map.get(metric, PJMProjectCost.cost_per_kw)

    # Map aggregation
    agg_map = {
        "avg": func.avg,
        "sum": func.sum,
        "count": func.count,
        "min": func.min,
        "max": func.max,
    }
    agg_func = agg_map.get(aggregation, func.avg)

    # Map group_by to column
    group_map = {
        "fuel_type": PJMProjectCost.fuel_type,
        "state": PJMProjectCost.state,
        "utility": PJMProjectCost.utility,
        "county": PJMProjectCost.county,
    }

    # Build query
    base_query = select(PJMProjectCost).where(PJMProjectCost.cluster_id == cluster_id)

    # Apply filters
    for key, value in cluster_filter.items():
        if hasattr(PJMProjectCost, key):
            base_query = base_query.where(getattr(PJMProjectCost, key) == value)

    if group_by and group_by in group_map:
        group_col = group_map[group_by]
        query = select(
            group_col.label("group"),
            agg_func(metric_col).label("value"),
            func.count(PJMProjectCost.id).label("count")
        ).where(
            PJMProjectCost.cluster_id == cluster_id
        ).group_by(group_col)

        # Apply filters
        for key, value in cluster_filter.items():
            if hasattr(PJMProjectCost, key):
                query = query.where(getattr(PJMProjectCost, key) == value)

        # Sort and limit
        if sort == "desc":
            query = query.order_by(func.coalesce(agg_func(metric_col), 0).desc())
        else:
            query = query.order_by(func.coalesce(agg_func(metric_col), 0).asc())

        query = query.limit(limit)

        results = session.exec(query).all()
        data = [
            {
                "name": r.group or "Unknown",
                "value": safe_float(r.value),
                "count": r.count
            }
            for r in results if r.group
        ]

        description = f"{aggregation.upper()} {metric} by {group_by} in {cluster_name} {phase}"

    else:
        # Single stat - no grouping
        query = select(
            agg_func(metric_col).label("value"),
            func.count(PJMProjectCost.id).label("count")
        ).where(PJMProjectCost.cluster_id == cluster_id)

        # Apply filters
        for key, value in cluster_filter.items():
            if hasattr(PJMProjectCost, key):
                query = query.where(getattr(PJMProjectCost, key) == value)

        result = session.exec(query).first()

        filter_desc = ", ".join(f"{k}={v}" for k, v in cluster_filter.items()) if cluster_filter else "all projects"
        data = [{"name": filter_desc, "value": safe_float(result.value), "count": result.count}]
        description = f"{aggregation.upper()} {metric} for {filter_desc} in {cluster_name} {phase}"

    return data, description


# ============================================================================
# QUEUE DATA QUERIES
# ============================================================================

def query_queue_data(
    session: Session,
    metric: str,
    aggregation: str,
    group_by: Optional[str],
    filters: Optional[Dict[str, Any]],
    limit: int,
    sort: str,
) -> tuple[List[Dict], str]:
    """Query national queue data with aggregation"""

    filters = filters or {}

    # Map metric to column
    metric_map = {
        "mw": QueueProject.mw1,
        "mw1": QueueProject.mw1,
        "count": QueueProject.q_id,
    }
    metric_col = metric_map.get(metric, QueueProject.mw1)

    # Map aggregation
    agg_map = {
        "avg": func.avg,
        "sum": func.sum,
        "count": func.count,
        "min": func.min,
        "max": func.max,
    }
    agg_func = agg_map.get(aggregation, func.count)

    # Map group_by to column
    group_map = {
        "region": QueueProject.region,
        "state": QueueProject.state,
        "type_clean": QueueProject.type_clean,
        "fuel_type": QueueProject.type_clean,  # Alias
        "q_status": QueueProject.q_status,
        "status": QueueProject.q_status,  # Alias
        "q_year": QueueProject.q_year,
        "year": QueueProject.q_year,  # Alias
        "developer": QueueProject.developer,
        "utility": QueueProject.utility,
    }

    if group_by and group_by in group_map:
        group_col = group_map[group_by]
        query = select(
            group_col.label("group"),
            agg_func(metric_col).label("value"),
            func.count(QueueProject.q_id).label("count")
        ).group_by(group_col)

        # Apply filters
        for key, value in filters.items():
            if key in group_map:
                query = query.where(group_map[key] == value)

        # Sort and limit
        if sort == "desc":
            query = query.order_by(func.coalesce(agg_func(metric_col), 0).desc())
        else:
            query = query.order_by(func.coalesce(agg_func(metric_col), 0).asc())

        query = query.limit(limit)

        results = session.exec(query).all()
        data = [
            {
                "name": r.group or "Unknown",
                "value": safe_float(r.value) if aggregation != "count" else r.value,
                "count": r.count
            }
            for r in results if r.group
        ]

        description = f"{aggregation.upper()} by {group_by} (national queue)"

    else:
        # Single stat
        query = select(
            agg_func(metric_col).label("value"),
            func.count(QueueProject.q_id).label("count")
        )

        # Apply filters
        for key, value in filters.items():
            if key in group_map:
                query = query.where(group_map[key] == value)

        result = session.exec(query).first()

        filter_desc = ", ".join(f"{k}={v}" for k, v in filters.items()) if filters else "all projects"
        data = [{"name": filter_desc, "value": safe_float(result.value), "count": result.count}]
        description = f"{aggregation.upper()} for {filter_desc} (national queue)"

    return data, description


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/query", response_model=ChartResponse)
def query_data(
    request: ChartRequest,
    session: Session = Depends(get_session),
):
    """
    Execute a parameterized query and return chart data.

    This is the core NLP→SQL endpoint. The AI will call this with
    structured parameters extracted from natural language.
    """
    try:
        if request.dataset == "cluster":
            data, description = query_cluster_data(
                session=session,
                metric=request.metric,
                aggregation=request.aggregation,
                group_by=request.group_by,
                filters=request.filters,
                limit=request.limit,
                sort=request.sort,
            )
            sources = ["PJM TC2 Phase 1 Data"]
        else:
            data, description = query_queue_data(
                session=session,
                metric=request.metric,
                aggregation=request.aggregation,
                group_by=request.group_by,
                filters=request.filters,
                limit=request.limit,
                sort=request.sort,
            )
            sources = ["National Queue Data (36K projects)"]

        if not data:
            return ChartResponse(
                content="No data found for the specified query.",
                chart=None,
                sources=sources,
            )

        # Build response
        if request.chart_type == "stat":
            # Single statistic
            value = data[0]["value"] if data else 0
            count = data[0]["count"] if data else 0

            if request.metric == "cost_per_kw":
                content = f"**${value:.0f}/kW** ({count} projects)"
            elif request.metric in ["total_cost", "mw"]:
                content = f"**{value:,.0f}** ({count} projects)"
            else:
                content = f"**{value:.1f}** ({count} projects)"

            return ChartResponse(content=content, chart=None, sources=sources)

        # Format text content
        if request.group_by:
            lines = [f"**{description}**\n"]
            for item in data[:5]:
                if request.metric == "cost_per_kw":
                    lines.append(f"- {item['name']}: ${item['value']:.0f}/kW ({item['count']} projects)")
                else:
                    lines.append(f"- {item['name']}: {item['value']:,.0f} ({item['count']} projects)")
            content = "\n".join(lines)
        else:
            item = data[0]
            if request.metric == "cost_per_kw":
                content = f"**{description}**\n\nAverage: **${item['value']:.0f}/kW** across {item['count']} projects"
            else:
                content = f"**{description}**\n\nValue: **{item['value']:,.0f}** across {item['count']} projects"

        # Build chart data
        chart = {
            "type": request.chart_type,
            "data": data,
            "dataKey": "value",
            "nameKey": "name",
        }

        return ChartResponse(content=content, chart=chart, sources=sources)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    session: Session = Depends(get_session),
):
    """
    Simple chat endpoint - parses natural language to structured query.

    For MVP, this uses keyword matching. Later will integrate with LLM.
    """
    message = request.message.lower()

    # Keyword-based intent detection (MVP - will be replaced by LLM)

    # Detect dataset
    dataset = "cluster"
    if any(word in message for word in ["queue", "national", "all isos", "36k", "36,000"]):
        dataset = "queue"

    # Detect metric
    metric = "cost_per_kw"
    if "mw" in message or "capacity" in message or "megawatt" in message:
        metric = "mw_capacity" if dataset == "cluster" else "mw"
    elif "risk" in message:
        metric = "risk_score_overall"
    elif "total cost" in message:
        metric = "total_cost"
    elif "count" in message or "how many" in message:
        metric = "count"

    # Detect aggregation
    aggregation = "avg"
    if "total" in message or "sum" in message:
        aggregation = "sum"
    elif "count" in message or "how many" in message:
        aggregation = "count"
    elif "max" in message or "highest" in message or "top" in message:
        aggregation = "max"
    elif "min" in message or "lowest" in message:
        aggregation = "min"

    # Detect group_by
    group_by = None
    if "by fuel" in message or "by type" in message or "fuel type" in message:
        group_by = "fuel_type"
    elif "by state" in message:
        group_by = "state"
    elif "by utility" in message or "by owner" in message:
        group_by = "utility"
    elif "by region" in message or "by iso" in message:
        group_by = "region"
    elif "by year" in message:
        group_by = "q_year" if dataset == "queue" else None
    elif "by developer" in message:
        group_by = "developer"

    # Detect filters
    filters = {}

    # Fuel type filters
    if "solar" in message:
        filters["fuel_type"] = "Solar"
    elif "wind" in message:
        filters["fuel_type"] = "Wind"
    elif "battery" in message or "storage" in message:
        filters["fuel_type"] = "Storage"
    elif "gas" in message or "natural gas" in message:
        filters["fuel_type"] = "Gas"

    # Region filters (for queue)
    if dataset == "queue":
        if "pjm" in message:
            filters["region"] = "PJM"
        elif "miso" in message:
            filters["region"] = "MISO"
        elif "caiso" in message or "california" in message:
            filters["region"] = "CAISO"
        elif "ercot" in message or "texas" in message:
            filters["region"] = "ERCOT"

    # Detect chart type
    chart_type = "bar"
    if "pie" in message or "breakdown" in message or "composition" in message:
        chart_type = "pie"
    elif "trend" in message or "over time" in message:
        chart_type = "line"
    elif "table" in message or "list" in message:
        chart_type = "table"

    # Execute query
    query_request = ChartRequest(
        dataset=dataset,
        metric=metric,
        aggregation=aggregation,
        group_by=group_by,
        filters=filters if filters else None,
        chart_type=chart_type,
        limit=10,
        sort="desc",
    )

    result = query_data(query_request, session)

    return ChatResponse(
        content=result.content,
        chart=result.chart,
        sources=result.sources,
    )


@router.get("/health")
def agent_health():
    """Health check for agent endpoint"""
    return {"status": "ok", "service": "gridagent"}

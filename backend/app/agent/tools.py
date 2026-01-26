"""
GridAgent Tool Implementations
==============================

This module implements the actual tool execution logic for GridAgent.

Tools:
1. query_db - Execute SQL queries against our database
2. firecrawl_scrape - Scrape web pages via Firecrawl
3. firecrawl_search - Search web via Firecrawl
4. execute_code - Run Python code in E2B sandbox

Each tool returns a standardized result format:
{
    "success": bool,
    "result": Any,  # The actual result
    "error": Optional[str],  # Error message if failed
    "metadata": dict  # Additional info (tokens, timing, etc.)
}
"""

import os
import time
from typing import Any, Dict, List, Optional
from datetime import datetime
import httpx
from sqlmodel import Session, text

from app.database import engine


# =============================================================================
# TOOL RESULT FORMAT
# =============================================================================

def tool_result(
    success: bool,
    result: Any = None,
    error: Optional[str] = None,
    metadata: Optional[dict] = None
) -> dict:
    """Standardized tool result format."""
    return {
        "success": success,
        "result": result,
        "error": error,
        "metadata": metadata or {},
        "timestamp": datetime.now().isoformat(),
    }


# =============================================================================
# TOOL: query_db
# =============================================================================

BLOCKED_KEYWORDS = {
    "drop", "delete", "truncate", "update", "insert", "alter",
    "create", "grant", "revoke", "--", ";--", "/*", "*/"
}


def validate_sql_query(query: str) -> tuple[bool, Optional[str]]:
    """
    Validate SQL query for safety.
    Returns (is_valid, error_message).
    """
    query_lower = query.lower().strip()

    # Must start with SELECT
    if not query_lower.startswith("select"):
        return False, "Only SELECT queries are allowed"

    # Check for blocked keywords
    for keyword in BLOCKED_KEYWORDS:
        if keyword in query_lower:
            return False, f"Query contains blocked keyword: {keyword}"

    # Check for multiple statements
    if query_lower.count(";") > 1:
        return False, "Multiple statements not allowed"

    return True, None


async def query_db(query: str, explain: str = "") -> dict:
    """
    Execute a read-only SQL query against the PJM database.

    Args:
        query: SQL SELECT query to execute
        explain: Brief explanation of query purpose

    Returns:
        Tool result with query results or error
    """
    start_time = time.time()

    # Validate query
    is_valid, error = validate_sql_query(query)
    if not is_valid:
        return tool_result(
            success=False,
            error=f"Query validation failed: {error}",
            metadata={"query": query, "explain": explain}
        )

    try:
        with Session(engine) as session:
            result = session.execute(text(query))
            columns = result.keys()
            rows = result.fetchall()

            # Convert to list of dicts
            data = [dict(zip(columns, row)) for row in rows]

            elapsed = time.time() - start_time

            return tool_result(
                success=True,
                result={
                    "columns": list(columns),
                    "rows": data,
                    "row_count": len(data),
                },
                metadata={
                    "query": query,
                    "explain": explain,
                    "elapsed_ms": round(elapsed * 1000, 2),
                }
            )

    except Exception as e:
        return tool_result(
            success=False,
            error=f"Database error: {str(e)}",
            metadata={"query": query, "explain": explain}
        )


# =============================================================================
# TOOL: firecrawl_scrape
# =============================================================================

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1"


async def firecrawl_scrape(url: str, purpose: str = "") -> dict:
    """
    Scrape a web page using Firecrawl API.

    Args:
        url: Full URL to scrape
        purpose: What information you're looking for

    Returns:
        Tool result with markdown content or error
    """
    if not FIRECRAWL_API_KEY:
        return tool_result(
            success=False,
            error="FIRECRAWL_API_KEY not configured",
            metadata={"url": url}
        )

    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{FIRECRAWL_BASE_URL}/scrape",
                headers={
                    "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "url": url,
                    "formats": ["markdown"],
                }
            )

            if response.status_code != 200:
                return tool_result(
                    success=False,
                    error=f"Firecrawl API error: {response.status_code} - {response.text}",
                    metadata={"url": url}
                )

            data = response.json()

            if not data.get("success"):
                return tool_result(
                    success=False,
                    error=f"Firecrawl scrape failed: {data.get('error', 'Unknown error')}",
                    metadata={"url": url}
                )

            elapsed = time.time() - start_time
            markdown = data.get("data", {}).get("markdown", "")

            return tool_result(
                success=True,
                result={
                    "markdown": markdown,
                    "url": url,
                    "char_count": len(markdown),
                },
                metadata={
                    "purpose": purpose,
                    "elapsed_ms": round(elapsed * 1000, 2),
                    "source_url": data.get("data", {}).get("metadata", {}).get("sourceURL"),
                }
            )

    except httpx.TimeoutException:
        return tool_result(
            success=False,
            error="Firecrawl request timed out after 60s",
            metadata={"url": url}
        )
    except Exception as e:
        return tool_result(
            success=False,
            error=f"Firecrawl error: {str(e)}",
            metadata={"url": url}
        )


async def firecrawl_search(query: str, limit: int = 5) -> dict:
    """
    Search the web using Firecrawl API.

    Args:
        query: Search query
        limit: Maximum number of results

    Returns:
        Tool result with search results or error
    """
    if not FIRECRAWL_API_KEY:
        return tool_result(
            success=False,
            error="FIRECRAWL_API_KEY not configured"
        )

    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{FIRECRAWL_BASE_URL}/search",
                headers={
                    "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "query": query,
                    "limit": limit,
                }
            )

            if response.status_code != 200:
                return tool_result(
                    success=False,
                    error=f"Firecrawl search error: {response.status_code}"
                )

            data = response.json()
            elapsed = time.time() - start_time

            return tool_result(
                success=True,
                result={
                    "results": data.get("data", []),
                    "query": query,
                    "result_count": len(data.get("data", [])),
                },
                metadata={
                    "elapsed_ms": round(elapsed * 1000, 2),
                }
            )

    except Exception as e:
        return tool_result(
            success=False,
            error=f"Search error: {str(e)}"
        )


async def firecrawl_map(url: str) -> dict:
    """
    Map a website's URLs using Firecrawl API.
    Useful for finding all pages/documents on a site.

    Args:
        url: Base URL to map

    Returns:
        Tool result with list of URLs found
    """
    if not FIRECRAWL_API_KEY:
        return tool_result(
            success=False,
            error="FIRECRAWL_API_KEY not configured"
        )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{FIRECRAWL_BASE_URL}/map",
                headers={
                    "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"url": url}
            )

            if response.status_code != 200:
                return tool_result(
                    success=False,
                    error=f"Firecrawl map error: {response.status_code}"
                )

            data = response.json()

            return tool_result(
                success=True,
                result={
                    "urls": data.get("links", []),
                    "url_count": len(data.get("links", [])),
                }
            )

    except Exception as e:
        return tool_result(
            success=False,
            error=f"Map error: {str(e)}"
        )


# =============================================================================
# TOOL: execute_code (E2B)
# =============================================================================

E2B_API_KEY = os.getenv("E2B_API_KEY")


async def execute_code(code: str, purpose: str = "") -> dict:
    """
    Execute Python code in E2B sandbox.

    Available packages: pandas, numpy, matplotlib, pdfplumber
    Files persist in /workspace/ between calls.

    Args:
        code: Python code to execute
        purpose: What this code accomplishes

    Returns:
        Tool result with execution output or error
    """
    if not E2B_API_KEY:
        return tool_result(
            success=False,
            error="E2B_API_KEY not configured. Code execution not available.",
            metadata={"code": code[:200] + "..." if len(code) > 200 else code}
        )

    start_time = time.time()

    try:
        # Import E2B SDK (optional dependency)
        from e2b_code_interpreter import Sandbox

        # Create sandbox and execute
        with Sandbox(api_key=E2B_API_KEY) as sandbox:
            execution = sandbox.run_code(code)

            elapsed = time.time() - start_time

            # Collect outputs
            stdout = []
            stderr = []
            results = []

            for output in execution.logs.stdout:
                stdout.append(output)

            for output in execution.logs.stderr:
                stderr.append(output)

            for result in execution.results:
                if result.png:
                    results.append({"type": "image", "data": result.png})
                elif result.text:
                    results.append({"type": "text", "data": result.text})

            return tool_result(
                success=execution.error is None,
                result={
                    "stdout": "\n".join(stdout),
                    "stderr": "\n".join(stderr),
                    "results": results,
                    "error": str(execution.error) if execution.error else None,
                },
                metadata={
                    "purpose": purpose,
                    "elapsed_ms": round(elapsed * 1000, 2),
                    "code_length": len(code),
                }
            )

    except ImportError:
        return tool_result(
            success=False,
            error="E2B SDK not installed. Run: pip install e2b-code-interpreter",
            metadata={"code": code[:200] + "..." if len(code) > 200 else code}
        )
    except Exception as e:
        return tool_result(
            success=False,
            error=f"Code execution error: {str(e)}",
            metadata={"code": code[:200] + "..." if len(code) > 200 else code}
        )


# =============================================================================
# TOOL EXECUTION DISPATCHER
# =============================================================================

TOOLS = {
    "query_db": query_db,
    "firecrawl_scrape": firecrawl_scrape,
    "firecrawl_search": firecrawl_search,
    "firecrawl_map": firecrawl_map,
    "execute_code": execute_code,
}


async def execute_tool(tool_name: str, **kwargs) -> dict:
    """
    Execute a tool by name with given arguments.

    Args:
        tool_name: Name of the tool to execute
        **kwargs: Arguments to pass to the tool

    Returns:
        Tool result
    """
    if tool_name not in TOOLS:
        return tool_result(
            success=False,
            error=f"Unknown tool: {tool_name}. Available: {list(TOOLS.keys())}"
        )

    tool_func = TOOLS[tool_name]
    return await tool_func(**kwargs)


# =============================================================================
# HELPER: Parse Tool Calls from Claude Response
# =============================================================================

def parse_tool_calls(response_content: List[dict]) -> List[dict]:
    """
    Parse tool use blocks from Claude response content.

    Args:
        response_content: List of content blocks from Claude response

    Returns:
        List of tool call dicts with name, id, and input
    """
    tool_calls = []

    for block in response_content:
        if block.get("type") == "tool_use":
            tool_calls.append({
                "id": block.get("id"),
                "name": block.get("name"),
                "input": block.get("input", {}),
            })

    return tool_calls


def format_tool_result_for_claude(tool_id: str, result: dict) -> dict:
    """
    Format tool result for Claude API tool_result content block.

    Args:
        tool_id: The tool use ID from Claude's response
        result: The tool result dict

    Returns:
        Formatted content block for Claude
    """
    if result["success"]:
        content = result["result"]
        # Convert dict to string if needed
        if isinstance(content, dict):
            import json
            content = json.dumps(content, indent=2, default=str)
    else:
        content = f"Error: {result['error']}"

    return {
        "type": "tool_result",
        "tool_use_id": tool_id,
        "content": str(content)[:50000],  # Limit size
    }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "query_db",
    "firecrawl_scrape",
    "firecrawl_search",
    "firecrawl_map",
    "execute_code",
    "execute_tool",
    "parse_tool_calls",
    "format_tool_result_for_claude",
    "tool_result",
    "TOOLS",
]

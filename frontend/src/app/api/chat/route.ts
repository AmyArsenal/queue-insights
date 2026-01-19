import { NextRequest, NextResponse } from "next/server";
import { AGENT_TOOLS, SYSTEM_PROMPT, QueryDbParams } from "@/types/agent";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// Execute the query_db tool against our FastAPI backend
async function executeQueryDb(params: QueryDbParams) {
  const queryParams = new URLSearchParams();

  // Handle filters
  if (params.filters) {
    if (params.filters.regions?.length) {
      queryParams.append("region", params.filters.regions.join(","));
    }
    if (params.filters.states?.length) {
      queryParams.append("state", params.filters.states.join(","));
    }
    if (params.filters.types?.length) {
      queryParams.append("type_clean", params.filters.types.join(","));
    }
    if (params.filters.statuses?.length) {
      queryParams.append("q_status", params.filters.statuses.join(","));
    }
    if (params.filters.min_mw !== undefined) {
      queryParams.append("min_mw", params.filters.min_mw.toString());
    }
    if (params.filters.max_mw !== undefined) {
      queryParams.append("max_mw", params.filters.max_mw.toString());
    }
    if (params.filters.years?.length) {
      queryParams.append("q_year", params.filters.years.join(","));
    }
  }

  // Handle aggregation - if we want aggregated data, use the stats endpoints
  if (params.aggregation && params.aggregation !== "raw") {
    let endpoint = "/api/stats";
    switch (params.aggregation) {
      case "by_region":
        endpoint = "/api/stats/by-region";
        break;
      case "by_type":
        endpoint = "/api/stats/by-type";
        break;
      case "by_status":
        endpoint = "/api/stats/by-status";
        break;
      case "by_year":
        endpoint = "/api/stats/by-year";
        break;
    }

    // For stats endpoints, pass filters as query params
    const url = `${BACKEND_API_URL}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    return response.json();
  }

  // For raw data, use the projects endpoint
  const limit = Math.min(params.limit || 100, 500);
  queryParams.append("limit", limit.toString());

  const url = `${BACKEND_API_URL}/api/projects?${queryParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }
  return response.json();
}

// Process tool calls and execute them
async function processToolCalls(
  toolCalls: Array<{
    id: string;
    function: { name: string; arguments: string };
  }>
) {
  const results = [];

  for (const toolCall of toolCalls) {
    const { name, arguments: argsString } = toolCall.function;

    try {
      const args = JSON.parse(argsString);

      if (name === "query_db") {
        const data = await executeQueryDb(args);
        results.push({
          id: toolCall.id,
          name,
          arguments: args,
          result: { data },
          status: "completed" as const,
        });
      } else {
        results.push({
          id: toolCall.id,
          name,
          arguments: args,
          result: { error: `Unknown tool: ${name}` },
          status: "error" as const,
        });
      }
    } catch (error) {
      results.push({
        id: toolCall.id,
        name,
        arguments: {},
        result: { error: error instanceof Error ? error.message : "Unknown error" },
        status: "error" as const,
      });
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!OPENROUTER_API_KEY) {
      // Fallback: simulate a response without calling OpenRouter
      return NextResponse.json({
        content:
          "OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables to enable the AI agent.",
        toolInvocations: [],
      });
    }

    // Prepare messages for OpenRouter (OpenAI-compatible format)
    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // First API call to get the model's response
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://queue-insights.vercel.app",
        "X-Title": "GridAgent",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: apiMessages,
        tools: AGENT_TOOLS,
        tool_choice: "auto",
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error("No response from model");
    }

    // Check if the model wants to use tools
    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      // Execute the tool calls
      const toolResults = await processToolCalls(choice.message.tool_calls);

      // Build tool response messages for the second API call
      const toolResponseMessages = toolResults.map((result) => ({
        role: "tool" as const,
        tool_call_id: result.id,
        content: JSON.stringify(result.result.data || result.result.error),
      }));

      // Second API call with tool results
      const secondResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://queue-insights.vercel.app",
            "X-Title": "GridAgent",
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-4",
            messages: [
              ...apiMessages,
              choice.message,
              ...toolResponseMessages,
            ],
            max_tokens: 4096,
          }),
        }
      );

      if (!secondResponse.ok) {
        throw new Error(`OpenRouter API error: ${secondResponse.status}`);
      }

      const secondData = await secondResponse.json();
      const finalContent = secondData.choices?.[0]?.message?.content || "";

      return NextResponse.json({
        content: finalContent,
        toolInvocations: toolResults,
      });
    }

    // No tool calls, return the direct response
    return NextResponse.json({
      content: choice.message.content || "",
      toolInvocations: [],
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

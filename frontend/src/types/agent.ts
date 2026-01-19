// Agent types for GridAgent chat

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolInvocations?: ToolInvocation[];
}

export interface ToolInvocation {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: ToolResult;
  status: "pending" | "running" | "completed" | "error";
}

export interface ToolResult {
  data?: unknown;
  error?: string;
}

// Query database tool parameters
export interface QueryDbParams {
  filters?: {
    regions?: string[];
    states?: string[];
    types?: string[];
    statuses?: string[];
    min_mw?: number;
    max_mw?: number;
    years?: number[];
  };
  aggregation?: "raw" | "by_region" | "by_type" | "by_status" | "by_year";
  limit?: number;
}

// Chat request/response types
export interface ChatRequest {
  messages: { role: MessageRole; content: string }[];
  model?: string;
}

export interface ChatStreamChunk {
  type: "text" | "tool_call" | "tool_result" | "done" | "error";
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    id: string;
    result: unknown;
  };
  error?: string;
}

// Tool definitions for OpenRouter
export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "query_db",
      description: `Query the interconnection queue database with 36,000+ projects.

Available fields:
- region: ISO region (ERCOT, PJM, CAISO, MISO, SPP, NYISO, ISO-NE, West, Southeast)
- state: US state abbreviation (TX, CA, PA, etc.)
- type_clean: Fuel type (Solar, Wind, Storage, Gas, Hybrid, etc.)
- q_status: Queue status (active, withdrawn, operational)
- mw1: Capacity in MW
- q_year: Year entered queue
- developer: Developer company name
- project_name: Project name
- poi_name: Point of interconnection

Use this tool to find projects, get statistics, and analyze the queue.`,
      parameters: {
        type: "object",
        properties: {
          filters: {
            type: "object",
            properties: {
              regions: {
                type: "array",
                items: { type: "string" },
                description: "Filter by ISO regions",
              },
              states: {
                type: "array",
                items: { type: "string" },
                description: "Filter by state abbreviations",
              },
              types: {
                type: "array",
                items: { type: "string" },
                description: "Filter by fuel types (Solar, Wind, Storage, etc.)",
              },
              statuses: {
                type: "array",
                items: { type: "string" },
                description: "Filter by queue status (active, withdrawn, operational)",
              },
              min_mw: {
                type: "number",
                description: "Minimum capacity in MW",
              },
              max_mw: {
                type: "number",
                description: "Maximum capacity in MW",
              },
              years: {
                type: "array",
                items: { type: "number" },
                description: "Filter by queue entry years",
              },
            },
          },
          aggregation: {
            type: "string",
            enum: ["raw", "by_region", "by_type", "by_status", "by_year"],
            description: "How to aggregate results. Use 'raw' for individual projects.",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default 100, max 500)",
          },
        },
      },
    },
  },
];

// System prompt for GridAgent
export const SYSTEM_PROMPT = `You are GridAgent, an AI analyst for US electricity interconnection queue data.

## Your Role
Help users understand and analyze the interconnection queue - where new power plants and storage projects wait for grid connection approval.

## Database
You have access to 36,000+ projects from all major US ISOs (Independent System Operators):
- ERCOT (Texas)
- PJM (Mid-Atlantic, Midwest)
- CAISO (California)
- MISO (Central US)
- SPP (Great Plains)
- NYISO (New York)
- ISO-NE (New England)
- West (Western states)
- Southeast (Southern states)

## Available Data Fields
- region: ISO region
- state: US state abbreviation
- type_clean: Fuel type (Solar, Wind, Storage, Gas, Hybrid, etc.)
- q_status: Queue status (active, withdrawn, operational)
- mw1: Capacity in MW
- q_year: Year project entered the queue
- developer: Developer company name
- project_name: Project name
- poi_name: Point of interconnection (substation)

## Guidelines
1. ALWAYS use the query_db tool to fetch data before making claims
2. Cite specific numbers from the data
3. For time-series questions, aggregate by q_year
4. For comparisons, use appropriate groupings (by_region, by_type, etc.)
5. Explain what the data means in plain English
6. If a query returns no results, explain why and suggest alternatives

## Key Metrics to Know
- Total queue: ~36,000 projects, ~2,300 GW capacity
- Withdrawal rates vary by region (typically 30-60%)
- Solar dominates new queue entries
- Battery storage is growing rapidly

## Example Queries
- "Solar projects in Texas" → query_db with filters: {types: ['Solar'], regions: ['ERCOT']}
- "Largest wind projects" → query_db with filters: {types: ['Wind']}, aggregation: 'raw', limit: 10
- "Queue by region" → query_db with aggregation: 'by_region'
- "Projects entering in 2023" → query_db with filters: {years: [2023]}`;

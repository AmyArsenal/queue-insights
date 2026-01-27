"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Send,
  Zap,
  BarChart3,
  Database,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Loader2,
  Clock,
  Code2,
  FileText,
  Globe,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  Copy,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { sendAgentMessage } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ToolCall, AgentMessage } from "@/components/agent/agent-provider";

const suggestedQueries = [
  {
    icon: BarChart3,
    text: "What's the avg $/kW for solar in TC2?",
  },
  {
    icon: Database,
    text: "Show me the top 10 riskiest projects",
  },
  {
    icon: Zap,
    text: "Which projects share Upgrade #b4523?",
  },
  {
    icon: Sparkles,
    text: "Compare battery vs solar project costs",
  },
];

const CHART_COLORS = ["#4FFFB0", "#3B82F6", "#FBBF24", "#8B5CF6", "#F97316"];

// Electron orbital thinking animation
function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#4FFFB0] shadow-[0_0_12px_#4FFFB0]" />
        </div>
        <motion.div
          className="absolute w-2 h-2 bg-[#4FFFB0] rounded-full shadow-[0_0_8px_#4FFFB0]"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{
            top: "calc(50% - 4px)",
            left: "calc(50% - 4px)",
            transformOrigin: "4px 4px",
            transform: "translateX(20px)",
          }}
        />
        <motion.div
          className="absolute w-1.5 h-1.5 bg-[#3B82F6] rounded-full shadow-[0_0_6px_#3B82F6]"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{
            top: "calc(50% - 3px)",
            left: "calc(50% - 3px)",
            transformOrigin: "3px 3px",
            transform: "translateX(16px) rotate(60deg)",
          }}
        />
        <motion.div
          className="absolute w-1.5 h-1.5 bg-[#FBBF24] rounded-full shadow-[0_0_6px_#FBBF24]"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          style={{
            top: "calc(50% - 3px)",
            left: "calc(50% - 3px)",
            transformOrigin: "3px 3px",
            transform: "translateX(12px) rotate(120deg)",
          }}
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-white/60">Thinking</span>
        <motion.span
          className="text-[#4FFFB0]"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
        >
          .
        </motion.span>
        <motion.span
          className="text-[#4FFFB0]"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.2 }}
        >
          .
        </motion.span>
        <motion.span
          className="text-[#4FFFB0]"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1], delay: 0.4 }}
        >
          .
        </motion.span>
      </div>
    </div>
  );
}

// Tool icon mapper
function getToolIcon(toolName: string) {
  switch (toolName) {
    case "query_db":
      return Database;
    case "firecrawl_scrape":
    case "firecrawl_search":
    case "firecrawl_map":
      return Globe;
    case "execute_code":
      return Code2;
    default:
      return FileText;
  }
}

// Tool call item in left panel
function ToolCallItem({
  tool,
  isSelected,
  onClick
}: {
  tool: ToolCall;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = getToolIcon(tool.name);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2 rounded-lg transition-colors ${
        isSelected
          ? "bg-[#4FFFB0]/10 border border-[#4FFFB0]/30"
          : "hover:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded flex items-center justify-center ${
          tool.status === "success" ? "bg-emerald-500/10" :
          tool.status === "error" ? "bg-red-500/10" :
          "bg-blue-500/10"
        }`}>
          <Icon className={`w-3.5 h-3.5 ${
            tool.status === "success" ? "text-emerald-400" :
            tool.status === "error" ? "text-red-400" :
            "text-blue-400"
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/80 truncate">{tool.name}</p>
          {tool.duration_ms && (
            <p className="text-[10px] text-white/40">{tool.duration_ms}ms</p>
          )}
        </div>
        {tool.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        {tool.status === "error" && <XCircle className="w-3.5 h-3.5 text-red-400" />}
        {tool.status === "running" && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
      </div>
    </button>
  );
}

// Left Panel - Tool Execution Timeline
function LeftPanel({
  messages,
  selectedToolId,
  onSelectTool,
  isCollapsed,
  onToggleCollapse
}: {
  messages: AgentMessage[];
  selectedToolId: string | null;
  onSelectTool: (toolId: string | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const allToolCalls = useMemo(() => {
    return messages.flatMap(m => m.tool_calls || []);
  }, [messages]);

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-white/40 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="px-3 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/40" />
          <span className="text-xs font-medium text-white/60">Execution Trace</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-6 w-6 text-white/40 hover:text-white"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tool calls list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {allToolCalls.length === 0 ? (
          <div className="text-center py-8">
            <Code2 className="w-8 h-8 mx-auto text-white/20 mb-2" />
            <p className="text-xs text-white/40">No tool calls yet</p>
            <p className="text-[10px] text-white/30 mt-1">
              Ask a question to see the agent work
            </p>
          </div>
        ) : (
          allToolCalls.map((tool) => (
            <ToolCallItem
              key={tool.id}
              tool={tool}
              isSelected={selectedToolId === tool.id}
              onClick={() => onSelectTool(selectedToolId === tool.id ? null : tool.id)}
            />
          ))
        )}
      </div>

      {/* Stats */}
      {allToolCalls.length > 0 && (
        <div className="px-3 py-2 border-t border-white/10">
          <div className="flex justify-between text-[10px] text-white/40">
            <span>{allToolCalls.length} tool calls</span>
            <span>
              {allToolCalls.reduce((sum, t) => sum + (t.duration_ms || 0), 0)}ms total
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Right Panel - Details
function RightPanel({
  selectedTool,
  selectedMessage,
  isCollapsed,
  onToggleCollapse
}: {
  selectedTool: ToolCall | null;
  selectedMessage: AgentMessage | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const copyToClipboard = async (text: string, type: "input" | "output") => {
    await navigator.clipboard.writeText(text);
    if (type === "input") {
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } else {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-white/40 hover:text-white"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="px-3 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/40" />
          <span className="text-xs font-medium text-white/60">Details</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-6 w-6 text-white/40 hover:text-white"
        >
          <PanelRightClose className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {selectedTool ? (
          <div className="space-y-4">
            {/* Tool header */}
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = getToolIcon(selectedTool.name);
                return <Icon className="w-4 h-4 text-[#4FFFB0]" />;
              })()}
              <span className="text-sm font-medium text-white">{selectedTool.name}</span>
              {selectedTool.status === "success" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  Success
                </span>
              )}
              {selectedTool.status === "error" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                  Error
                </span>
              )}
            </div>

            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Input</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => copyToClipboard(JSON.stringify(selectedTool.input, null, 2), "input")}
                >
                  {copiedInput ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-white/40" />
                  )}
                </Button>
              </div>
              <pre className="text-[11px] text-white/70 bg-white/5 rounded-lg p-2 overflow-x-auto max-h-40">
                {JSON.stringify(selectedTool.input, null, 2)}
              </pre>
            </div>

            {/* Output */}
            {selectedTool.output && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">Output</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => copyToClipboard(selectedTool.output || "", "output")}
                  >
                    {copiedOutput ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/40" />
                    )}
                  </Button>
                </div>
                <pre className="text-[11px] text-white/70 bg-white/5 rounded-lg p-2 overflow-x-auto max-h-60 whitespace-pre-wrap">
                  {selectedTool.output.slice(0, 2000)}
                  {selectedTool.output.length > 2000 && "..."}
                </pre>
              </div>
            )}

            {/* Duration */}
            {selectedTool.duration_ms && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Clock className="w-3 h-3" />
                <span>{selectedTool.duration_ms}ms</span>
              </div>
            )}
          </div>
        ) : selectedMessage ? (
          <div className="space-y-4">
            {/* Message sources */}
            {selectedMessage.sources && selectedMessage.sources.length > 0 && (
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Sources</span>
                <div className="mt-2 space-y-1.5">
                  {selectedMessage.sources.map((source, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs p-2 rounded bg-white/5"
                    >
                      <FileText className="w-3.5 h-3.5 text-white/40" />
                      <span className="flex-1 text-white/70">{source}</span>
                      {source.startsWith("http") && (
                        <a href={source} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 text-white/40 hover:text-white" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thinking trace */}
            {selectedMessage.thinking && (
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Thinking</span>
                <pre className="mt-2 text-[11px] text-white/60 bg-white/5 rounded-lg p-2 overflow-x-auto max-h-60 whitespace-pre-wrap">
                  {selectedMessage.thinking}
                </pre>
              </div>
            )}

            {/* Tool calls for this message */}
            {selectedMessage.tool_calls && selectedMessage.tool_calls.length > 0 && (
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  Tools Used ({selectedMessage.tool_calls.length})
                </span>
                <div className="mt-2 space-y-1">
                  {selectedMessage.tool_calls.map((tool) => (
                    <div key={tool.id} className="flex items-center gap-2 text-xs p-2 rounded bg-white/5">
                      {(() => {
                        const Icon = getToolIcon(tool.name);
                        return <Icon className="w-3.5 h-3.5 text-white/40" />;
                      })()}
                      <span className="flex-1 text-white/70">{tool.name}</span>
                      <span className="text-white/40">{tool.duration_ms}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            {selectedMessage.timestamp && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Clock className="w-3 h-3" />
                <span>{new Date(selectedMessage.timestamp).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto text-white/20 mb-2" />
            <p className="text-xs text-white/40">Select a tool or message</p>
            <p className="text-[10px] text-white/30 mt-1">to see details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Chart renderer
function MessageChart({ chart }: { chart: AgentMessage["chart"] }) {
  if (!chart) return null;

  if (chart.type === "bar") {
    return (
      <div className="h-48 mt-4 bg-white/5 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey={chart.nameKey}
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                color: "white",
              }}
            />
            <Bar dataKey={chart.dataKey || "value"} fill="#4FFFB0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === "pie") {
    return (
      <div className="h-48 mt-4 bg-white/5 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              nameKey={chart.nameKey}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: "rgba(255,255,255,0.3)" }}
            >
              {chart.data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                color: "white",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

// Collapsible thinking dropdown
function ThinkingDropdown({ thinking }: { thinking: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinking) return null;

  return (
    <div className="mt-2 border-t border-white/10 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-white/50 hover:text-white/70 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span>Thinking</span>
      </button>
      {isOpen && (
        <pre className="mt-1.5 text-xs text-white/50 bg-white/5 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
          {thinking}
        </pre>
      )}
    </div>
  );
}

// Main Page Component
export default function AgentPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Find selected tool and message
  const selectedTool = useMemo(() => {
    if (!selectedToolId) return null;
    for (const msg of messages) {
      const tool = msg.tool_calls?.find(t => t.id === selectedToolId);
      if (tool) return tool;
    }
    return null;
  }, [selectedToolId, messages]);

  const selectedMessage = useMemo(() => {
    if (!selectedMessageId) return null;
    return messages.find(m => m.id === selectedMessageId) || null;
  }, [selectedMessageId, messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");
    setIsLoading(true);

    try {
      const apiResponse = await sendAgentMessage({ message: currentQuery });

      // Parse tool_calls from API response if present
      const toolCalls: ToolCall[] = apiResponse.tool_calls?.map((tc: {
        id?: string;
        name: string;
        input: Record<string, unknown>;
        output?: string;
        duration_ms?: number;
      }, i: number) => ({
        id: tc.id || `tool-${Date.now()}-${i}`,
        name: tc.name,
        input: tc.input || {},
        output: tc.output,
        duration_ms: tc.duration_ms,
        status: "success" as const,
      })) || [];

      const assistantMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: apiResponse.content,
        chart: apiResponse.chart as AgentMessage["chart"],
        sources: apiResponse.sources,
        thinking: apiResponse.thinking,
        tool_calls: toolCalls,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSelectedMessageId(assistantMessage.id);
    } catch (error) {
      console.error("API error:", error);
      const errorMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleClearMessages = () => {
    setMessages([]);
    setSelectedToolId(null);
    setSelectedMessageId(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-black">
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        {/* Left Panel - Tool Trace */}
        <ResizablePanel
          defaultSize={18}
          minSize={3}
          maxSize={30}
          collapsible
        >
          <LeftPanel
            messages={messages}
            selectedToolId={selectedToolId}
            onSelectTool={(id) => {
              setSelectedToolId(id);
              setSelectedMessageId(null);
            }}
            isCollapsed={leftCollapsed}
            onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
          />
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/5 hover:bg-white/10 transition-colors" />

        {/* Center Panel - Chat */}
        <ResizablePanel defaultSize={64} minSize={40}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4FFFB0]/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#4FFFB0]" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-white">GridAgent</h1>
                  <p className="text-[10px] text-white/40">PJM Intelligence</p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearMessages}
                  className="text-white/40 hover:text-white h-8"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-6">
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center min-h-[50vh]"
                  >
                    <div className="mb-6 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#4FFFB0]/10 border border-[#4FFFB0]/20 mb-3">
                        <Zap className="w-7 h-7 text-[#4FFFB0]" />
                      </div>
                      <h2 className="text-xl font-semibold text-white mb-1">GridAgent</h2>
                      <p className="text-white/40 text-sm">PJM Interconnection Intelligence</p>
                    </div>

                    <div className="w-full max-w-lg space-y-2">
                      <p className="text-xs text-white/30 uppercase tracking-wider text-center mb-3">
                        Try asking
                      </p>
                      {suggestedQueries.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#4FFFB0]/10 transition-colors">
                            <suggestion.icon className="w-4 h-4 text-white/50 group-hover:text-[#4FFFB0] transition-colors" />
                          </div>
                          <span className="flex-1 text-sm text-white/70 group-hover:text-white transition-colors">
                            {suggestion.text}
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <button
                            onClick={() => {
                              if (message.role === "assistant") {
                                setSelectedMessageId(selectedMessageId === message.id ? null : message.id);
                                setSelectedToolId(null);
                              }
                            }}
                            className={`max-w-[85%] text-left ${
                              message.role === "user"
                                ? "bg-white text-black rounded-2xl rounded-br-md px-4 py-3"
                                : `bg-transparent transition-all ${
                                    selectedMessageId === message.id
                                      ? "ring-1 ring-[#4FFFB0]/30 rounded-lg"
                                      : ""
                                  }`
                            }`}
                          >
                            {message.role === "assistant" && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-lg bg-[#4FFFB0]/10 flex items-center justify-center">
                                  <Zap className="w-3 h-3 text-[#4FFFB0]" />
                                </div>
                                <span className="text-xs text-white/40 font-medium">GridAgent</span>
                                {message.tool_calls && message.tool_calls.length > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                                    {message.tool_calls.length} tools
                                  </span>
                                )}
                              </div>
                            )}
                            <div
                              className={`prose prose-sm max-w-none ${
                                message.role === "assistant"
                                  ? "prose-invert prose-p:text-white/80 prose-strong:text-white prose-td:text-white/70 prose-th:text-white/90"
                                  : ""
                              }`}
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {message.content}
                            </div>

                            {message.chart && <MessageChart chart={message.chart} />}

                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-white/10">
                                <div className="flex flex-wrap gap-1.5">
                                  {message.sources.map((source, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/10"
                                    >
                                      {source}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {message.thinking && (
                              <ThinkingDropdown thinking={message.thinking} />
                            )}
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="py-2"
                      >
                        <ThinkingAnimation />
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-white/10 bg-black/50 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto px-4 py-3">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/20 rounded-xl p-1.5 focus-within:border-white/40 transition-colors">
                    <Input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask about PJM projects, costs, upgrades..."
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-white/40 px-3"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isLoading || !query.trim()}
                      className="rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed px-4"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
                <p className="text-[10px] text-white/30 text-center mt-2">
                  TC2 Phase 1 data with 452 projects
                </p>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-white/5 hover:bg-white/10 transition-colors" />

        {/* Right Panel - Details */}
        <ResizablePanel
          defaultSize={18}
          minSize={3}
          maxSize={30}
          collapsible
        >
          <RightPanel
            selectedTool={selectedTool}
            selectedMessage={selectedMessage}
            isCollapsed={rightCollapsed}
            onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

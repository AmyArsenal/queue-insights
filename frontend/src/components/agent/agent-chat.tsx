"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAgent, type AgentMessage } from "./agent-provider";
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

const CHART_COLORS = ["#4FFFB0", "#3B82F6", "#FBBF24", "#8B5CF6", "#F97316"];

const suggestedQueries = [
  "What's the avg $/kW for solar?",
  "Show me the riskiest projects",
  "Compare battery vs solar costs",
];

// Compact thinking animation
function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="relative w-8 h-8">
        {/* Center nucleus */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#4FFFB0] shadow-[0_0_8px_#4FFFB0]" />
        </div>
        {/* Orbiting electrons */}
        <motion.div
          className="absolute w-1.5 h-1.5 bg-[#4FFFB0] rounded-full shadow-[0_0_6px_#4FFFB0]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{
            top: "calc(50% - 3px)",
            left: "calc(50% - 3px)",
            transformOrigin: "3px 3px",
            transform: "translateX(12px)",
          }}
        />
        <motion.div
          className="absolute w-1 h-1 bg-[#3B82F6] rounded-full shadow-[0_0_4px_#3B82F6]"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{
            top: "calc(50% - 2px)",
            left: "calc(50% - 2px)",
            transformOrigin: "2px 2px",
            transform: "translateX(10px) rotate(120deg)",
          }}
        />
      </div>
      <span className="text-sm text-zinc-400">Thinking...</span>
    </div>
  );
}

function MessageChart({ chart }: { chart: AgentMessage["chart"] }) {
  if (!chart) return null;

  if (chart.type === "bar") {
    return (
      <div className="h-36 mt-3 bg-zinc-800/50 rounded-lg p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey={chart.nameKey}
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                color: "white",
                fontSize: "12px",
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
      <div className="h-36 mt-3 bg-zinc-800/50 rounded-lg p-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
              nameKey={chart.nameKey}
              label={({ name }) => name}
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
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

export function AgentChat() {
  const {
    isOpen,
    closeChat,
    messages,
    isLoading,
    addMessage,
    setLoading,
    clearMessages,
  } = useAgent();
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    addMessage(userMessage);
    const currentQuery = query;
    setQuery("");
    setLoading(true);

    try {
      const apiResponse = await sendAgentMessage({ message: currentQuery });

      const assistantMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: apiResponse.content,
        chart: apiResponse.chart as AgentMessage["chart"],
        sources: apiResponse.sources,
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error("API error:", error);
      const errorMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-zinc-950 border-zinc-800 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#4FFFB0]/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#4FFFB0]" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-white">
                  GridAgent
                </SheetTitle>
                <p className="text-xs text-zinc-500">PJM Intelligence</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="text-zinc-400 hover:text-white h-8"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="py-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500 text-center">
                  Ask me anything about PJM interconnection data
                </p>
                <div className="space-y-2">
                  {suggestedQueries.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[90%] ${
                          message.role === "user"
                            ? "bg-white text-black rounded-2xl rounded-br-sm px-3 py-2"
                            : "bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm px-3 py-2"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Zap className="w-3 h-3 text-[#4FFFB0]" />
                            <span className="text-xs text-zinc-500">GridAgent</span>
                          </div>
                        )}
                        <div
                          className={`text-sm whitespace-pre-wrap ${
                            message.role === "assistant" ? "text-zinc-200" : ""
                          }`}
                        >
                          {message.content}
                        </div>

                        {message.chart && <MessageChart chart={message.chart} />}

                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-zinc-700">
                            <div className="flex flex-wrap gap-1">
                              {message.sources.map((source, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
                                >
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm px-3 py-2">
                      <ThinkingAnimation />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-zinc-800 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask GridAgent..."
              className="flex-1 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !query.trim()}
              className="bg-[#4FFFB0] hover:bg-[#3de09d] text-black"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-zinc-600 text-center mt-2">
            TC2 Phase 1 data available
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Zap,
  BarChart3,
  Database,
  ChevronRight,
  Sparkles,
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  chart?: {
    type: "bar" | "pie";
    data: Record<string, unknown>[];
    dataKey?: string;
    nameKey?: string;
  };
  sources?: string[];
}

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
        {/* Center nucleus */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#4FFFB0] shadow-[0_0_12px_#4FFFB0]" />
        </div>

        {/* Orbital rings */}
        {[0, 60, 120].map((rotation, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Orbital path */}
            <div className="absolute inset-1 border border-white/10 rounded-full" />

            {/* Electron */}
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-[#4FFFB0] shadow-[0_0_8px_#4FFFB0]"
              style={{
                top: "50%",
                left: "50%",
                marginTop: "-4px",
                marginLeft: "-4px",
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1.5 + i * 0.3,
                repeat: Infinity,
                ease: "linear",
              }}
              // Position electron on orbital
              initial={false}
            >
              <motion.div
                animate={{
                  x: [20, -20, 20],
                  y: [0, 0, 0],
                }}
                transition={{
                  duration: 1.5 + i * 0.3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>
          </div>
        ))}

        {/* Animated electrons orbiting */}
        <motion.div
          className="absolute w-2 h-2 bg-[#4FFFB0] rounded-full shadow-[0_0_8px_#4FFFB0]"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            top: "calc(50% - 4px)",
            left: "calc(50% - 4px)",
            transformOrigin: "4px 4px",
            transform: "translateX(20px)",
          }}
        />
        <motion.div
          className="absolute w-1.5 h-1.5 bg-[#3B82F6] rounded-full shadow-[0_0_6px_#3B82F6]"
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            top: "calc(50% - 3px)",
            left: "calc(50% - 3px)",
            transformOrigin: "3px 3px",
            transform: "translateX(16px) rotate(60deg)",
          }}
        />
        <motion.div
          className="absolute w-1.5 h-1.5 bg-[#FBBF24] rounded-full shadow-[0_0_6px_#FBBF24]"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            top: "calc(50% - 3px)",
            left: "calc(50% - 3px)",
            transformOrigin: "3px 3px",
            transform: "translateX(12px) rotate(120deg)",
          }}
        />
      </div>

      {/* Thinking text with animated dots */}
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

export default function AgentPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateMockResponse = (userQuery: string): Message => {
    const lowerQuery = userQuery.toLowerCase();

    if (lowerQuery.includes("$/kw") || lowerQuery.includes("cost") || lowerQuery.includes("solar")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Based on TC2 Phase 1 data, here's the cost distribution for solar projects:\n\n**Average $/kW:** $187\n**Median $/kW:** $156\n**Range:** $45 - $892/kW\n\nSolar projects show lower average costs compared to storage ($234/kW) but higher variance.",
        chart: {
          type: "bar",
          data: [
            { range: "$0-100", count: 45 },
            { range: "$100-200", count: 128 },
            { range: "$200-300", count: 87 },
            { range: "$300-400", count: 34 },
            { range: "$400+", count: 12 },
          ],
          dataKey: "count",
          nameKey: "range",
        },
        sources: ["TC2 Phase 1 Cost Summary", "PJM Queue Data"],
      };
    }

    if (lowerQuery.includes("risk") || lowerQuery.includes("risky")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Here are the top 10 highest-risk projects in TC2 based on our composite risk score:\n\n| Rank | Project | Risk Score | $/kW |\n|------|---------|------------|------|\n| 1 | AH1-234 | 89 | $542 |\n| 2 | AG2-891 | 85 | $478 |\n| 3 | AH1-456 | 82 | $423 |\n\nRisk factors include high $/kW, upgrade concentration, and co-dependency count.",
        chart: {
          type: "pie",
          data: [
            { name: "Cost Risk", value: 35 },
            { name: "Concentration", value: 25 },
            { name: "Dependency", value: 25 },
            { name: "Overloads", value: 15 },
          ],
          nameKey: "name",
        },
        sources: ["Risk Model v2", "TC2 Upgrade Allocations"],
      };
    }

    if (lowerQuery.includes("upgrade") || lowerQuery.includes("share")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "**Upgrade b4523** is a 500kV transmission reinforcement shared by 23 projects.\n\n**Total Cost:** $124.5M\n**Your Allocation:** 4.2% ($5.2M)\n\n**Co-dependent Projects:**\n- AH1-234 (Solar, 150MW) - 8.1%\n- AG2-456 (Storage, 200MW) - 12.3%\n- AH1-789 (Wind, 300MW) - 15.7%\n\nWithdrawal of the top 3 contributors could reduce your allocation by ~$1.8M.",
        sources: ["TC2 Network Upgrades", "Project Allocations DB"],
      };
    }

    if (lowerQuery.includes("battery") || lowerQuery.includes("storage") || lowerQuery.includes("compare")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "**Battery vs Solar Cost Comparison (TC2)**\n\n| Metric | Battery | Solar |\n|--------|---------|-------|\n| Avg $/kW | $234 | $187 |\n| Median | $198 | $156 |\n| Projects | 89 | 245 |\n\nBattery projects have 25% higher average costs but lower variance. Network upgrade costs drive the difference.",
        chart: {
          type: "bar",
          data: [
            { type: "Battery", avgCost: 234, median: 198 },
            { type: "Solar", avgCost: 187, median: 156 },
            { type: "Wind", avgCost: 145, median: 132 },
            { type: "Gas", avgCost: 278, median: 245 },
          ],
          dataKey: "avgCost",
          nameKey: "type",
        },
        sources: ["TC2 Cost Analysis", "Fuel Type Comparison"],
      };
    }

    return {
      id: Date.now().toString(),
      role: "assistant",
      content: "I can help you analyze PJM interconnection data. Try asking about:\n\n- **Cost analysis:** \"What's the avg $/kW for solar?\"\n- **Risk assessment:** \"Show me risky projects\"\n- **Upgrade sharing:** \"Which projects share upgrade X?\"\n- **Comparisons:** \"Compare battery vs solar costs\"\n\nI have access to TC2 Phase 1 data with 452 projects and full upgrade allocations.",
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");
    setIsLoading(true);

    try {
      // Call real backend API
      const apiResponse = await sendAgentMessage({ message: currentQuery });

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: apiResponse.content,
        chart: apiResponse.chart as Message["chart"],
        sources: apiResponse.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("API error, falling back to mock:", error);
      // Fallback to mock response if API fails
      const response = generateMockResponse(currentQuery);
      setMessages((prev) => [...prev, response]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const renderChart = (chart: Message["chart"]) => {
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
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              {/* Logo/Title */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#4FFFB0]/10 border border-[#4FFFB0]/20 mb-4">
                  <Zap className="w-8 h-8 text-[#4FFFB0]" />
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">GridAgent</h1>
                <p className="text-white/50 text-sm">PJM Interconnection Intelligence</p>
              </div>

              {/* Suggested Queries */}
              <div className="w-full max-w-xl space-y-3">
                <p className="text-xs text-white/40 uppercase tracking-wider text-center mb-4">
                  Try asking
                </p>
                {suggestedQueries.map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#4FFFB0]/10 transition-colors">
                      <suggestion.icon className="w-5 h-5 text-white/50 group-hover:text-[#4FFFB0] transition-colors" />
                    </div>
                    <span className="flex-1 text-white/70 group-hover:text-white transition-colors">
                      {suggestion.text}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        message.role === "user"
                          ? "bg-white text-black rounded-2xl rounded-br-md px-4 py-3"
                          : "bg-transparent"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-lg bg-[#4FFFB0]/10 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 text-[#4FFFB0]" />
                          </div>
                          <span className="text-xs text-white/40 font-medium">GridAgent</span>
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

                      {message.chart && renderChart(message.chart)}

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <p className="text-xs text-white/40 mb-2">Sources</p>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/60 border border-white/10"
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
                  exit={{ opacity: 0 }}
                  className="py-4"
                >
                  <ThinkingAnimation />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
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
          <p className="text-xs text-white/30 text-center mt-3">
            GridAgent has access to PJM TC2 data with 452 projects
          </p>
        </div>
      </div>
    </div>
  );
}

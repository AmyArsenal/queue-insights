"use client";

import { ComingSoon } from "@/components/coming-soon";
import { MessageSquare } from "lucide-react";

export default function AgentPage() {
  return (
    <ComingSoon
      title="AI Agent"
      description="Ask questions about the interconnection queue in plain English"
      icon={MessageSquare}
      features={[
        "Natural language queries: \"Show me solar projects over 100 MW in Texas\"",
        "AI-generated charts and visualizations",
        "Real-time web search for ISO news and tariff updates",
        "Python code execution for custom analysis",
        "Export results and share insights",
      ]}
    />
  );
}

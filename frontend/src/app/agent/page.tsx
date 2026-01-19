"use client";

import { AgentChat } from "@/components/agent/chat";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Database, Zap } from "lucide-react";

export default function AgentPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-400">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">GridAgent</h1>
            <p className="text-muted-foreground">
              AI-powered analysis of the US interconnection queue
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="gap-1">
            <Database className="h-3 w-3" />
            36K+ Projects
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            ~2,300 GW Capacity
          </Badge>
          <Badge variant="secondary">Phase 1: Database Query</Badge>
        </div>
      </div>

      {/* Chat interface */}
      <Card className="h-[calc(100vh-220px)] min-h-[500px]">
        <AgentChat />
      </Card>
    </div>
  );
}

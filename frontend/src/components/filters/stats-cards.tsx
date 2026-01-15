"use client";

import { Card } from "@/components/ui/card";
import { Zap, TrendingUp, Activity, CheckCircle } from "lucide-react";
import type { OverviewStats } from "@/types";

interface StatsCardsProps {
  stats: OverviewStats | null;
  loading: boolean;
  filteredCount?: number;
}

export function StatsCards({ stats, loading, filteredCount }: StatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Projects",
      value: stats.total_projects.toLocaleString(),
      icon: Zap,
      color: "text-blue-500",
    },
    {
      label: "Total Capacity",
      value: `${stats.total_capacity_gw.toLocaleString()} GW`,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Active Projects",
      value: stats.active_projects.toLocaleString(),
      icon: Activity,
      color: "text-amber-500",
    },
    {
      label: "Active Capacity",
      value: `${stats.active_capacity_gw.toLocaleString()} GW`,
      icon: CheckCircle,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="flex items-center gap-2">
            <card.icon className={`h-4 w-4 ${card.color}`} />
            <span className="text-sm text-muted-foreground">{card.label}</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}

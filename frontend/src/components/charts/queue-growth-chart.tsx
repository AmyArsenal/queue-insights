"use client";

import { Card } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { TimelineStats } from "@/lib/api";

interface QueueGrowthChartProps {
  data: TimelineStats[];
  loading: boolean;
}

export function QueueGrowthChart({ data, loading }: QueueGrowthChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  // Filter to recent years (2010+)
  const recentData = data.filter((d) => d.year >= 2010);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Queue Growth Over Time</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Projects entering the interconnection queue by year
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={recentData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "total_entered") return [v.toLocaleString(), "Projects Entered"];
                if (name === "total_mw_entered") return [`${(v / 1000).toFixed(1)} GW`, "Capacity Entered"];
                return [v, String(name)];
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="total_entered"
              name="Projects Entered"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function CapacityGrowthChart({ data, loading }: QueueGrowthChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  const recentData = data.filter((d) => d.year >= 2010).map((d) => ({
    ...d,
    total_gw: d.total_mw_entered / 1000,
    active_gw: d.active_mw / 1000,
    withdrawn_gw: d.withdrawn_mw / 1000,
    operational_gw: d.operational_mw / 1000,
  }));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Capacity Entering Queue (GW)</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Gigawatts of capacity by queue entry year and current status
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={recentData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} GW`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [`${Number(value).toFixed(1)} GW`]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="active_gw"
              name="Active"
              stackId="1"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="operational_gw"
              name="Operational"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="withdrawn_gw"
              name="Withdrawn"
              stackId="1"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

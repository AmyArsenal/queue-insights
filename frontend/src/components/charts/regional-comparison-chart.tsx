"use client";

import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RegionStats } from "@/types";

interface RegionalComparisonChartProps {
  data: RegionStats[];
  loading: boolean;
}

const COLORS = {
  capacity: "#3B82F6",
  projects: "#10B981",
};

export function RegionalCapacityChart({ data, loading }: RegionalComparisonChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    region: d.region,
    capacity: d.total_gw,
    projects: d.project_count,
  }));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Capacity by ISO/Region</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Total queue capacity across major grid operators
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v} GW`}
            />
            <YAxis
              type="category"
              dataKey="region"
              tick={{ fontSize: 11 }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value, name) => [
                name === "capacity" ? `${Number(value).toFixed(1)} GW` : `${Number(value).toLocaleString()} projects`,
                name === "capacity" ? "Capacity" : "Projects",
              ]}
            />
            <Bar dataKey="capacity" fill={COLORS.capacity} name="Capacity (GW)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function RegionalProjectsChart({ data, loading }: RegionalComparisonChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    region: d.region,
    projects: d.project_count,
    avgSize: d.total_mw / d.project_count,
  }));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Projects by ISO/Region</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Number of interconnection requests per region
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => v.toLocaleString()}
            />
            <YAxis
              type="category"
              dataKey="region"
              tick={{ fontSize: 11 }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value, _name, props) => [
                `${Number(value).toLocaleString()} projects (avg ${(props.payload as { avgSize: number }).avgSize.toFixed(0)} MW)`,
                "Project Count",
              ]}
            />
            <Bar dataKey="projects" fill={COLORS.projects} name="Projects" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

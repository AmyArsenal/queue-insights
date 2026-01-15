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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { TypeStats } from "@/types";

interface CapacityByTypeChartProps {
  data: TypeStats[];
  loading: boolean;
}

const COLORS = [
  "#F59E0B", // Solar - Amber
  "#14B8A6", // Wind - Teal
  "#6B7280", // Gas - Gray
  "#8B5CF6", // Battery - Purple
  "#F97316", // Solar+Battery - Orange
  "#3B82F6", // Other - Blue
  "#06B6D4", // Offshore Wind - Cyan
  "#EF4444", // Coal - Red
  "#84CC16", // Nuclear - Lime
  "#EC4899", // Other Storage - Pink
];

export function CapacityByTypeBarChart({ data, loading }: CapacityByTypeChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  // Top 10 types
  const topTypes = data.slice(0, 10).map((d) => ({
    ...d,
    total_gw: d.total_gw,
    name: d.type.length > 15 ? d.type.substring(0, 12) + "..." : d.type,
    fullName: d.type,
  }));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Capacity by Technology</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Total queue capacity by fuel type (top 10)
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topTypes} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v} GW`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value, _name, props) => [
                `${Number(value).toFixed(1)} GW (${(props.payload as { project_count: number }).project_count.toLocaleString()} projects)`,
                (props.payload as { fullName: string }).fullName,
              ]}
            />
            <Bar dataKey="total_gw" name="Capacity">
              {topTypes.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function CapacityByTypePieChart({ data, loading }: CapacityByTypeChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  // Top 6 types for pie chart (others grouped)
  const topTypes = data.slice(0, 6);
  const otherTypes = data.slice(6);
  const otherTotal = otherTypes.reduce((sum, t) => sum + t.total_gw, 0);
  const otherCount = otherTypes.reduce((sum, t) => sum + t.project_count, 0);

  const pieData = [
    ...topTypes.map((d) => ({
      name: d.type,
      value: d.total_gw,
      count: d.project_count,
    })),
    ...(otherTotal > 0
      ? [{ name: "Other", value: otherTotal, count: otherCount }]
      : []),
  ];

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Queue Capacity Mix</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Share of total queue capacity by technology
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value, name) => [
                `${Number(value).toFixed(1)} GW (${((Number(value) / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

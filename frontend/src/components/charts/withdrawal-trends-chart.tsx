"use client";

import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import type { TimelineStats } from "@/lib/api";

interface WithdrawalTrendsChartProps {
  data: TimelineStats[];
  loading: boolean;
}

export function WithdrawalRateChart({ data, loading }: WithdrawalTrendsChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  // Filter to years with meaningful data (after 2000)
  const chartData = data
    .filter((d) => d.year >= 2000)
    .map((d) => ({
      year: d.year,
      withdrawalRate: d.withdrawal_rate,
      totalEntered: d.total_entered,
      withdrawn: d.withdrawn,
    }));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Withdrawal Rate by Queue Year</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Percentage of projects that withdrew from the queue, by entry year
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => v.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "withdrawalRate") return [`${v.toFixed(1)}%`, "Withdrawal Rate"];
                if (name === "totalEntered") return [v.toLocaleString(), "Total Entered"];
                if (name === "withdrawn") return [v.toLocaleString(), "Withdrawn"];
                return [v, String(name)];
              }}
            />
            <Legend />
            <Bar
              yAxisId="right"
              dataKey="totalEntered"
              fill="#E2E8F0"
              name="Total Entered"
            />
            <Bar
              yAxisId="right"
              dataKey="withdrawn"
              fill="#EF4444"
              name="Withdrawn"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="withdrawalRate"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ fill: "#F59E0B" }}
              name="Withdrawal Rate %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function WithdrawnCapacityChart({ data, loading }: WithdrawalTrendsChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  // Filter to years with meaningful data (after 2000)
  const chartData = data
    .filter((d) => d.year >= 2000)
    .map((d) => ({
      year: d.year,
      enteredGW: d.total_mw_entered / 1000,
      withdrawnGW: d.withdrawn_mw / 1000,
      activeGW: d.active_mw / 1000,
      operationalGW: d.operational_mw / 1000,
    }));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Queue Capacity Outcomes by Year</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        What happened to capacity that entered the queue each year
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} GW`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value, name) => [
                `${Number(value).toFixed(1)} GW`,
                String(name).replace("GW", "").trim(),
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="operationalGW"
              stackId="1"
              stroke="#10B981"
              fill="#10B981"
              name="Operational"
            />
            <Area
              type="monotone"
              dataKey="activeGW"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F6"
              name="Still Active"
            />
            <Area
              type="monotone"
              dataKey="withdrawnGW"
              stackId="1"
              stroke="#EF4444"
              fill="#EF4444"
              name="Withdrawn"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

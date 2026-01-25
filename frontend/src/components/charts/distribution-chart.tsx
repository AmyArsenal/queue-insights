"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  ZAxis,
  ComposedChart,
  ErrorBar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Fuel type colors matching design tokens
const CATEGORY_COLORS: Record<string, string> = {
  // Fuel types
  Solar: "#FBBF24",
  Wind: "#14B8A6",
  Storage: "#8B5CF6",
  "Hybrid Storage": "#EC4899",
  "Natural Gas": "#6B7280",
  Nuclear: "#EF4444",
  "Offshore Wind": "#0EA5E9",
  Other: "#9CA3AF",
  // Default for utilities/unknown
  default: "#3B82F6",
};

interface DataPoint {
  id: string;
  value: number;
  label?: string;
}

interface CategoryData {
  category: string;
  values: number[];
  points: DataPoint[];
}

interface DistributionStats {
  category: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
  color: string;
}

interface DistributionChartProps {
  title: string;
  data: CategoryData[];
  valueLabel?: string;
  showPoints?: boolean;
  maxCategories?: number;
  height?: number;
}

function calculateQuartiles(values: number[]): { min: number; q1: number; median: number; q3: number; max: number } {
  if (values.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const min = sorted[0];
  const max = sorted[n - 1];
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];

  return { min, q1, median, q3, max };
}

export function DistributionChart({
  title,
  data,
  valueLabel = "Value",
  showPoints = true,
  maxCategories = 8,
  height = 300,
}: DistributionChartProps) {
  const stats = useMemo(() => {
    return data
      .slice(0, maxCategories)
      .map((item): DistributionStats => {
        const quartiles = calculateQuartiles(item.values);
        return {
          category: item.category,
          ...quartiles,
          count: item.values.length,
          color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default,
        };
      })
      .sort((a, b) => b.median - a.median); // Sort by median descending
  }, [data, maxCategories]);

  // Prepare scatter data for individual points
  const scatterData = useMemo(() => {
    if (!showPoints) return [];

    return data.slice(0, maxCategories).flatMap((item, categoryIndex) => {
      return item.points.map((point, pointIndex) => ({
        category: item.category,
        categoryIndex,
        value: point.value,
        id: point.id,
        label: point.label,
        // Add jitter to prevent overlap
        jitter: (Math.random() - 0.5) * 0.3,
      }));
    });
  }, [data, maxCategories, showPoints]);

  // Prepare bar chart data with range (Q1 to Q3)
  const barData = useMemo(() => {
    return stats.map((stat) => ({
      category: stat.category,
      // The "box" portion - from Q1 to Q3
      rangeStart: stat.q1,
      range: stat.q3 - stat.q1,
      median: stat.median,
      min: stat.min,
      max: stat.max,
      q1: stat.q1,
      q3: stat.q3,
      count: stat.count,
      color: stat.color,
      // For whiskers (min to Q1 and Q3 to max)
      lowerWhisker: stat.q1 - stat.min,
      upperWhisker: stat.max - stat.q3,
    }));
  }, [stats]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof barData[0] }> }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-white mb-2">{data.category}</p>
        <div className="space-y-1 text-sm text-zinc-300">
          <p>Projects: <span className="text-white font-medium">{data.count}</span></p>
          <p>Median: <span className="text-white font-medium">${data.median.toLocaleString()}</span></p>
          <p>Q1-Q3: <span className="text-white font-medium">${data.q1.toLocaleString()} - ${data.q3.toLocaleString()}</span></p>
          <p>Range: <span className="text-white font-medium">${data.min.toLocaleString()} - ${data.max.toLocaleString()}</span></p>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={barData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
              <XAxis
                type="number"
                stroke="#888"
                tick={{ fill: "#888", fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#888"
                tick={{ fill: "#fff", fontSize: 12 }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Range bar (Q1 to Q3) - stacked on top of rangeStart */}
              <Bar
                dataKey="rangeStart"
                stackId="range"
                fill="transparent"
                isAnimationActive={false}
              />
              <Bar
                dataKey="range"
                stackId="range"
                radius={[4, 4, 4, 4]}
                isAnimationActive={true}
              >
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.7} />
                ))}
              </Bar>

              {/* Median line marker */}
              {barData.map((entry, index) => (
                <Bar
                  key={`median-${index}`}
                  dataKey="median"
                  fill="transparent"
                  isAnimationActive={false}
                >
                  {/* We'll render median markers separately */}
                </Bar>
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {barData.slice(0, 6).map((item) => (
            <div key={item.category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-zinc-400">
                {item.category} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Simpler horizontal bar chart for counts (upgrades, constraints)
interface CountChartProps {
  title: string;
  data: { category: string; value: number; count: number }[];
  valueLabel?: string;
  height?: number;
}

export function CountDistributionChart({
  title,
  data,
  valueLabel = "Count",
  height = 300,
}: CountChartProps) {
  const chartData = useMemo(() => {
    return data
      .slice(0, 8)
      .sort((a, b) => b.value - a.value)
      .map((item) => ({
        ...item,
        color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default,
      }));
  }, [data]);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
              <XAxis
                type="number"
                stroke="#888"
                tick={{ fill: "#888", fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#888"
                tick={{ fill: "#fff", fontSize: 12 }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : String(value), valueLabel]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="flex justify-between text-xs text-zinc-500 mt-2 px-2">
          <span>Total: {chartData.reduce((sum, d) => sum + d.count, 0)} projects</span>
          <span>Avg {valueLabel}: {(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length || 0).toFixed(1)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Box plot with scatter overlay (for detailed view)
interface BoxPlotChartProps {
  title: string;
  data: CategoryData[];
  valueLabel?: string;
  formatValue?: (value: number) => string;
  height?: number;
  onPointClick?: (projectId: string) => void;
}

export function BoxPlotChart({
  title,
  data,
  valueLabel = "$/kW",
  formatValue = (v) => `$${v.toLocaleString()}`,
  height = 350,
  onPointClick,
}: BoxPlotChartProps) {
  // Calculate stats for each category
  const categoryStats = useMemo(() => {
    return data.map((item) => {
      const quartiles = calculateQuartiles(item.values);
      return {
        category: item.category,
        ...quartiles,
        count: item.values.length,
        color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default,
      };
    }).sort((a, b) => b.median - a.median);
  }, [data]);

  // Create scatter points with jitter
  const scatterPoints = useMemo(() => {
    return data.flatMap((item) => {
      const categoryIndex = categoryStats.findIndex(s => s.category === item.category);
      return item.points.map((point) => ({
        categoryIndex,
        category: item.category,
        value: point.value,
        id: point.id,
        label: point.label || point.id,
        // Jitter for visual separation
        y: categoryIndex + (Math.random() - 0.5) * 0.4,
        color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default,
      }));
    });
  }, [data, categoryStats]);

  // Find x-axis domain
  const xDomain = useMemo(() => {
    const allValues = data.flatMap(d => d.values);
    if (allValues.length === 0) return [0, 100];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    // Add 10% padding
    return [Math.max(0, min * 0.9), max * 1.1];
  }, [data]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof scatterPoints[0] }> }) => {
    if (!active || !payload || !payload[0]) return null;

    const point = payload[0].payload;

    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-lg">
        <p className="font-medium text-white text-sm">{point.id}</p>
        <p className="text-xs text-zinc-400">{point.label}</p>
        <p className="text-sm text-white mt-1">{formatValue(point.value)}</p>
      </div>
    );
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }} className="relative">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                type="number"
                dataKey="value"
                domain={xDomain}
                stroke="#888"
                tick={{ fill: "#888", fontSize: 11 }}
                tickFormatter={(v) => formatValue(v)}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[-0.5, categoryStats.length - 0.5]}
                ticks={categoryStats.map((_, i) => i)}
                tickFormatter={(i) => categoryStats[i]?.category || ""}
                stroke="#888"
                tick={{ fill: "#fff", fontSize: 11 }}
                width={90}
              />
              <ZAxis range={[30, 30]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={scatterPoints}
                cursor={onPointClick ? "pointer" : "default"}
                onClick={(data) => onPointClick?.(data.id)}
              >
                {scatterPoints.map((point, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={point.color}
                    fillOpacity={0.7}
                    stroke={point.color}
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Box overlay - rendered as absolute positioned divs */}
          {/* This would require more complex positioning, skip for now */}
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          {categoryStats.slice(0, 4).map((stat) => (
            <div
              key={stat.category}
              className="flex items-center justify-between p-2 bg-zinc-800/50 rounded"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="text-zinc-300">{stat.category}</span>
              </div>
              <span className="text-white font-medium">
                {formatValue(stat.median)} median
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  TrendingUp,
  DollarSign,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  getClusterSummary,
  getClusterProjects,
  getClusterFilterOptions,
  searchClusterProjects,
  getCostDistribution,
  getRiskBreakdown,
  getClusterStatsByFuelType,
  getClusterStatsByUtility,
  type ClusterSummary,
  type ClusterProject,
  type ClusterFilterOptions,
} from "@/lib/api";
import { ClusterFilterBar } from "@/components/filters/cluster-filter-bar";
import { MultiSelectFilter } from "@/components/filters/multi-select-filter";

function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

function formatCurrency(value: unknown): string {
  const num = safeNumber(value);
  if (num === null) return "—";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

function formatMW(value: unknown): string {
  const num = safeNumber(value);
  if (num === null) return "—";
  return `${num.toFixed(0)} MW`;
}

function getRiskColor(score: unknown): string {
  const num = safeNumber(score);
  if (num === null) return "bg-zinc-500";
  if (num < 25) return "bg-green-500";
  if (num < 50) return "bg-yellow-500";
  if (num < 75) return "bg-orange-500";
  return "bg-red-500";
}

function getRiskLabel(score: unknown): string {
  const num = safeNumber(score);
  if (num === null) return "—";
  if (num < 25) return "Low";
  if (num < 50) return "Medium";
  if (num < 75) return "High";
  return "Critical";
}

function safeNumberOrZero(value: unknown): number {
  const num = safeNumber(value);
  return num === null ? 0 : num;
}

// Color palette for charts
const FUEL_COLORS: Record<string, string> = {
  Solar: "#FBBF24",
  Wind: "#14B8A6",
  Storage: "#8B5CF6",
  "Hybrid Storage": "#EC4899",
  "Natural Gas": "#6B7280",
  Nuclear: "#EF4444",
  "Offshore Wind": "#0EA5E9",
  Other: "#9CA3AF",
};

type SortField = "cost_per_kw" | "cost_allocated_upgrade_count" | "mw_capacity" | "total_cost" | "risk_score_overall";
type SortOrder = "asc" | "desc";

export default function ClusterPage() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null);
  const [projects, setProjects] = useState<ClusterProject[]>([]);
  const [filterOptions, setFilterOptions] = useState<ClusterFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClusterProject[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cluster selection
  const [selectedISO, setSelectedISO] = useState("PJM");
  const [selectedCluster, setSelectedCluster] = useState("TC2");
  const [selectedPhase, setSelectedPhase] = useState("PHASE_1");

  // Chart data
  const [fuelTypeStats, setFuelTypeStats] = useState<{ fuel_type: string; count: number; total_mw: number; total_cost: number; avg_cost_per_kw: number }[]>([]);
  const [utilityStats, setUtilityStats] = useState<{ utility: string; count: number; total_mw: number; total_cost: number; avg_risk: number }[]>([]);

  // Table filters (multi-select)
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("cost_per_kw");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Table scroll ref
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const cluster = selectedCluster;
  const phase = selectedPhase;

  // Load initial data and charts
  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, filterData, fuelData, utilData] = await Promise.all([
          getClusterSummary(cluster, phase),
          getClusterFilterOptions(cluster, phase),
          getClusterStatsByFuelType(cluster, phase),
          getClusterStatsByUtility(cluster, phase),
        ]);
        setSummary(summaryData);
        setFilterOptions(filterData);
        setFuelTypeStats(fuelData);
        setUtilityStats(utilData);
      } catch (error) {
        console.error("Failed to load cluster data:", error);
      }
    }
    loadData();
  }, [cluster, phase]);

  // Load projects
  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const data = await getClusterProjects({
          cluster,
          phase,
          limit: 500,
        });
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [cluster, phase]);

  // Search projects
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchClusterProjects(searchQuery, cluster, phase);
        setSearchResults(
          results.map((r) => ({
            project_id: r.project_id,
            developer: r.developer,
            utility: r.utility,
            state: null,
            fuel_type: null,
            mw_capacity: r.mw_capacity,
            total_cost: r.total_cost,
            cost_per_kw: null,
            risk_score_overall: null,
            cost_rank: null,
          }))
        );
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, cluster, phase]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = searchQuery.length >= 2 ? searchResults : projects;

    // Apply multi-select filters
    if (selectedStates.length > 0) {
      filtered = filtered.filter((p) => p.state && selectedStates.includes(p.state));
    }
    if (selectedUtilities.length > 0) {
      filtered = filtered.filter((p) => p.utility && selectedUtilities.includes(p.utility));
    }
    if (selectedFuelTypes.length > 0) {
      filtered = filtered.filter((p) => p.fuel_type && selectedFuelTypes.includes(p.fuel_type));
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aVal = safeNumberOrZero(a[sortField as keyof ClusterProject]);
      const bVal = safeNumberOrZero(b[sortField as keyof ClusterProject]);
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [projects, searchResults, searchQuery, selectedStates, selectedUtilities, selectedFuelTypes, sortField, sortOrder]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-primary" />
    );
  };

  // Prepare chart data - $/kW by Fuel Type
  const fuelCostChartData = useMemo(() => {
    return fuelTypeStats
      .filter((f) => f.avg_cost_per_kw > 0)
      .sort((a, b) => b.avg_cost_per_kw - a.avg_cost_per_kw)
      .slice(0, 8)
      .map((f) => ({
        name: f.fuel_type,
        value: Math.round(f.avg_cost_per_kw),
        count: f.count,
        color: FUEL_COLORS[f.fuel_type] || "#9CA3AF",
      }));
  }, [fuelTypeStats]);

  // Prepare chart data - Count by Fuel Type
  const fuelCountChartData = useMemo(() => {
    return fuelTypeStats
      .filter((f) => f.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((f) => ({
        name: f.fuel_type,
        value: f.count,
        mw: f.total_mw,
        color: FUEL_COLORS[f.fuel_type] || "#9CA3AF",
      }));
  }, [fuelTypeStats]);

  // Prepare chart data - $/kW by Utility (TO)
  const utilityCostChartData = useMemo(() => {
    return utilityStats
      .filter((u) => u.total_cost > 0 && u.total_mw > 0)
      .map((u) => ({
        name: u.utility.length > 20 ? u.utility.substring(0, 20) + "..." : u.utility,
        fullName: u.utility,
        value: Math.round(u.total_cost / u.total_mw / 1000), // $/kW approximation
        count: u.count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [utilityStats]);

  // Prepare chart data - Count by Utility (TO)
  const utilityCountChartData = useMemo(() => {
    return utilityStats
      .filter((u) => u.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((u) => ({
        name: u.utility.length > 20 ? u.utility.substring(0, 20) + "..." : u.utility,
        fullName: u.utility,
        value: u.count,
        mw: u.total_mw,
      }));
  }, [utilityStats]);

  // Custom tooltip for horizontal bar charts
  const CustomTooltip = ({ active, payload, valueLabel = "Value" }: { active?: boolean; payload?: Array<{ payload: { name: string; fullName?: string; value: number; count?: number; mw?: number } }>; valueLabel?: string }) => {
    if (!active || !payload || !payload[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
        <p className="font-medium text-white">{data.fullName || data.name}</p>
        <p className="text-sm text-zinc-300">
          {valueLabel}: <span className="text-white font-medium">{valueLabel.includes("$") ? `$${data.value}` : data.value.toLocaleString()}</span>
        </p>
        {data.count && (
          <p className="text-sm text-zinc-400">{data.count} projects</p>
        )}
        {data.mw && (
          <p className="text-sm text-zinc-400">{formatMW(data.mw)}</p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-400">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cluster Study Analyzer</h1>
            <p className="text-muted-foreground">Interconnection cost allocation analysis</p>
          </div>
        </div>

        {/* Filter Bar */}
        <ClusterFilterBar
          selectedISO={selectedISO}
          selectedCluster={selectedCluster}
          selectedPhase={selectedPhase}
          onISOChange={setSelectedISO}
          onClusterChange={setSelectedCluster}
          onPhaseChange={setSelectedPhase}
        />

        {/* Summary badges */}
        <div className="flex gap-2 mt-4">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {summary?.total_projects || 0} Projects
          </Badge>
          <Badge variant="outline" className="gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(summary?.total_cost || 0)} Total Cost
          </Badge>
          <Badge variant="secondary">
            {selectedPhase === "PHASE_1" ? "Phase 1 SIS Results" : selectedPhase}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_projects}</div>
              <p className="text-xs text-zinc-500">{formatMW(summary.total_mw)} capacity</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Cost Allocated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_cost)}</div>
              <p className="text-xs text-zinc-500">Avg: {formatCurrency(summary.avg_cost_per_kw)}/kW</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Average Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeNumber(summary.avg_risk_score)?.toFixed(1) ?? "—"}</div>
              <p className="text-xs text-zinc-500">out of 100</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-0.5 h-6 rounded overflow-hidden">
                {["low", "medium", "high", "critical"].map((level) => {
                  const count = safeNumberOrZero(summary.risk_distribution?.[level]);
                  const totalProjects = safeNumberOrZero(summary.total_projects);
                  const percent = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
                  const colors: Record<string, string> = {
                    low: "bg-green-500",
                    medium: "bg-yellow-500",
                    high: "bg-orange-500",
                    critical: "bg-red-500",
                  };
                  return (
                    <div
                      key={level}
                      className={`${colors[level]} h-full transition-all`}
                      style={{ width: `${percent}%` }}
                      title={`${level}: ${count} projects`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>Low: {safeNumberOrZero(summary.risk_distribution?.low)}</span>
                <span>High: {safeNumberOrZero(summary.risk_distribution?.high) + safeNumberOrZero(summary.risk_distribution?.critical)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid - 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* $/kW by Fuel Type */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">$/kW by Fuel Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelCostChartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#888"
                    tick={{ fill: "#888", fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#888"
                    tick={{ fill: "#fff", fontSize: 12 }}
                    width={75}
                  />
                  <Tooltip content={<CustomTooltip valueLabel="Avg $/kW" />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {fuelCostChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Fuel Type */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Projects by Fuel Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelCountChartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#888"
                    tick={{ fill: "#888", fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#888"
                    tick={{ fill: "#fff", fontSize: 12 }}
                    width={75}
                  />
                  <Tooltip content={<CustomTooltip valueLabel="Projects" />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {fuelCountChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* $/kW by Utility (TO) */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">$/kW by Transmission Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilityCostChartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#888"
                    tick={{ fill: "#888", fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#888"
                    tick={{ fill: "#fff", fontSize: 11 }}
                    width={95}
                  />
                  <Tooltip content={<CustomTooltip valueLabel="Avg $/kW" />} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Utility (TO) */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Projects by Transmission Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilityCountChartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#888"
                    tick={{ fill: "#888", fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#888"
                    tick={{ fill: "#fff", fontSize: 11 }}
                    width={95}
                  />
                  <Tooltip content={<CustomTooltip valueLabel="Projects" />} />
                  <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table Filters */}
      <Card className="mb-6 bg-zinc-900 border-zinc-800">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by project ID, developer, or utility..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Multi-select filters */}
            <MultiSelectFilter
              title="State"
              options={filterOptions?.states || []}
              selected={selectedStates}
              onChange={setSelectedStates}
              className="w-[140px]"
            />

            <MultiSelectFilter
              title="Utility"
              options={filterOptions?.utilities || []}
              selected={selectedUtilities}
              onChange={setSelectedUtilities}
              className="w-[160px]"
            />

            <MultiSelectFilter
              title="Fuel Type"
              options={filterOptions?.fuel_types || []}
              selected={selectedFuelTypes}
              onChange={setSelectedFuelTypes}
              className="w-[150px]"
            />
          </div>

          {/* Active filter badges */}
          {(selectedStates.length > 0 || selectedUtilities.length > 0 || selectedFuelTypes.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedStates.map((state) => (
                <Badge key={state} variant="secondary" className="gap-1">
                  {state}
                  <button onClick={() => setSelectedStates(selectedStates.filter((s) => s !== state))} className="ml-1 hover:text-red-400">×</button>
                </Badge>
              ))}
              {selectedUtilities.map((util) => (
                <Badge key={util} variant="secondary" className="gap-1">
                  {util.length > 15 ? util.substring(0, 15) + "..." : util}
                  <button onClick={() => setSelectedUtilities(selectedUtilities.filter((u) => u !== util))} className="ml-1 hover:text-red-400">×</button>
                </Badge>
              ))}
              {selectedFuelTypes.map((fuel) => (
                <Badge key={fuel} variant="secondary" className="gap-1">
                  {fuel}
                  <button onClick={() => setSelectedFuelTypes(selectedFuelTypes.filter((f) => f !== fuel))} className="ml-1 hover:text-red-400">×</button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-zinc-400 hover:text-white"
                onClick={() => {
                  setSelectedStates([]);
                  setSelectedUtilities([]);
                  setSelectedFuelTypes([]);
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {searchQuery.length >= 2
              ? `Search Results (${filteredProjects.length})`
              : `All Projects (${filteredProjects.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !searchQuery ? (
            <div className="text-center py-8 text-zinc-500">Loading projects...</div>
          ) : (
            <div ref={tableContainerRef} className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableHead className="w-[100px] sticky left-0 bg-zinc-900 z-10">Project ID</TableHead>
                    <TableHead className="min-w-[200px]">Developer</TableHead>
                    <TableHead className="min-w-[80px]">State</TableHead>
                    <TableHead className="min-w-[150px]">Utility</TableHead>
                    <TableHead className="min-w-[100px]">Fuel Type</TableHead>
                    <TableHead
                      className="text-right min-w-[80px] cursor-pointer hover:text-white"
                      onClick={() => handleSort("mw_capacity")}
                    >
                      <span className="flex items-center justify-end">
                        MW
                        <SortIndicator field="mw_capacity" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="text-right min-w-[100px] cursor-pointer hover:text-white"
                      onClick={() => handleSort("cost_per_kw")}
                    >
                      <span className="flex items-center justify-end">
                        $/kW
                        <SortIndicator field="cost_per_kw" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="text-right min-w-[100px] cursor-pointer hover:text-white"
                      onClick={() => handleSort("total_cost")}
                    >
                      <span className="flex items-center justify-end">
                        Total Cost
                        <SortIndicator field="total_cost" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="text-center min-w-[80px] cursor-pointer hover:text-white"
                      onClick={() => handleSort("risk_score_overall")}
                    >
                      <span className="flex items-center justify-center">
                        Risk
                        <SortIndicator field="risk_score_overall" />
                      </span>
                    </TableHead>
                    <TableHead className="text-center min-w-[60px]">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.project_id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="sticky left-0 bg-zinc-900 z-10 font-medium">
                        <Link
                          href={`/cluster/${project.project_id}`}
                          className="text-primary hover:underline"
                        >
                          {project.project_id}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{project.developer || "—"}</TableCell>
                      <TableCell>{project.state || "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{project.utility || "—"}</TableCell>
                      <TableCell>
                        {project.fuel_type ? (
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: FUEL_COLORS[project.fuel_type] || "#9CA3AF",
                              color: FUEL_COLORS[project.fuel_type] || "#9CA3AF",
                            }}
                          >
                            {project.fuel_type}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatMW(project.mw_capacity)}</TableCell>
                      <TableCell className="text-right">
                        {safeNumber(project.cost_per_kw) !== null
                          ? `$${safeNumber(project.cost_per_kw)!.toFixed(0)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(project.total_cost)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`${getRiskColor(project.risk_score_overall)} text-white`}
                        >
                          {getRiskLabel(project.risk_score_overall)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/cluster/${project.project_id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-zinc-500">
                        {searchQuery.length >= 2 && !isSearching
                          ? "No matching projects found"
                          : "No projects available"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, TrendingUp, DollarSign, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
  ComposedChart,
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
  if (num === null) return "bg-gray-200";
  if (num < 25) return "bg-green-500";
  if (num < 50) return "bg-yellow-500";
  if (num < 75) return "bg-orange-500";
  return "bg-red-500";
}

function getRiskLabel(score: unknown): string {
  const num = safeNumber(score);
  if (num === null) return "Unknown";
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
  "Solar + Storage": "#F97316",
  Hybrid: "#EC4899",
  Gas: "#6B7280",
  Other: "#94A3B8",
};

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"];

export default function ClusterPage() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null);
  const [projects, setProjects] = useState<ClusterProject[]>([]);
  const [filterOptions, setFilterOptions] = useState<ClusterFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClusterProject[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cluster selection (for future multi-cluster support)
  const [selectedISO, setSelectedISO] = useState("PJM");
  const [selectedCluster, setSelectedCluster] = useState("TC2");
  const [selectedPhase, setSelectedPhase] = useState("PHASE_1");

  // Chart data
  const [costDistribution, setCostDistribution] = useState<{ bins: string[]; counts: number[] } | null>(null);
  const [riskBreakdown, setRiskBreakdown] = useState<{ cost: number; concentration: number; dependency: number; timeline: number; overall: number } | null>(null);
  const [fuelTypeStats, setFuelTypeStats] = useState<{ fuel_type: string; count: number; total_mw: number; avg_cost_per_kw: number }[]>([]);
  const [utilityStats, setUtilityStats] = useState<{ utility: string; count: number; total_mw: number; avg_risk: number }[]>([]);

  // Filters
  const [sortBy, setSortBy] = useState("cost_rank");
  const [sortOrder, setSortOrder] = useState("asc");
  const [utilityFilter, setUtilityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  // Table scroll ref
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const cluster = selectedCluster;
  const phase = selectedPhase;

  // Load initial data and charts
  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, filterData, costDist, riskData, fuelData, utilData] = await Promise.all([
          getClusterSummary(cluster, phase),
          getClusterFilterOptions(cluster, phase),
          getCostDistribution(cluster, phase),
          getRiskBreakdown(cluster, phase),
          getClusterStatsByFuelType(cluster, phase),
          getClusterStatsByUtility(cluster, phase),
        ]);
        setSummary(summaryData);
        setFilterOptions(filterData);
        setCostDistribution(costDist);
        setRiskBreakdown(riskData);
        setFuelTypeStats(fuelData);
        setUtilityStats(utilData);
      } catch (error) {
        console.error("Failed to load cluster data:", error);
      }
    }
    loadData();
  }, [cluster, phase]);

  // Load projects when filters change
  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const data = await getClusterProjects({
          cluster,
          phase,
          utility: utilityFilter || undefined,
          state: stateFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          limit: 500, // Load all projects for full table
        });
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [cluster, phase, sortBy, sortOrder, utilityFilter, stateFilter]);

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

  const displayProjects = searchQuery.length >= 2 ? searchResults : projects;

  // Table scroll handlers
  const scrollTable = (direction: "left" | "right") => {
    if (tableContainerRef.current) {
      const scrollAmount = 300;
      tableContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Prepare chart data
  const costChartData = costDistribution?.bins.map((bin, i) => ({
    bin,
    count: costDistribution.counts[i],
  })).filter(d => d.count > 0).slice(0, 15) || [];

  const fuelPieData = fuelTypeStats.map((f) => ({
    name: f.fuel_type,
    value: f.count,
    mw: f.total_mw,
  }));

  const riskRadarData = riskBreakdown
    ? [
        { subject: "Cost", value: riskBreakdown.cost, fullMark: 100 },
        { subject: "Concentration", value: riskBreakdown.concentration, fullMark: 100 },
        { subject: "Dependency", value: riskBreakdown.dependency, fullMark: 100 },
        { subject: "Timeline", value: riskBreakdown.timeline, fullMark: 100 },
      ]
    : [];

  const utilityBarData = utilityStats.slice(0, 10).map((u) => ({
    name: u.utility.length > 15 ? u.utility.substring(0, 15) + "..." : u.utility,
    fullName: u.utility,
    projects: u.count,
    mw: Math.round(u.total_mw),
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with Cluster Selection */}
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

        {/* ISO / Cluster / Phase Selection */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={selectedISO} onValueChange={setSelectedISO}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select ISO" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PJM">PJM</SelectItem>
              <SelectItem value="MISO" disabled>
                MISO (Coming Soon)
              </SelectItem>
              <SelectItem value="CAISO" disabled>
                CAISO (Coming Soon)
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCluster} onValueChange={setSelectedCluster}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TC2">TC2 (2024)</SelectItem>
              <SelectItem value="TC1" disabled>
                TC1 (Coming Soon)
              </SelectItem>
              <SelectItem value="Cycle1" disabled>
                Cycle 1 (Coming Soon)
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPhase} onValueChange={setSelectedPhase}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PHASE_1">Phase 1 (SIS)</SelectItem>
              <SelectItem value="PHASE_2" disabled>
                Phase 2 (Coming Soon)
              </SelectItem>
              <SelectItem value="PHASE_3" disabled>
                Phase 3 (Coming Soon)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {summary?.total_projects || 0} Projects
          </Badge>
          <Badge variant="outline" className="gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(summary?.total_cost || 0)} Total Cost
          </Badge>
          <Badge variant="secondary">{selectedPhase === "PHASE_1" ? "Phase 1 SIS Results" : selectedPhase}</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_projects}</div>
              <p className="text-xs text-muted-foreground">{formatMW(summary.total_mw)} capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost Allocated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_cost)}</div>
              <p className="text-xs text-muted-foreground">Avg: {formatCurrency(summary.avg_cost_per_kw)}/kW</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeNumber(summary.avg_risk_score)?.toFixed(1) ?? "—"}</div>
              <p className="text-xs text-muted-foreground">out of 100</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 h-6">
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
                      className={`${colors[level]} h-full`}
                      style={{ width: `${percent}%` }}
                      title={`${level}: ${count} projects`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low: {safeNumberOrZero(summary.risk_distribution?.low)}</span>
                <span>High: {safeNumberOrZero(summary.risk_distribution?.high) + safeNumberOrZero(summary.risk_distribution?.critical)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Cost Distribution Histogram with Average Line */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Cost Distribution ($/kW)</span>
              {summary?.avg_cost_per_kw && (
                <span className="text-sm font-normal text-muted-foreground">
                  Avg: <span className="text-orange-500 font-medium">${safeNumber(summary.avg_cost_per_kw)?.toFixed(0)}/kW</span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={costChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="bin" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} projects`, "Count"]}
                    labelFormatter={(label) => `Cost Range: ${label}`}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Projects" />
                  {summary?.avg_cost_per_kw && (
                    <ReferenceLine
                      x={(() => {
                        const avgCost = safeNumber(summary.avg_cost_per_kw) || 0;
                        const binIndex = Math.floor(avgCost / 100);
                        return costChartData[binIndex]?.bin || costChartData[0]?.bin;
                      })()}
                      stroke="#F97316"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        value: "Avg",
                        position: "top",
                        fill: "#F97316",
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects by Fuel Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuelPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {fuelPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={FUEL_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} projects (${formatMW(props.payload.mw)})`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Risk Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskRadarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Risk Score" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Utility Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Utilities by Project Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilityBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip
                    formatter={(value, name, props) => [
                      name === "projects" ? `${value} projects` : `${value} MW`,
                      props.payload.fullName,
                    ]}
                  />
                  <Bar dataKey="projects" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by project ID, developer, or utility..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <Select value={utilityFilter || "all"} onValueChange={(v) => setUtilityFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Utilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Utilities</SelectItem>
                {filterOptions?.utilities.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stateFilter || "all"} onValueChange={(v) => setStateFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {filterOptions?.states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(v) => {
                const [field, order] = v.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost_rank-asc">Cost Rank (Low to High)</SelectItem>
                <SelectItem value="cost_rank-desc">Cost Rank (High to Low)</SelectItem>
                <SelectItem value="risk_score_overall-desc">Risk (High to Low)</SelectItem>
                <SelectItem value="risk_score_overall-asc">Risk (Low to High)</SelectItem>
                <SelectItem value="total_cost-desc">Total Cost (High to Low)</SelectItem>
                <SelectItem value="mw_capacity-desc">Capacity (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table with Horizontal Scroll */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {searchQuery.length >= 2 ? `Search Results (${searchResults.length})` : `All Projects (${projects.length})`}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => scrollTable("left")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scrollTable("right")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
          ) : (
            <div ref={tableContainerRef} className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] sticky left-0 bg-background z-10">Project ID</TableHead>
                    <TableHead className="min-w-[200px]">Developer</TableHead>
                    <TableHead className="min-w-[150px]">Utility</TableHead>
                    <TableHead className="min-w-[80px]">State</TableHead>
                    <TableHead className="min-w-[100px]">Fuel Type</TableHead>
                    <TableHead className="text-right min-w-[80px]">MW</TableHead>
                    <TableHead className="text-right min-w-[100px]">Total Cost</TableHead>
                    <TableHead className="text-right min-w-[80px]">$/kW</TableHead>
                    <TableHead className="text-center min-w-[80px]">Risk</TableHead>
                    <TableHead className="text-center min-w-[80px]">Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayProjects.map((project) => (
                    <TableRow key={project.project_id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="sticky left-0 bg-background z-10">
                        <Link href={`/cluster/${project.project_id}`} className="font-medium text-blue-600 hover:underline">
                          {project.project_id}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{project.developer || "—"}</TableCell>
                      <TableCell>{project.utility || "—"}</TableCell>
                      <TableCell>{project.state || "—"}</TableCell>
                      <TableCell>{project.fuel_type || "—"}</TableCell>
                      <TableCell className="text-right">{formatMW(project.mw_capacity)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(project.total_cost)}</TableCell>
                      <TableCell className="text-right">
                        {safeNumber(project.cost_per_kw) !== null ? `$${safeNumber(project.cost_per_kw)!.toFixed(0)}` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={`${getRiskColor(project.risk_score_overall)} text-white`}>
                          {getRiskLabel(project.risk_score_overall)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{project.cost_rank ? `#${project.cost_rank}` : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {displayProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {searchQuery.length >= 2 && !isSearching ? "No matching projects found" : "No projects available"}
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

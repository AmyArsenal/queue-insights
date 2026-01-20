"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Search, TrendingUp, DollarSign, Zap } from "lucide-react";
import Link from "next/link";
import {
  getClusterSummary,
  getClusterProjects,
  getClusterFilterOptions,
  searchClusterProjects,
  type ClusterSummary,
  type ClusterProject,
  type ClusterFilterOptions,
} from "@/lib/api";

function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
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

export default function ClusterPage() {
  const [summary, setSummary] = useState<ClusterSummary | null>(null);
  const [projects, setProjects] = useState<ClusterProject[]>([]);
  const [filterOptions, setFilterOptions] = useState<ClusterFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClusterProject[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState("cost_rank");
  const [sortOrder, setSortOrder] = useState("asc");
  const [utilityFilter, setUtilityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const cluster = "TC2";
  const phase = "PHASE_1";

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, filterData] = await Promise.all([
          getClusterSummary(cluster, phase),
          getClusterFilterOptions(cluster, phase),
        ]);
        setSummary(summaryData);
        setFilterOptions(filterData);
      } catch (error) {
        console.error("Failed to load cluster data:", error);
      }
    }
    loadData();
  }, []);

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
          limit: 50,
        });
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [sortBy, sortOrder, utilityFilter, stateFilter]);

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
        // Convert search results to ClusterProject format
        setSearchResults(results.map((r) => ({
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
        })));
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const displayProjects = searchQuery.length >= 2 ? searchResults : projects;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-400">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">PJM Cluster Study Analyzer</h1>
            <p className="text-muted-foreground">
              TC2 Phase 1 Cost Allocation Analysis
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {summary?.total_projects || 0} Projects
          </Badge>
          <Badge variant="outline" className="gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(summary?.total_cost || 0)} Total Cost
          </Badge>
          <Badge variant="secondary">Phase 1 SIS Results</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_projects}</div>
              <p className="text-xs text-muted-foreground">
                {formatMW(summary.total_mw)} capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cost Allocated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.total_cost)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(summary.avg_cost_per_kw)}/kW
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Risk Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {safeNumber(summary.avg_risk_score)?.toFixed(1) ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                out of 100
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Risk Distribution
              </CardTitle>
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

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {searchQuery.length >= 2
              ? `Search Results (${searchResults.length})`
              : `Projects (${projects.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading projects...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Project ID</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Utility</TableHead>
                  <TableHead className="text-right">MW</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">$/kW</TableHead>
                  <TableHead className="text-center">Risk</TableHead>
                  <TableHead className="text-center">Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayProjects.map((project) => (
                  <TableRow key={project.project_id}>
                    <TableCell>
                      <Link
                        href={`/cluster/${project.project_id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {project.project_id}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {project.developer || "—"}
                    </TableCell>
                    <TableCell>{project.utility || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatMW(project.mw_capacity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(project.total_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {safeNumber(project.cost_per_kw) !== null
                        ? `$${safeNumber(project.cost_per_kw)!.toFixed(0)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`${getRiskColor(project.risk_score_overall)} text-white`}
                      >
                        {getRiskLabel(project.risk_score_overall)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {project.cost_rank ? `#${project.cost_rank}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {displayProjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchQuery.length >= 2 && !isSearching
                        ? "No matching projects found"
                        : "No projects available"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

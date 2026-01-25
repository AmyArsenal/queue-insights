"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  DollarSign,
  Zap,
  Building,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { getClusterProjectDashboard, type ProjectDashboard } from "@/lib/api";

// Fuel type colors matching design tokens
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

function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

function safeNumberOrZero(value: unknown): number {
  const num = safeNumber(value);
  return num === null ? 0 : num;
}

function formatCurrency(value: unknown): string {
  const num = safeNumber(value);
  if (num === null) return "—";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
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

function getRiskBgClass(score: unknown): string {
  const num = safeNumber(score);
  if (num === null) return "bg-zinc-800";
  if (num < 25) return "bg-green-500/20";
  if (num < 50) return "bg-yellow-500/20";
  if (num < 75) return "bg-orange-500/20";
  return "bg-red-500/20";
}

// Risk meter component
function RiskMeter({ score, label }: { score: unknown; label: string }) {
  const displayScore = safeNumberOrZero(score);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-medium text-white">
          {safeNumber(score)?.toFixed(0) ?? "—"}
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${getRiskColor(score)}`}
          style={{ width: `${Math.min(displayScore, 100)}%` }}
        />
      </div>
    </div>
  );
}

// Percentile bar component
function PercentileBar({
  label,
  percentile,
  color = "primary",
}: {
  label: string;
  percentile: number | null;
  color?: string;
}) {
  const displayValue = percentile ?? 0;
  const colorClass =
    color === "primary"
      ? "bg-primary"
      : color === "amber"
      ? "bg-amber-500"
      : color === "teal"
      ? "bg-teal-500"
      : "bg-blue-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-medium text-white">
          {percentile !== null ? `${(percentile * 100).toFixed(0)}%` : "—"}
        </span>
      </div>
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${colorClass} rounded-full`}
          style={{ width: `${displayValue * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [project, setProject] = useState<ProjectDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        const data = await getClusterProjectDashboard(projectId);
        setProject(data);
      } catch (err) {
        setError("Failed to load project data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 text-zinc-500">
          Loading project data...
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 text-red-500">
          {error || "Project not found"}
        </div>
        <div className="text-center">
          <Link href="/cluster">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Categorize upgrades
  const costAllocatedUpgrades = project.upgrades.filter(
    (u) => u.link_type === "COST_ALLOCATED"
  );
  const contingentUpgrades = project.upgrades.filter(
    (u) => u.link_type === "CONTINGENT" || u.link_type === "TAGGED_NO_COST"
  );

  // PJM report URL
  const pjmReportUrl =
    project.report_url ||
    `https://www.pjm.com/planning/services-requests/interconnection-queues.aspx`;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/cluster"
        className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.project_id}</h1>
          <p className="text-zinc-400">
            {project.cluster_name} {project.phase} |{" "}
            {project.developer || "Unknown Developer"}
          </p>
        </div>
        <div className="flex gap-2 mt-3 md:mt-0">
          <Badge
            variant="secondary"
            className={`${getRiskColor(project.risk_score_overall)} text-white`}
          >
            {getRiskLabel(project.risk_score_overall)} Risk
          </Badge>
          {project.cost_rank && (
            <Badge variant="outline" className="border-zinc-700">
              Rank #{project.cost_rank} of {project.cluster_total_projects}
            </Badge>
          )}
          <a href={pjmReportUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-zinc-700">
              <ExternalLink className="mr-1 h-4 w-4" /> PJM Report
            </Button>
          </a>
        </div>
      </div>

      {/* Top Section: 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Column 1: Project Details */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-zinc-400" /> Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Project ID</span>
              <span className="font-medium">{project.project_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Developer</span>
              <span className="font-medium truncate ml-4 max-w-[180px]">
                {project.developer || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Location</span>
              <span className="font-medium">
                {project.county ? `${project.county}, ` : ""}
                {project.state || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Utility (TO)</span>
              <span className="font-medium">{project.utility || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Fuel Type</span>
              <Badge
                variant="outline"
                style={{
                  borderColor: FUEL_COLORS[project.fuel_type || "Other"],
                  color: FUEL_COLORS[project.fuel_type || "Other"],
                }}
              >
                {project.fuel_type || "—"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Capacity</span>
              <span className="font-medium">{formatMW(project.mw_capacity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Status</span>
              <span className="font-medium">{project.project_status || "Active"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Cost Breakdown */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-zinc-400" /> Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Cost */}
            <div className="text-center pb-3 border-b border-zinc-800">
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(project.total_cost)}
              </div>
              <div className="text-sm text-zinc-400">Total Cost</div>
              {safeNumber(project.cost_per_kw) !== null && (
                <div className="text-lg font-medium mt-1">
                  ${safeNumber(project.cost_per_kw)!.toFixed(0)}/kW
                </div>
              )}
            </div>

            {/* Cost Components */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">TOIF</span>
                <span className="font-medium">{formatCurrency(project.toif_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Network Upgrades</span>
                <span className="font-medium">
                  {formatCurrency(project.network_upgrade_cost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">System Reliability</span>
                <span className="font-medium">
                  {formatCurrency(project.system_reliability_cost)}
                </span>
              </div>
            </div>

            {/* Readiness Deposits */}
            <div className="pt-3 border-t border-zinc-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">RD1</span>
                <span className="font-medium text-green-400">
                  {formatCurrency(project.rd1_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">RD2</span>
                <span className="font-medium text-amber-400">
                  {formatCurrency(project.rd2_amount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column 3: Position vs Peers */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-zinc-400" /> Position vs Peers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cost Percentiles */}
            <div className="space-y-3">
              <PercentileBar
                label="Overall Percentile"
                percentile={safeNumber(project.cost_percentile)}
                color="primary"
              />
              {/* These would need additional API data */}
              {/* <PercentileBar
                label="vs Fuel Type"
                percentile={project.cost_percentile_fuel}
                color="amber"
              />
              <PercentileBar
                label="vs State"
                percentile={project.cost_percentile_state}
                color="teal"
              /> */}
            </div>

            {/* Risk Score */}
            <div className="pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Risk Score</span>
                <span className="text-lg font-bold">
                  {safeNumber(project.risk_score_overall)?.toFixed(0) ?? "—"}/100
                </span>
              </div>
              <div
                className={`p-3 rounded-lg ${getRiskBgClass(
                  project.risk_score_overall
                )}`}
              >
                <div className="space-y-2">
                  <RiskMeter score={project.risk_score_cost} label="Cost (35%)" />
                  <RiskMeter
                    score={project.risk_score_concentration}
                    label="Concentration (25%)"
                  />
                  <RiskMeter
                    score={project.risk_score_dependency}
                    label="Dependency (25%)"
                  />
                  <RiskMeter
                    score={project.risk_score_timeline}
                    label="Timeline (15%)"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Upgrades Table */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-4 w-4 text-zinc-400" /> Network Upgrades
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {costAllocatedUpgrades.length} cost-allocated,{" "}
            {contingentUpgrades.length} contingent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {costAllocatedUpgrades.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableHead className="w-[100px]">RTEP ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Your Share</TableHead>
                    <TableHead className="text-right">% Share</TableHead>
                    <TableHead className="text-center">Shared By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costAllocatedUpgrades.slice(0, 15).map((upgrade) => (
                    <TableRow
                      key={upgrade.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell className="font-medium">
                        {upgrade.upgrade_rtep_id || "—"}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {upgrade.upgrade_title || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(upgrade.upgrade_total_cost)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(upgrade.allocated_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {safeNumber(upgrade.percent_allocation) !== null
                          ? `${(safeNumber(upgrade.percent_allocation)! * 100).toFixed(1)}%`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {upgrade.shared_by_count || 1}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {costAllocatedUpgrades.length > 15 && (
                <div className="text-center py-3 text-sm text-zinc-500">
                  +{costAllocatedUpgrades.length - 15} more upgrades
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              No cost-allocated upgrades
            </div>
          )}

          {/* Contingent Upgrades */}
          {contingentUpgrades.length > 0 && (
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Contingent Upgrades (Timeline Risk)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {contingentUpgrades.slice(0, 6).map((upgrade) => (
                  <div
                    key={upgrade.id}
                    className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                  >
                    <div className="font-medium text-sm">
                      {upgrade.upgrade_rtep_id || "—"}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {upgrade.upgrade_title || "—"}
                    </div>
                  </div>
                ))}
                {contingentUpgrades.length > 6 && (
                  <div className="p-3 bg-zinc-800 rounded-lg flex items-center justify-center text-sm text-zinc-400">
                    +{contingentUpgrades.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Sharing Upgrades */}
      {project.codependent_projects.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-400" /> Projects Sharing Your
              Upgrades
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {project.codependent_projects.length} projects share network upgrades
              with this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.codependent_projects.slice(0, 30).map((pid) => (
                <Link key={pid} href={`/cluster/${pid}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-zinc-800 border-zinc-700 transition-colors"
                  >
                    {pid}
                  </Badge>
                </Link>
              ))}
              {project.codependent_projects.length > 30 && (
                <Badge variant="secondary" className="bg-zinc-800">
                  +{project.codependent_projects.length - 30} more
                </Badge>
              )}
            </div>

            {/* Risk Dependencies Note */}
            <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg text-sm text-zinc-400">
              <strong className="text-zinc-300">Why this matters:</strong> If a
              high-$/kW project withdraws, their upgrade costs may redistribute
              to remaining projects sharing those upgrades.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

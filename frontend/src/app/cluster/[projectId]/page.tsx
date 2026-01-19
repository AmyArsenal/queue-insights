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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  DollarSign,
  Zap,
  Building,
  MapPin,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getClusterProjectDashboard, type ProjectDashboard } from "@/lib/api";

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatMW(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(0)} MW`;
}

function getRiskColor(score: number | null): string {
  if (score === null) return "bg-gray-300";
  if (score < 25) return "bg-green-500";
  if (score < 50) return "bg-yellow-500";
  if (score < 75) return "bg-orange-500";
  return "bg-red-500";
}

function getRiskLabel(score: number | null): string {
  if (score === null) return "Unknown";
  if (score < 25) return "Low";
  if (score < 50) return "Medium";
  if (score < 75) return "High";
  return "Critical";
}

function RiskMeter({ score, label }: { score: number | null; label: string }) {
  const displayScore = score ?? 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score?.toFixed(0) ?? "—"}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${getRiskColor(score)}`}
          style={{ width: `${Math.min(displayScore, 100)}%` }}
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
        <div className="text-center py-12 text-muted-foreground">
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

  // Calculate cost allocation upgrades vs tagged-no-cost
  const costAllocatedUpgrades = project.upgrades.filter(
    (u) => u.link_type === "COST_ALLOCATED"
  );
  const taggedNoCostUpgrades = project.upgrades.filter(
    (u) => u.link_type === "TAGGED_NO_COST"
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back link */}
      <Link href="/cluster" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.project_id}</h1>
          <p className="text-muted-foreground">
            {project.cluster_name} {project.phase} | {project.developer || "Unknown Developer"}
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
            <Badge variant="outline">
              Rank #{project.cost_rank} of {project.cluster_total_projects}
            </Badge>
          )}
          {project.report_url && (
            <a href={project.report_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1 h-4 w-4" /> PJM Report
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Project Info & Risk */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-4 w-4" /> Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Developer</span>
                <span className="font-medium">{project.developer || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Utility</span>
                <span className="font-medium">{project.utility || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">
                  {project.county ? `${project.county}, ` : ""}
                  {project.state || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Type</span>
                <span className="font-medium">{project.fuel_type || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium">{formatMW(project.mw_capacity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{project.project_status || "Active"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Risk Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Risk Score
              </CardTitle>
              <CardDescription>
                Overall: {project.risk_score_overall?.toFixed(1) ?? "—"}/100
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RiskMeter score={project.risk_score_cost} label="Cost (35%)" />
              <RiskMeter score={project.risk_score_concentration} label="Concentration (25%)" />
              <RiskMeter score={project.risk_score_dependency} label="Dependency (25%)" />
              <RiskMeter score={project.risk_score_timeline} label="Overloads (15%)" />
            </CardContent>
          </Card>

          {/* Co-dependent Projects */}
          {project.codependent_projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" /> Co-dependent Projects
                </CardTitle>
                <CardDescription>
                  {project.codependent_projects.length} projects share upgrades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.codependent_projects.slice(0, 20).map((pid) => (
                    <Link key={pid} href={`/cluster/${pid}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                        {pid}
                      </Badge>
                    </Link>
                  ))}
                  {project.codependent_projects.length > 20 && (
                    <Badge variant="secondary">
                      +{project.codependent_projects.length - 20} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle Column: Cost Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center pb-4 border-b">
                <div className="text-4xl font-bold text-blue-600">
                  {formatCurrency(project.total_cost)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Allocated Cost
                </div>
                {project.cost_per_kw && (
                  <div className="text-lg mt-1">
                    ${project.cost_per_kw.toFixed(0)}/kW
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Upgrades</span>
                  <span className="font-medium">
                    {formatCurrency(project.network_upgrade_cost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TOIF</span>
                  <span className="font-medium">
                    {formatCurrency(project.toif_cost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Reliability</span>
                  <span className="font-medium">
                    {formatCurrency(project.system_reliability_cost)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RD1 (Paid)</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(project.rd1_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RD2 (Due at DP1)</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(project.rd2_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Percentile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{
                        width: `${project.cost_percentile ?? 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm font-medium w-20 text-right">
                  {project.cost_percentile?.toFixed(0)}th percentile
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Lower cost than {(100 - (project.cost_percentile ?? 0)).toFixed(0)}% of projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Upgrades */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4" /> Network Upgrades
              </CardTitle>
              <CardDescription>
                {costAllocatedUpgrades.length} cost-allocated, {taggedNoCostUpgrades.length} tagged
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Cost Allocated Upgrades */}
              {costAllocatedUpgrades.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Cost Allocated</h4>
                  <div className="space-y-2">
                    {costAllocatedUpgrades.slice(0, 10).map((upgrade) => (
                      <div
                        key={upgrade.id}
                        className="p-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {upgrade.upgrade_rtep_id || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {upgrade.upgrade_title || "No description"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-blue-600">
                              {formatCurrency(upgrade.allocated_cost)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {upgrade.percent_allocation
                                ? `${(upgrade.percent_allocation * 100).toFixed(1)}%`
                                : "—"}
                            </div>
                          </div>
                        </div>
                        {upgrade.shared_by_count && upgrade.shared_by_count > 1 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Shared by {upgrade.shared_by_count} projects
                          </div>
                        )}
                      </div>
                    ))}
                    {costAllocatedUpgrades.length > 10 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{costAllocatedUpgrades.length - 10} more upgrades
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tagged No Cost */}
              {taggedNoCostUpgrades.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    Tagged (No Cost) - Timeline Risk
                  </h4>
                  <div className="space-y-2">
                    {taggedNoCostUpgrades.slice(0, 5).map((upgrade) => (
                      <div
                        key={upgrade.id}
                        className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm"
                      >
                        <div className="font-medium">
                          {upgrade.upgrade_rtep_id || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {upgrade.upgrade_title || "No description"}
                        </div>
                      </div>
                    ))}
                    {taggedNoCostUpgrades.length > 5 && (
                      <div className="text-center text-sm text-muted-foreground">
                        +{taggedNoCostUpgrades.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {project.upgrades.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No upgrades allocated
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, use, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Trash2,
  ExternalLink,
  FolderOpen,
  DollarSign,
  Zap,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  getPortfolio,
  removeProjectFromPortfolio,
  type Portfolio,
} from "@/lib/portfolio-store";
import { getClusterProjects, type ClusterProject } from "@/lib/api";
import { CreatePortfolioModal } from "@/components/portfolio/create-portfolio-modal";
import { updatePortfolio, getPortfolios } from "@/lib/portfolio-store";

// Fuel type colors
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

export default function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [allProjects, setAllProjects] = useState<ClusterProject[]>([]);
  const [portfolioProjects, setPortfolioProjects] = useState<ClusterProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load portfolio and projects
  useEffect(() => {
    async function loadData() {
      try {
        const loadedPortfolio = getPortfolio(id);
        setPortfolio(loadedPortfolio);

        if (loadedPortfolio) {
          const loadedProjects = await getClusterProjects({
            cluster: "TC2",
            phase: "PHASE_1",
            limit: 500,
          });
          setAllProjects(loadedProjects);

          // Filter to portfolio projects
          const projectsMap = new Map(loadedProjects.map((p) => [p.project_id, p]));
          const filtered = loadedPortfolio.projectIds
            .map((pid) => projectsMap.get(pid))
            .filter((p): p is ClusterProject => p !== undefined);
          setPortfolioProjects(filtered);
        }
      } catch (error) {
        console.error("Failed to load portfolio:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Calculate aggregated metrics
  const stats = useCallback(() => {
    if (portfolioProjects.length === 0) {
      return {
        totalProjects: 0,
        totalMw: 0,
        avgCostPerKw: 0,
        totalCost: 0,
        avgRiskScore: 0,
      };
    }

    const totalMw = portfolioProjects.reduce(
      (sum, p) => sum + (p.mw_capacity || 0),
      0
    );
    const totalCost = portfolioProjects.reduce(
      (sum, p) => sum + (p.total_cost || 0),
      0
    );
    const costPerKwValues = portfolioProjects
      .filter((p) => p.cost_per_kw !== null && p.cost_per_kw > 0)
      .map((p) => p.cost_per_kw!);
    const avgCostPerKw =
      costPerKwValues.length > 0
        ? costPerKwValues.reduce((a, b) => a + b, 0) / costPerKwValues.length
        : 0;
    const riskValues = portfolioProjects
      .filter((p) => p.risk_score_overall !== null)
      .map((p) => p.risk_score_overall!);
    const avgRiskScore =
      riskValues.length > 0
        ? riskValues.reduce((a, b) => a + b, 0) / riskValues.length
        : 0;

    return {
      totalProjects: portfolioProjects.length,
      totalMw,
      avgCostPerKw,
      totalCost,
      avgRiskScore,
    };
  }, [portfolioProjects]);

  // Remove project from portfolio
  const handleRemoveProject = (projectId: string) => {
    if (portfolio) {
      removeProjectFromPortfolio(portfolio.id, projectId);
      setPortfolio(getPortfolio(portfolio.id));
      setPortfolioProjects((prev) =>
        prev.filter((p) => p.project_id !== projectId)
      );
    }
  };

  // Handle add projects
  const handleAddProjects = (name: string, projectIds: string[]) => {
    if (portfolio) {
      updatePortfolio(portfolio.id, { name, projectIds });
      setPortfolio(getPortfolio(portfolio.id));

      // Update projects list
      const projectsMap = new Map(allProjects.map((p) => [p.project_id, p]));
      const filtered = projectIds
        .map((pid) => projectsMap.get(pid))
        .filter((p): p is ClusterProject => p !== undefined);
      setPortfolioProjects(filtered);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Portfolio not found</p>
          <Link href="/portfolio">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Portfolios
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const metrics = stats();

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/portfolio"
        className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Portfolios
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-400">
            <FolderOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{portfolio.name}</h1>
            <p className="text-zinc-400">{portfolio.projectIds.length} projects</p>
          </div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Projects
        </Button>
      </div>

      {/* Aggregated Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProjects}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total MW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalMw.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Avg $/kW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.avgCostPerKw.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalCost)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Avg Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avgRiskScore.toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-4 w-4 text-zinc-400" />
            Projects in Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {portfolioProjects.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No projects in this portfolio. Click &quot;Add Projects&quot; to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableHead className="w-[100px]">Project ID</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead className="text-right">MW</TableHead>
                    <TableHead className="text-right">$/kW</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-center">Risk</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioProjects.map((project) => (
                    <TableRow
                      key={project.project_id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/cluster/${project.project_id}`}
                          className="text-primary hover:underline"
                        >
                          {project.project_id}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {project.developer || "—"}
                      </TableCell>
                      <TableCell>
                        {project.fuel_type ? (
                          <Badge
                            variant="outline"
                            style={{
                              borderColor:
                                FUEL_COLORS[project.fuel_type] || "#9CA3AF",
                              color: FUEL_COLORS[project.fuel_type] || "#9CA3AF",
                            }}
                          >
                            {project.fuel_type}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {project.mw_capacity?.toFixed(0) || "—"} MW
                      </TableCell>
                      <TableCell className="text-right">
                        {project.cost_per_kw
                          ? `$${project.cost_per_kw.toFixed(0)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(project.total_cost)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`${getRiskColor(
                            project.risk_score_overall
                          )} text-white`}
                        >
                          {getRiskLabel(project.risk_score_overall)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Link href={`/cluster/${project.project_id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-red-400"
                            onClick={() =>
                              handleRemoveProject(project.project_id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Projects Modal */}
      <CreatePortfolioModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddProjects}
        editingPortfolio={portfolio}
        projects={allProjects}
      />
    </div>
  );
}

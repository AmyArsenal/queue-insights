"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FolderOpen } from "lucide-react";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { CreatePortfolioModal } from "@/components/portfolio/create-portfolio-modal";
import {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  type Portfolio,
} from "@/lib/portfolio-store";
import { getClusterProjects, type ClusterProject } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PortfolioStats {
  totalMw: number;
  avgCostPerKw: number;
  totalCost: number;
  avgRiskScore: number;
  rd1Total: number;
  rd2Total: number;
}

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [projects, setProjects] = useState<ClusterProject[]>([]);
  const [projectsMap, setProjectsMap] = useState<Map<string, ClusterProject>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [deletingPortfolio, setDeletingPortfolio] = useState<Portfolio | null>(null);

  // Load portfolios and projects
  useEffect(() => {
    async function loadData() {
      try {
        // Load portfolios from localStorage
        const loadedPortfolios = getPortfolios();
        setPortfolios(loadedPortfolios);

        // Load projects from API for stats calculation
        const loadedProjects = await getClusterProjects({
          cluster: "TC2",
          phase: "PHASE_1",
          limit: 500,
        });
        setProjects(loadedProjects);

        // Create a map for quick lookup
        const map = new Map<string, ClusterProject>();
        loadedProjects.forEach((p) => map.set(p.project_id, p));
        setProjectsMap(map);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate stats for a portfolio
  const calculateStats = useCallback(
    (portfolio: Portfolio): PortfolioStats | undefined => {
      if (projectsMap.size === 0) return undefined;

      const portfolioProjects = portfolio.projectIds
        .map((id) => projectsMap.get(id))
        .filter((p): p is ClusterProject => p !== undefined);

      if (portfolioProjects.length === 0) return undefined;

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

      // RD amounts would need additional API data - using 0 for now
      return {
        totalMw,
        avgCostPerKw,
        totalCost,
        avgRiskScore,
        rd1Total: 0,
        rd2Total: 0,
      };
    },
    [projectsMap]
  );

  // Handle create/update portfolio
  const handleSubmitPortfolio = (name: string, projectIds: string[]) => {
    if (editingPortfolio) {
      // Update existing
      updatePortfolio(editingPortfolio.id, { name, projectIds });
    } else {
      // Create new
      createPortfolio(name, projectIds);
    }
    // Refresh portfolios
    setPortfolios(getPortfolios());
    setEditingPortfolio(null);
  };

  // Handle edit
  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = (portfolio: Portfolio) => {
    setDeletingPortfolio(portfolio);
  };

  const confirmDelete = () => {
    if (deletingPortfolio) {
      deletePortfolio(deletingPortfolio.id);
      setPortfolios(getPortfolios());
      setDeletingPortfolio(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-400">
            <FolderOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Portfolios</h1>
            <p className="text-zinc-400">
              Track and compare groups of projects
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingPortfolio(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Portfolio
        </Button>
      </div>

      {/* Portfolio Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : portfolios.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">No portfolios yet</h3>
            <p className="text-zinc-400 text-center mb-4">
              Create a portfolio to group and track multiple projects together.
            </p>
            <Button
              onClick={() => {
                setEditingPortfolio(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              stats={calculateStats(portfolio)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreatePortfolioModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmitPortfolio}
        editingPortfolio={editingPortfolio}
        projects={projects}
        isLoading={isLoading}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingPortfolio}
        onOpenChange={() => setDeletingPortfolio(null)}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portfolio</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete &quot;{deletingPortfolio?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

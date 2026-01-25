"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Portfolio } from "@/lib/portfolio-store";

interface PortfolioCardProps {
  portfolio: Portfolio;
  stats?: {
    totalMw: number;
    avgCostPerKw: number;
    totalCost: number;
    avgRiskScore: number;
    rd1Total: number;
    rd2Total: number;
  };
  onEdit?: (portfolio: Portfolio) => void;
  onDelete?: (portfolio: Portfolio) => void;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function PortfolioCard({
  portfolio,
  stats,
  onEdit,
  onDelete,
}: PortfolioCardProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1">
          <CardTitle className="text-lg">{portfolio.name}</CardTitle>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="border-zinc-700">
              {portfolio.projectIds.length} Projects
            </Badge>
            {stats && (
              <Badge variant="secondary" className="bg-zinc-800">
                {stats.totalMw.toFixed(0)} MW
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={() => onEdit(portfolio)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-red-400"
              onClick={() => onDelete(portfolio)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-zinc-400">Avg $/kW</span>
              <div className="font-medium">${stats.avgCostPerKw.toFixed(0)}</div>
            </div>
            <div>
              <span className="text-zinc-400">Total Cost</span>
              <div className="font-medium">{formatCurrency(stats.totalCost)}</div>
            </div>
            <div>
              <span className="text-zinc-400">Avg Risk</span>
              <div className="font-medium">{stats.avgRiskScore.toFixed(0)}/100</div>
            </div>
            <div>
              <span className="text-zinc-400">RD1 + RD2</span>
              <div className="font-medium">
                {formatCurrency(stats.rd1Total + stats.rd2Total)}
              </div>
            </div>
          </div>
        )}

        {/* Project IDs preview */}
        <div className="flex flex-wrap gap-1 mb-4">
          {portfolio.projectIds.slice(0, 5).map((pid) => (
            <Badge key={pid} variant="outline" className="text-xs border-zinc-700">
              {pid}
            </Badge>
          ))}
          {portfolio.projectIds.length > 5 && (
            <Badge variant="secondary" className="text-xs bg-zinc-800">
              +{portfolio.projectIds.length - 5} more
            </Badge>
          )}
        </div>

        <Link href={`/portfolio/${portfolio.id}`}>
          <Button
            variant="outline"
            className="w-full border-zinc-700 hover:bg-zinc-800"
          >
            View Details
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

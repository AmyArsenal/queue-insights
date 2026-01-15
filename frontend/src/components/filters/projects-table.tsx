"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { QueueProject } from "@/types";

interface ProjectsTableProps {
  projects: QueueProject[];
  loading: boolean;
  error: string | null;
  onNextPage: () => void;
  onPrevPage: () => void;
  currentOffset: number;
  limit: number;
}

function getStatusColor(status: string | null) {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "operational":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "withdrawn":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "suspended":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  }
}

function getTypeColor(type: string | null) {
  switch (type?.toLowerCase()) {
    case "solar":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "wind":
      return "bg-teal-500/10 text-teal-600 border-teal-500/20";
    case "battery":
    case "storage":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "gas":
      return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    case "solar+battery":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    default:
      return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  }
}

function formatMW(mw: number | null): string {
  if (mw === null) return "-";
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  return `${mw.toFixed(0)} MW`;
}

export function ProjectsTable({
  projects,
  loading,
  error,
  onNextPage,
  onPrevPage,
  currentOffset,
  limit,
}: ProjectsTableProps) {
  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Make sure the backend server is running at localhost:8000
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Queue ID</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Year</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No projects found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    {project.q_id || "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {project.project_name || project.poi_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.region || "-"}</Badge>
                  </TableCell>
                  <TableCell>{project.state || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(project.type_clean)} variant="outline">
                      {project.type_clean || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMW(project.mw1)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(project.q_status)} variant="outline">
                      {project.q_status || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.q_year || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Showing {currentOffset + 1} - {currentOffset + projects.length} results
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={currentOffset === 0 || loading}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={projects.length < limit || loading}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import type { QueueProject } from "@/types";
import { searchProjects } from "@/lib/api";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<QueueProject[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounced search with AbortController to prevent race conditions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    const abortController = new AbortController();

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const results = await searchProjects(searchQuery, 100, abortController.signal);
        if (abortController.signal.aborted) return;
        setSearchResults(results);
      } catch (err) {
        if (abortController.signal.aborted) return;
        // Don't show error for aborted requests
        if (err instanceof Error && err.name === "AbortError") return;
        setSearchError(err instanceof Error ? err.message : "Search failed");
        setSearchResults(null);
      } finally {
        if (!abortController.signal.aborted) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchError(null);
  }, []);

  // Use search results if searching, otherwise use filtered projects
  const displayProjects = searchResults !== null ? searchResults : projects;
  const isSearchMode = searchQuery.length >= 2;

  if (error && !isSearchMode) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Make sure the backend server is running
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Search Bar */}
      <div className="border-b p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Queue ID, project name, POI, developer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isSearchMode && !searching && searchResults !== null && (
          <p className="mt-2 text-sm text-muted-foreground">
            Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
          </p>
        )}
        {searchError && (
          <p className="mt-2 text-sm text-red-500">{searchError}</p>
        )}
      </div>

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
            {(loading || searching) ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searching ? "Searching..." : "Loading projects..."}
                  </p>
                </TableCell>
              </TableRow>
            ) : displayProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {isSearchMode
                    ? `No projects found matching "${searchQuery}"`
                    : "No projects found matching your filters."}
                </TableCell>
              </TableRow>
            ) : (
              displayProjects.map((project) => (
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

      {/* Pagination - hide when searching */}
      {!isSearchMode && (
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
      )}
    </Card>
  );
}

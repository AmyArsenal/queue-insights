"use client";

import { useState, useMemo, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  X,
} from "lucide-react";
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

// Column filter state type
interface ColumnFilters {
  q_id: Set<string>;
  project_name: Set<string>;
  region: Set<string>;
  state: Set<string>;
  type_clean: Set<string>;
  q_status: Set<string>;
  q_year: Set<string>;
}

type FilterableColumn = keyof ColumnFilters;

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

// Column Filter Component
function ColumnFilter({
  column,
  label,
  values,
  selectedValues,
  onSelectionChange,
}: {
  column: FilterableColumn;
  label: string;
  values: string[];
  selectedValues: Set<string>;
  onSelectionChange: (column: FilterableColumn, values: Set<string>) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredValues = useMemo(() => {
    if (!search) return values;
    const searchLower = search.toLowerCase();
    return values.filter((v) => v.toLowerCase().includes(searchLower));
  }, [values, search]);

  const handleSelectAll = () => {
    onSelectionChange(column, new Set(filteredValues));
  };

  const handleClearAll = () => {
    onSelectionChange(column, new Set());
  };

  const handleToggle = (value: string) => {
    const newSet = new Set(selectedValues);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    onSelectionChange(column, newSet);
  };

  const hasActiveFilter = selectedValues.size > 0;

  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${hasActiveFilter ? "text-blue-500" : "text-muted-foreground"}`}
          >
            <Filter className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {/* Search input */}
          <div className="p-2">
            <Input
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <DropdownMenuSeparator />

          {/* Select All / Clear All buttons */}
          <div className="flex gap-2 px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleClearAll}
            >
              Clear
            </Button>
          </div>
          <DropdownMenuSeparator />

          {/* Checkbox list */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredValues.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No results found
              </p>
            ) : (
              <div className="space-y-1">
                {filteredValues.slice(0, 100).map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={selectedValues.has(value)}
                      onCheckedChange={() => handleToggle(value)}
                    />
                    <span className="truncate">{value}</span>
                  </label>
                ))}
                {filteredValues.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Showing first 100 of {filteredValues.length} values
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active filter indicator */}
          {hasActiveFilter && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <p className="text-xs text-blue-500">
                  {selectedValues.size} selected
                </p>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
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
  // Column filter state
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    q_id: new Set(),
    project_name: new Set(),
    region: new Set(),
    state: new Set(),
    type_clean: new Set(),
    q_status: new Set(),
    q_year: new Set(),
  });

  // Get unique values for each filterable column
  const uniqueValues = useMemo(() => {
    const values: Record<FilterableColumn, Set<string>> = {
      q_id: new Set(),
      project_name: new Set(),
      region: new Set(),
      state: new Set(),
      type_clean: new Set(),
      q_status: new Set(),
      q_year: new Set(),
    };

    projects.forEach((p) => {
      if (p.q_id) values.q_id.add(p.q_id);
      if (p.project_name) values.project_name.add(p.project_name);
      else if (p.poi_name) values.project_name.add(p.poi_name);
      if (p.region) values.region.add(p.region);
      if (p.state) values.state.add(p.state);
      if (p.type_clean) values.type_clean.add(p.type_clean);
      if (p.q_status) values.q_status.add(p.q_status);
      if (p.q_year) values.q_year.add(String(p.q_year));
    });

    return {
      q_id: Array.from(values.q_id).sort(),
      project_name: Array.from(values.project_name).sort(),
      region: Array.from(values.region).sort(),
      state: Array.from(values.state).sort(),
      type_clean: Array.from(values.type_clean).sort(),
      q_status: Array.from(values.q_status).sort(),
      q_year: Array.from(values.q_year).sort((a, b) => Number(b) - Number(a)),
    };
  }, [projects]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (column: FilterableColumn, values: Set<string>) => {
      setColumnFilters((prev) => ({
        ...prev,
        [column]: values,
      }));
    },
    []
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setColumnFilters({
      q_id: new Set(),
      project_name: new Set(),
      region: new Set(),
      state: new Set(),
      type_clean: new Set(),
      q_status: new Set(),
      q_year: new Set(),
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(columnFilters).some((set) => set.size > 0);
  }, [columnFilters]);

  // Filter projects based on column filters
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Queue ID filter
      if (
        columnFilters.q_id.size > 0 &&
        (!project.q_id || !columnFilters.q_id.has(project.q_id))
      ) {
        return false;
      }

      // Project Name filter
      if (columnFilters.project_name.size > 0) {
        const name = project.project_name || project.poi_name;
        if (!name || !columnFilters.project_name.has(name)) {
          return false;
        }
      }

      // Region filter
      if (
        columnFilters.region.size > 0 &&
        (!project.region || !columnFilters.region.has(project.region))
      ) {
        return false;
      }

      // State filter
      if (
        columnFilters.state.size > 0 &&
        (!project.state || !columnFilters.state.has(project.state))
      ) {
        return false;
      }

      // Type filter
      if (
        columnFilters.type_clean.size > 0 &&
        (!project.type_clean || !columnFilters.type_clean.has(project.type_clean))
      ) {
        return false;
      }

      // Status filter
      if (
        columnFilters.q_status.size > 0 &&
        (!project.q_status || !columnFilters.q_status.has(project.q_status))
      ) {
        return false;
      }

      // Year filter
      if (
        columnFilters.q_year.size > 0 &&
        (!project.q_year || !columnFilters.q_year.has(String(project.q_year)))
      ) {
        return false;
      }

      return true;
    });
  }, [projects, columnFilters]);

  if (error) {
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
      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between border-b px-4 py-2 bg-blue-500/5">
          <p className="text-sm text-blue-600">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-blue-600 hover:text-blue-700"
            onClick={clearAllFilters}
          >
            <X className="h-3 w-3 mr-1" />
            Clear all filters
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {/* Column headers with filter icons */}
            <TableRow>
              <TableHead className="w-[120px]">
                <ColumnFilter
                  column="q_id"
                  label="Queue ID"
                  values={uniqueValues.q_id}
                  selectedValues={columnFilters.q_id}
                  onSelectionChange={handleFilterChange}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  column="project_name"
                  label="Project Name"
                  values={uniqueValues.project_name}
                  selectedValues={columnFilters.project_name}
                  onSelectionChange={handleFilterChange}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  column="region"
                  label="Region"
                  values={uniqueValues.region}
                  selectedValues={columnFilters.region}
                  onSelectionChange={handleFilterChange}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  column="state"
                  label="State"
                  values={uniqueValues.state}
                  selectedValues={columnFilters.state}
                  onSelectionChange={handleFilterChange}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  column="type_clean"
                  label="Type"
                  values={uniqueValues.type_clean}
                  selectedValues={columnFilters.type_clean}
                  onSelectionChange={handleFilterChange}
                />
              </TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead>
                <ColumnFilter
                  column="q_status"
                  label="Status"
                  values={uniqueValues.q_status}
                  selectedValues={columnFilters.q_status}
                  onSelectionChange={handleFilterChange}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  column="q_year"
                  label="Year"
                  values={uniqueValues.q_year}
                  selectedValues={columnFilters.q_year}
                  onSelectionChange={handleFilterChange}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading projects...
                  </p>
                </TableCell>
              </TableRow>
            ) : filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {hasActiveFilters
                    ? "No projects match the selected filters."
                    : "No projects found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
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
          {hasActiveFilters
            ? `Showing ${filteredProjects.length} filtered results`
            : `Showing ${currentOffset + 1} - ${currentOffset + projects.length} results`}
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

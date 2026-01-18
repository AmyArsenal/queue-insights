"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  Search,
} from "lucide-react";
import type { QueueProject } from "@/types";
import {
  getFilterOptions,
  getProjectsFiltered,
  searchProjects,
  type FilterOptions,
  type ExtendedProjectFilters,
} from "@/lib/api";

interface ProjectsTableProps {
  projects: QueueProject[];
  loading: boolean;
  error: string | null;
  onNextPage: () => void;
  onPrevPage: () => void;
  currentOffset: number;
  limit: number;
  // Global filters from parent
  globalFilters?: {
    region?: string;
    type_clean?: string;
    q_status?: string;
  };
}

// Column filter state type
interface ColumnFilters {
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
  disabled,
}: {
  column: FilterableColumn;
  label: string;
  values: string[];
  selectedValues: Set<string>;
  onSelectionChange: (column: FilterableColumn, values: Set<string>) => void;
  disabled?: boolean;
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
            disabled={disabled}
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
                {filteredValues.map((value) => (
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
  projects: initialProjects,
  loading: initialLoading,
  error,
  onNextPage,
  onPrevPage,
  currentOffset,
  limit,
  globalFilters,
}: ProjectsTableProps) {
  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Filtered data from server
  const [filteredProjects, setFilteredProjects] = useState<QueueProject[] | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<QueueProject[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Column filter state
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    region: new Set(),
    state: new Set(),
    type_clean: new Set(),
    q_status: new Set(),
    q_year: new Set(),
  });

  // Load filter options on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error("Failed to load filter options:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadFilterOptions();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchProjects(searchQuery, 100, abortController.signal);
        if (!abortController.signal.aborted) {
          setSearchResults(results);
        }
      } catch (err) {
        if (!abortController.signal.aborted && !(err instanceof Error && err.name === "AbortError")) {
          console.error("Search failed:", err);
        }
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

  // Fetch filtered data when column filters change
  useEffect(() => {
    const hasFilters =
      columnFilters.region.size > 0 ||
      columnFilters.state.size > 0 ||
      columnFilters.type_clean.size > 0 ||
      columnFilters.q_status.size > 0 ||
      columnFilters.q_year.size > 0;

    if (!hasFilters) {
      setFilteredProjects(null);
      return;
    }

    const abortController = new AbortController();

    async function fetchFiltered() {
      setFilterLoading(true);
      try {
        const filters: ExtendedProjectFilters = {
          limit: 500, // Get more results when filtering
        };

        // Apply global filters first
        if (globalFilters?.region) filters.region = globalFilters.region;
        if (globalFilters?.type_clean) filters.type_clean = globalFilters.type_clean;
        if (globalFilters?.q_status) filters.q_status = globalFilters.q_status;

        // Then apply column filters (multi-select)
        if (columnFilters.region.size > 0) {
          filters.regions = Array.from(columnFilters.region);
        }
        if (columnFilters.state.size > 0) {
          filters.states = Array.from(columnFilters.state);
        }
        if (columnFilters.type_clean.size > 0) {
          filters.types = Array.from(columnFilters.type_clean);
        }
        if (columnFilters.q_status.size > 0) {
          filters.statuses = Array.from(columnFilters.q_status);
        }
        if (columnFilters.q_year.size > 0) {
          filters.years = Array.from(columnFilters.q_year).map((y) => parseInt(y));
        }

        const results = await getProjectsFiltered(filters, abortController.signal);
        if (!abortController.signal.aborted) {
          setFilteredProjects(results);
        }
      } catch (err) {
        if (!abortController.signal.aborted && !(err instanceof Error && err.name === "AbortError")) {
          console.error("Filter failed:", err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setFilterLoading(false);
        }
      }
    }

    fetchFiltered();

    return () => {
      abortController.abort();
    };
  }, [columnFilters, globalFilters]);

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
      region: new Set(),
      state: new Set(),
      type_clean: new Set(),
      q_status: new Set(),
      q_year: new Set(),
    });
    setSearchQuery("");
    setSearchResults(null);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(columnFilters).some((set) => set.size > 0);
  }, [columnFilters]);

  // Determine which projects to display
  const displayProjects = useMemo(() => {
    if (searchQuery.length >= 2 && searchResults !== null) {
      return searchResults;
    }
    if (hasActiveFilters && filteredProjects !== null) {
      return filteredProjects;
    }
    return initialProjects;
  }, [searchQuery, searchResults, hasActiveFilters, filteredProjects, initialProjects]);

  const isLoading = initialLoading || filterLoading || searching || loadingOptions;
  const isSearchMode = searchQuery.length >= 2;

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
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
              }}
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
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && !isSearchMode && (
        <div className="flex items-center justify-between border-b px-4 py-2 bg-blue-500/5">
          <p className="text-sm text-blue-600">
            {filterLoading
              ? "Filtering..."
              : `Found ${filteredProjects?.length ?? 0} projects matching filters`}
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
              <TableHead className="w-[120px]">Queue ID</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>
                <ColumnFilter
                  column="region"
                  label="Region"
                  values={filterOptions?.regions ?? []}
                  selectedValues={columnFilters.region}
                  onSelectionChange={handleFilterChange}
                  disabled={loadingOptions}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  column="state"
                  label="State"
                  values={filterOptions?.states ?? []}
                  selectedValues={columnFilters.state}
                  onSelectionChange={handleFilterChange}
                  disabled={loadingOptions}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  column="type_clean"
                  label="Type"
                  values={filterOptions?.types ?? []}
                  selectedValues={columnFilters.type_clean}
                  onSelectionChange={handleFilterChange}
                  disabled={loadingOptions}
                />
              </TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead>
                <ColumnFilter
                  column="q_status"
                  label="Status"
                  values={filterOptions?.statuses ?? []}
                  selectedValues={columnFilters.q_status}
                  onSelectionChange={handleFilterChange}
                  disabled={loadingOptions}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  column="q_year"
                  label="Year"
                  values={filterOptions?.years.map(String) ?? []}
                  selectedValues={columnFilters.q_year}
                  onSelectionChange={handleFilterChange}
                  disabled={loadingOptions}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searching
                      ? "Searching..."
                      : filterLoading
                      ? "Applying filters..."
                      : "Loading..."}
                  </p>
                </TableCell>
              </TableRow>
            ) : displayProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {isSearchMode
                    ? `No projects found matching "${searchQuery}"`
                    : hasActiveFilters
                    ? "No projects match the selected filters."
                    : "No projects found."}
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

      {/* Pagination - hide when filtering or searching */}
      {!hasActiveFilters && !isSearchMode && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {currentOffset + 1} - {currentOffset + initialProjects.length} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={currentOffset === 0 || initialLoading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={initialProjects.length < limit || initialLoading}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Show count when filtering */}
      {(hasActiveFilters || isSearchMode) && !isLoading && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {displayProjects.length} results
          </p>
        </div>
      )}
    </Card>
  );
}

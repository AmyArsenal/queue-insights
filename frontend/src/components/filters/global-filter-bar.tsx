"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import type { ProjectFilters, RegionStats, TypeStats, StatusStats } from "@/types";

interface GlobalFilterBarProps {
  filters: ProjectFilters;
  onFilterChange: (filters: Partial<ProjectFilters>) => void;
  onClearFilters: () => void;
  regions: RegionStats[];
  types: TypeStats[];
  statuses: StatusStats[];
}

export function GlobalFilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  regions,
  types,
  statuses,
}: GlobalFilterBarProps) {
  const activeFilterCount = [
    filters.region,
    filters.type_clean,
    filters.q_status,
  ].filter(Boolean).length;

  // Top fuel types
  const mainTypes = types.slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
      {/* Region Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Region:</span>
        <Select
          value={filters.region || "all"}
          onValueChange={(value) =>
            onFilterChange({ region: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region.region} value={region.region}>
                {region.region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Type:</span>
        <Select
          value={filters.type_clean || "all"}
          onValueChange={(value) =>
            onFilterChange({ type_clean: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {mainTypes.map((type) => (
              <SelectItem key={type.type} value={type.type}>
                {type.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        <Select
          value={filters.q_status || "all"}
          onValueChange={(value) =>
            onFilterChange({ q_status: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.status} value={status.status}>
                {status.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters & Clear */}
      {activeFilterCount > 0 && (
        <>
          <div className="h-6 w-px bg-border" />
          <Badge variant="secondary">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
          </Badge>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Clear
          </Button>
        </>
      )}
    </div>
  );
}

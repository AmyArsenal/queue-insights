"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Filter, RotateCcw } from "lucide-react";
import type { ProjectFilters, RegionStats, TypeStats, StatusStats } from "@/types";

interface FilterSidebarProps {
  filters: ProjectFilters;
  onFilterChange: (filters: Partial<ProjectFilters>) => void;
  onClearFilters: () => void;
  regions: RegionStats[];
  types: TypeStats[];
  statuses: StatusStats[];
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  regions,
  types,
  statuses,
}: FilterSidebarProps) {
  const activeFilterCount = [
    filters.region,
    filters.type_clean,
    filters.q_status,
    filters.min_mw,
    filters.max_mw,
  ].filter(Boolean).length;

  // Top fuel types (limit to main ones)
  const mainTypes = types.slice(0, 8);

  return (
    <Card className="h-fit p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <Separator className="mb-4" />

      {/* Region Filter */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Region / ISO</h4>
        <div className="flex flex-wrap gap-1">
          {regions.map((region) => (
            <Badge
              key={region.region}
              variant={filters.region === region.region ? "default" : "outline"}
              className="cursor-pointer transition-colors hover:bg-primary/80"
              onClick={() =>
                onFilterChange({
                  region: filters.region === region.region ? undefined : region.region,
                })
              }
            >
              {region.region}
              {filters.region === region.region && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Fuel Type Filter */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Fuel Type</h4>
        <div className="flex flex-wrap gap-1">
          {mainTypes.map((type) => (
            <Badge
              key={type.type}
              variant={filters.type_clean === type.type ? "default" : "outline"}
              className="cursor-pointer transition-colors hover:bg-primary/80"
              onClick={() =>
                onFilterChange({
                  type_clean: filters.type_clean === type.type ? undefined : type.type,
                })
              }
            >
              {type.type}
              {filters.type_clean === type.type && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Status Filter */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Status</h4>
        <div className="flex flex-wrap gap-1">
          {statuses.map((status) => (
            <Badge
              key={status.status}
              variant={filters.q_status === status.status ? "default" : "outline"}
              className="cursor-pointer transition-colors hover:bg-primary/80"
              onClick={() =>
                onFilterChange({
                  q_status: filters.q_status === status.status ? undefined : status.status,
                })
              }
            >
              {status.status}
              {filters.q_status === status.status && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Capacity Range */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Capacity (MW)</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_mw || ""}
            onChange={(e) =>
              onFilterChange({
                min_mw: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.max_mw || ""}
            onChange={(e) =>
              onFilterChange({
                max_mw: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <Separator className="mb-4" />
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Quick Filters</h4>
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => onFilterChange({ min_mw: 100 })}
          >
            Large projects (100+ MW)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => onFilterChange({ q_status: "active" })}
          >
            Active only
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => onFilterChange({ type_clean: "Solar", q_status: "active" })}
          >
            Active Solar
          </Button>
        </div>
      </div>
    </Card>
  );
}

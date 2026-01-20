"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { ProjectsTable } from "@/components/filters/projects-table";
import { StatsCards } from "@/components/filters/stats-cards";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { useProjects, useStats } from "@/hooks/use-projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, BarChart3, Table2 } from "lucide-react";
import { getTimeline } from "@/lib/api";
import type { TimelineStats } from "@/lib/api";
import type { OverviewStats } from "@/types";

// Chart imports
import { QueueGrowthChart, CapacityGrowthChart } from "@/components/charts/queue-growth-chart";
import { CapacityByTypeBarChart, CapacityByTypePieChart } from "@/components/charts/capacity-by-type-chart";
import { RegionalCapacityChart, RegionalProjectsChart } from "@/components/charts/regional-comparison-chart";
import { WithdrawalRateChart, WithdrawnCapacityChart } from "@/components/charts/withdrawal-trends-chart";

// Dynamic import for map (heavy component)
const USChoroplethMap = dynamic(
  () => import("@/components/map/us-choropleth-map").then((mod) => mod.USChoroplethMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center bg-slate-900 rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading map...</span>
        </div>
      </div>
    ),
  }
);

export default function QueuePage() {
  // Shared filter state for all tabs
  const [globalFilters, setGlobalFilters] = useState<{
    region?: string;
    type_clean?: string;
    q_status?: string;
  }>({});

  const {
    projects,
    filters,
    loading: projectsLoading,
    error,
    updateFilters,
    clearFilters,
    nextPage,
    prevPage,
  } = useProjects({
    region: globalFilters.region,
    type_clean: globalFilters.type_clean,
    q_status: globalFilters.q_status,
  });

  const {
    overview,
    regions,
    types,
    statuses,
    loading: statsLoading,
  } = useStats();

  // Timeline data for charts
  const [timelineData, setTimelineData] = useState<TimelineStats[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      try {
        const data = await getTimeline({
          region: globalFilters.region,
          type_clean: globalFilters.type_clean,
        });
        setTimelineData(data);
      } catch (err) {
        console.error("Failed to load timeline:", err);
      } finally {
        setTimelineLoading(false);
      }
    }
    loadTimeline();
  }, [globalFilters.region, globalFilters.type_clean]);

  // Handle global filter changes
  const handleGlobalFilterChange = (newFilters: Partial<typeof globalFilters>) => {
    setGlobalFilters((prev) => ({ ...prev, ...newFilters }));
    // Also update the projects filter
    updateFilters(newFilters);
  };

  const handleClearGlobalFilters = () => {
    setGlobalFilters({});
    clearFilters();
  };

  // Calculate filtered stats based on active filters
  const filteredStats = useMemo((): OverviewStats | null => {
    if (!overview) return null;

    // If no filters, return original overview
    if (!globalFilters.region && !globalFilters.type_clean && !globalFilters.q_status) {
      return overview;
    }

    // For filtered view, calculate from filtered regions/types
    let filteredProjectCount = overview.total_projects;
    let filteredCapacity = overview.total_capacity_mw;

    if (globalFilters.region) {
      const regionData = regions.find((r) => r.region === globalFilters.region);
      if (regionData) {
        filteredProjectCount = regionData.project_count;
        filteredCapacity = regionData.total_mw;
      }
    }

    if (globalFilters.type_clean) {
      const typeData = types.find((t) => t.type === globalFilters.type_clean);
      if (typeData) {
        // If both region and type, we'd need a combined API call
        // For now, show type data when type is selected
        filteredProjectCount = typeData.project_count;
        filteredCapacity = typeData.total_mw;
      }
    }

    return {
      ...overview,
      total_projects: filteredProjectCount,
      total_capacity_mw: filteredCapacity,
      total_capacity_gw: filteredCapacity / 1000,
    };
  }, [overview, regions, types, globalFilters]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Queue Explorer</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and filter {overview?.total_projects.toLocaleString() || "36,000+"} interconnection projects
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <StatsCards stats={filteredStats} loading={statsLoading} />
      </div>

      {/* Global Filter Bar */}
      <div className="mb-6">
        <GlobalFilterBar
          filters={globalFilters}
          onFilterChange={handleGlobalFilterChange}
          onClearFilters={handleClearGlobalFilters}
          regions={regions}
          types={types}
          statuses={statuses}
        />
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Map</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Map Tab */}
        <TabsContent value="map" className="mt-0">
          <div className="rounded-lg overflow-hidden border">
            <USChoroplethMap className="h-[500px] w-full" filters={globalFilters} />
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="mt-0">
          <div className="grid gap-6">
            {/* Row 1: Growth Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <QueueGrowthChart data={timelineData} loading={timelineLoading} />
              <CapacityGrowthChart data={timelineData} loading={timelineLoading} />
            </div>

            {/* Row 2: Type Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CapacityByTypeBarChart data={types} loading={statsLoading} />
              <CapacityByTypePieChart data={types} loading={statsLoading} />
            </div>

            {/* Row 3: Regional Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <RegionalCapacityChart data={regions} loading={statsLoading} />
              <RegionalProjectsChart data={regions} loading={statsLoading} />
            </div>

            {/* Row 4: Withdrawal Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <WithdrawalRateChart data={timelineData} loading={timelineLoading} />
              <WithdrawnCapacityChart data={timelineData} loading={timelineLoading} />
            </div>
          </div>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="mt-0">
          <ProjectsTable
            projects={projects}
            loading={projectsLoading}
            error={error}
            onNextPage={nextPage}
            onPrevPage={prevPage}
            currentOffset={filters.offset || 0}
            limit={filters.limit || 100}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

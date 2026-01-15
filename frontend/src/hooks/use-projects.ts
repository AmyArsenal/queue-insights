"use client";

import { useState, useEffect, useCallback } from "react";
import type { QueueProject, ProjectFilters, OverviewStats, RegionStats, TypeStats, StatusStats } from "@/types";
import { getProjects, getOverviewStats, getStatsByRegion, getStatsByType, getStatsByStatus } from "@/lib/api";

export function useProjects(initialFilters: ProjectFilters = {}) {
  const [projects, setProjects] = useState<QueueProject[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>({ limit: 100, ...initialFilters });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects(filters);
      setProjects(data);
      // Note: For proper pagination, backend should return total count
      // For now, we estimate based on returned results
      setTotalCount(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ limit: 100, offset: 0 });
  }, []);

  const nextPage = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 100),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 100)),
    }));
  }, []);

  return {
    projects,
    filters,
    loading,
    error,
    totalCount,
    updateFilters,
    clearFilters,
    nextPage,
    prevPage,
    refetch: fetchProjects,
  };
}

export function useStats() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [regions, setRegions] = useState<RegionStats[]>([]);
  const [types, setTypes] = useState<TypeStats[]>([]);
  const [statuses, setStatuses] = useState<StatusStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [overviewData, regionsData, typesData, statusesData] = await Promise.all([
          getOverviewStats(),
          getStatsByRegion(),
          getStatsByType(),
          getStatsByStatus(),
        ]);
        setOverview(overviewData);
        setRegions(regionsData);
        setTypes(typesData);
        setStatuses(statusesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { overview, regions, types, statuses, loading, error };
}

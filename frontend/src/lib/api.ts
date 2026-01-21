import type {
  QueueProject,
  OverviewStats,
  RegionStats,
  TypeStats,
  StatusStats,
  StateStats,
  YearStats,
  ProjectFilters,
  CountyStats,
  MapDataResponse,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Stats endpoints
export async function getOverviewStats(): Promise<OverviewStats> {
  return fetchAPI<OverviewStats>("/api/stats");
}

export async function getStatsByRegion(): Promise<RegionStats[]> {
  return fetchAPI<RegionStats[]>("/api/stats/by-region");
}

export async function getStatsByType(): Promise<TypeStats[]> {
  return fetchAPI<TypeStats[]>("/api/stats/by-type");
}

export async function getStatsByStatus(): Promise<StatusStats[]> {
  return fetchAPI<StatusStats[]>("/api/stats/by-status");
}

export async function getStatsByState(): Promise<StateStats[]> {
  return fetchAPI<StateStats[]>("/api/stats/by-state");
}

export async function getStatsByYear(): Promise<YearStats[]> {
  return fetchAPI<YearStats[]>("/api/stats/by-year");
}

// Timeline and withdrawal endpoints
export interface TimelineStats {
  year: number;
  total_entered: number;
  total_mw_entered: number;
  withdrawn: number;
  withdrawn_mw: number;
  active: number;
  active_mw: number;
  operational: number;
  operational_mw: number;
  withdrawal_rate: number;
}

export async function getTimeline(params?: {
  region?: string;
  type_clean?: string;
}): Promise<TimelineStats[]> {
  const searchParams = new URLSearchParams();
  if (params?.region) searchParams.append("region", params.region);
  if (params?.type_clean) searchParams.append("type_clean", params.type_clean);
  const query = searchParams.toString();
  return fetchAPI<TimelineStats[]>(`/api/stats/timeline${query ? `?${query}` : ""}`);
}

export interface WithdrawnByYear {
  year: number;
  withdrawn_count: number;
  withdrawn_mw: number;
  withdrawn_gw: number;
}

export async function getWithdrawnByYear(type_clean?: string): Promise<WithdrawnByYear[]> {
  const query = type_clean ? `?type_clean=${encodeURIComponent(type_clean)}` : "";
  return fetchAPI<WithdrawnByYear[]>(`/api/stats/withdrawn-by-year${query}`);
}

export interface WithdrawnByRegion {
  region: string;
  withdrawn_count: number;
  withdrawn_mw: number;
  withdrawn_gw: number;
}

export async function getWithdrawnByRegion(q_year?: number): Promise<WithdrawnByRegion[]> {
  const query = q_year ? `?q_year=${q_year}` : "";
  return fetchAPI<WithdrawnByRegion[]>(`/api/stats/withdrawn-by-region${query}`);
}

// Filter options type
export interface FilterOptions {
  regions: string[];
  states: string[];
  types: string[];
  statuses: string[];
  years: number[];
}

// Get filter options for dropdowns
export async function getFilterOptions(): Promise<FilterOptions> {
  return fetchAPI<FilterOptions>("/api/projects/filter-options");
}

// Extended filters with multi-select support
export interface ExtendedProjectFilters extends ProjectFilters {
  regions?: string[];  // Multi-select
  states?: string[];   // Multi-select
  types?: string[];    // Multi-select
  statuses?: string[]; // Multi-select
  years?: number[];    // Multi-select
  q_ids?: string[];    // Multi-select
}

// Projects endpoints
export async function getProjects(filters: ProjectFilters = {}): Promise<QueueProject[]> {
  const params = new URLSearchParams();

  if (filters.region) params.append("region", filters.region);
  if (filters.state) params.append("state", filters.state);
  if (filters.type_clean) params.append("type_clean", filters.type_clean);
  if (filters.q_status) params.append("q_status", filters.q_status);
  if (filters.min_mw !== undefined) params.append("min_mw", filters.min_mw.toString());
  if (filters.max_mw !== undefined) params.append("max_mw", filters.max_mw.toString());
  if (filters.q_year) params.append("q_year", filters.q_year.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.offset) params.append("offset", filters.offset.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/api/projects?${queryString}` : "/api/projects";

  return fetchAPI<QueueProject[]>(endpoint);
}

// Get projects with extended multi-select filters
export async function getProjectsFiltered(
  filters: ExtendedProjectFilters = {},
  signal?: AbortSignal
): Promise<QueueProject[]> {
  const params = new URLSearchParams();

  // Multi-select filters (comma-separated)
  if (filters.regions && filters.regions.length > 0) {
    params.append("region", filters.regions.join(","));
  } else if (filters.region) {
    params.append("region", filters.region);
  }

  if (filters.states && filters.states.length > 0) {
    params.append("state", filters.states.join(","));
  } else if (filters.state) {
    params.append("state", filters.state);
  }

  if (filters.types && filters.types.length > 0) {
    params.append("type_clean", filters.types.join(","));
  } else if (filters.type_clean) {
    params.append("type_clean", filters.type_clean);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    params.append("q_status", filters.statuses.join(","));
  } else if (filters.q_status) {
    params.append("q_status", filters.q_status);
  }

  if (filters.years && filters.years.length > 0) {
    params.append("q_year", filters.years.join(","));
  } else if (filters.q_year) {
    params.append("q_year", filters.q_year.toString());
  }

  if (filters.q_ids && filters.q_ids.length > 0) {
    params.append("q_id", filters.q_ids.join(","));
  }

  if (filters.min_mw !== undefined) params.append("min_mw", filters.min_mw.toString());
  if (filters.max_mw !== undefined) params.append("max_mw", filters.max_mw.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.offset) params.append("offset", filters.offset.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/projects${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getProject(id: number): Promise<QueueProject> {
  return fetchAPI<QueueProject>(`/api/projects/${id}`);
}

export async function searchProjects(
  query: string,
  limit = 50,
  signal?: AbortSignal
): Promise<QueueProject[]> {
  const url = `${API_BASE_URL}/api/projects/search/?q=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Map data endpoints
export async function getStatsByCounty(params?: {
  region?: string;
  type_clean?: string;
  q_status?: string;
}): Promise<CountyStats[]> {
  const searchParams = new URLSearchParams();
  if (params?.region) searchParams.append("region", params.region);
  if (params?.type_clean) searchParams.append("type_clean", params.type_clean);
  if (params?.q_status) searchParams.append("q_status", params.q_status);
  const query = searchParams.toString();
  return fetchAPI<CountyStats[]>(`/api/stats/by-county${query ? `?${query}` : ""}`);
}

export async function getMapData(params?: {
  type_clean?: string;
  q_status?: string;
}): Promise<MapDataResponse> {
  const searchParams = new URLSearchParams();
  if (params?.type_clean) searchParams.append("type_clean", params.type_clean);
  if (params?.q_status) searchParams.append("q_status", params.q_status);
  const query = searchParams.toString();
  return fetchAPI<MapDataResponse>(`/api/stats/map-data${query ? `?${query}` : ""}`);
}

// ============================================================================
// PJM CLUSTER STUDY API
// ============================================================================

export interface ClusterInfo {
  id: number;
  cluster_name: string;
  phase: string;
  total_projects: number;
  total_mw: number | null;
}

export interface ClusterSummary {
  cluster_name: string;
  phase: string;
  total_projects: number;
  total_mw: number | null;
  total_cost: number | null;
  avg_cost_per_kw: number | null;
  avg_risk_score: number | null;
  risk_distribution: Record<string, number> | null;
  cost_distribution: Record<string, number> | null;
}

export interface ClusterProject {
  project_id: string;
  developer: string | null;
  utility: string | null;
  state: string | null;
  fuel_type: string | null;
  mw_capacity: number | null;
  total_cost: number | null;
  cost_per_kw: number | null;
  risk_score_overall: number | null;
  cost_rank: number | null;
}

export interface ProjectUpgrade {
  id: number;
  project_id: string;
  link_type: string;
  allocated_cost: number | null;
  percent_allocation: number | null;
  upgrade_rtep_id: string | null;
  upgrade_title: string | null;
  upgrade_utility: string | null;
  upgrade_total_cost: number | null;
  shared_by_count: number | null;
}

export interface ProjectDashboard {
  project_id: string;
  cluster_name: string;
  phase: string;
  developer: string | null;
  utility: string | null;
  state: string | null;
  county: string | null;
  fuel_type: string | null;
  mw_capacity: number | null;
  project_status: string | null;
  total_cost: number | null;
  cost_per_kw: number | null;
  toif_cost: number | null;
  network_upgrade_cost: number | null;
  system_reliability_cost: number | null;
  rd1_amount: number | null;
  rd2_amount: number | null;
  risk_score_overall: number | null;
  risk_score_cost: number | null;
  risk_score_concentration: number | null;
  risk_score_dependency: number | null;
  risk_score_timeline: number | null;
  cost_rank: number | null;
  cost_percentile: number | null;
  cluster_total_projects: number | null;
  report_url: string | null;
  upgrades: ProjectUpgrade[];
  codependent_projects: string[];
}

export interface ClusterFilterOptions {
  utilities: string[];
  states: string[];
  fuel_types: string[];
}

// Get list of clusters
export async function getClusters(): Promise<ClusterInfo[]> {
  return fetchAPI<ClusterInfo[]>("/api/cluster/clusters");
}

// Get cluster summary
export async function getClusterSummary(
  cluster: string,
  phase: string
): Promise<ClusterSummary> {
  return fetchAPI<ClusterSummary>(`/api/cluster/summary/${cluster}/${phase}`);
}

// Get cluster projects with filters
export async function getClusterProjects(params: {
  cluster?: string;
  phase?: string;
  utility?: string;
  state?: string;
  fuel_type?: string;
  min_mw?: number;
  max_mw?: number;
  min_risk?: number;
  max_risk?: number;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
  offset?: number;
}): Promise<ClusterProject[]> {
  const searchParams = new URLSearchParams();
  if (params.cluster) searchParams.append("cluster", params.cluster);
  if (params.phase) searchParams.append("phase", params.phase);
  if (params.utility) searchParams.append("utility", params.utility);
  if (params.state) searchParams.append("state", params.state);
  if (params.fuel_type) searchParams.append("fuel_type", params.fuel_type);
  if (params.min_mw !== undefined) searchParams.append("min_mw", params.min_mw.toString());
  if (params.max_mw !== undefined) searchParams.append("max_mw", params.max_mw.toString());
  if (params.min_risk !== undefined) searchParams.append("min_risk", params.min_risk.toString());
  if (params.max_risk !== undefined) searchParams.append("max_risk", params.max_risk.toString());
  if (params.sort_by) searchParams.append("sort_by", params.sort_by);
  if (params.sort_order) searchParams.append("sort_order", params.sort_order);
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.offset) searchParams.append("offset", params.offset.toString());
  const query = searchParams.toString();
  return fetchAPI<ClusterProject[]>(`/api/cluster/projects${query ? `?${query}` : ""}`);
}

// Search cluster projects
export async function searchClusterProjects(
  q: string,
  cluster = "TC2",
  phase = "PHASE_1",
  limit = 20
): Promise<{ project_id: string; developer: string | null; utility: string | null; mw_capacity: number | null; total_cost: number | null }[]> {
  return fetchAPI(`/api/cluster/projects/search?q=${encodeURIComponent(q)}&cluster=${cluster}&phase=${phase}&limit=${limit}`);
}

// Get cluster filter options
export async function getClusterFilterOptions(
  cluster = "TC2",
  phase = "PHASE_1"
): Promise<ClusterFilterOptions> {
  return fetchAPI<ClusterFilterOptions>(`/api/cluster/projects/filter-options?cluster=${cluster}&phase=${phase}`);
}

// Get project dashboard
export async function getClusterProjectDashboard(
  projectId: string,
  cluster = "TC2",
  phase = "PHASE_1"
): Promise<ProjectDashboard> {
  return fetchAPI<ProjectDashboard>(`/api/cluster/projects/${projectId}?cluster=${cluster}&phase=${phase}`);
}

// Get top upgrades
export async function getTopUpgrades(
  cluster = "TC2",
  phase = "PHASE_1",
  limit = 10
): Promise<{ rtep_id: string; title: string | null; utility: string | null; total_cost: number; shared_by_count: number | null }[]> {
  return fetchAPI(`/api/cluster/analytics/top-upgrades?cluster=${cluster}&phase=${phase}&limit=${limit}`);
}

// Get cost distribution
export async function getCostDistribution(
  cluster = "TC2",
  phase = "PHASE_1"
): Promise<{ bins: string[]; counts: number[]; total_projects: number }> {
  return fetchAPI(`/api/cluster/analytics/cost-distribution?cluster=${cluster}&phase=${phase}`);
}

// Get risk breakdown
export async function getRiskBreakdown(
  cluster = "TC2",
  phase = "PHASE_1"
): Promise<{ cost: number; concentration: number; dependency: number; timeline: number; overall: number }> {
  return fetchAPI(`/api/cluster/analytics/risk-breakdown?cluster=${cluster}&phase=${phase}`);
}

// Get stats by fuel type
export async function getClusterStatsByFuelType(
  cluster = "TC2",
  phase = "PHASE_1"
): Promise<{ fuel_type: string; count: number; total_mw: number; total_cost: number; avg_cost_per_kw: number }[]> {
  return fetchAPI(`/api/cluster/analytics/by-fuel-type?cluster=${cluster}&phase=${phase}`);
}

// Get stats by utility
export async function getClusterStatsByUtility(
  cluster = "TC2",
  phase = "PHASE_1"
): Promise<{ utility: string; count: number; total_mw: number; total_cost: number; avg_risk: number }[]> {
  return fetchAPI(`/api/cluster/analytics/by-utility?cluster=${cluster}&phase=${phase}`);
}

// ============================================================================
// GRIDAGENT CHAT API
// ============================================================================

export interface AgentChatRequest {
  message: string;
  context?: Record<string, unknown>;
}

export interface AgentChartData {
  type: "bar" | "pie" | "line" | "table" | "stat";
  data: Record<string, unknown>[];
  dataKey?: string;
  nameKey?: string;
}

export interface AgentChatResponse {
  content: string;
  chart?: AgentChartData;
  sources: string[];
}

export async function sendAgentMessage(request: AgentChatRequest): Promise<AgentChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

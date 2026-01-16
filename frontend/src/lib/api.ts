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

// API Response Types

export interface QueueProject {
  id: number;
  q_id: string | null;
  q_status: string | null;
  q_date: string | null;
  prop_date: string | null;
  on_date: string | null;
  wd_date: string | null;
  ia_date: string | null;
  ia_status_raw: string | null;
  ia_status_clean: string | null;
  county: string | null;
  state: string | null;
  fips_code: string | null;
  poi_name: string | null;
  region: string | null;
  project_name: string | null;
  utility: string | null;
  entity: string | null;
  developer: string | null;
  service_type: string | null;
  project_type: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  mw1: number | null;
  mw2: number | null;
  mw3: number | null;
  type_clean: string | null;
  q_year: number | null;
  prop_year: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OverviewStats {
  total_projects: number;
  total_capacity_mw: number;
  total_capacity_gw: number;
  active_projects: number;
  active_capacity_mw: number;
  active_capacity_gw: number;
}

export interface RegionStats {
  region: string;
  project_count: number;
  total_mw: number;
  total_gw: number;
}

export interface TypeStats {
  type: string;
  project_count: number;
  total_mw: number;
  total_gw: number;
}

export interface StatusStats {
  status: string;
  project_count: number;
  total_mw: number;
  total_gw: number;
}

export interface StateStats {
  state: string;
  project_count: number;
  total_mw: number;
  total_gw: number;
}

export interface YearStats {
  year: number;
  project_count: number;
  total_mw: number;
  total_gw: number;
}

// Filter types
export interface ProjectFilters {
  region?: string;
  state?: string;
  type_clean?: string;
  q_status?: string;
  min_mw?: number;
  max_mw?: number;
  q_year?: number;
  limit?: number;
  offset?: number;
}

// Map data types
export interface CountyStats {
  fips: string;
  county: string;
  state: string;
  region: string;
  project_count: number;
  total_mw: number;
  total_gw: number;
}

export interface MapDataResponse {
  by_state: {
    state: string;
    region: string;
    project_count: number;
    total_mw: number;
  }[];
  by_county: {
    fips: string;
    county: string;
    state: string;
    project_count: number;
    total_mw: number;
  }[];
  by_region: {
    region: string;
    project_count: number;
    total_mw: number;
  }[];
}

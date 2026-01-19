-- PJM Cluster Study Tables
-- MVP: TC2 Phase 1 data
-- Designed for future expansion: TC1 historical, withdrawal simulation, multi-ISO

-- ============================================================================
-- CLUSTERS: TC1, TC2, Cycle1, etc.
-- ============================================================================
CREATE TABLE IF NOT EXISTS pjm_clusters (
    id SERIAL PRIMARY KEY,
    cluster_name VARCHAR(20) NOT NULL,      -- TC1, TC2, Cycle1
    phase VARCHAR(20) NOT NULL,              -- PHASE_1, PHASE_2, PHASE_3

    -- Metadata
    total_projects INT,
    total_mw DECIMAL(12, 2),
    decision_deadline DATE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cluster_name, phase)
);

-- ============================================================================
-- PROJECT COSTS: Cost allocation per project per cluster/phase
-- ============================================================================
CREATE TABLE IF NOT EXISTS pjm_project_costs (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(20) NOT NULL,         -- AH1-665, AG2-095
    cluster_id INT REFERENCES pjm_clusters(id) ON DELETE CASCADE,

    -- Project info (from Excel)
    utility VARCHAR(100),                     -- EKPC, Dominion, AEP
    developer VARCHAR(200),
    state VARCHAR(10),
    county VARCHAR(100),
    fuel_type VARCHAR(50),                    -- Solar, Wind, Storage
    mw_capacity DECIMAL(10, 2),
    mw_energy DECIMAL(10, 2),
    project_status VARCHAR(50),               -- Active, Withdrawn

    -- Cost breakdown (from HTML report Table 1)
    total_cost DECIMAL(15, 2),
    cost_per_kw DECIMAL(10, 2),               -- Calculated: total_cost / (mw_capacity * 1000)
    toif_cost DECIMAL(15, 2),                 -- Transmission Owner Interconnection Facilities
    stand_alone_cost DECIMAL(15, 2),
    network_upgrade_cost DECIMAL(15, 2),
    system_reliability_cost DECIMAL(15, 2),

    -- Readiness deposits (from HTML report Table 2)
    rd1_amount DECIMAL(15, 2),
    rd2_amount DECIMAL(15, 2),
    rd2_due_date DATE,

    -- Timeline
    requested_cod DATE,                       -- From Excel: Requested In-Service Date

    -- Risk scores (calculated after data load)
    risk_score_overall DECIMAL(5, 2),         -- 0-100 composite
    risk_score_cost DECIMAL(5, 2),            -- $/kW percentile
    risk_score_concentration DECIMAL(5, 2),   -- Single upgrade exposure
    risk_score_dependency DECIMAL(5, 2),      -- Co-dependent project risk
    risk_score_timeline DECIMAL(5, 2),        -- Tagged-no-cost upgrades

    -- Cluster ranking
    cost_rank INT,                            -- Rank by $/kW in cluster
    cost_percentile DECIMAL(5, 2),            -- Percentile (0-100)

    -- Source
    report_url TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(project_id, cluster_id)
);

-- ============================================================================
-- UPGRADES: Network upgrades identified in cluster studies
-- ============================================================================
CREATE TABLE IF NOT EXISTS pjm_upgrades (
    id SERIAL PRIMARY KEY,
    cluster_id INT REFERENCES pjm_clusters(id) ON DELETE CASCADE,

    -- Identification
    rtep_id VARCHAR(50),                      -- n9670.0, (Pending)
    to_id VARCHAR(100),                       -- DAYr190039, EKPC-tc1-r0002a
    utility VARCHAR(100),                     -- Dayton, EKPC, AEP, DEOK

    -- Description
    title TEXT,
    upgrade_type VARCHAR(50),                 -- Network, Stand-Alone, TOIF, System Reliability

    -- Cost
    total_cost DECIMAL(15, 2),

    -- Sharing info (calculated)
    shared_by_count INT,                      -- Number of projects sharing this upgrade

    -- Timeline (for interim deliverability analysis - future)
    upgrade_cod DATE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cluster_id, rtep_id, to_id)
);

-- ============================================================================
-- PROJECT-UPGRADE LINKS: Which projects pay for which upgrades
-- ============================================================================
CREATE TABLE IF NOT EXISTS pjm_project_upgrades (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(20) NOT NULL,
    upgrade_id INT REFERENCES pjm_upgrades(id) ON DELETE CASCADE,
    cluster_id INT REFERENCES pjm_clusters(id) ON DELETE CASCADE,

    -- Link type (KEY DISTINCTION)
    link_type VARCHAR(20) NOT NULL DEFAULT 'COST_ALLOCATED',
    -- 'COST_ALLOCATED': Project pays for this upgrade
    -- 'TAGGED_NO_COST': Project depends on upgrade but $0 allocated (timeline risk)

    -- Cost allocation (for COST_ALLOCATED type)
    mw_impact DECIMAL(10, 2),                 -- 20.2 MW
    percent_allocation DECIMAL(8, 4),         -- 0.3270 (32.7%)
    allocated_cost DECIMAL(15, 2),            -- $5,104,602

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(project_id, upgrade_id)
);

-- ============================================================================
-- FACILITY OVERLOADS: Line loading data for simulation
-- ============================================================================
CREATE TABLE IF NOT EXISTS pjm_facility_overloads (
    id SERIAL PRIMARY KEY,
    cluster_id INT REFERENCES pjm_clusters(id) ON DELETE CASCADE,
    upgrade_id INT REFERENCES pjm_upgrades(id) ON DELETE SET NULL,

    -- Facility identification
    facility_name VARCHAR(200),               -- 01BELMNT-01FLINTRUN 500.0 kV Ckt 1 line
    contingency_name TEXT,
    contingency_type VARCHAR(50),             -- Single, Breaker, Multiple

    -- Loading data
    loading_pct DECIMAL(8, 4),                -- 121.47 (%)
    rating_mva DECIMAL(10, 2),                -- 3792.0
    mva_to_mitigate DECIMAL(10, 2),

    -- Aggregates for quick queries
    total_mw_contribution DECIMAL(10, 2),
    contributing_project_count INT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(cluster_id, facility_name, contingency_name)
);

-- ============================================================================
-- MW CONTRIBUTIONS: Project contributions to facility overloads
-- For withdrawal simulation: remove project → recalculate loading
-- ============================================================================
CREATE TABLE IF NOT EXISTS pjm_mw_contributions (
    id SERIAL PRIMARY KEY,
    facility_overload_id INT REFERENCES pjm_facility_overloads(id) ON DELETE CASCADE,
    project_id VARCHAR(20) NOT NULL,

    -- Contribution data
    mw_contribution DECIMAL(10, 4) NOT NULL,  -- 6.355
    contribution_type VARCHAR(50),            -- 50/50, Solar/Wind Harmer, Adder

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(facility_overload_id, project_id)
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Project lookups
CREATE INDEX IF NOT EXISTS idx_project_costs_project_id ON pjm_project_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_cluster ON pjm_project_costs(cluster_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_developer ON pjm_project_costs(developer);
CREATE INDEX IF NOT EXISTS idx_project_costs_utility ON pjm_project_costs(utility);
CREATE INDEX IF NOT EXISTS idx_project_costs_state ON pjm_project_costs(state);
CREATE INDEX IF NOT EXISTS idx_project_costs_risk ON pjm_project_costs(risk_score_overall);
CREATE INDEX IF NOT EXISTS idx_project_costs_cost_rank ON pjm_project_costs(cost_rank);

-- Upgrade lookups
CREATE INDEX IF NOT EXISTS idx_upgrades_cluster ON pjm_upgrades(cluster_id);
CREATE INDEX IF NOT EXISTS idx_upgrades_utility ON pjm_upgrades(utility);

-- Project-Upgrade relationships
CREATE INDEX IF NOT EXISTS idx_project_upgrades_project ON pjm_project_upgrades(project_id);
CREATE INDEX IF NOT EXISTS idx_project_upgrades_upgrade ON pjm_project_upgrades(upgrade_id);
CREATE INDEX IF NOT EXISTS idx_project_upgrades_type ON pjm_project_upgrades(link_type);

-- MW Contributions (for simulation queries)
CREATE INDEX IF NOT EXISTS idx_mw_contrib_facility ON pjm_mw_contributions(facility_overload_id);
CREATE INDEX IF NOT EXISTS idx_mw_contrib_project ON pjm_mw_contributions(project_id);

-- ============================================================================
-- VIEWS for common queries
-- ============================================================================

-- Project summary with cluster context
CREATE OR REPLACE VIEW v_project_summary AS
SELECT
    pc.project_id,
    pc.developer,
    pc.utility,
    pc.state,
    pc.fuel_type,
    pc.mw_capacity,
    pc.total_cost,
    pc.cost_per_kw,
    pc.cost_rank,
    pc.cost_percentile,
    pc.risk_score_overall,
    pc.risk_score_cost,
    pc.risk_score_concentration,
    pc.risk_score_dependency,
    pc.risk_score_timeline,
    pc.project_status,
    pc.report_url,
    c.cluster_name,
    c.phase,
    c.total_projects as cluster_total_projects
FROM pjm_project_costs pc
JOIN pjm_clusters c ON pc.cluster_id = c.id;

-- Project upgrade exposure
CREATE OR REPLACE VIEW v_project_upgrade_exposure AS
SELECT
    pu.project_id,
    u.id as upgrade_id,
    u.rtep_id,
    u.title as upgrade_title,
    u.utility as upgrade_utility,
    u.total_cost as upgrade_total_cost,
    u.shared_by_count,
    pu.allocated_cost,
    pu.percent_allocation,
    pu.link_type,
    c.cluster_name,
    c.phase
FROM pjm_project_upgrades pu
JOIN pjm_upgrades u ON pu.upgrade_id = u.id
JOIN pjm_clusters c ON pu.cluster_id = c.id;

-- Co-dependent projects (share upgrades)
CREATE OR REPLACE VIEW v_codependent_projects AS
SELECT DISTINCT
    pu1.project_id as project_a,
    pu2.project_id as project_b,
    u.id as shared_upgrade_id,
    u.rtep_id,
    u.title as upgrade_title,
    c.cluster_name,
    c.phase
FROM pjm_project_upgrades pu1
JOIN pjm_project_upgrades pu2 ON pu1.upgrade_id = pu2.upgrade_id
    AND pu1.project_id != pu2.project_id
JOIN pjm_upgrades u ON pu1.upgrade_id = u.id
JOIN pjm_clusters c ON pu1.cluster_id = c.id
WHERE pu1.link_type = 'COST_ALLOCATED'
  AND pu2.link_type = 'COST_ALLOCATED';

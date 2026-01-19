# Data Pipeline

Scraping, extraction, and loading pipeline for PJM cluster study data.

## Overview

This pipeline extracts cost allocation data from PJM individual project SIS (System Impact Study) reports and loads it into PostgreSQL for the GridAgent AI assistant.

## Structure

```
data_pipeline/
├── config.py              # Configuration (paths, delays, weights)
├── run_scraper.py         # Main entry point
├── test_scraper.py        # Quick scraper test
├── scrapers/
│   ├── __init__.py
│   └── pjm_scraper.py     # PJM HTML report scraper
├── migrations/
│   └── 001_cluster_tables.sql  # Database schema
├── output/                # Scraped data (JSON, generated)
└── README.md
```

## Quick Start

```bash
# 1. Install dependencies
pip install pandas requests beautifulsoup4 lxml openpyxl python-dotenv

# 2. Test scraper on single project
cd data_pipeline
python test_scraper.py

# 3. Scrape TC2 Phase 1 (test with 10 projects)
python run_scraper.py --cluster TC2 --phase PHASE_1 --limit 10

# 4. Full scrape (~648 projects, takes ~30 min)
python run_scraper.py --cluster TC2 --phase PHASE_1

# 5. Scrape AND load into database (all-in-one)
python load_to_db.py --scrape --cluster TC2 --phase PHASE_1 --limit 10

# 6. Load from existing JSON file
python load_to_db.py --json output/scraped_TC2_PHASE_1_YYYYMMDD.json
```

## Database Schema

### Tables

| Table | Purpose | Est. Rows |
|-------|---------|-----------|
| `pjm_clusters` | Cluster metadata (TC1, TC2) | ~10 |
| `pjm_project_costs` | Cost per project per phase | ~1,600 |
| `pjm_upgrades` | Network upgrades | ~500 |
| `pjm_project_upgrades` | Project-upgrade cost allocation | ~5,000 |
| `pjm_facility_overloads` | Line loading data | ~2,000 |
| `pjm_mw_contributions` | MW contributions (for simulation) | ~100,000 |

### Key Views

- `v_project_summary` - Project with cluster context and risk scores
- `v_project_upgrade_exposure` - Which upgrades each project pays for
- `v_codependent_projects` - Projects that share upgrades

## Data Extracted

From each PJM HTML report:

### Cost Summary (Table 1)
- Total cost
- TOIF (Transmission Owner Interconnection Facilities)
- Stand-alone network upgrades
- Network upgrades
- System reliability upgrades

### Readiness Deposits (Table 2)
- RD1 amount (already paid)
- RD2 amount (due at Decision Point 1)

### Upgrade Allocations (Table 113+)
- RTEP ID, TO ID
- Utility (Dayton, EKPC, AEP, etc.)
- Description
- Total cost and allocated cost
- Link type: COST_ALLOCATED or TAGGED_NO_COST

### Facility Overloads (Table 8)
- Facility name, contingency
- Loading percentage, rating MVA
- MVA to mitigate

### MW Contributions (Tables 9+)
- Project ID, MW contribution
- Contribution type (50/50, Solar/Wind Harmer, Adder)

## Risk Score Calculation

Composite risk score (0-100) with four components:

| Component | Weight | What it measures |
|-----------|--------|------------------|
| Cost | 35% | $/kW percentile in cluster |
| Concentration | 25% | % of cost from single largest upgrade |
| Dependency | 25% | Risk of co-dependent projects |
| Timeline | 15% | Tagged-but-no-cost upgrades (interim deliverability) |

## MVP Scope

- **Cluster**: TC2 only
- **Phase**: Phase 1 only
- **Projects**: ~648

## Future Expansion

1. **TC1 Historical**: Phase 1, 2, 3 for dropout analysis
2. **TC2 Phase 2**: When results are published
3. **Withdrawal Simulation**: Full DFAX-based recalculation
4. **Multi-ISO**: MISO, SPP with different scrapers

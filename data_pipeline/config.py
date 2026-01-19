"""
Data Pipeline Configuration
"""
import os
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_PIPELINE_DIR = Path(__file__).parent
EXCEL_FILE = PROJECT_ROOT / "CycleProjects-All (3).xlsx"

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Scraping
SCRAPE_DELAY_SECONDS = 0.5  # Delay between requests to avoid rate limiting
MAX_RETRIES = 3
REQUEST_TIMEOUT = 30

# PJM URLs
PJM_BASE_URL = "https://www.pjm.com"
PJM_QUEUE_PATH = "/pjmfiles/pub/planning/project-queues"

# Cluster configurations
CLUSTERS = {
    "TC2": {
        "phases": ["PHASE_1"],  # MVP: Only Phase 1
        "project_id_prefixes": ["AG2", "AH1"],
    },
    # Future: Add TC1 with Phase 1, 2, 3
    # "TC1": {
    #     "phases": ["PHASE_1", "PHASE_2", "PHASE_3"],
    #     "project_id_prefixes": ["AE1", "AE2", "AF1", "AG1"],
    # },
}

# Risk Score Weights (configurable for future)
RISK_WEIGHTS = {
    "cost": 0.35,           # $/kW percentile
    "concentration": 0.25,  # % from single upgrade
    "dependency": 0.25,     # Co-dependent project risk
    "timeline": 0.15,       # Tagged-no-cost upgrades
}

# Risk Score Thresholds
RISK_THRESHOLDS = {
    "low": 25,
    "medium": 50,
    "high": 75,
    # Above 75 = critical
}

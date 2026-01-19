"""
PJM Cluster Study Report Scraper

Scrapes individual project HTML reports from PJM and extracts:
- Cost summary
- Readiness deposits
- Upgrade allocations
- Facility overloads with MW contributions
"""
import pandas as pd
import requests
import time
import re
from io import StringIO
from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class CostSummary:
    """Cost breakdown from Table 1"""
    total_cost: float = 0.0
    toif_cost: float = 0.0
    stand_alone_cost: float = 0.0
    network_upgrade_cost: float = 0.0
    system_reliability_cost: float = 0.0
    cost_subject_to_readiness: float = 0.0


@dataclass
class ReadinessDeposit:
    """Readiness deposit info from Table 2"""
    rd1_amount: float = 0.0
    rd2_amount: float = 0.0


@dataclass
class Upgrade:
    """Individual upgrade allocation"""
    rtep_id: str = ""
    to_id: str = ""
    utility: str = ""
    title: str = ""
    total_cost: float = 0.0
    allocated_cost: float = 0.0


@dataclass
class ProjectUpgradeLink:
    """Project's share of an upgrade"""
    project_id: str = ""
    upgrade_rtep_id: str = ""
    mw_impact: float = 0.0
    percent_allocation: float = 0.0
    allocated_cost: float = 0.0


@dataclass
class FacilityOverload:
    """Facility overload data"""
    facility_name: str = ""
    contingency_name: str = ""
    contingency_type: str = ""
    loading_pct: float = 0.0
    rating_mva: float = 0.0
    mva_to_mitigate: float = 0.0


@dataclass
class MWContribution:
    """MW contribution to a facility overload"""
    facility_name: str = ""
    contingency_name: str = ""
    project_id: str = ""
    mw_contribution: float = 0.0
    contribution_type: str = ""


@dataclass
class ScrapedReport:
    """Complete scraped data from one project report"""
    project_id: str = ""
    cluster: str = ""
    phase: str = ""
    report_url: str = ""

    cost_summary: CostSummary = field(default_factory=CostSummary)
    readiness: ReadinessDeposit = field(default_factory=ReadinessDeposit)
    upgrades: list[Upgrade] = field(default_factory=list)
    project_upgrade_links: list[ProjectUpgradeLink] = field(default_factory=list)
    facility_overloads: list[FacilityOverload] = field(default_factory=list)
    mw_contributions: list[MWContribution] = field(default_factory=list)

    # Errors during scraping
    errors: list[str] = field(default_factory=list)


def parse_currency(value: str) -> float:
    """Parse currency string to float: '$1,234,567' -> 1234567.0"""
    if pd.isna(value) or value == "":
        return 0.0
    # Remove $, commas, parentheses, and notes like "(See Note 1)"
    cleaned = re.sub(r'[\$,\(\)]', '', str(value))
    cleaned = re.sub(r'\(See Note.*?\)', '', cleaned).strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def parse_percentage(value: str) -> float:
    """Parse percentage string: '32.7%' -> 0.327"""
    if pd.isna(value) or value == "":
        return 0.0
    cleaned = str(value).replace('%', '').strip()
    try:
        return float(cleaned) / 100.0
    except ValueError:
        return 0.0


def parse_mw(value: str) -> float:
    """Parse MW string: '20.2 MW' -> 20.2"""
    if pd.isna(value) or value == "":
        return 0.0
    cleaned = str(value).replace('MW', '').strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def parse_loading(value: str) -> float:
    """Parse loading percentage: '121.47 %' -> 121.47"""
    if pd.isna(value) or value == "":
        return 0.0
    cleaned = str(value).replace('%', '').strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


class PJMReportScraper:
    """Scraper for PJM individual project reports"""

    def __init__(self, delay_seconds: float = 0.5):
        self.delay_seconds = delay_seconds
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; QueueInsights/1.0)'
        })

    def scrape_report(self, url: str, project_id: str, cluster: str, phase: str) -> ScrapedReport:
        """Scrape a single project report"""
        report = ScrapedReport(
            project_id=project_id,
            cluster=cluster,
            phase=phase,
            report_url=url
        )

        try:
            logger.info(f"Scraping {project_id}: {url}")

            # Fetch HTML
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            # Parse all tables
            tables = pd.read_html(StringIO(response.text))
            logger.debug(f"Found {len(tables)} tables")

            # Extract data from tables
            self._extract_cost_summary(tables, report)
            self._extract_readiness(tables, report)
            self._extract_upgrades(tables, report)
            self._extract_facility_overloads(tables, report)
            self._extract_mw_contributions(tables, report)

            # Rate limiting
            time.sleep(self.delay_seconds)

        except Exception as e:
            logger.error(f"Error scraping {project_id}: {e}")
            report.errors.append(str(e))

        return report

    def _extract_cost_summary(self, tables: list[pd.DataFrame], report: ScrapedReport):
        """Extract cost summary from Table 1"""
        try:
            if len(tables) < 1:
                return

            df = tables[0]

            # Table 1 has multi-level columns, flatten them
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = [' '.join(str(c) for c in col).strip() for col in df.columns]

            # Find the cost allocated column
            cost_col = None
            for col in df.columns:
                if 'Cost Allocated' in str(col):
                    cost_col = col
                    break

            if cost_col is None:
                report.errors.append("Could not find Cost Allocated column")
                return

            # Find description column
            desc_col = df.columns[0]

            # Extract costs by description
            for _, row in df.iterrows():
                desc = str(row[desc_col]).strip()
                cost = parse_currency(row[cost_col])

                if 'Total' in desc and 'Grand' not in desc:
                    report.cost_summary.total_cost = cost
                elif 'Transmission Owner Interconnection' in desc or 'TOIF' in desc:
                    report.cost_summary.toif_cost = cost
                elif 'Stand Alone' in desc:
                    report.cost_summary.stand_alone_cost = cost
                elif 'Network Upgrade' in desc and 'System' not in desc:
                    report.cost_summary.network_upgrade_cost = cost
                elif 'Steady State' in desc or 'System Reliability' in desc:
                    report.cost_summary.system_reliability_cost = cost

        except Exception as e:
            report.errors.append(f"Cost summary extraction error: {e}")

    def _extract_readiness(self, tables: list[pd.DataFrame], report: ScrapedReport):
        """Extract readiness deposit info from Table 2"""
        try:
            if len(tables) < 2:
                return

            df = tables[1]

            # Flatten columns if multi-level
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = [' '.join(str(c) for c in col).strip() for col in df.columns]

            # Look for RD1 and RD2 values
            for col in df.columns:
                col_str = str(col)
                if 'RD1' in col_str or 'Received' in col_str:
                    if len(df) > 0:
                        report.readiness.rd1_amount = parse_currency(df.iloc[0][col])
                elif 'RD2' in col_str or 'due' in col_str.lower():
                    if len(df) > 0:
                        report.readiness.rd2_amount = parse_currency(df.iloc[0][col])

        except Exception as e:
            report.errors.append(f"Readiness extraction error: {e}")

    def _extract_upgrades(self, tables: list[pd.DataFrame], report: ScrapedReport):
        """Extract upgrade allocations from various tables"""
        try:
            # Look for tables with upgrade data (typically Table 3-5, and Table 113+)
            for i, df in enumerate(tables):
                # Flatten columns
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = [' '.join(str(c) for c in col).strip() for col in df.columns]

                col_str = ' '.join(str(c) for c in df.columns)

                # Look for upgrade summary table (has TO, RTEP ID, Title, Allocated Cost)
                if 'RTEP ID' in col_str and 'Title' in col_str and 'Allocated Cost' in col_str:
                    self._parse_upgrade_summary_table(df, report)

                # Look for project allocation tables (has Project, MW Impact, Percent Allocation)
                elif 'Project' in col_str and 'MW Impact' in col_str and 'Percent Allocation' in col_str:
                    self._parse_project_allocation_table(df, report)

        except Exception as e:
            report.errors.append(f"Upgrade extraction error: {e}")

    def _parse_upgrade_summary_table(self, df: pd.DataFrame, report: ScrapedReport):
        """Parse the upgrade summary table (Table 113)"""
        try:
            for _, row in df.iterrows():
                # Skip Grand Total row
                if 'Grand Total' in str(row.iloc[0]):
                    continue

                upgrade = Upgrade()

                # Column mapping varies, try to find them
                for col in df.columns:
                    val = row[col]
                    col_lower = col.lower()

                    if 'to' == col_lower.strip() or col.strip() == 'TO':
                        upgrade.utility = str(val).strip() if pd.notna(val) else ""
                    elif 'rtep' in col_lower:
                        # Format: "n9670.0 / DAYr190039" or "(Pending) / EKPC-tc2-nu007"
                        val_str = str(val).strip() if pd.notna(val) else ""
                        if ' / ' in val_str:
                            parts = val_str.split(' / ')
                            upgrade.rtep_id = parts[0].strip()
                            upgrade.to_id = parts[1].strip() if len(parts) > 1 else ""
                        else:
                            upgrade.rtep_id = val_str
                    elif 'title' in col_lower or 'description' in col_lower:
                        upgrade.title = str(val).strip() if pd.notna(val) else ""
                    elif 'allocated' in col_lower and 'cost' in col_lower:
                        upgrade.allocated_cost = parse_currency(val)
                    elif 'total' in col_lower and 'cost' in col_lower:
                        upgrade.total_cost = parse_currency(val)

                # Only add if we have meaningful data
                if upgrade.rtep_id or upgrade.title:
                    report.upgrades.append(upgrade)

        except Exception as e:
            report.errors.append(f"Upgrade summary parse error: {e}")

    def _parse_project_allocation_table(self, df: pd.DataFrame, report: ScrapedReport):
        """Parse project allocation tables (Tables 117, 119, etc.)"""
        try:
            for _, row in df.iterrows():
                link = ProjectUpgradeLink()
                link.project_id = report.project_id  # Will need to be updated based on table context

                for col in df.columns:
                    val = row[col]
                    col_lower = col.lower()

                    if 'project' in col_lower:
                        link.project_id = str(val).strip() if pd.notna(val) else ""
                    elif 'mw impact' in col_lower:
                        link.mw_impact = parse_mw(val)
                    elif 'percent' in col_lower:
                        link.percent_allocation = parse_percentage(val)
                    elif 'allocated' in col_lower and 'cost' in col_lower:
                        link.allocated_cost = parse_currency(val)

                if link.project_id and link.allocated_cost > 0:
                    report.project_upgrade_links.append(link)

        except Exception as e:
            report.errors.append(f"Project allocation parse error: {e}")

    def _extract_facility_overloads(self, tables: list[pd.DataFrame], report: ScrapedReport):
        """Extract facility overload data from Table 8"""
        try:
            # Table 8 typically has: Study Area, Facility Description, Contingency, Loading, Rating
            for i, df in enumerate(tables):
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = [' '.join(str(c) for c in col).strip() for col in df.columns]

                col_str = ' '.join(str(c) for c in df.columns)

                # Look for facility impact table
                if 'Facility' in col_str and 'Loading' in col_str and 'Rating' in col_str:
                    for _, row in df.iterrows():
                        overload = FacilityOverload()

                        for col in df.columns:
                            val = row[col]
                            col_lower = col.lower()

                            if 'facility' in col_lower:
                                overload.facility_name = str(val).strip() if pd.notna(val) else ""
                            elif 'contingency' in col_lower and 'name' in col_lower:
                                overload.contingency_name = str(val).strip() if pd.notna(val) else ""
                            elif 'contingency' in col_lower and 'type' in col_lower:
                                overload.contingency_type = str(val).strip() if pd.notna(val) else ""
                            elif 'loading' in col_lower:
                                overload.loading_pct = parse_loading(val)
                            elif 'rating' in col_lower:
                                try:
                                    overload.rating_mva = float(val) if pd.notna(val) else 0.0
                                except:
                                    overload.rating_mva = 0.0
                            elif 'mitigate' in col_lower:
                                try:
                                    overload.mva_to_mitigate = float(val) if pd.notna(val) else 0.0
                                except:
                                    overload.mva_to_mitigate = 0.0

                        if overload.facility_name:
                            report.facility_overloads.append(overload)
                    break  # Only process first matching table

        except Exception as e:
            report.errors.append(f"Facility overload extraction error: {e}")

    def _extract_mw_contributions(self, tables: list[pd.DataFrame], report: ScrapedReport):
        """Extract MW contributions from Tables 9+ (project contributions to overloads)"""
        try:
            # Look for tables with Bus #, Bus Name, Type, MW Contribution
            for i, df in enumerate(tables):
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = [' '.join(str(c) for c in col).strip() for col in df.columns]

                col_str = ' '.join(str(c) for c in df.columns).lower()

                # MW contribution tables have: Bus #, Bus Name, Type, MW Contribution
                if 'bus' in col_str and 'mw contribution' in col_str:
                    for _, row in df.iterrows():
                        contrib = MWContribution()

                        for col in df.columns:
                            val = row[col]
                            col_lower = col.lower()

                            if 'bus name' in col_lower or col_lower == 'bus name':
                                bus_name = str(val).strip() if pd.notna(val) else ""
                                # Extract project ID from bus name (e.g., "AG2-548 GEN" -> "AG2-548")
                                if '_GEN' in bus_name or ' GEN' in bus_name:
                                    contrib.project_id = bus_name.replace('_GEN', '').replace(' GEN', '').strip()
                                else:
                                    contrib.project_id = bus_name
                            elif 'type' in col_lower:
                                contrib.contribution_type = str(val).strip() if pd.notna(val) else ""
                            elif 'mw contribution' in col_lower:
                                try:
                                    contrib.mw_contribution = float(val) if pd.notna(val) else 0.0
                                except:
                                    contrib.mw_contribution = 0.0

                        # Only add if looks like a project contribution
                        if contrib.project_id and '-' in contrib.project_id and contrib.mw_contribution > 0:
                            report.mw_contributions.append(contrib)

        except Exception as e:
            report.errors.append(f"MW contribution extraction error: {e}")


def load_project_list(excel_path: Path, cluster: str = None, phase: str = None) -> pd.DataFrame:
    """Load project list from Excel file"""
    df = pd.read_excel(excel_path)

    # Filter by cluster if specified
    if cluster:
        df = df[df['Cycle'] == cluster]

    # Filter by phase if specified (need to check Stage column)
    if phase:
        # Stage column has values like "Phase 2", "PHASE 1", etc.
        phase_pattern = phase.replace('_', ' ').lower()
        df = df[df['Stage'].str.lower().str.contains(phase_pattern.replace('phase_', 'phase '))]

    return df


def get_report_url(row: pd.Series, phase: str) -> Optional[str]:
    """Get the appropriate report URL for a project/phase"""
    # Column mapping: Phase 1 SIS Report, Phase 2 SIS Report, etc.
    phase_num = phase.replace('PHASE_', '').replace('PHASE', '')
    col_name = f'Phase {phase_num} SIS Report'

    if col_name in row.index:
        url = row[col_name]
        if pd.notna(url) and str(url).startswith('http'):
            return str(url)

    return None


if __name__ == "__main__":
    # Test scraping a single report
    scraper = PJMReportScraper(delay_seconds=0.5)

    test_url = "https://www.pjm.com/pjmfiles/pub/planning/project-queues/TC2/PHASE_1/AH1-665/AH1-665_imp_PHASE_1.htm"
    report = scraper.scrape_report(test_url, "AH1-665", "TC2", "PHASE_1")

    print(f"\n=== SCRAPED REPORT: {report.project_id} ===")
    print(f"Total Cost: ${report.cost_summary.total_cost:,.0f}")
    print(f"TOIF: ${report.cost_summary.toif_cost:,.0f}")
    print(f"Network Upgrades: ${report.cost_summary.network_upgrade_cost:,.0f}")
    print(f"System Reliability: ${report.cost_summary.system_reliability_cost:,.0f}")
    print(f"RD1: ${report.readiness.rd1_amount:,.0f}")
    print(f"RD2: ${report.readiness.rd2_amount:,.0f}")
    print(f"Upgrades found: {len(report.upgrades)}")
    print(f"Project-Upgrade links: {len(report.project_upgrade_links)}")
    print(f"Facility overloads: {len(report.facility_overloads)}")
    print(f"MW contributions: {len(report.mw_contributions)}")

    if report.errors:
        print(f"Errors: {report.errors}")

    print("\n=== UPGRADES ===")
    for u in report.upgrades[:5]:
        print(f"  {u.rtep_id}: ${u.allocated_cost:,.0f} - {u.title[:60]}...")

"""
Main script to run PJM cluster data scraper and load into database.

Usage:
    python run_scraper.py --cluster TC2 --phase PHASE_1 --limit 10  # Test with 10 projects
    python run_scraper.py --cluster TC2 --phase PHASE_1              # Full scrape
"""
import argparse
import json
import os
from pathlib import Path
from datetime import datetime

import pandas as pd
from dotenv import load_dotenv

from config import PROJECT_ROOT, EXCEL_FILE, SCRAPE_DELAY_SECONDS
from scrapers.pjm_scraper import PJMReportScraper, ScrapedReport

# Load environment variables
load_dotenv(PROJECT_ROOT / "backend" / ".env")


def load_project_list(cluster: str, phase: str) -> pd.DataFrame:
    """Load project list from Excel and filter by cluster/phase"""
    print(f"Loading projects from {EXCEL_FILE}")
    df = pd.read_excel(EXCEL_FILE)

    # Filter by cluster
    df = df[df['Cycle'] == cluster]
    print(f"  Found {len(df)} projects in {cluster}")

    # Get report URL column based on phase
    phase_num = phase.replace('PHASE_', '')
    report_col = f'Phase {phase_num} SIS Report'

    if report_col not in df.columns:
        raise ValueError(f"Column '{report_col}' not found in Excel file")

    # Filter to only projects with valid report URLs
    df = df[df[report_col].notna()]
    df = df[df[report_col].str.startswith('http', na=False)]
    print(f"  {len(df)} projects have {phase} reports")

    return df, report_col


def scrape_projects(
    df: pd.DataFrame,
    report_col: str,
    cluster: str,
    phase: str,
    limit: int = None,
    output_dir: Path = None
) -> list[ScrapedReport]:
    """Scrape all projects and return results"""
    scraper = PJMReportScraper(delay_seconds=SCRAPE_DELAY_SECONDS)

    if limit:
        df = df.head(limit)
        print(f"  Limiting to {limit} projects for testing")

    reports = []
    errors = []

    for i, (_, row) in enumerate(df.iterrows()):
        project_id = row['Project ID']
        url = row[report_col]

        print(f"[{i+1}/{len(df)}] Scraping {project_id}...")

        try:
            report = scraper.scrape_report(url, project_id, cluster, phase)

            # Add metadata from Excel
            report.excel_data = {
                'developer': row.get('Developer', ''),
                'utility': row.get('Transmission Owner', ''),
                'state': row.get('State', ''),
                'county': row.get('County', ''),
                'fuel_type': row.get('Fuel', ''),
                'mw_capacity': row.get('MW Capacity', 0),
                'mw_energy': row.get('MW Energy', 0),
                'status': row.get('Status', ''),
                'requested_cod': row.get('Requested In-Service Date', None),
            }

            reports.append(report)

            # Print summary
            print(f"    Total: ${report.cost_summary.total_cost:,.0f} | "
                  f"Upgrades: {len(report.upgrades)} | "
                  f"Errors: {len(report.errors)}")

        except Exception as e:
            print(f"    ERROR: {e}")
            errors.append({'project_id': project_id, 'error': str(e)})

    print(f"\nScraping complete: {len(reports)} succeeded, {len(errors)} failed")

    # Save intermediate results
    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"scraped_{cluster}_{phase}_{timestamp}.json"
        save_reports_json(reports, output_file)
        print(f"Saved results to {output_file}")

    return reports


def save_reports_json(reports: list[ScrapedReport], filepath: Path):
    """Save scraped reports to JSON for inspection/debugging"""
    data = []
    for r in reports:
        data.append({
            'project_id': r.project_id,
            'cluster': r.cluster,
            'phase': r.phase,
            'report_url': r.report_url,
            'cost_summary': {
                'total_cost': r.cost_summary.total_cost,
                'toif_cost': r.cost_summary.toif_cost,
                'stand_alone_cost': r.cost_summary.stand_alone_cost,
                'network_upgrade_cost': r.cost_summary.network_upgrade_cost,
                'system_reliability_cost': r.cost_summary.system_reliability_cost,
            },
            'readiness': {
                'rd1_amount': r.readiness.rd1_amount,
                'rd2_amount': r.readiness.rd2_amount,
            },
            'upgrades_count': len(r.upgrades),
            'upgrades': [
                {
                    'rtep_id': u.rtep_id,
                    'utility': u.utility,
                    'title': u.title[:100] if u.title else '',
                    'allocated_cost': u.allocated_cost,
                }
                for u in r.upgrades
            ],
            'facility_overloads_count': len(r.facility_overloads),
            'mw_contributions_count': len(r.mw_contributions),
            'errors': r.errors,
            'excel_data': getattr(r, 'excel_data', {}),
        })

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)


def main():
    parser = argparse.ArgumentParser(description='Scrape PJM cluster study reports')
    parser.add_argument('--cluster', default='TC2', help='Cluster name (TC1, TC2)')
    parser.add_argument('--phase', default='PHASE_1', help='Phase (PHASE_1, PHASE_2, PHASE_3)')
    parser.add_argument('--limit', type=int, help='Limit number of projects (for testing)')
    parser.add_argument('--output', default='output', help='Output directory for JSON results')

    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"PJM Cluster Data Scraper")
    print(f"Cluster: {args.cluster} | Phase: {args.phase}")
    print(f"{'='*60}\n")

    # Load project list
    df, report_col = load_project_list(args.cluster, args.phase)

    # Scrape
    output_dir = Path(args.output)
    reports = scrape_projects(
        df,
        report_col,
        args.cluster,
        args.phase,
        limit=args.limit,
        output_dir=output_dir
    )

    # Summary stats
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")

    total_cost = sum(r.cost_summary.total_cost for r in reports)
    total_upgrades = sum(len(r.upgrades) for r in reports)
    total_mw_contrib = sum(len(r.mw_contributions) for r in reports)

    print(f"Projects scraped: {len(reports)}")
    print(f"Total cost allocated: ${total_cost:,.0f}")
    print(f"Total upgrades: {total_upgrades}")
    print(f"Total MW contributions: {total_mw_contrib:,}")

    # Cost distribution
    costs = [r.cost_summary.total_cost for r in reports if r.cost_summary.total_cost > 0]
    if costs:
        mw_caps = [getattr(r, 'excel_data', {}).get('mw_capacity', 0) or 0 for r in reports]
        cost_per_kw = []
        for r in reports:
            mw = getattr(r, 'excel_data', {}).get('mw_capacity', 0) or 0
            if mw > 0 and r.cost_summary.total_cost > 0:
                cost_per_kw.append(r.cost_summary.total_cost / (mw * 1000))

        if cost_per_kw:
            import statistics
            print(f"\n$/kW Statistics:")
            print(f"  Min: ${min(cost_per_kw):,.0f}/kW")
            print(f"  Max: ${max(cost_per_kw):,.0f}/kW")
            print(f"  Median: ${statistics.median(cost_per_kw):,.0f}/kW")
            print(f"  Mean: ${statistics.mean(cost_per_kw):,.0f}/kW")


if __name__ == "__main__":
    main()

"""
Load scraped PJM data into Supabase PostgreSQL database.

Usage:
    python load_to_db.py --json output/scraped_TC2_PHASE_1_YYYYMMDD.json
    python load_to_db.py --scrape --cluster TC2 --phase PHASE_1 --limit 10
"""
import argparse
import json
import os
from pathlib import Path
from datetime import datetime
from decimal import Decimal

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

from config import PROJECT_ROOT, RISK_WEIGHTS, RISK_THRESHOLDS

# Load environment variables
load_dotenv(PROJECT_ROOT / "backend" / ".env")


def get_db_connection():
    """Get database connection from DATABASE_URL"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not set in environment")
    return psycopg2.connect(database_url)


def ensure_cluster_exists(conn, cluster_name: str, phase: str) -> int:
    """Create or get cluster record, return cluster_id"""
    with conn.cursor() as cur:
        # Check if exists
        cur.execute(
            "SELECT id FROM pjm_clusters WHERE cluster_name = %s AND phase = %s",
            (cluster_name, phase)
        )
        row = cur.fetchone()
        if row:
            return row[0]

        # Create new
        cur.execute(
            """
            INSERT INTO pjm_clusters (cluster_name, phase, created_at)
            VALUES (%s, %s, NOW())
            RETURNING id
            """,
            (cluster_name, phase)
        )
        cluster_id = cur.fetchone()[0]
        conn.commit()
        return cluster_id


def load_project(conn, cluster_id: int, report: dict) -> int:
    """Load a single project and return project cost ID"""
    excel_data = report.get('excel_data', {})
    cost = report.get('cost_summary', {})
    readiness = report.get('readiness', {})

    # Calculate cost per kW
    mw_capacity = excel_data.get('mw_capacity', 0) or 0
    total_cost = cost.get('total_cost', 0) or 0
    cost_per_kw = (total_cost / (mw_capacity * 1000)) if mw_capacity > 0 else None

    with conn.cursor() as cur:
        # Upsert project cost record
        cur.execute(
            """
            INSERT INTO pjm_project_costs (
                project_id, cluster_id, utility, developer, state, county,
                fuel_type, mw_capacity, mw_energy, project_status,
                total_cost, cost_per_kw, toif_cost, stand_alone_cost,
                network_upgrade_cost, system_reliability_cost,
                rd1_amount, rd2_amount, report_url, scraped_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s,
                %s, %s, %s, NOW()
            )
            ON CONFLICT (project_id, cluster_id) DO UPDATE SET
                utility = EXCLUDED.utility,
                developer = EXCLUDED.developer,
                state = EXCLUDED.state,
                county = EXCLUDED.county,
                fuel_type = EXCLUDED.fuel_type,
                mw_capacity = EXCLUDED.mw_capacity,
                mw_energy = EXCLUDED.mw_energy,
                project_status = EXCLUDED.project_status,
                total_cost = EXCLUDED.total_cost,
                cost_per_kw = EXCLUDED.cost_per_kw,
                toif_cost = EXCLUDED.toif_cost,
                stand_alone_cost = EXCLUDED.stand_alone_cost,
                network_upgrade_cost = EXCLUDED.network_upgrade_cost,
                system_reliability_cost = EXCLUDED.system_reliability_cost,
                rd1_amount = EXCLUDED.rd1_amount,
                rd2_amount = EXCLUDED.rd2_amount,
                report_url = EXCLUDED.report_url,
                scraped_at = NOW()
            RETURNING id
            """,
            (
                report['project_id'],
                cluster_id,
                excel_data.get('utility', ''),
                excel_data.get('developer', ''),
                excel_data.get('state', ''),
                excel_data.get('county', ''),
                excel_data.get('fuel_type', ''),
                mw_capacity or None,
                excel_data.get('mw_energy', None),
                excel_data.get('status', 'Active'),
                total_cost or None,
                cost_per_kw,
                cost.get('toif_cost', None),
                cost.get('stand_alone_cost', None),
                cost.get('network_upgrade_cost', None),
                cost.get('system_reliability_cost', None),
                readiness.get('rd1_amount', None),
                readiness.get('rd2_amount', None),
                report.get('report_url', '')
            )
        )
        return cur.fetchone()[0]


def load_upgrades(conn, cluster_id: int, project_id: str, upgrades: list) -> dict:
    """Load upgrades and return mapping of rtep_id -> upgrade_id"""
    upgrade_map = {}

    with conn.cursor() as cur:
        for u in upgrades:
            rtep_id = u.get('rtep_id', '')
            to_id = u.get('to_id', '')

            # Upsert upgrade
            cur.execute(
                """
                INSERT INTO pjm_upgrades (
                    cluster_id, rtep_id, to_id, utility, title, total_cost
                ) VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (cluster_id, rtep_id, to_id) DO UPDATE SET
                    utility = COALESCE(EXCLUDED.utility, pjm_upgrades.utility),
                    title = COALESCE(EXCLUDED.title, pjm_upgrades.title),
                    total_cost = GREATEST(EXCLUDED.total_cost, pjm_upgrades.total_cost)
                RETURNING id
                """,
                (
                    cluster_id,
                    rtep_id,
                    to_id,
                    u.get('utility', ''),
                    u.get('title', ''),
                    u.get('total_cost', None)
                )
            )
            upgrade_id = cur.fetchone()[0]
            upgrade_map[(rtep_id, to_id)] = upgrade_id

            # Create project-upgrade link
            # Determine link_type: if allocated_cost > 0, it's COST_ALLOCATED
            allocated_cost = u.get('allocated_cost', 0) or 0
            link_type = 'COST_ALLOCATED' if allocated_cost > 0 else 'TAGGED_NO_COST'

            cur.execute(
                """
                INSERT INTO pjm_project_upgrades (
                    project_id, upgrade_id, cluster_id, link_type,
                    allocated_cost
                ) VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (project_id, upgrade_id) DO UPDATE SET
                    link_type = EXCLUDED.link_type,
                    allocated_cost = EXCLUDED.allocated_cost
                """,
                (
                    project_id,
                    upgrade_id,
                    cluster_id,
                    link_type,
                    allocated_cost or None
                )
            )

    return upgrade_map


def calculate_risk_scores(conn, cluster_id: int):
    """Calculate risk scores for all projects in a cluster"""
    print("\nCalculating risk scores...")

    with conn.cursor() as cur:
        # 1. Calculate cost percentile rank
        cur.execute(
            """
            WITH ranked AS (
                SELECT id, cost_per_kw,
                    PERCENT_RANK() OVER (ORDER BY cost_per_kw) * 100 as percentile,
                    RANK() OVER (ORDER BY cost_per_kw) as rank
                FROM pjm_project_costs
                WHERE cluster_id = %s AND cost_per_kw IS NOT NULL AND cost_per_kw > 0
            )
            UPDATE pjm_project_costs pc
            SET cost_percentile = r.percentile,
                cost_rank = r.rank,
                risk_score_cost = r.percentile
            FROM ranked r
            WHERE pc.id = r.id
            """,
            (cluster_id,)
        )
        print(f"  Updated cost percentiles for {cur.rowcount} projects")

        # 2. Calculate concentration risk (% of cost from single largest upgrade)
        cur.execute(
            """
            WITH max_upgrade AS (
                SELECT pu.project_id,
                    MAX(pu.allocated_cost) as max_cost,
                    SUM(pu.allocated_cost) as total_cost
                FROM pjm_project_upgrades pu
                WHERE pu.cluster_id = %s AND pu.link_type = 'COST_ALLOCATED'
                GROUP BY pu.project_id
            )
            UPDATE pjm_project_costs pc
            SET risk_score_concentration =
                CASE WHEN mu.total_cost > 0
                     THEN (mu.max_cost / mu.total_cost) * 100
                     ELSE 0 END
            FROM max_upgrade mu
            WHERE pc.project_id = mu.project_id AND pc.cluster_id = %s
            """,
            (cluster_id, cluster_id)
        )
        print(f"  Updated concentration risk for {cur.rowcount} projects")

        # 3. Calculate dependency risk (number of co-dependent projects)
        cur.execute(
            """
            WITH shared_count AS (
                SELECT pu.project_id,
                    COUNT(DISTINCT pu2.project_id) as codependent_count
                FROM pjm_project_upgrades pu
                JOIN pjm_project_upgrades pu2 ON pu.upgrade_id = pu2.upgrade_id
                    AND pu.project_id != pu2.project_id
                WHERE pu.cluster_id = %s
                    AND pu.link_type = 'COST_ALLOCATED'
                    AND pu2.link_type = 'COST_ALLOCATED'
                GROUP BY pu.project_id
            ),
            max_codep AS (
                SELECT MAX(codependent_count) as max_count FROM shared_count
            )
            UPDATE pjm_project_costs pc
            SET risk_score_dependency =
                CASE WHEN mc.max_count > 0
                     THEN (sc.codependent_count::float / mc.max_count) * 100
                     ELSE 0 END
            FROM shared_count sc, max_codep mc
            WHERE pc.project_id = sc.project_id AND pc.cluster_id = %s
            """,
            (cluster_id, cluster_id)
        )
        print(f"  Updated dependency risk for {cur.rowcount} projects")

        # 4. Calculate overload risk (total number of upgrades/overloads tagged)
        # More overloads = more complexity = higher risk
        cur.execute(
            """
            WITH upgrade_counts AS (
                SELECT project_id,
                    COUNT(*) as total_upgrades
                FROM pjm_project_upgrades
                WHERE cluster_id = %s
                GROUP BY project_id
            ),
            max_upgrades AS (
                SELECT MAX(total_upgrades) as max_count FROM upgrade_counts
            )
            UPDATE pjm_project_costs pc
            SET risk_score_timeline =
                CASE WHEN mu.max_count > 0
                     THEN (uc.total_upgrades::float / mu.max_count) * 100
                     ELSE 0 END
            FROM upgrade_counts uc, max_upgrades mu
            WHERE pc.project_id = uc.project_id AND pc.cluster_id = %s
            """,
            (cluster_id, cluster_id)
        )
        print(f"  Updated overload risk for {cur.rowcount} projects")

        # 5. Calculate overall risk score (weighted average)
        cur.execute(
            """
            UPDATE pjm_project_costs
            SET risk_score_overall =
                COALESCE(risk_score_cost, 0) * %s +
                COALESCE(risk_score_concentration, 0) * %s +
                COALESCE(risk_score_dependency, 0) * %s +
                COALESCE(risk_score_timeline, 0) * %s
            WHERE cluster_id = %s
            """,
            (
                RISK_WEIGHTS['cost'],
                RISK_WEIGHTS['concentration'],
                RISK_WEIGHTS['dependency'],
                RISK_WEIGHTS['timeline'],
                cluster_id
            )
        )
        print(f"  Updated overall risk scores for {cur.rowcount} projects")

        # 6. Update upgrade shared_by_count
        cur.execute(
            """
            UPDATE pjm_upgrades u
            SET shared_by_count = (
                SELECT COUNT(DISTINCT project_id)
                FROM pjm_project_upgrades pu
                WHERE pu.upgrade_id = u.id AND pu.link_type = 'COST_ALLOCATED'
            )
            WHERE cluster_id = %s
            """,
            (cluster_id,)
        )
        print(f"  Updated shared_by_count for {cur.rowcount} upgrades")

        # 7. Update cluster metadata
        cur.execute(
            """
            UPDATE pjm_clusters c
            SET total_projects = (
                    SELECT COUNT(*) FROM pjm_project_costs WHERE cluster_id = c.id
                ),
                total_mw = (
                    SELECT SUM(mw_capacity) FROM pjm_project_costs WHERE cluster_id = c.id
                ),
                updated_at = NOW()
            WHERE id = %s
            """,
            (cluster_id,)
        )

    conn.commit()
    print("  Risk score calculation complete!")


def update_cluster_stats(conn, cluster_id: int):
    """Update cluster-level statistics"""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE pjm_clusters c
            SET total_projects = (
                    SELECT COUNT(*) FROM pjm_project_costs WHERE cluster_id = c.id
                ),
                total_mw = (
                    SELECT SUM(mw_capacity) FROM pjm_project_costs WHERE cluster_id = c.id
                ),
                updated_at = NOW()
            WHERE id = %s
            """,
            (cluster_id,)
        )
    conn.commit()


def load_from_json(json_path: Path):
    """Load scraped data from JSON file into database"""
    print(f"\nLoading data from {json_path}")

    with open(json_path, 'r') as f:
        reports = json.load(f)

    print(f"Found {len(reports)} reports to load")

    if not reports:
        print("No reports to load!")
        return

    # Get cluster info from first report
    cluster_name = reports[0].get('cluster', 'TC2')
    phase = reports[0].get('phase', 'PHASE_1')

    conn = get_db_connection()
    try:
        # Ensure cluster exists
        cluster_id = ensure_cluster_exists(conn, cluster_name, phase)
        print(f"Using cluster_id: {cluster_id} ({cluster_name} {phase})")

        # Load each project
        loaded = 0
        errors = []

        for i, report in enumerate(reports):
            try:
                project_id = report['project_id']
                print(f"[{i+1}/{len(reports)}] Loading {project_id}...")

                # Load project cost record
                load_project(conn, cluster_id, report)

                # Load upgrades
                upgrades = report.get('upgrades', [])
                if upgrades:
                    load_upgrades(conn, cluster_id, project_id, upgrades)

                loaded += 1

            except Exception as e:
                print(f"  ERROR: {e}")
                errors.append({'project_id': report.get('project_id', 'unknown'), 'error': str(e)})

        conn.commit()
        print(f"\nLoaded {loaded} projects successfully, {len(errors)} errors")

        # Calculate risk scores
        calculate_risk_scores(conn, cluster_id)

        # Final summary
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    COUNT(*) as total_projects,
                    SUM(mw_capacity) as total_mw,
                    SUM(total_cost) as total_cost,
                    AVG(cost_per_kw) as avg_cost_per_kw,
                    AVG(risk_score_overall) as avg_risk
                FROM pjm_project_costs
                WHERE cluster_id = %s
                """,
                (cluster_id,)
            )
            stats = cur.fetchone()
            print(f"\n{'='*60}")
            print("CLUSTER SUMMARY")
            print(f"{'='*60}")
            print(f"Projects: {stats[0]}")
            print(f"Total MW: {stats[1]:,.0f}" if stats[1] else "Total MW: N/A")
            print(f"Total Cost: ${stats[2]:,.0f}" if stats[2] else "Total Cost: N/A")
            print(f"Avg $/kW: ${stats[3]:,.0f}" if stats[3] else "Avg $/kW: N/A")
            print(f"Avg Risk Score: {stats[4]:.1f}" if stats[4] else "Avg Risk: N/A")

            # Risk distribution
            cur.execute(
                """
                SELECT
                    CASE
                        WHEN risk_score_overall < 25 THEN 'Low'
                        WHEN risk_score_overall < 50 THEN 'Medium'
                        WHEN risk_score_overall < 75 THEN 'High'
                        ELSE 'Critical'
                    END as risk_level,
                    COUNT(*) as count
                FROM pjm_project_costs
                WHERE cluster_id = %s
                GROUP BY 1
                ORDER BY 1
                """,
                (cluster_id,)
            )
            print("\nRisk Distribution:")
            for row in cur.fetchall():
                print(f"  {row[0]}: {row[1]} projects")

    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(description='Load PJM data into Supabase')
    parser.add_argument('--json', type=Path, help='Path to scraped JSON file')
    parser.add_argument('--scrape', action='store_true', help='Run scraper first')
    parser.add_argument('--cluster', default='TC2', help='Cluster name')
    parser.add_argument('--phase', default='PHASE_1', help='Phase')
    parser.add_argument('--limit', type=int, help='Limit projects (for testing)')

    args = parser.parse_args()

    if args.scrape:
        # Import and run scraper
        from run_scraper import load_project_list, scrape_projects

        print(f"\n{'='*60}")
        print(f"SCRAPING {args.cluster} {args.phase}")
        print(f"{'='*60}\n")

        df, report_col = load_project_list(args.cluster, args.phase)
        output_dir = Path('output')
        reports = scrape_projects(
            df, report_col, args.cluster, args.phase,
            limit=args.limit, output_dir=output_dir
        )

        # Convert reports to dict format for loading
        # (Reports are ScrapedReport objects, need to convert)
        from dataclasses import asdict
        report_dicts = []
        for r in reports:
            d = {
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
                'upgrades': [
                    {
                        'rtep_id': u.rtep_id,
                        'to_id': u.to_id,
                        'utility': u.utility,
                        'title': u.title,
                        'total_cost': u.total_cost,
                        'allocated_cost': u.allocated_cost,
                    }
                    for u in r.upgrades
                ],
                'excel_data': getattr(r, 'excel_data', {}),
            }
            report_dicts.append(d)

        # Save to JSON
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_path = output_dir / f"scraped_{args.cluster}_{args.phase}_{timestamp}.json"
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(json_path, 'w') as f:
            json.dump(report_dicts, f, indent=2, default=str)
        print(f"\nSaved to {json_path}")

        # Load into DB
        load_from_json(json_path)

    elif args.json:
        load_from_json(args.json)
    else:
        print("Please specify --json <path> or --scrape")
        parser.print_help()


if __name__ == "__main__":
    main()

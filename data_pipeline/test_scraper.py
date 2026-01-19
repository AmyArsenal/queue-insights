"""Test the PJM scraper"""
from scrapers.pjm_scraper import PJMReportScraper

scraper = PJMReportScraper(delay_seconds=0.1)
url = 'https://www.pjm.com/pjmfiles/pub/planning/project-queues/TC2/PHASE_1/AH1-665/AH1-665_imp_PHASE_1.htm'
report = scraper.scrape_report(url, 'AH1-665', 'TC2', 'PHASE_1')

print('=== SCRAPED REPORT ===')
print(f'Project: {report.project_id}')
print(f'Total Cost: ${report.cost_summary.total_cost:,.0f}')
print(f'TOIF: ${report.cost_summary.toif_cost:,.0f}')
print(f'Stand Alone: ${report.cost_summary.stand_alone_cost:,.0f}')
print(f'Network Upgrades: ${report.cost_summary.network_upgrade_cost:,.0f}')
print(f'System Reliability: ${report.cost_summary.system_reliability_cost:,.0f}')
print(f'RD1: ${report.readiness.rd1_amount:,.0f}')
print(f'RD2: ${report.readiness.rd2_amount:,.0f}')
print(f'Upgrades: {len(report.upgrades)}')
print(f'Project-Upgrade links: {len(report.project_upgrade_links)}')
print(f'Facility overloads: {len(report.facility_overloads)}')
print(f'MW contributions: {len(report.mw_contributions)}')
print(f'Errors: {report.errors}')

print()
print('=== TOP 5 UPGRADES ===')
for u in report.upgrades[:5]:
    title = u.title[:50] if u.title else "N/A"
    print(f'  {u.utility} | {u.rtep_id} | ${u.allocated_cost:,.0f} | {title}...')

print()
print('=== TOP 10 MW CONTRIBUTIONS ===')
for c in report.mw_contributions[:10]:
    print(f'  {c.project_id} | {c.mw_contribution:.3f} MW | {c.contribution_type}')

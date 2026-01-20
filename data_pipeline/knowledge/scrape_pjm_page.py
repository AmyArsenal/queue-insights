"""
PJM Interconnection Study Page Scraper
Scrapes PJM project pages and converts to markdown files.
"""

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
import re
from datetime import datetime


async def scrape_pjm_page(url: str) -> dict:
    """Scrape a PJM interconnection study page and extract all data."""

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print(f"Loading: {url}")
        await page.goto(url, wait_until="networkidle", timeout=60000)

        # Wait for content to load
        await page.wait_for_timeout(3000)

        # Get page title
        title = await page.title()

        # Get all text content
        full_text = await page.inner_text("body")

        # Get all tables as HTML
        tables_html = await page.evaluate("""
            () => {
                const tables = document.querySelectorAll('table');
                return Array.from(tables).map(t => t.outerHTML);
            }
        """)

        # Get all tables as structured data
        tables_data = await page.evaluate("""
            () => {
                const tables = document.querySelectorAll('table');
                return Array.from(tables).map(table => {
                    const headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText.trim());
                    const rows = Array.from(table.querySelectorAll('tr')).map(tr => {
                        return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
                    }).filter(row => row.length > 0);
                    return { headers, rows };
                });
            }
        """)

        # Try to extract specific sections
        sections = await page.evaluate("""
            () => {
                const result = {};

                // Get all headings and their content
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                headings.forEach(h => {
                    result[h.innerText.trim()] = h.nextElementSibling ? h.nextElementSibling.innerText.trim() : '';
                });

                return result;
            }
        """)

        await browser.close()

        return {
            "url": url,
            "title": title,
            "full_text": full_text,
            "tables_html": tables_html,
            "tables_data": tables_data,
            "sections": sections,
            "scraped_at": datetime.now().isoformat()
        }


def convert_to_markdown(data: dict, project_id: str) -> str:
    """Convert scraped data to markdown format."""

    md = f"# {project_id} - PJM Interconnection Study\n\n"
    md += f"**Source:** [{data['url']}]({data['url']})\n"
    md += f"**Scraped:** {data['scraped_at']}\n\n"
    md += "---\n\n"

    # Add full text content
    md += "## Full Content\n\n"
    md += data['full_text']
    md += "\n\n---\n\n"

    # Add tables in markdown format
    if data['tables_data']:
        md += "## Tables\n\n"
        for i, table in enumerate(data['tables_data'], 1):
            md += f"### Table {i}\n\n"

            if table['headers']:
                md += "| " + " | ".join(table['headers']) + " |\n"
                md += "| " + " | ".join(["---"] * len(table['headers'])) + " |\n"

            for row in table['rows']:
                if row:
                    md += "| " + " | ".join(row) + " |\n"

            md += "\n"

    return md


async def scrape_and_save(url: str, output_dir: str = None):
    """Scrape a URL and save as markdown."""

    # Extract project ID from URL
    # Example: .../AG1-021/AG1-021_imp_FINAL.htm -> AG1-021
    match = re.search(r'/([A-Z]{2}\d-\d{3})/', url)
    project_id = match.group(1) if match else "unknown"

    # Determine cluster from URL
    if '/TC1/' in url:
        cluster = "tc1"
    elif '/TC2/' in url:
        cluster = "tc2"
    else:
        cluster = "other"

    # Set output directory
    if output_dir is None:
        output_dir = Path(__file__).parent / "scraped" / cluster
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    # Scrape
    print(f"Scraping {project_id}...")
    data = await scrape_pjm_page(url)

    # Convert to markdown
    md_content = convert_to_markdown(data, project_id)

    # Save
    output_file = output_dir / f"{project_id}.md"
    output_file.write_text(md_content, encoding="utf-8")
    print(f"Saved: {output_file}")

    # Also save raw JSON for debugging
    import json
    json_file = output_dir / f"{project_id}_raw.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump({
            "url": data["url"],
            "title": data["title"],
            "tables_data": data["tables_data"],
            "sections": data["sections"],
            "scraped_at": data["scraped_at"]
        }, f, indent=2)
    print(f"Saved: {json_file}")

    return output_file


async def main():
    """Main entry point."""

    # Test URL
    url = "https://www.pjm.com/pjmfiles/pub/planning/project-queues/TC1/FINAL/AG1-021/AG1-021_imp_FINAL.htm"

    await scrape_and_save(url)
    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())

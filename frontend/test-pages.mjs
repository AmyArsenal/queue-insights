import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function testPages() {
  console.log('Starting Playwright tests...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const results = [];

  // Test 1: Landing Page
  console.log('Testing Landing Page...');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Check for key elements
    const title = await page.title();
    const heroText = await page.locator('h1').first().textContent();
    const statsCards = await page.locator('[class*="Card"]').count();
    const mapSection = await page.locator('[class*="map"], [class*="Map"]').count();

    // Take screenshot
    await page.screenshot({ path: 'screenshots/landing-page.png', fullPage: true });

    results.push({
      page: 'Landing Page',
      status: 'PASS',
      details: {
        title,
        heroText: heroText?.substring(0, 50) + '...',
        statsCards,
        hasMap: mapSection > 0
      }
    });
    console.log('✓ Landing Page loaded successfully');
  } catch (error) {
    results.push({
      page: 'Landing Page',
      status: 'FAIL',
      error: error.message
    });
    console.log('✗ Landing Page failed:', error.message);
  }

  // Test 2: Explorer Page
  console.log('\nTesting Explorer Page...');
  try {
    await page.goto(`${BASE_URL}/explorer`, { waitUntil: 'networkidle', timeout: 30000 });

    // Check for key elements
    const title = await page.title();
    const hasFilters = await page.locator('[class*="filter"], [class*="Filter"], [class*="sidebar"], [class*="Sidebar"]').count();
    const hasTable = await page.locator('table, [class*="table"], [class*="Table"]').count();

    // Take screenshot
    await page.screenshot({ path: 'screenshots/explorer-page.png', fullPage: true });

    results.push({
      page: 'Explorer Page',
      status: 'PASS',
      details: {
        title,
        hasFilters: hasFilters > 0,
        hasTable: hasTable > 0
      }
    });
    console.log('✓ Explorer Page loaded successfully');
  } catch (error) {
    results.push({
      page: 'Explorer Page',
      status: 'FAIL',
      error: error.message
    });
    console.log('✗ Explorer Page failed:', error.message);
  }

  // Test 3: Check for console errors
  console.log('\nChecking for console errors...');
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000); // Wait for any async errors

  if (consoleErrors.length > 0) {
    console.log('⚠ Console errors found:', consoleErrors.length);
    results.push({
      page: 'Console Errors',
      status: 'WARNING',
      errors: consoleErrors
    });
  } else {
    console.log('✓ No console errors found');
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));

  for (const result of results) {
    const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '⚠';
    console.log(`${icon} ${result.page}: ${result.status}`);
    if (result.details) {
      console.log('  Details:', JSON.stringify(result.details, null, 2).replace(/\n/g, '\n  '));
    }
    if (result.error) {
      console.log('  Error:', result.error);
    }
  }

  console.log('\nScreenshots saved to screenshots/ directory');
}

// Create screenshots directory
import { mkdirSync } from 'fs';
try {
  mkdirSync('screenshots', { recursive: true });
} catch (e) {}

testPages().catch(console.error);

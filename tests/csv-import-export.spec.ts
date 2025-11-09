/**
 * CSV Import/Export E2E Tests
 *
 * Tests the complete CSV import and export functionality
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('CSV Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Wait for app to load
    await page.waitForSelector('text=Raiders Game Manager');
  });

  test('exports roster to CSV with correct format', async ({ page }) => {
    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForSelector('text=Team Roster');

    // Add a test player first
    await page.click('text=Add Player');
    await page.fill('input[name="number"]', '7');
    await page.fill('input[name="name"]', 'Test Player');
    await page.click('button:has-text("Save Player")');
    await page.waitForSelector('text=Test Player');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Export CSV');

    // Verify download
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/raiders-roster-\d{4}-\d{2}-\d{2}\.csv/);

    // Save and read file
    const downloadPath = path.join(__dirname, filename);
    await download.saveAs(downloadPath);
    const csvContent = fs.readFileSync(downloadPath, 'utf-8');

    // Verify CSV format
    expect(csvContent).toContain('Number,Name,Preferred Positions');
    expect(csvContent).toContain('7');
    expect(csvContent).toContain('Test Player');

    // Cleanup
    fs.unlinkSync(downloadPath);
  });

  test('imports valid CSV in merge mode', async ({ page }) => {
    // Create test CSV file
    const csvContent = `Number,Name,Preferred Positions
5,Alex Martinez,MID|FWD
12,Jordan Taylor,GK
18,Sam Chen,DEF`;

    const csvPath = path.join(__dirname, 'test-roster.csv');
    fs.writeFileSync(csvPath, csvContent);

    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForSelector('text=Team Roster');

    // Click import button and select file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Wait for confirmation modal
    await page.waitForSelector('text=Import Roster - 3 Players Found');

    // Verify preview shows players
    await expect(page.locator('text=Alex Martinez')).toBeVisible();
    await expect(page.locator('text=Jordan Taylor')).toBeVisible();
    await expect(page.locator('text=Sam Chen')).toBeVisible();

    // Select merge mode (should be default)
    await expect(page.locator('input[value="merge"]')).toBeChecked();

    // Confirm import
    await page.click('text=Import Roster');

    // Wait for success message
    await page.waitForSelector('text=✓ Imported');

    // Verify players are in roster
    await expect(page.locator('text=Alex Martinez')).toBeVisible();
    await expect(page.locator('text=Jordan Taylor')).toBeVisible();
    await expect(page.locator('text=Sam Chen')).toBeVisible();

    // Cleanup
    fs.unlinkSync(csvPath);
  });

  test('imports valid CSV in replace mode', async ({ page }) => {
    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForSelector('text=Team Roster');

    // Add existing player
    await page.click('text=Add Player');
    await page.fill('input[name="number"]', '99');
    await page.fill('input[name="name"]', 'Old Player');
    await page.click('button:has-text("Save Player")');
    await page.waitForSelector('text=Old Player');

    // Create test CSV file
    const csvContent = `Number,Name,Preferred Positions
7,New Player One,MID
8,New Player Two,FWD`;

    const csvPath = path.join(__dirname, 'test-replace.csv');
    fs.writeFileSync(csvPath, csvContent);

    // Import file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Wait for confirmation modal
    await page.waitForSelector('text=Import Roster - 2 Players Found');

    // Select replace mode
    await page.click('input[value="replace"]');

    // Confirm import
    await page.click('text=Import Roster');

    // Wait for success message
    await page.waitForSelector('text=✓ Roster replaced');

    // Verify only new players exist
    await expect(page.locator('text=New Player One')).toBeVisible();
    await expect(page.locator('text=New Player Two')).toBeVisible();
    await expect(page.locator('text=Old Player')).not.toBeVisible();

    // Cleanup
    fs.unlinkSync(csvPath);
  });

  test('rejects CSV with duplicate numbers', async ({ page }) => {
    // Create CSV with duplicate numbers
    const csvContent = `Number,Name,Preferred Positions
7,Player One,MID
7,Player Two,FWD`;

    const csvPath = path.join(__dirname, 'test-duplicates.csv');
    fs.writeFileSync(csvPath, csvContent);

    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForSelector('text=Team Roster');

    // Import file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Wait for error modal
    await page.waitForSelector('text=Import Failed');
    await expect(page.locator('text=Duplicate number 7')).toBeVisible();

    // Close error modal
    await page.click('text=Fix CSV & Try Again');

    // Cleanup
    fs.unlinkSync(csvPath);
  });

  test('rejects CSV with missing required fields', async ({ page }) => {
    // Create CSV with missing name
    const csvContent = `Number,Name,Preferred Positions
5,,MID
,Jordan Taylor,GK`;

    const csvPath = path.join(__dirname, 'test-missing.csv');
    fs.writeFileSync(csvPath, csvContent);

    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForSelector('text=Team Roster');

    // Import file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Wait for error modal
    await page.waitForSelector('text=Import Failed');
    await expect(page.locator('text=Name is required')).toBeVisible();

    // Cleanup
    fs.unlinkSync(csvPath);
  });

  test('handles invalid preferred positions gracefully', async ({ page }) => {
    // Create CSV with invalid positions
    const csvContent = `Number,Name,Preferred Positions
10,Test Player,STRIKER|INVALID|MID`;

    const csvPath = path.join(__dirname, 'test-invalid-pos.csv');
    fs.writeFileSync(csvPath, csvContent);

    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForSelector('text=Team Roster');

    // Import file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Should show confirmation (invalid positions ignored)
    await page.waitForSelector('text=Import Roster - 1 Player Found');

    // Confirm import
    await page.click('text=Import Roster');

    // Wait for success
    await page.waitForSelector('text=✓ Imported');

    // Verify player exists (with only valid positions)
    await expect(page.locator('text=Test Player')).toBeVisible();

    // Cleanup
    fs.unlinkSync(csvPath);
  });

  test('rejects non-CSV files', async ({ page }) => {
    // Create a text file
    const txtPath = path.join(__dirname, 'test.txt');
    fs.writeFileSync(txtPath, 'Not a CSV file');

    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForSelector('text=Team Roster');

    // Try to import
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(txtPath);

    // Should show error
    await page.waitForSelector('text=Import Failed');
    await expect(page.locator('text=Please select a CSV file')).toBeVisible();

    // Cleanup
    fs.unlinkSync(txtPath);
  });

  test('shows conflict warning for matching numbers', async ({ page }) => {
    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForSelector('text=Team Roster');

    // Add existing player
    await page.click('text=Add Player');
    await page.fill('input[name="number"]', '7');
    await page.fill('input[name="name"]', 'Existing Player');
    await page.click('button:has-text("Save Player")');
    await page.waitForSelector('text=Existing Player');

    // Create CSV with matching number
    const csvContent = `Number,Name,Preferred Positions
7,Updated Player,MID
8,New Player,FWD`;

    const csvPath = path.join(__dirname, 'test-conflict.csv');
    fs.writeFileSync(csvPath, csvContent);

    // Import file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Wait for confirmation modal
    await page.waitForSelector('text=Import Roster - 2 Players Found');

    // Should show conflict warning
    await expect(page.locator('text=1 Conflicting Number')).toBeVisible();
    await expect(page.locator('text=⚠️ Exists')).toBeVisible();

    // Cancel import
    await page.click('text=Cancel');

    // Cleanup
    fs.unlinkSync(csvPath);
  });

  test('export button is disabled when no players', async ({ page }) => {
    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForSelector('text=Team Roster');

    // Export button should be disabled
    const exportButton = page.locator('button:has-text("Export CSV")');
    await expect(exportButton).toBeDisabled();
  });
});

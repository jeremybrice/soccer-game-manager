import { test, expect } from '@playwright/test';

/**
 * Test suite for Player Loading Issue
 * Tests both deployed and local versions to diagnose the root cause
 */

test.describe('Player Loading Diagnostics', () => {
  test('should inspect deployed app player loading', async ({ page }) => {
    // Navigate to deployed app
    await page.goto('https://soccer-game-manager.netlify.app/');

    // Wait for app to initialize
    await page.waitForTimeout(2000);

    // Navigate to roster view
    await page.click('text=Manage Roster');

    // Wait for roster to load
    await page.waitForTimeout(1000);

    // Check player count display
    const playerCount = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();
    console.log('Deployed App - Player count:', playerCount);

    // Check if "No players yet" message is shown
    const noPlayersMessage = await page.locator('text=No players yet').isVisible();
    console.log('Deployed App - No players message visible:', noPlayersMessage);

    // Try to add a test player
    await page.click('button:has-text("+ Add Player")', { timeout: 5000 });
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });

    // Fill in player details
    await page.fill('input[type="text"]', 'Test Player Deployed');
    await page.fill('input[type="number"]', '99');

    // Click the submit button inside the modal (not the header button)
    await page.locator('form').locator('button[type="submit"]').click();

    // Wait for modal to close
    await page.waitForTimeout(1000);

    // Check if player appears
    const playerAdded = await page.locator('text=Test Player Deployed').isVisible().catch(() => false);
    console.log('Deployed App - Player added successfully:', playerAdded);

    // Inspect IndexedDB to check data type
    const indexedDBData = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SoccerGameManager');

        request.onsuccess = () => {
          try {
            const db = request.result;
            const transaction = db.transaction(['players'], 'readonly');
            const objectStore = transaction.objectStore('players');
            const getAllRequest = objectStore.getAll();

            getAllRequest.onsuccess = () => {
              const players = getAllRequest.result;
              const result = {
                count: players.length,
                players: players.map((p: any) => ({
                  name: p.name,
                  number: p.number,
                  isActiveType: typeof p.isActive,
                  isActiveValue: p.isActive,
                })),
              };
              resolve(result);
            };

            getAllRequest.onerror = () => {
              resolve({ error: 'Failed to get all players' });
            };
          } catch (error: any) {
            resolve({ error: error.message });
          }
        };

        request.onerror = (event: any) => {
          resolve({ error: 'Failed to open IndexedDB: ' + event.target.error });
        };
      });
    });

    console.log('Deployed App - IndexedDB Data:', JSON.stringify(indexedDBData, null, 2));

    // Take a screenshot for reference
    await page.screenshot({ path: 'tests/deployed-app-state.png', fullPage: true });
  });

  test('should inspect local dev server player loading', async ({ page }) => {
    // This test will run against local dev server
    // You'll need to start the dev server first: npm run dev

    try {
      await page.goto('http://localhost:5173/', { timeout: 5000 });
    } catch (error) {
      console.log('Local dev server not running - skipping this test');
      test.skip();
      return;
    }

    // Wait for app to initialize
    await page.waitForTimeout(2000);

    // Navigate to roster view
    await page.click('text=Manage Roster');

    // Wait for roster to load
    await page.waitForTimeout(1000);

    // Check player count display
    const playerCount = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();
    console.log('Local App - Player count:', playerCount);

    // Check if "No players yet" message is shown
    const noPlayersMessage = await page.locator('text=No players yet').isVisible();
    console.log('Local App - No players message visible:', noPlayersMessage);

    // Inspect IndexedDB to check data type
    const indexedDBData = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('SoccerGameManager');

        request.onsuccess = () => {
          try {
            const db = request.result;
            const transaction = db.transaction(['players'], 'readonly');
            const objectStore = transaction.objectStore('players');
            const getAllRequest = objectStore.getAll();

            getAllRequest.onsuccess = () => {
              const players = getAllRequest.result;
              const result = {
                count: players.length,
                players: players.map((p: any) => ({
                  name: p.name,
                  number: p.number,
                  isActiveType: typeof p.isActive,
                  isActiveValue: p.isActive,
                })),
              };
              resolve(result);
            };

            getAllRequest.onerror = () => {
              resolve({ error: 'Failed to get all players' });
            };
          } catch (error: any) {
            resolve({ error: error.message });
          }
        };

        request.onerror = (event: any) => {
          resolve({ error: 'Failed to open IndexedDB: ' + event.target.error });
        };
      });
    });

    console.log('Local App - IndexedDB Data:', JSON.stringify(indexedDBData, null, 2));

    // Take a screenshot for reference
    await page.screenshot({ path: 'tests/local-app-state.png', fullPage: true });
  });
});

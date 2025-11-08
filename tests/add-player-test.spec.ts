import { test, expect } from '@playwright/test';

test('Add player and verify it appears', async ({ page }) => {
  // Navigate to local app
  await page.goto('http://localhost:5173/');

  // Wait for app to initialize
  await page.waitForTimeout(2000);

  // Navigate to roster
  await page.click('text=Manage Roster');
  await page.waitForTimeout(1000);

  // Verify we start with 0 players
  let playerCount = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();
  console.log('Initial player count:', playerCount);

  // Click Add Player button
  await page.click('button:has-text("+ Add Player")');
  await page.waitForSelector('input[type="text"]');

  // Fill in player details
  await page.fill('input[type="text"]', 'Test Player One');
  await page.fill('input[type="number"]', '1');

  // Select a position preference
  await page.click('button:has-text("Goalkeeper")');

  // Submit the form
  await page.locator('form').locator('button[type="submit"]').click();

  // Wait for modal to close
  await page.waitForTimeout(1000);

  // Check if player appears
  await expect(page.locator('text=Test Player One')).toBeVisible();

  // Verify player count updated
  playerCount = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();
  console.log('After adding player:', playerCount);

  // Take screenshot
  await page.screenshot({ path: 'tests/after-add-player.png', fullPage: true });

  // Add a second player
  await page.click('button:has-text("+ Add Player")');
  await page.waitForSelector('input[type="text"]');

  await page.fill('input[type="text"]', 'Test Player Two');
  await page.fill('input[type="number"]', '2');
  await page.click('button:has-text("Defense")');
  await page.locator('form').locator('button[type="submit"]').click();
  await page.waitForTimeout(1000);

  // Verify both players visible
  await expect(page.locator('text=Test Player One')).toBeVisible();
  await expect(page.locator('text=Test Player Two')).toBeVisible();

  playerCount = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();
  console.log('After adding 2nd player:', playerCount);

  // Check IndexedDB
  const indexedDBData = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const request = indexedDB.open('SoccerGameManager');

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['players'], 'readonly');
        const objectStore = transaction.objectStore('players');
        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = () => {
          const players = getAllRequest.result;
          resolve({
            count: players.length,
            players: players.map((p: any) => ({
              name: p.name,
              number: p.number,
              isActiveType: typeof p.isActive,
              isActiveValue: p.isActive,
            })),
          });
        };
      };
    });
  });

  console.log('Final IndexedDB state:', JSON.stringify(indexedDBData, null, 2));
});

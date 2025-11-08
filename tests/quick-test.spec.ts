import { test } from '@playwright/test';

test('Quick local app test - check if players load', async ({ page }) => {
  // Navigate to local app
  await page.goto('http://localhost:5173/');

  // Wait for app to initialize
  await page.waitForTimeout(3000);

  // Take screenshot of home page
  await page.screenshot({ path: 'tests/local-home.png', fullPage: true });
  console.log('Home page screenshot taken');

  // Try to find and click the roster button (try different possible texts)
  const rosterButtonSelectors = [
    'text=Manage Roster',
    'text=Team Roster',
    'text=Roster',
    'button:has-text("Roster")',
    'a:has-text("Roster")',
  ];

  let clicked = false;
  for (const selector of rosterButtonSelectors) {
    try {
      await page.click(selector, { timeout: 2000 });
      clicked = true;
      console.log(`Clicked roster button using: ${selector}`);
      break;
    } catch (e) {
      // Try next selector
    }
  }

  if (!clicked) {
    console.log('Could not find roster button, checking page content...');
    const bodyText = await page.locator('body').textContent();
    console.log('Page content:', bodyText?.substring(0, 500));
  } else {
    // Wait for roster page to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'tests/local-roster.png', fullPage: true });

    // Get player count
    const playerCountElement = await page.locator('text=/\\d+ \\/ 14 Players/').textContent().catch(() => 'Not found');
    console.log('Player count:', playerCountElement);

    // Check IndexedDB
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

    console.log('Local IndexedDB Data:', JSON.stringify(indexedDBData, null, 2));
  }
});

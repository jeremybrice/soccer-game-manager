import { test, expect } from '@playwright/test';

test('Game timer persists across app close/reopen', async ({ page }) => {
  console.log('🧪 Starting timer persistence test...');

  // Navigate to app
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  // Clear IndexedDB to start fresh
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const deleteRequest = indexedDB.deleteDatabase('SoccerGameManager');
      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => resolve(false);
    });
  });
  console.log('✅ Cleared IndexedDB');

  // Reload after clearing DB
  await page.reload();
  await page.waitForTimeout(2000);

  // Add minimum 9 players to start a game
  console.log('📋 Adding players...');
  await page.click('text=Team Roster');
  await page.waitForTimeout(1000);

  for (let i = 1; i <= 9; i++) {
    await page.fill('input[placeholder="Player Name"]', `Player ${i}`);
    await page.fill('input[type="number"]', i.toString());
    await page.click('button:has-text("Add Player")');
    await page.waitForTimeout(500);
  }

  console.log('✅ Added 9 players');

  // Go back to home
  await page.click('text=← Back');
  await page.waitForTimeout(1000);

  // Start a new game
  console.log('🎮 Starting game...');
  await page.click('button:has-text("Start Game")');
  await page.waitForTimeout(2000);

  // Verify we're on game screen
  const gameTime = await page.locator('text=Game Time').isVisible();
  expect(gameTime).toBe(true);
  console.log('✅ Game started');

  // Wait for timer to run for ~5 seconds
  console.log('⏱️  Waiting for timer to run (5 seconds)...');
  await page.waitForTimeout(5000);

  // Get the current game time
  const gameTimeElement = await page.locator('div.font-mono.text-3xl').first();
  const initialTime = await gameTimeElement.textContent();
  console.log(`⏱️  Initial time: ${initialTime}`);

  // Verify timer is running (should be around 0:05 or more)
  const initialSeconds = parseTimeToSeconds(initialTime || '0:00');
  expect(initialSeconds).toBeGreaterThan(3); // At least 3 seconds should have passed
  console.log(`✅ Timer is running: ${initialSeconds} seconds`);

  // Get timer state from IndexedDB before reload
  const timerStateBefore = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const request = indexedDB.open('SoccerGameManager');
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['games'], 'readonly');
        const objectStore = transaction.objectStore('games');
        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = () => {
          const games = getAllRequest.result;
          const activeGame = games.find((g: any) => g.isActive);
          resolve({
            timerStartedAt: activeGame?.timerStartedAt,
            timerPausedAt: activeGame?.timerPausedAt,
            timerTotalPausedDuration: activeGame?.timerTotalPausedDuration,
          });
        };
      };
    });
  });
  console.log('💾 Timer state in DB before reload:', timerStateBefore);

  // Simulate closing the app (reload the page)
  console.log('🔄 Simulating app close/reopen (reloading page)...');
  await page.reload();
  await page.waitForTimeout(3000); // Give time for app to restore state

  // Verify we're still on game screen (game was restored)
  const gameTimeAfterReload = await page.locator('text=Game Time').isVisible();
  expect(gameTimeAfterReload).toBe(true);
  console.log('✅ Game screen restored after reload');

  // Get the game time after reload
  const gameTimeElementAfter = await page.locator('div.font-mono.text-3xl').first();
  const timeAfterReload = await gameTimeElementAfter.textContent();
  console.log(`⏱️  Time after reload: ${timeAfterReload}`);

  // Convert to seconds for comparison
  const secondsAfterReload = parseTimeToSeconds(timeAfterReload || '0:00');
  console.log(`⏱️  Seconds after reload: ${secondsAfterReload}`);

  // The timer should have persisted
  // It should be approximately the same as before (allowing 2 second variance for reload time)
  expect(secondsAfterReload).toBeGreaterThanOrEqual(initialSeconds - 2);
  expect(secondsAfterReload).toBeLessThanOrEqual(initialSeconds + 5);
  console.log('✅ Timer persisted correctly across reload!');

  // Test pause functionality across reload
  console.log('⏸️  Testing pause persistence...');
  await page.click('button:has-text("⏸")'); // Pause button
  await page.waitForTimeout(1000);

  const pausedTime = await gameTimeElementAfter.textContent();
  console.log(`⏱️  Paused time: ${pausedTime}`);

  // Reload while paused
  console.log('🔄 Reloading while paused...');
  await page.reload();
  await page.waitForTimeout(3000);

  // Get time after reload while paused
  const gameTimeElementAfterPause = await page.locator('div.font-mono.text-3xl').first();
  const timeAfterPauseReload = await gameTimeElementAfterPause.textContent();
  console.log(`⏱️  Time after pause reload: ${timeAfterPauseReload}`);

  // Time should match the paused time (not continue counting)
  const pausedSeconds = parseTimeToSeconds(pausedTime || '0:00');
  const secondsAfterPauseReload = parseTimeToSeconds(timeAfterPauseReload || '0:00');

  expect(Math.abs(secondsAfterPauseReload - pausedSeconds)).toBeLessThanOrEqual(2);
  console.log('✅ Paused timer persisted correctly!');

  // Test resume after reload
  console.log('▶️  Testing resume after reload...');
  await page.click('button:has-text("▶")'); // Resume button
  await page.waitForTimeout(3000);

  const resumedTime = await gameTimeElementAfterPause.textContent();
  const resumedSeconds = parseTimeToSeconds(resumedTime || '0:00');
  console.log(`⏱️  Resumed time: ${resumedTime} (${resumedSeconds} seconds)`);

  // Timer should have continued from where it was paused
  expect(resumedSeconds).toBeGreaterThanOrEqual(pausedSeconds);
  console.log('✅ Timer resumed correctly after reload!');

  console.log('🎉 All timer persistence tests passed!');
});

// Helper function to parse time string (MM:SS) to seconds
function parseTimeToSeconds(timeString: string): number {
  const parts = timeString.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  return 0;
}

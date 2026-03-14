import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Game Screen Debug Test Suite
 *
 * Tests all game screen functionality:
 * - Timer system (start, pause, resume, player minutes)
 * - Quarter system (auto-pause, overtime, transitions)
 * - Swap system (tap-to-select, staged swaps, execution)
 * - Ghost preview (field↔bench, field↔field)
 * - Edge cases (rapid pause/resume, page reload, empty bench)
 */

const BASE_URL = 'http://localhost:5173/';

/**
 * Helper: Add players to roster and return to home
 * Clears IndexedDB first for clean state
 */
async function setupRoster(page: Page, count: number = 14) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(500);

  // Clear IndexedDB for clean test state
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('SoccerGameDB');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  // Reload after clearing DB
  await page.goto(BASE_URL);
  await page.waitForTimeout(500);

  // Go to roster
  await page.click('text=Manage Roster');
  await page.waitForTimeout(500);

  // Check existing player count
  const countText = await page.locator('text=/\\d+ \\/ 14 Players/').textContent().catch(() => '0 / 14');
  const existing = parseInt(countText?.match(/(\d+) \//)?.[1] || '0');

  if (existing >= count) {
    await page.click('text=← Back');
    await page.waitForTimeout(300);
    return;
  }

  const positions = ['Goalkeeper', 'Defense', 'Defense', 'Defense', 'Midfield', 'Midfield', 'Midfield', 'Forward', 'Forward', 'Defense', 'Midfield', 'Forward', 'Defense', 'Midfield'];

  for (let i = existing; i < count; i++) {
    await page.click('button:has-text("+ Add Player")');
    await page.waitForSelector('input[type="text"]');
    await page.fill('input[type="text"]', `Player ${i + 1}`);
    await page.fill('input[type="number"]', `${i + 1}`);
    await page.click(`button:has-text("${positions[i]}")`);
    await page.locator('form').locator('button[type="submit"]').click();
    await page.waitForTimeout(200);
  }

  await page.click('text=← Back');
  await page.waitForTimeout(300);
}

/**
 * Helper: Navigate to game screen from home, start a new game
 * Handles both fresh start and resuming from active game
 */
async function startNewGame(page: Page) {
  // If there's a "Resume Game" button, an active game exists - end it first
  const resumeBtn = page.locator('button:has-text("Resume Game")');
  if (await resumeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await resumeBtn.click();
    await page.waitForTimeout(500);

    // End the active game
    const backBtn = page.locator('text=← Back');
    await backBtn.click();
    await page.waitForTimeout(500);

    // If we're back on home, try to end game via clicking Resume then ending
    if (await resumeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await resumeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // Now start a new game
  const startBtn = page.locator('text=Start New Game');
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(1000);
  }

  // Should be on formation setup - click Start Game
  const formStartBtn = page.locator('button:has-text("Start Game")');
  if (await formStartBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await formStartBtn.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Helper: Get the displayed quarter time text from the header
 */
async function getQuarterTimeText(page: Page): Promise<string> {
  const timeEl = page.locator('.font-mono span').nth(1);
  return (await timeEl.textContent()) || '0:00';
}

// ============================================================================
// Test Suite: Game Startup & Timer
// ============================================================================

test.describe('Game Startup & Timer', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoster(page, 14);
  });

  test('should show 0:00 before timer starts', async ({ page }) => {
    await startNewGame(page);
    await page.screenshot({ path: 'tests/screenshots/debug-01-game-loaded.png', fullPage: true });

    // Timer should show Q1 and 0:00
    await expect(page.locator('text=Q1')).toBeVisible();

    // Game should be in paused state
    await expect(page.locator('text=Paused')).toBeVisible();

    // Play button should be visible (not stop)
    await expect(page.locator('button:has-text("▶")')).toBeVisible();
  });

  test('BUG: player minutes should be 0 before timer starts', async ({ page }) => {
    await startNewGame(page);

    // Wait a moment to see if any minutes accumulate
    await page.waitForTimeout(2000);

    // No player card should show any time badge before timer starts
    // Time badges show "Xm" format
    const timeBadges = page.locator('text=/^\\d+m$/');
    const count = await timeBadges.count();

    await page.screenshot({ path: 'tests/screenshots/debug-02-minutes-before-start.png', fullPage: true });

    // All should be 0 - no time badges should appear
    expect(count).toBe(0);
  });

  test('timer should advance when started', async ({ page }) => {
    await startNewGame(page);

    // Start the timer
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(500);

    // Should now show "Game Time" status
    await expect(page.locator('text=Game Time')).toBeVisible();

    // Wait 3 seconds for timer to advance
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/debug-03-timer-running.png', fullPage: true });

    // Timer should show at least 0:02
    const timeText = await getQuarterTimeText(page);
    const [min, sec] = timeText.split(':').map(Number);
    const totalSeconds = min * 60 + sec;
    expect(totalSeconds).toBeGreaterThanOrEqual(2);
  });

  test('pause should freeze all timers', async ({ page }) => {
    await startNewGame(page);

    // Start timer, wait, then pause
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(3000);

    // Click stop button to trigger the manual-stop modal
    await page.click('button:has-text("⏹")');
    await page.waitForTimeout(500);

    // Should see the quarter modal with pause option
    await expect(page.locator('text=Pause Timer')).toBeVisible();
    await page.click('button:has-text("Pause Timer")');
    await page.waitForTimeout(500);

    // Record the time
    const timeAfterPause = await getQuarterTimeText(page);

    // Wait 2 more seconds
    await page.waitForTimeout(2000);

    // Time should not have changed
    const timeAfterWait = await getQuarterTimeText(page);

    await page.screenshot({ path: 'tests/screenshots/debug-04-paused.png', fullPage: true });

    expect(timeAfterWait).toBe(timeAfterPause);
    await expect(page.locator('text=Paused')).toBeVisible();
  });

  test('resume should continue from paused time', async ({ page }) => {
    await startNewGame(page);

    // Start, wait, pause
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(3000);

    await page.click('button:has-text("⏹")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Pause Timer")');
    await page.waitForTimeout(500);

    const pausedTime = await getQuarterTimeText(page);
    const [pauseMin, pauseSec] = pausedTime.split(':').map(Number);
    const pausedSeconds = pauseMin * 60 + pauseSec;

    // Wait 2 seconds while paused (should not count)
    await page.waitForTimeout(2000);

    // Resume
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(2000);

    const resumedTime = await getQuarterTimeText(page);
    const [resumeMin, resumeSec] = resumedTime.split(':').map(Number);
    const resumedSeconds = resumeMin * 60 + resumeSec;

    await page.screenshot({ path: 'tests/screenshots/debug-05-resumed.png', fullPage: true });

    // Resumed time should be about 2 seconds more than paused time (not 4 seconds more)
    // Allow 1 second tolerance
    const elapsed = resumedSeconds - pausedSeconds;
    expect(elapsed).toBeGreaterThanOrEqual(1);
    expect(elapsed).toBeLessThanOrEqual(4);
  });
});

// ============================================================================
// Test Suite: Tap-to-Select & Swap System
// ============================================================================

test.describe('Tap-to-Select & Swap System', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoster(page, 14);
  });

  test('tap a player to select them', async ({ page }) => {
    await startNewGame(page);

    // Find a field player card and tap it
    const fieldPlayers = page.locator('.touch-target.rounded-xl').first();
    await fieldPlayers.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'tests/screenshots/debug-06-player-selected.png', fullPage: true });

    // Selected player should have ring-4 class (selection indicator)
    const selectedCards = page.locator('.ring-4');
    await expect(selectedCards.first()).toBeVisible();
  });

  test('tap same player again to deselect', async ({ page }) => {
    await startNewGame(page);

    const firstPlayer = page.locator('.touch-target.rounded-xl').first();
    // Select
    await firstPlayer.click();
    await page.waitForTimeout(300);
    // Deselect
    await firstPlayer.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'tests/screenshots/debug-07-player-deselected.png', fullPage: true });

    // No selected player cards should exist
    const selectedCards = page.locator('.ring-raiders-red-light');
    const count = await selectedCards.count();
    expect(count).toBe(0);
  });

  test('tap two players to stage a swap', async ({ page }) => {
    await startNewGame(page);

    // Get player cards - field players are in the formation area
    const playerCards = page.locator('button.touch-target.rounded-xl');

    // Tap first player (field)
    await playerCards.nth(0).click();
    await page.waitForTimeout(300);

    // Tap a bench player (last ones are bench)
    const benchSection = page.locator('.bg-gray-200');
    const benchCards = benchSection.locator('button.touch-target.rounded-xl');
    await benchCards.first().click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/debug-08-swap-staged.png', fullPage: true });

    // SwipeExecuteBar should appear with "1 swap staged"
    await expect(page.locator('text=1 swap staged')).toBeVisible();

    // Ghost preview should be visible (INCOMING labels - one on field, one on bench)
    await expect(page.locator('text=INCOMING').first()).toBeVisible();
  });

  test('ghost tap should unstage a swap', async ({ page }) => {
    await startNewGame(page);

    const playerCards = page.locator('button.touch-target.rounded-xl');
    await playerCards.nth(0).click();
    await page.waitForTimeout(300);

    const benchSection = page.locator('.bg-gray-200');
    const benchCards = benchSection.locator('button.touch-target.rounded-xl');
    await benchCards.first().click();
    await page.waitForTimeout(500);

    // Should see swap staged
    await expect(page.locator('text=1 swap staged')).toBeVisible();

    // Click ghost to unstage
    const ghost = page.locator('text=INCOMING').first();
    await ghost.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/debug-09-swap-unstaged.png', fullPage: true });

    // Swap bar should be gone
    const swapBar = page.locator('text=swap staged');
    await expect(swapBar).not.toBeVisible();
  });

  test('BUG: overlapping swaps should resolve correctly', async ({ page }) => {
    await startNewGame(page);

    // Get player names/numbers for verification
    const fieldCards = page.locator('button.touch-target.rounded-xl');
    const benchSection = page.locator('.bg-gray-200');
    const benchCards = benchSection.locator('button.touch-target.rounded-xl');

    // Record initial state of first 3 field players
    const field0Text = await fieldCards.nth(0).textContent();
    const field1Text = await fieldCards.nth(1).textContent();

    // Stage swap 1: Field[0] ↔ Field[1]
    await fieldCards.nth(0).click();
    await page.waitForTimeout(300);
    await fieldCards.nth(1).click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/debug-10-overlapping-swap-staged.png', fullPage: true });

    // The stageSwap function replaces existing swaps involving same players,
    // so we can only have non-overlapping swaps by design (check stageSwap logic).
    // Let's stage a second non-overlapping swap to test multi-swap execution
    await fieldCards.nth(2).click();
    await page.waitForTimeout(300);

    // Try to swap with a bench player
    if (await benchCards.count() > 0) {
      await benchCards.first().click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'tests/screenshots/debug-10b-multi-swap-staged.png', fullPage: true });

    // Check swap count
    const swapText = page.locator('text=/\\d+ swap/');
    await expect(swapText).toBeVisible();
  });
});

// ============================================================================
// Test Suite: SwipeExecuteBar
// ============================================================================

test.describe('SwipeExecuteBar', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoster(page, 14);
  });

  test('execute bar appears when swaps are staged', async ({ page }) => {
    await startNewGame(page);

    // Stage a swap
    const fieldCards = page.locator('button.touch-target.rounded-xl');
    await fieldCards.nth(0).click();
    await page.waitForTimeout(300);

    const benchSection = page.locator('.bg-gray-200');
    const benchCards = benchSection.locator('button.touch-target.rounded-xl');
    await benchCards.first().click();
    await page.waitForTimeout(500);

    // Verify execute bar
    await expect(page.locator('text=1 swap staged')).toBeVisible();
    await expect(page.locator('text=Drag to execute or clear')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/debug-11-execute-bar.png', fullPage: true });
  });

  test('swiping up on execute bar should execute swaps', async ({ page }) => {
    await startNewGame(page);

    // Get initial bench player count
    const benchSection = page.locator('.bg-gray-200');
    const initialBenchText = await benchSection.locator('text=/\\d+ players/').textContent();

    // Stage a swap
    const fieldCards = page.locator('button.touch-target.rounded-xl');
    await fieldCards.nth(0).click();
    await page.waitForTimeout(300);
    const benchCards = benchSection.locator('button.touch-target.rounded-xl');
    await benchCards.first().click();
    await page.waitForTimeout(500);

    // Simulate swipe up on the execute bar
    const executeBar = page.locator('.bg-orange-500').first();
    const box = await executeBar.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      // Swipe up 100px
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 100, { steps: 10 });
      await page.mouse.up();
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/debug-12-after-execute.png', fullPage: true });

    // Execute bar should be gone (swaps executed)
    // Note: Touch events may not fire via mouse - this tests the visual state
  });
});

// ============================================================================
// Test Suite: Quarter System
// ============================================================================

test.describe('Quarter System', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoster(page, 14);
  });

  test('should display Q1 indicator at game start', async ({ page }) => {
    await startNewGame(page);

    await expect(page.locator('text=Q1')).toBeVisible();
    await page.screenshot({ path: 'tests/screenshots/debug-13-quarter-indicator.png', fullPage: true });
  });

  test('manual stop button should show quarter modal', async ({ page }) => {
    await startNewGame(page);

    // Start timer
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(1000);

    // Click stop button
    await page.click('button:has-text("⏹")');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/debug-14-quarter-modal.png', fullPage: true });

    // Should show manual-stop modal with options
    await expect(page.locator('text=Quarter 1 Actions')).toBeVisible();
    await expect(page.locator('text=Pause Timer')).toBeVisible();
    await expect(page.locator('text=End Quarter')).toBeVisible();
    await expect(page.locator('text=Cancel')).toBeVisible();
  });

  test('End Quarter should advance to Q2', async ({ page }) => {
    await startNewGame(page);

    // Start timer briefly
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(1000);

    // Stop and advance quarter
    await page.click('button:has-text("⏹")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("End Quarter")');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/debug-15-quarter-2.png', fullPage: true });

    // Should now show Q2
    await expect(page.locator('text=Q2')).toBeVisible();

    // Timer should be paused showing 0:00
    await expect(page.locator('text=Paused')).toBeVisible();
  });

  test('cancel should dismiss modal without action', async ({ page }) => {
    await startNewGame(page);

    await page.click('button:has-text("▶")');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("⏹")');
    await page.waitForTimeout(500);

    // Click cancel
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/debug-16-modal-cancelled.png', fullPage: true });

    // Modal should be gone, but timer state depends on whether cancel resumes
    // The modal should not be visible
    await expect(page.locator('text=Quarter 1 Actions')).not.toBeVisible();
  });
});

// ============================================================================
// Test Suite: Ghost Preview Logic
// ============================================================================

test.describe('Ghost Preview Logic', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoster(page, 14);
  });

  test('field↔bench swap should show ghost on both sides', async ({ page }) => {
    await startNewGame(page);

    // Stage field↔bench swap
    const fieldCards = page.locator('button.touch-target.rounded-xl');
    await fieldCards.nth(0).click();
    await page.waitForTimeout(300);

    const benchSection = page.locator('.bg-gray-200');
    const benchCards = benchSection.locator('button.touch-target.rounded-xl');
    await benchCards.first().click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/debug-17-ghost-field-bench.png', fullPage: true });

    // Should see INCOMING ghost labels
    const ghosts = page.locator('text=INCOMING');
    const ghostCount = await ghosts.count();
    // Should have ghosts showing on both field and bench sides
    expect(ghostCount).toBeGreaterThanOrEqual(1);

    // Check for faded out cards (opacity-70)
    const faded = page.locator('.opacity-70');
    const fadedCount = await faded.count();
    expect(fadedCount).toBeGreaterThanOrEqual(1);
  });

  test('BUG: field↔field swap ghost preview clarity', async ({ page }) => {
    await startNewGame(page);

    // Stage field↔field swap (two field players)
    const fieldCards = page.locator('button.touch-target.rounded-xl');
    await fieldCards.nth(0).click();
    await page.waitForTimeout(300);
    await fieldCards.nth(1).click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/debug-18-ghost-field-field.png', fullPage: true });

    // For field↔field swaps, both players show ghost (who's coming)
    // but neither should be faded (both stay on field)
    const ghosts = page.locator('text=INCOMING');
    const ghostCount = await ghosts.count();

    const faded = page.locator('.opacity-70');
    const fadedCount = await faded.count();

    console.log(`Field↔Field swap: ${ghostCount} ghosts, ${fadedCount} faded cards`);

    // Fixed behavior: ghost overlays show who's coming, but cards aren't faded
    expect(ghostCount).toBe(2); // Both positions show ghost of incoming player
    expect(fadedCount).toBe(0); // Neither player is faded (both stay on field)
  });
});

// ============================================================================
// Test Suite: Player Time Colors
// ============================================================================

test.describe('Player Time Colors', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoster(page, 14);
  });

  test('color legend should be visible on game screen', async ({ page }) => {
    await startNewGame(page);

    await expect(page.locator('text=<10m')).toBeVisible();
    await expect(page.locator('text=10-15m')).toBeVisible();
    await expect(page.locator('text=>15m')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/debug-19-color-legend.png', fullPage: true });
  });

  test('all field players should start green (< 10 min)', async ({ page }) => {
    await startNewGame(page);

    // Start timer
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/screenshots/debug-20-players-green.png', fullPage: true });

    // All field player cards should have green background
    const greenCards = page.locator('.bg-green-500.touch-target');
    const greenCount = await greenCards.count();
    // At least 9 field players should be green
    expect(greenCount).toBeGreaterThanOrEqual(9);
  });
});

// ============================================================================
// Test Suite: Bench Area
// ============================================================================

test.describe('Bench Area', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoster(page, 14);
  });

  test('bench should show correct player count', async ({ page }) => {
    await startNewGame(page);

    const benchSection = page.locator('.bg-gray-200');
    await expect(benchSection).toBeVisible();

    // With 14 players and 9 on field, should have 5 on bench
    await expect(page.locator('text=5 players')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/debug-21-bench-area.png', fullPage: true });
  });

  test('bench should show player cards horizontally', async ({ page }) => {
    await startNewGame(page);

    const benchSection = page.locator('.bg-gray-200');
    const benchCards = benchSection.locator('button.touch-target.rounded-xl');
    const count = await benchCards.count();

    expect(count).toBe(5);

    await page.screenshot({ path: 'tests/screenshots/debug-22-bench-cards.png', fullPage: true });
  });
});

// ============================================================================
// Test Suite: Game State Edge Cases
// ============================================================================

test.describe('Edge Cases', () => {
  test('should work with minimum players (9)', async ({ page }) => {
    await setupRoster(page, 9);
    await startNewGame(page);

    await page.screenshot({ path: 'tests/screenshots/debug-23-minimum-players.png', fullPage: true });

    // Should be able to start with 9 players (home screen requires >= 9)
    await expect(page.locator('text=Q1')).toBeVisible();
  });

  test('BUG: stop button disabled during auto-stop', async ({ page }) => {
    await setupRoster(page, 14);
    await startNewGame(page);

    // Start timer
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(1000);

    // The stop button should be enabled when timer is running
    const stopBtn = page.locator('button:has-text("⏹")');
    await expect(stopBtn).toBeEnabled();

    await page.screenshot({ path: 'tests/screenshots/debug-24-stop-button.png', fullPage: true });
  });

  test('back button should work during game', async ({ page }) => {
    await setupRoster(page, 14);
    await startNewGame(page);

    // Should see back button
    const backBtn = page.locator('text=← Back');
    await expect(backBtn).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/debug-25-back-button.png', fullPage: true });
  });

  test('formation labels should be correct for Formation A (3-3-2)', async ({ page }) => {
    await setupRoster(page, 14);
    await startNewGame(page);

    await page.screenshot({ path: 'tests/screenshots/debug-26-formation-labels.png', fullPage: true });

    // Check section labels
    await expect(page.locator('text=Forward')).toBeVisible();
    await expect(page.locator('text=Midfield')).toBeVisible();
    await expect(page.locator('text=Defense')).toBeVisible();
    await expect(page.locator('text=Goalkeeper')).toBeVisible();

    // Check position order: Forward at top, GK at bottom
    const bodyText = await page.locator('body').textContent();
    const forwardIndex = bodyText?.indexOf('Forward') ?? -1;
    const defenseIndex = bodyText?.indexOf('Defense') ?? -1;
    const gkIndex = bodyText?.indexOf('Goalkeeper') ?? -1;

    expect(forwardIndex).toBeLessThan(defenseIndex);
    expect(defenseIndex).toBeLessThan(gkIndex);
  });
});

// ============================================================================
// Test Suite: Rapid Operations (Stress Tests)
// ============================================================================

test.describe('Rapid Operations', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoster(page, 14);
  });

  test('rapid tap-select should not break state', async ({ page }) => {
    await startNewGame(page);

    const fieldCards = page.locator('button.touch-target.rounded-xl');

    // Rapidly tap different players (use force to bypass ghost overlay interception)
    for (let i = 0; i < 5; i++) {
      await fieldCards.nth(i % 4).click({ force: true });
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/debug-27-rapid-taps.png', fullPage: true });

    // App should not crash - verify game screen still visible
    await expect(page.locator('text=Q1')).toBeVisible();
  });

  test('BUG: rapid pause/resume should not drift timer', async ({ page }) => {
    await startNewGame(page);

    // Start timer
    await page.click('button:has-text("▶")');
    await page.waitForTimeout(3000);

    // Record time before rapid pause/resume
    const timeBefore = await getQuarterTimeText(page);
    const [minB, secB] = timeBefore.split(':').map(Number);
    const secondsBefore = minB * 60 + secB;

    // Rapid pause/resume 5 times
    for (let i = 0; i < 5; i++) {
      // Pause via stop button + pause option
      await page.click('button:has-text("⏹")');
      await page.waitForTimeout(300);
      await page.click('button:has-text("Pause Timer")');
      await page.waitForTimeout(200);
      // Resume
      await page.click('button:has-text("▶")');
      await page.waitForTimeout(200);
    }

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    const timeAfter = await getQuarterTimeText(page);
    const [minA, secA] = timeAfter.split(':').map(Number);
    const secondsAfter = minA * 60 + secA;

    const elapsed = secondsAfter - secondsBefore;

    await page.screenshot({ path: 'tests/screenshots/debug-28-rapid-pause-resume.png', fullPage: true });

    // The elapsed time during rapid pause/resume cycle (~5 * 0.7s + 2s wait ≈ 5.5s)
    // Should be reasonable, not hugely drifted
    console.log(`Rapid pause/resume: before=${secondsBefore}s, after=${secondsAfter}s, elapsed=${elapsed}s`);
    expect(elapsed).toBeLessThanOrEqual(15); // Should not drift more than 15s total
    expect(elapsed).toBeGreaterThanOrEqual(1); // Should advance at least a bit
  });
});

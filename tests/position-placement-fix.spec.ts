import { test, expect } from '@playwright/test';

/**
 * Test suite for Position Placement Fix (v2.1.1)
 *
 * Verifies that when swapping a player from bench to a specific field position,
 * the player appears at the EXACT targeted position slot (left, center, or right).
 *
 * Bug: Previously, selecting "left midfield" might result in the player
 * appearing at center or right midfield due to object insertion order issues.
 *
 * Fix: swapPlayers now maintains slot order by rebuilding assignments in
 * predictable order (GK, DEF, MID, FWD, BENCH).
 */

test.describe('Position Placement Fix - Exact Slot Swapping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1000);
  });

  /**
   * Helper function to set up a game with 14 players
   */
  async function setupGameWith14Players(page: any) {
    await page.click('text=Manage Roster');
    await page.waitForTimeout(500);

    // Check if we already have players
    const playerCountText = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();
    const existingCount = parseInt(playerCountText?.match(/(\d+) \//)?.[1] || '0');

    if (existingCount >= 14) {
      console.log(`✓ Already have ${existingCount} players`);
      await page.click('text=← Back');
      return;
    }

    console.log(`Setting up roster: need ${14 - existingCount} more players`);

    // Add 14 players with specific names for position tracking
    const players = [
      { name: 'GK1', number: '1', position: 'Goalkeeper' },
      { name: 'LD-Left-Def', number: '2', position: 'Defense' },
      { name: 'CD-Center-Def', number: '3', position: 'Defense' },
      { name: 'RD-Right-Def', number: '4', position: 'Defense' },
      { name: 'LM-Left-Mid', number: '5', position: 'Midfield' },
      { name: 'CM-Center-Mid', number: '6', position: 'Midfield' },
      { name: 'RM-Right-Mid', number: '7', position: 'Midfield' },
      { name: 'LF-Left-Fwd', number: '8', position: 'Forward' },
      { name: 'RF-Right-Fwd', number: '9', position: 'Forward' },
      { name: 'Bench1', number: '10', position: 'Midfield' },
      { name: 'Bench2', number: '11', position: 'Defense' },
      { name: 'Bench3', number: '12', position: 'Forward' },
      { name: 'Bench4', number: '13', position: 'Midfield' },
      { name: 'Bench5', number: '14', position: 'Defense' },
    ];

    for (const player of players) {
      await page.click('button:has-text("+ Add Player")');
      await page.waitForSelector('input[type="text"]');
      await page.fill('input[type="text"]', player.name);
      await page.fill('input[type="number"]', player.number);
      await page.click(`button:has-text("${player.position}")`);
      await page.locator('form').locator('button[type="submit"]').click();
      await page.waitForTimeout(200);
    }

    await page.click('text=← Back');
    await page.waitForTimeout(500);
  }

  /**
   * Helper to start a game from home screen
   */
  async function startGame(page: any) {
    await page.click('text=Start New Game');
    await page.waitForTimeout(1000);

    // Handle pre-game setup if present
    const startButton = await page.locator('button:has-text("Start Game")').isVisible().catch(() => false);
    if (startButton) {
      await page.click('button:has-text("Start Game")');
      await page.waitForTimeout(1500);
    }
  }

  /**
   * Helper to get position label for a player card by player name
   */
  async function getPlayerPositionLabel(page: any, playerName: string): Promise<string | null> {
    // Find the player card
    const playerCard = page.locator(`button:has-text("${playerName}")`).first();
    if (!(await playerCard.isVisible())) {
      return null;
    }

    // Get the text content of the card
    const cardText = await playerCard.textContent();

    // Extract position label (LM, CM, RM, LD, CD, RD, LF, RF, GK)
    const labelMatch = cardText?.match(/\b(LM|CM|RM|LD|CD|RD|LF|RF|GK)\b/);
    return labelMatch ? labelMatch[1] : null;
  }

  test('bench player swapped to left midfield appears at LM position', async ({ page }) => {
    console.log('🧪 Test: Bench → Left Midfield (LM) placement');

    await setupGameWith14Players(page);
    await startGame(page);

    // Take screenshot of initial state
    await page.screenshot({ path: 'tests/screenshots/position-fix-01-initial.png', fullPage: true });

    // Verify initial state: LM-Left-Mid should be at left midfield (LM label)
    const initialLabel = await getPlayerPositionLabel(page, 'LM');
    console.log(`Initial LM-Left-Mid position label: ${initialLabel}`);
    expect(initialLabel).toBe('LM');

    // Step 1: Select bench player
    const benchPlayer = page.locator('button:has-text("Bench1")').first();
    await benchPlayer.click();
    await page.waitForTimeout(500);

    // Verify selection indicator is shown
    const selectionIndicator = await page.locator('text=Tap another player to swap').isVisible();
    expect(selectionIndicator).toBe(true);

    await page.screenshot({ path: 'tests/screenshots/position-fix-02-bench-selected.png', fullPage: true });

    // Step 2: Click the left midfield player (LM-Left-Mid with LM label)
    const leftMidfielder = page.locator('button:has-text("LM-Left-Mid")').first();
    await leftMidfielder.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/screenshots/position-fix-03-after-swap.png', fullPage: true });

    // Step 3: Verify Bench1 now has the LM label (left midfield position)
    const bench1NewLabel = await getPlayerPositionLabel(page, 'Bench1');
    console.log(`After swap, Bench1 position label: ${bench1NewLabel}`);

    // CRITICAL: Bench1 MUST be at LM (index 0 in midfielders), not CM or RM
    expect(bench1NewLabel).toBe('LM');

    // Step 4: Verify LM-Left-Mid is now on bench (no position label)
    const originalMidfielderLabel = await getPlayerPositionLabel(page, 'LM');
    console.log(`After swap, LM-Left-Mid label: ${originalMidfielderLabel || 'none (on bench)'}`);

    // Original player should not have a field position label anymore
    expect(originalMidfielderLabel).toBeNull();

    console.log('✅ Test passed: Bench player correctly placed at left midfield slot');
  });

  test('bench player swapped to center defense appears at CD position', async ({ page }) => {
    console.log('🧪 Test: Bench → Center Defense (CD) placement');

    await setupGameWith14Players(page);
    await startGame(page);

    // Verify initial center defender
    const initialLabel = await getPlayerPositionLabel(page, 'CD');
    console.log(`Initial CD-Center-Def position label: ${initialLabel}`);
    expect(initialLabel).toBe('CD');

    // Select bench player
    await page.locator('button:has-text("Bench2")').first().click();
    await page.waitForTimeout(500);

    // Click center defender
    await page.locator('button:has-text("CD-Center-Def")').first().click();
    await page.waitForTimeout(1000);

    // Verify Bench2 is now at center defense (CD label, index 1)
    const bench2NewLabel = await getPlayerPositionLabel(page, 'Bench2');
    console.log(`After swap, Bench2 position label: ${bench2NewLabel}`);
    expect(bench2NewLabel).toBe('CD');

    console.log('✅ Test passed: Bench player correctly placed at center defense slot');
  });

  test('bench player swapped to right forward appears at RF position', async ({ page }) => {
    console.log('🧪 Test: Bench → Right Forward (RF) placement');

    await setupGameWith14Players(page);
    await startGame(page);

    // Verify initial right forward
    const initialLabel = await getPlayerPositionLabel(page, 'RF');
    console.log(`Initial RF-Right-Fwd position label: ${initialLabel}`);
    expect(initialLabel).toBe('RF');

    // Select bench player
    await page.locator('button:has-text("Bench3")').first().click();
    await page.waitForTimeout(500);

    // Click right forward
    await page.locator('button:has-text("RF-Right-Fwd")').first().click();
    await page.waitForTimeout(1000);

    // Verify Bench3 is now at right forward (RF label, index 1)
    const bench3NewLabel = await getPlayerPositionLabel(page, 'Bench3');
    console.log(`After swap, Bench3 position label: ${bench3NewLabel}`);
    expect(bench3NewLabel).toBe('RF');

    console.log('✅ Test passed: Bench player correctly placed at right forward slot');
  });

  test('multiple consecutive swaps maintain correct slot positions', async ({ page }) => {
    console.log('🧪 Test: Multiple consecutive swaps preserve slot order');

    await setupGameWith14Players(page);
    await startGame(page);

    // Perform multiple swaps to verify stability

    // Swap 1: Bench4 → Left Midfield (LM)
    await page.locator('button:has-text("Bench4")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("LM-Left-Mid")').first().click();
    await page.waitForTimeout(1000);

    let bench4Label = await getPlayerPositionLabel(page, 'Bench4');
    console.log(`Swap 1 complete: Bench4 at ${bench4Label}`);
    expect(bench4Label).toBe('LM');

    // Swap 2: Bench5 → Right Defense (RD)
    await page.locator('button:has-text("Bench5")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("RD-Right-Def")').first().click();
    await page.waitForTimeout(1000);

    let bench5Label = await getPlayerPositionLabel(page, 'Bench5');
    console.log(`Swap 2 complete: Bench5 at ${bench5Label}`);
    expect(bench5Label).toBe('RD');

    // Verify Bench4 is STILL at LM (first swap should be stable)
    bench4Label = await getPlayerPositionLabel(page, 'Bench4');
    console.log(`After swap 2: Bench4 still at ${bench4Label}`);
    expect(bench4Label).toBe('LM');

    // Swap 3: Move Bench4 from LM to CM (field-to-field swap)
    await page.locator('button:has-text("Bench4")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("CM-Center-Mid")').first().click();
    await page.waitForTimeout(1000);

    bench4Label = await getPlayerPositionLabel(page, 'Bench4');
    console.log(`Swap 3 complete: Bench4 moved to ${bench4Label}`);
    expect(bench4Label).toBe('CM');

    // Verify Bench5 is STILL at RD (previous swaps should remain stable)
    bench5Label = await getPlayerPositionLabel(page, 'Bench5');
    console.log(`After swap 3: Bench5 still at ${bench5Label}`);
    expect(bench5Label).toBe('RD');

    await page.screenshot({ path: 'tests/screenshots/position-fix-multiple-swaps.png', fullPage: true });

    console.log('✅ Test passed: Multiple swaps maintain correct positions');
  });

  test('field-to-field swap preserves both players exact slots', async ({ page }) => {
    console.log('🧪 Test: Field-to-field swap preserves both slots');

    await setupGameWith14Players(page);
    await startGame(page);

    // Get initial positions
    const lmInitial = await getPlayerPositionLabel(page, 'LM');
    const rmInitial = await getPlayerPositionLabel(page, 'RM');
    console.log(`Initial: LM-Left-Mid at ${lmInitial}, RM-Right-Mid at ${rmInitial}`);
    expect(lmInitial).toBe('LM');
    expect(rmInitial).toBe('RM');

    // Swap left and right midfielders
    await page.locator('button:has-text("LM-Left-Mid")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("RM-Right-Mid")').first().click();
    await page.waitForTimeout(1000);

    // Verify they swapped exact slots
    const lmAfter = await getPlayerPositionLabel(page, 'LM');
    const rmAfter = await getPlayerPositionLabel(page, 'RM');
    console.log(`After swap: LM-Left-Mid at ${lmAfter}, RM-Right-Mid at ${rmAfter}`);

    // LM-Left-Mid should now be at RM position, RM-Right-Mid at LM position
    expect(lmAfter).toBe('RM');
    expect(rmAfter).toBe('LM');

    console.log('✅ Test passed: Field-to-field swap preserves exact slots');
  });
});

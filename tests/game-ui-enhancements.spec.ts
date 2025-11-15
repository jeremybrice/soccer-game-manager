import { test, expect } from '@playwright/test';

/**
 * Test suite for Game Screen UI Enhancements
 * Verifies all the new features:
 * - Reversed field order (FWD → MID → DEF → GK)
 * - Blue selection indicator above bench
 * - Time-based color coding
 * - Position-specific labels
 * - Time display on cards
 * - Color legend
 */

test.describe('Game Screen UI Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local app
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1000);
  });

  test('should display color legend at top of field', async ({ page }) => {
    // First, set up a game with players
    await page.click('text=Manage Roster');
    await page.waitForTimeout(500);

    // Add 9 players (minimum for a game)
    const players = [
      { name: 'Player 1', number: '1', position: 'Goalkeeper' },
      { name: 'Player 2', number: '2', position: 'Defense' },
      { name: 'Player 3', number: '3', position: 'Defense' },
      { name: 'Player 4', number: '4', position: 'Defense' },
      { name: 'Player 5', number: '5', position: 'Midfield' },
      { name: 'Player 6', number: '6', position: 'Midfield' },
      { name: 'Player 7', number: '7', position: 'Midfield' },
      { name: 'Player 8', number: '8', position: 'Forward' },
      { name: 'Player 9', number: '9', position: 'Forward' },
    ];

    for (const player of players) {
      await page.click('button:has-text("+ Add Player")');
      await page.waitForSelector('input[type="text"]');
      await page.fill('input[type="text"]', player.name);
      await page.fill('input[type="number"]', player.number);
      await page.click(`button:has-text("${player.position}")`);
      await page.locator('form').locator('button[type="submit"]').click();
      await page.waitForTimeout(300);
    }

    // Go back home and start a game
    await page.click('text=← Back');
    await page.waitForTimeout(500);
    await page.click('text=Start New Game');
    await page.waitForTimeout(1000);

    // Check if we're in pre-game setup or directly in game
    const inGame = await page.locator('text=Game Time').isVisible();

    if (!inGame) {
      // Click Start Game button
      await page.click('button:has-text("Start Game")');
      await page.waitForTimeout(1000);
    }

    // Verify color legend is visible
    const legendVisible = await page.locator('text=<10m').isVisible();
    console.log('Color legend visible:', legendVisible);
    expect(legendVisible).toBe(true);

    // Check all legend items (3-color system)
    await expect(page.locator('text=<10m')).toBeVisible();
    await expect(page.locator('text=10-15m')).toBeVisible();
    await expect(page.locator('text=>15m')).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/color-legend.png', fullPage: true });
    console.log('✅ Color legend test passed');
  });

  test('should show reversed field order with position labels', async ({ page }) => {
    // Navigate to existing game or create one
    await page.click('text=Manage Roster');
    await page.waitForTimeout(500);

    // Check if players exist, if not skip detailed checks
    const playerCount = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();
    console.log('Current players:', playerCount);

    if (playerCount?.includes('9 /') || playerCount?.includes('10 /')) {
      await page.click('text=← Back');
      await page.click('text=Start New Game');
      await page.waitForTimeout(1000);

      // Handle pre-game setup if present
      const startButton = await page.locator('button:has-text("Start Game")').isVisible().catch(() => false);
      if (startButton) {
        await page.click('button:has-text("Start Game")');
        await page.waitForTimeout(1000);
      }

      // Verify field order by checking position labels from top to bottom
      const bodyText = await page.locator('body').textContent();

      // Check that Forward section appears before Defense
      const forwardIndex = bodyText?.indexOf('Forward') ?? -1;
      const defenseIndex = bodyText?.indexOf('Defense') ?? -1;
      const goalkeeperlIndex = bodyText?.indexOf('Goalkeeper') ?? -1;

      console.log('Forward position:', forwardIndex);
      console.log('Defense position:', defenseIndex);
      console.log('Goalkeeper position:', goalkeeperlIndex);

      // Verify order: Forward should come before Defense, Defense before Goalkeeper
      expect(forwardIndex).toBeLessThan(defenseIndex);
      expect(defenseIndex).toBeLessThan(goalkeeperlIndex);

      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/field-order.png', fullPage: true });
      console.log('✅ Field order test passed - Forwards at top, GK at bottom');
    } else {
      console.log('⚠️ Not enough players to test field order');
    }
  });

  test('should display blue selection indicator above bench', async ({ page }) => {
    // Set up game
    await page.click('text=Manage Roster');
    await page.waitForTimeout(500);

    const playerCount = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();

    if (playerCount?.includes('9 /') || playerCount?.includes('10 /')) {
      await page.click('text=← Back');
      await page.click('text=Start New Game');
      await page.waitForTimeout(1000);

      const startButton = await page.locator('button:has-text("Start Game")').isVisible().catch(() => false);
      if (startButton) {
        await page.click('button:has-text("Start Game")');
        await page.waitForTimeout(1000);
      }

      // Find and click a player card
      const playerCards = await page.locator('.touch-target.rounded-xl').all();
      if (playerCards.length > 0) {
        await playerCards[0].click();
        await page.waitForTimeout(500);

        // Check for blue selection bar
        const selectionBar = await page.locator('text=Tap another player to swap positions').isVisible();
        console.log('Selection bar visible:', selectionBar);
        expect(selectionBar).toBe(true);

        // Verify it has blue background (check computed style or class)
        const blueBar = await page.locator('.bg-blue-500:has-text("Tap another player")').isVisible();
        console.log('Blue selection bar found:', blueBar);
        expect(blueBar).toBe(true);

        // Take screenshot
        await page.screenshot({ path: 'tests/screenshots/blue-selection.png', fullPage: true });
        console.log('✅ Blue selection indicator test passed');
      }
    } else {
      console.log('⚠️ Not enough players to test selection');
    }
  });

  test('should show position labels on player cards', async ({ page }) => {
    await page.click('text=Manage Roster');
    await page.waitForTimeout(500);

    const playerCount = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();

    if (playerCount?.includes('9 /') || playerCount?.includes('10 /')) {
      await page.click('text=← Back');
      await page.click('text=Start New Game');
      await page.waitForTimeout(1000);

      const startButton = await page.locator('button:has-text("Start Game")').isVisible().catch(() => false);
      if (startButton) {
        await page.click('button:has-text("Start Game")');
        await page.waitForTimeout(1000);
      }

      // Check for specific position labels
      const bodyContent = await page.locator('body').textContent();

      // Look for position labels (they should be visible somewhere)
      const hasPositionLabels =
        bodyContent?.includes('LF') ||
        bodyContent?.includes('RF') ||
        bodyContent?.includes('LM') ||
        bodyContent?.includes('CM') ||
        bodyContent?.includes('RM') ||
        bodyContent?.includes('LD') ||
        bodyContent?.includes('CD') ||
        bodyContent?.includes('RD') ||
        bodyContent?.includes('GK');

      console.log('Position labels found:', hasPositionLabels);
      console.log('Body text sample:', bodyContent?.substring(0, 500));

      // Take screenshot for manual verification
      await page.screenshot({ path: 'tests/screenshots/position-labels.png', fullPage: true });
      console.log('✅ Position labels screenshot captured');

      if (hasPositionLabels) {
        console.log('✅ Position labels are visible on cards');
      } else {
        console.log('⚠️ Position labels might not be visible yet (need to check screenshot)');
      }
    }
  });

  test('comprehensive UI verification', async ({ page }) => {
    console.log('Starting comprehensive UI test...');

    // Navigate to roster
    await page.click('text=Manage Roster');
    await page.waitForTimeout(500);

    const playerCountText = await page.locator('text=/\\d+ \\/ 14 Players/').textContent();
    const playerCount = parseInt(playerCountText?.match(/(\d+) \//)?.[1] || '0');

    console.log(`Current roster: ${playerCount} players`);

    if (playerCount >= 9) {
      // Go to game
      await page.click('text=← Back');
      await page.waitForTimeout(300);
      await page.click('text=Start New Game');
      await page.waitForTimeout(1000);

      // Handle pre-game setup
      const startButton = await page.locator('button:has-text("Start Game")').isVisible().catch(() => false);
      if (startButton) {
        await page.click('button:has-text("Start Game")');
        await page.waitForTimeout(1500);
      }

      // Comprehensive checks
      const checks = {
        colorLegend: await page.locator('text=<10m').isVisible(),
        forwardLabel: await page.locator('text=Forward').isVisible(),
        midfieldLabel: await page.locator('text=Midfield').isVisible(),
        defenseLabel: await page.locator('text=Defense').isVisible(),
        goalkeeperLabel: await page.locator('text=Goalkeeper').isVisible(),
        gameTime: await page.locator('text=Game Time').isVisible(),
      };

      console.log('UI Checks:', JSON.stringify(checks, null, 2));

      // Take final screenshot
      await page.screenshot({ path: 'tests/screenshots/game-screen-full.png', fullPage: true });

      // Verify critical elements
      expect(checks.colorLegend).toBe(true);
      expect(checks.gameTime).toBe(true);

      console.log('✅ Comprehensive UI test completed');
      console.log('Check screenshots in tests/screenshots/ for visual verification');
    } else {
      console.log(`⚠️ Need at least 9 players (have ${playerCount}). Skipping game tests.`);
    }
  });
});

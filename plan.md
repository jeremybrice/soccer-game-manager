# Debug Plan: Game Screen Deep Dive

## Approach
Run the app with Playwright E2E tests targeting the game screen. Write a comprehensive test suite that exercises every game screen feature, capturing screenshots at each step. Then fix bugs discovered.

## Phase 1: Setup & Smoke Test
1. Install dependencies, ensure dev server starts, verify Playwright works
2. Run existing tests to establish baseline (expect some may fail)

## Phase 2: Write Comprehensive Game Screen E2E Tests
Create `tests/game-debug.spec.ts` covering these scenarios:

### A. Game Startup & Timer
- Start a new game with 14 players (full roster)
- Verify all players are assigned (9 field + 5 bench)
- Verify timer shows 0:00 before starting
- **Bug check**: Player minutes should show 0 before timer starts (not accumulated time)
- Start timer, wait 5s, verify timer advances
- Pause timer, verify all timers freeze
- Resume timer, verify timers continue correctly

### B. Quarter System
- Let timer run to near quarter end (use fast-forward or manipulate state)
- Verify quarter indicator shows Q1
- Verify auto-pause triggers at 15:00 boundary
- Test "Continue Quarter" → overtime display (+MM:SS)
- Test "Start Next Quarter" → advances to Q2, resets quarter timer
- Verify Q4 end shows "Game Complete"

### C. Drag-Drop Swap System
- Long-press a field player to initiate drag
- Drag to a bench player → verify ghost preview appears
- Verify faded-out styling on source player
- **Bug check**: Stage field↔field swap, verify ghost display isn't confusing (both faded)
- Stage multiple swaps, verify SwipeExecuteBar appears
- Tap a ghost to unstage individual swap
- Swipe up to execute all swaps
- **Bug check**: Stage overlapping swaps (A↔B, then B↔C), execute, verify positions are correct
- Swipe down to clear all staged swaps

### D. Player Time Tracking
- Start game, let run for a few seconds
- Verify player cards show time badges
- Verify time-based colors: green (<10m), yellow (10-15m), red (>15m)
- Swap a field player to bench → verify their field timer resets
- **Bug check**: Verify bench time starts from 0 after swap, not carried over

### E. Pause Behavior
- Start game, pause, verify all player timers freeze
- Resume, verify timers continue from where they left off (no gap or jump)
- Rapid pause/resume multiple times, verify no time drift
- Pause near quarter boundary, resume, verify quarter end detection still works

### F. Game State Persistence
- Start a game, make some swaps, let timer run
- Refresh the page (simulate app restart)
- Verify game state is restored: timer, positions, quarter, staged swaps
- **Bug check**: Verify no NaN in timer display after reload

### G. Edge Cases
- Start game with minimum players (9)
- Try to swap when no players are staged
- Verify bench area shows correctly with 0 and 5 bench players

## Phase 3: Run Tests & Capture Screenshots
- Run each test scenario, screenshot at every meaningful state
- Document all failures with screenshots and error details

## Phase 4: Fix Bugs Found
Based on the code analysis, prioritize these likely bugs:

### P0 - Critical
1. **Staged swap execution order** (`store/index.ts`): Overlapping swaps read mutated state instead of original positions. Fix: snapshot original positions before executing swap loop.
2. **Player minutes shown before timer starts** (`GameView.tsx`): Players show accumulated time before game clock starts. Fix: return 0 when timer hasn't started.

### P1 - High
3. **Quarter timer pause calculation** (`store/index.ts`): Race condition when pausing at quarter boundary. Fix: ensure pause overlap calculation handles edge correctly.
4. **Ghost preview for field↔field swaps** (`FieldFormation.tsx`): Both players appear faded, confusing UX. Fix: only fade the source player, show ghost of destination.
5. **Timer persistence after reload** (`store/index.ts`): Date objects from IndexedDB may be strings → NaN. Fix: add defensive Date conversion with validation.

### P2 - Medium
6. **Pause period tracking** (`store/index.ts`): Multiple rapid pauses could corrupt pause periods array. Fix: validate pause state before adding new period.
7. **Quarter state initialization** (`store/index.ts`): `quarterStartedAt` not set at game start. Fix: set it when game starts.

## Phase 5: Verify Fixes
- Re-run all E2E tests
- Confirm all screenshots look correct
- Commit and push to branch

## Files Likely to be Modified
- `src/store/index.ts` (swap execution, timer, quarter state)
- `src/components/game/GameView.tsx` (timer display, player minutes)
- `src/components/game/FieldFormation.tsx` (ghost preview logic)
- `tests/game-debug.spec.ts` (new comprehensive test file)

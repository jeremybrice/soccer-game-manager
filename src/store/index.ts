/**
 * Global Application State (Zustand Store)
 *
 * Philosophy: Single source of truth. Simple actions. Predictable updates.
 * State flows one direction: Action → Store → UI
 */

import { create } from 'zustand';
import type {
  Player,
  GameSession,
  Position,
  PositionAssignments,
  AppView,
  TimerState,
  FormationTemplate,
  StagedSwap,
  QuarterConfig,
  QuarterState,
} from '../types';
import { DEFAULT_QUARTER_CONFIG, DEFAULT_QUARTER_STATE, BUILTIN_FORMATION_A, DEFAULT_FORMATIONS } from '../types';
import { db } from '../db';
import {
  exportPlayersToCSV as exportCSV,
  type PlayerCSVRow,
  type ImportResult,
} from '../utils/csvUtils';

// ============================================================================
// Store State Interface
// ============================================================================

interface AppState {
  // Data
  players: Player[];
  currentGame: GameSession | null;
  currentAssignments: PositionAssignments;

  // UI State
  currentView: AppView;
  timer: TimerState;

  // Quarter Management State (v3.1.0)
  quarterConfig: QuarterConfig;
  quarterState: QuarterState;

  // Formation State (v4.0.0 - Flexible Formations)
  formationTemplates: FormationTemplate[];
  selectedFormationId: string;
  /** Convenience getter — the currently selected template object */
  activeFormation: FormationTemplate;

  // Staged Rotations State (v3.2.0 - always in planning mode, drag-drop)
  stagedSwaps: StagedSwap[];

  // Help System State
  isHelpOpen: boolean;
  activeHelpSection: string | null;
  searchQuery: string;
  hasSeenTutorial: boolean;

  // Loading States
  isLoading: boolean;
  error: string | null;

  // ========================================================================
  // Initialization Actions
  // ========================================================================

  /**
   * Load initial data from IndexedDB
   */
  initialize: () => Promise<void>;

  // ========================================================================
  // Player Management Actions
  // ========================================================================

  /**
   * Add a new player to the roster
   */
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;

  /**
   * Update an existing player
   */
  updatePlayer: (player: Player) => Promise<void>;

  /**
   * Remove a player from the roster (soft delete)
   */
  removePlayer: (playerId: string) => Promise<void>;

  /**
   * Reload players from database
   */
  loadPlayers: () => Promise<void>;

  /**
   * Import players from CSV data
   */
  importPlayersFromCSV: (
    csvData: PlayerCSVRow[],
    replaceExisting: boolean
  ) => Promise<ImportResult>;

  /**
   * Export current roster to CSV string
   */
  exportPlayersToCSV: () => string;

  // ========================================================================
  // Game Management Actions
  // ========================================================================

  /**
   * Start a new game with initial positions
   */
  startGame: (initialAssignments: PositionAssignments) => Promise<void>;

  /**
   * End the current game
   */
  endGame: () => Promise<void>;

  /**
   * Load the active game (if any)
   */
  loadActiveGame: () => Promise<void>;

  // ========================================================================
  // Position Management Actions
  // ========================================================================

  /**
   * Swap two players' positions
   */
  swapPlayers: (playerId1: string, playerId2: string) => Promise<void>;

  /**
   * Move a player to a specific position
   */
  movePlayer: (playerId: string, toPosition: Position) => Promise<void>;

  // ========================================================================
  // Timer Actions
  // ========================================================================

  /**
   * Start/resume the game timer
   */
  startTimer: () => void;

  /**
   * Pause the game timer
   */
  pauseTimer: () => void;

  /**
   * Reset the timer to zero
   */
  resetTimer: () => void;

  /**
   * Update elapsed time (called by interval)
   */
  updateTimer: () => void;

  // ========================================================================
  // Quarter Management Actions (v3.1.0)
  // ========================================================================

  /**
   * Continue current quarter after auto-stop (enters overtime mode)
   * Use when referee hasn't stopped play yet
   */
  continueQuarter: () => void;

  /**
   * Advance to next quarter, reset quarter timer to 00:00
   * Use when referee signals quarter end
   */
  startNextQuarter: () => void;

  // ========================================================================
  // Navigation Actions
  // ========================================================================

  /**
   * Navigate to a different view
   */
  navigateTo: (view: AppView) => void;

  // ========================================================================
  // Formation Actions (v4.0.0 - Flexible Formations)
  // ========================================================================

  /**
   * Set the active formation by template ID
   */
  setActiveFormation: (templateId: string) => Promise<void>;

  /**
   * Load formation templates and preference from database
   */
  loadFormationTemplates: () => Promise<void>;

  /**
   * Save a formation template (create or update)
   */
  saveFormationTemplate: (template: FormationTemplate) => Promise<void>;

  /**
   * Delete a custom formation template
   */
  deleteFormationTemplate: (id: string) => Promise<boolean>;

  /**
   * Change formation mid-game (reassigns field players to new structure)
   */
  changeFormationMidGame: (templateId: string) => Promise<void>;

  // ========================================================================
  // Staged Rotations Actions (v3.2.0 - drag-drop based)
  // ========================================================================

  /**
   * Stage a player swap (any two players)
   */
  stageSwap: (player1Id: string, player2Id: string) => void;

  /**
   * Remove a staged swap by ID
   */
  unstageSwap: (swapId: string) => void;

  /**
   * Clear all staged swaps
   */
  clearStagedSwaps: () => void;

  /**
   * Execute all staged swaps simultaneously
   */
  executeStagedSwaps: () => Promise<void>;

  // ========================================================================
  // Help System Actions
  // ========================================================================

  /**
   * Open help modal (optionally with a specific section)
   */
  openHelp: (sectionId?: string) => void;

  /**
   * Close help modal
   */
  closeHelp: () => void;

  /**
   * Set active help section
   */
  setActiveHelpSection: (sectionId: string | null) => void;

  /**
   * Set search query for help content
   */
  setSearchQuery: (query: string) => void;

  /**
   * Mark tutorial as seen (persist to database)
   */
  markTutorialSeen: () => Promise<void>;

  /**
   * Load tutorial status from database
   */
  loadTutorialStatus: () => Promise<void>;

  // ========================================================================
  // Utility Actions
  // ========================================================================

  /**
   * Clear any error messages
   */
  clearError: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useAppStore = create<AppState>()((set, get) => ({
  // Initial State
  players: [],
  currentGame: null,
  currentAssignments: {},
  currentView: 'home',
  timer: {
    isRunning: false,
    elapsedSeconds: 0,
    totalPausedDuration: 0,
    pausePeriods: [],
  },
  quarterConfig: DEFAULT_QUARTER_CONFIG,
  quarterState: DEFAULT_QUARTER_STATE,
  formationTemplates: DEFAULT_FORMATIONS,
  selectedFormationId: BUILTIN_FORMATION_A.id,
  activeFormation: BUILTIN_FORMATION_A,
  stagedSwaps: [],
  isHelpOpen: false,
  activeHelpSection: null,
  searchQuery: '',
  hasSeenTutorial: false,
  isLoading: false,
  error: null,

  // ========================================================================
  // Initialization
  // ========================================================================

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().loadPlayers();
      await get().loadActiveGame();
      await get().loadTutorialStatus();
      await get().loadFormationTemplates();
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      });
    }
  },

  // ========================================================================
  // Player Management
  // ========================================================================

  addPlayer: async (playerInput) => {
    try {
      const player: Player = {
        ...playerInput,
        id: crypto.randomUUID(),
      };
      await db.savePlayer(player);
      await get().loadPlayers();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to add player',
      });
    }
  },

  updatePlayer: async (player) => {
    try {
      await db.savePlayer(player);
      await get().loadPlayers();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update player',
      });
    }
  },

  removePlayer: async (playerId) => {
    try {
      await db.deletePlayer(playerId);
      await get().loadPlayers();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to remove player',
      });
    }
  },

  loadPlayers: async () => {
    try {
      const players = await db.getActivePlayers();
      set({ players });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to load players',
      });
    }
  },

  importPlayersFromCSV: async (csvData, replaceExisting) => {
    try {
      const { players } = get();

      // If replace mode, deactivate all existing players
      if (replaceExisting) {
        for (const player of players) {
          await db.deletePlayer(player.id);
        }
      }

      let imported = 0;
      let updated = 0;
      const errors: ImportResult['errors'] = [];

      for (const csvRow of csvData) {
        try {
          // Check if player number already exists
          const existing = players.find((p) => p.number === csvRow.number);

          if (existing && !replaceExisting) {
            // Update existing player
            const updatedPlayer: Player = {
              ...existing,
              name: csvRow.name,
              preferredPositions: csvRow.preferredPositions,
            };
            await db.savePlayer(updatedPlayer);
            updated++;
          } else {
            // Create new player
            const newPlayer: Player = {
              id: crypto.randomUUID(),
              number: csvRow.number,
              name: csvRow.name,
              preferredPositions: csvRow.preferredPositions,
              isActive: true,
            };
            await db.savePlayer(newPlayer);
            imported++;
          }
        } catch (error) {
          errors.push({
            row: csvData.indexOf(csvRow) + 2,
            field: 'save',
            message:
              error instanceof Error ? error.message : 'Failed to save',
            data: csvRow,
          });
        }
      }

      // Reload players
      await get().loadPlayers();

      return {
        success: errors.length === 0,
        imported,
        updated,
        errors,
      };
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Import failed',
      });
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [
          {
            row: 0,
            field: 'general',
            message:
              error instanceof Error ? error.message : 'Unknown error',
            data: {},
          },
        ],
      };
    }
  },

  exportPlayersToCSV: () => {
    const { players } = get();
    return exportCSV(players);
  },

  // ========================================================================
  // Game Management
  // ========================================================================

  startGame: async (initialAssignments) => {
    try {
      const game = await db.startNewGame(initialAssignments);

      set({
        currentGame: game,
        currentAssignments: initialAssignments,
        currentView: 'game',
        timer: {
          isRunning: false,
          elapsedSeconds: 0,
          totalPausedDuration: 0,
          pausePeriods: [],
          pausedAt: undefined,
          startedAt: undefined,
        },
        // Initialize quarter state for new game (v3.1.0)
        quarterConfig: DEFAULT_QUARTER_CONFIG,
        quarterState: {
          currentQuarter: 1,
          quarterElapsedSeconds: 0,
          isAutoStopped: false,
          overtimeSeconds: 0,
          quarterStartedAt: undefined,
        },
      });
      // Timer starts in paused state - coach must manually start it
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to start game',
      });
    }
  },

  endGame: async () => {
    try {
      const { currentGame } = get();
      if (currentGame) {
        await db.endGame(currentGame.id);
        get().pauseTimer();
        get().resetTimer();
        set({
          currentGame: null,
          currentAssignments: {},
          currentView: 'home',
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to end game',
      });
    }
  },

  loadActiveGame: async () => {
    try {
      const game = await db.getActiveGame();
      if (game && game.rotations.length > 0) {
        // Convert Date fields from IndexedDB (may be stored as ISO strings after app restart)
        // This ensures .getTime() works correctly for timer calculations
        if (game.date) game.date = new Date(game.date);
        if (game.startTime) game.startTime = new Date(game.startTime);
        if (game.endTime) game.endTime = new Date(game.endTime);
        if (game.timerStartedAt) game.timerStartedAt = new Date(game.timerStartedAt);
        if (game.timerPausedAt) game.timerPausedAt = new Date(game.timerPausedAt);
        if (game.quarterStartedAt) game.quarterStartedAt = new Date(game.quarterStartedAt);

        // Convert pause period dates
        if (game.timerPausePeriods) {
          game.timerPausePeriods = game.timerPausePeriods.map(p => ({
            pausedAt: new Date(p.pausedAt),
            resumedAt: p.resumedAt ? new Date(p.resumedAt) : undefined,
          }));
        }

        // Convert rotation timestamps
        game.rotations = game.rotations.map(r => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));

        const latestRotation = game.rotations[game.rotations.length - 1];

        // Restore timer state from database
        // Timer is running if it has startedAt but no pausedAt
        const wasRunning = !!game.timerStartedAt && !game.timerPausedAt;

        const restoredTimerState: TimerState = {
          isRunning: wasRunning,
          elapsedSeconds: 0, // Will be calculated in updateTimer
          startedAt: game.timerStartedAt,
          pausedAt: game.timerPausedAt,
          totalPausedDuration: game.timerTotalPausedDuration ?? 0,
          pausePeriods: game.timerPausePeriods ?? [],
        };

        // Restore quarter state from database (v3.1.0)
        const restoredQuarterState: QuarterState = {
          currentQuarter: game.quarterCurrentQuarter ?? 1,
          quarterStartedAt: game.quarterStartedAt,
          quarterElapsedSeconds: 0, // Will be calculated in updateTimer
          isAutoStopped: game.quarterIsAutoStopped ?? false,
          overtimeSeconds: game.quarterOvertimeSeconds ?? 0,
        };

        console.log('[Store] loadActiveGame: Restored timer state', restoredTimerState);
        console.log('[Store] loadActiveGame: Restored quarter state', restoredQuarterState);

        set({
          currentGame: game,
          currentAssignments: latestRotation.assignments,
          timer: restoredTimerState,
          quarterState: restoredQuarterState,
        });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load active game',
      });
    }
  },

  // ========================================================================
  // Position Management
  // ========================================================================

  swapPlayers: async (playerId1, playerId2) => {
    try {
      const { currentAssignments, currentGame } = get();
      if (!currentGame) return;

      const pos1 = currentAssignments[playerId1];
      const pos2 = currentAssignments[playerId2];

      // Simple swap: exchange the complete PlayerPosition objects
      // This preserves both position category and slot information
      const newAssignments: PositionAssignments = {
        ...currentAssignments,
        [playerId1]: pos2,
        [playerId2]: pos1,
      };

      // Create the new rotation object
      const newRotation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        assignments: newAssignments,
      };

      await db.addRotation(currentGame.id, newAssignments);

      // Update currentGame with the new rotation to keep state in sync
      set({
        currentAssignments: newAssignments,
        currentGame: {
          ...currentGame,
          rotations: [...currentGame.rotations, newRotation],
        },
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to swap players',
      });
    }
  },

  movePlayer: async (playerId, toPosition) => {
    try {
      const { currentAssignments, currentGame } = get();
      if (!currentGame) return;

      // Note: toPosition is a Position category (not PlayerPosition)
      // We need to find an available slot or swap with someone
      // For now, assign to slot 0 (this function may need enhancement)
      const newAssignments = { ...currentAssignments };
      newAssignments[playerId] = { position: toPosition, slot: 0 };

      // Create the new rotation object
      const newRotation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        assignments: newAssignments,
      };

      await db.addRotation(currentGame.id, newAssignments);

      // Update currentGame with the new rotation to keep state in sync
      set({
        currentAssignments: newAssignments,
        currentGame: {
          ...currentGame,
          rotations: [...currentGame.rotations, newRotation],
        },
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to move player',
      });
    }
  },

  // ========================================================================
  // Timer Management
  // ========================================================================

  startTimer: () => {
    set((state) => {
      const now = new Date();

      // If resuming from pause, calculate pause duration
      if (state.timer.pausedAt) {
        const pauseDuration = now.getTime() - state.timer.pausedAt.getTime();

        // Close the current pause period
        const updatedPausePeriods = [...state.timer.pausePeriods];
        const currentPausePeriod = updatedPausePeriods[updatedPausePeriods.length - 1];
        if (currentPausePeriod && !currentPausePeriod.resumedAt) {
          currentPausePeriod.resumedAt = now;
        }

        const newTimerState = {
          ...state.timer,
          isRunning: true,
          startedAt: state.timer.startedAt || now,
          totalPausedDuration: state.timer.totalPausedDuration + pauseDuration,
          pausedAt: undefined,
          pausePeriods: updatedPausePeriods,
        };

        // Also set quarterStartedAt if not already set (v3.1.0)
        // Note: Do NOT reset isAutoStopped here - let callers manage that flag
        // This prevents auto-stop from re-triggering when continuing into overtime
        const newQuarterState = {
          ...state.quarterState,
          quarterStartedAt: state.quarterState.quarterStartedAt || now,
        };

        // Persist timer state to database
        if (state.currentGame) {
          db.updateGameTimerState(state.currentGame.id, {
            timerStartedAt: newTimerState.startedAt,
            timerPausedAt: undefined,
            timerTotalPausedDuration: newTimerState.totalPausedDuration,
            timerPausePeriods: newTimerState.pausePeriods,
          });
          // Persist quarter state
          db.updateGameQuarterState(state.currentGame.id, newQuarterState);
        }

        return { timer: newTimerState, quarterState: newQuarterState };
      }

      // Starting fresh
      const newTimerState = {
        ...state.timer,
        isRunning: true,
        startedAt: now,
      };

      // Also set quarterStartedAt for first start (v3.1.0)
      const newQuarterState = {
        ...state.quarterState,
        quarterStartedAt: state.quarterState.quarterStartedAt || now,
      };

      // Persist timer state to database
      if (state.currentGame) {
        db.updateGameTimerState(state.currentGame.id, {
          timerStartedAt: now,
          timerPausedAt: undefined,
          timerTotalPausedDuration: 0,
          timerPausePeriods: [],
        });
        // Persist quarter state
        db.updateGameQuarterState(state.currentGame.id, newQuarterState);
      }

      return { timer: newTimerState, quarterState: newQuarterState };
    });
  },

  pauseTimer: () => {
    const now = new Date();
    set((state) => {
      // Guard: don't add duplicate pause period if already paused
      if (state.timer.pausedAt && !state.timer.isRunning) {
        return state;
      }

      const newTimerState = {
        ...state.timer,
        isRunning: false,
        pausedAt: now,
        pausePeriods: [
          ...state.timer.pausePeriods,
          { pausedAt: now, resumedAt: undefined },
        ],
      };

      // Persist timer state to database
      if (state.currentGame) {
        db.updateGameTimerState(state.currentGame.id, {
          timerStartedAt: newTimerState.startedAt,
          timerPausedAt: now,
          timerTotalPausedDuration: newTimerState.totalPausedDuration,
          timerPausePeriods: newTimerState.pausePeriods,
        });
      }

      return { timer: newTimerState };
    });
  },

  resetTimer: () => {
    set({
      timer: {
        isRunning: false,
        elapsedSeconds: 0,
        totalPausedDuration: 0,
        pausedAt: undefined,
        startedAt: undefined,
        pausePeriods: [],
      },
    });
  },

  updateTimer: () => {
    set((state) => {
      // Calculate elapsed seconds from startedAt timestamp (like player timers)
      // This makes timer persistent across app lifecycle
      if (!state.timer.startedAt) {
        return state;
      }

      const now = state.timer.pausedAt ? state.timer.pausedAt.getTime() : Date.now();
      const elapsedMs = now - state.timer.startedAt.getTime() - state.timer.totalPausedDuration;
      const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

      // ========================================================================
      // Quarter Time Calculation (v3.1.0)
      // ========================================================================
      let quarterElapsedSeconds = 0;
      let overtimeSeconds = 0;

      if (state.quarterState.quarterStartedAt) {
        const quarterStart = state.quarterState.quarterStartedAt.getTime();

        // Calculate pause time that occurred during this quarter
        let quarterPauseMs = 0;
        for (const period of state.timer.pausePeriods) {
          const pauseStart = period.pausedAt.getTime();
          const pauseEnd = period.resumedAt ? period.resumedAt.getTime() : now;
          // Only count pause time that occurred during this quarter
          if (pauseEnd > quarterStart) {
            const overlapStart = Math.max(quarterStart, pauseStart);
            const overlapEnd = Math.min(now, pauseEnd);
            quarterPauseMs += Math.max(0, overlapEnd - overlapStart);
          }
        }

        const quarterElapsedMs = now - quarterStart - quarterPauseMs;
        quarterElapsedSeconds = Math.max(0, Math.floor(quarterElapsedMs / 1000));

        // Calculate overtime if past quarter duration
        if (quarterElapsedSeconds > state.quarterConfig.durationSeconds) {
          overtimeSeconds = quarterElapsedSeconds - state.quarterConfig.durationSeconds;
        }
      }

      // Check for auto-stop at quarter end (only if running and not already stopped)
      const shouldAutoStop =
        state.timer.isRunning &&
        !state.quarterState.isAutoStopped &&
        quarterElapsedSeconds >= state.quarterConfig.durationSeconds;

      if (shouldAutoStop) {
        // Trigger haptic feedback for quarter end
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]); // Distinct pattern for quarter end
        }
        console.log(`[Timer] Quarter ${state.quarterState.currentQuarter} complete - auto-stopping`);

        // Auto-pause the timer
        const pauseNow = new Date();
        const newTimerState = {
          ...state.timer,
          elapsedSeconds,
          isRunning: false,
          pausedAt: pauseNow,
          pausePeriods: [
            ...state.timer.pausePeriods,
            { pausedAt: pauseNow, resumedAt: undefined },
          ],
        };

        const newQuarterState = {
          ...state.quarterState,
          quarterElapsedSeconds,
          overtimeSeconds: 0, // No overtime yet - just hit the boundary
          isAutoStopped: true,
        };

        // Persist to database
        if (state.currentGame) {
          db.updateGameTimerState(state.currentGame.id, {
            timerStartedAt: newTimerState.startedAt,
            timerPausedAt: pauseNow,
            timerTotalPausedDuration: newTimerState.totalPausedDuration,
            timerPausePeriods: newTimerState.pausePeriods,
          });
          db.updateGameQuarterState(state.currentGame.id, newQuarterState);
        }

        return {
          timer: newTimerState,
          quarterState: newQuarterState,
        };
      }

      // Normal update - just update elapsed times
      return {
        timer: {
          ...state.timer,
          elapsedSeconds,
        },
        quarterState: {
          ...state.quarterState,
          quarterElapsedSeconds,
          overtimeSeconds,
        },
      };
    });
  },

  // ========================================================================
  // Quarter Management (v3.1.0)
  // ========================================================================

  continueQuarter: () => {
    // Resume current quarter after auto-stop (referee hasn't stopped play yet)
    // This enters overtime mode - timer continues past 15:00
    // Note: Keep isAutoStopped true to prevent auto-stop from re-triggering
    // The modal hides because condition is `isAutoStopped && !timer.isRunning`
    const { startTimer } = get();
    startTimer(); // Resume the timer - modal will hide since timer is running
    console.log(`[Quarter] Continuing Q${get().quarterState.currentQuarter} into overtime`);
  },

  startNextQuarter: () => {
    // Advance to next quarter, reset quarter timer
    const { quarterState, quarterConfig, currentGame, timer, pauseTimer } = get();

    // If timer is running (manual-stop case), pause it first
    // This ensures the button shows ▶ and user can start the new quarter
    if (timer.isRunning) {
      pauseTimer();
    }

    const nextQuarter = quarterState.currentQuarter + 1;

    // Check if game is complete (past Q4)
    if (nextQuarter > quarterConfig.totalQuarters) {
      console.log('[Quarter] Game complete - all quarters finished');
      // Game over - could trigger endGame or show completion UI
      return;
    }

    const newQuarterState: QuarterState = {
      currentQuarter: nextQuarter,
      quarterStartedAt: undefined, // Will be set when timer starts
      quarterElapsedSeconds: 0,
      isAutoStopped: false,
      overtimeSeconds: 0,
    };

    set({ quarterState: newQuarterState });

    // Persist to database
    if (currentGame) {
      db.updateGameQuarterState(currentGame.id, newQuarterState);
    }

    console.log(`[Quarter] Advanced to Q${nextQuarter} - ready to start`);
  },

  // ========================================================================
  // Navigation
  // ========================================================================

  navigateTo: (view) => {
    set({ currentView: view });
  },

  // ========================================================================
  // Help System
  // ========================================================================

  openHelp: (sectionId) => {
    set({
      isHelpOpen: true,
      activeHelpSection: sectionId || null,
      searchQuery: '', // Clear search when opening
    });
  },

  closeHelp: () => {
    set({
      isHelpOpen: false,
      searchQuery: '', // Clear search when closing
    });
  },

  setActiveHelpSection: (sectionId) => {
    set({ activeHelpSection: sectionId });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  markTutorialSeen: async () => {
    try {
      await db.saveUserPreference('hasSeenTutorial', true);
      set({ hasSeenTutorial: true });
    } catch (error) {
      console.error('[Store] Failed to mark tutorial as seen:', error);
    }
  },

  loadTutorialStatus: async () => {
    try {
      const seen = await db.getUserPreference('hasSeenTutorial');
      set({ hasSeenTutorial: seen === true });
    } catch (error) {
      console.error('[Store] Failed to load tutorial status:', error);
      set({ hasSeenTutorial: false });
    }
  },

  // ========================================================================
  // Formation Management (v4.0.0 - Flexible Formations)
  // ========================================================================

  setActiveFormation: async (templateId) => {
    try {
      const { formationTemplates } = get();
      const template = formationTemplates.find(t => t.id === templateId);
      if (!template) {
        console.error(`[Store] Formation template not found: ${templateId}`);
        return;
      }
      await db.saveUserPreference('selectedFormationId', templateId);
      set({ selectedFormationId: templateId, activeFormation: template });
      console.log(`[Store] Active formation set to '${template.name}' (${templateId})`);
    } catch (error) {
      console.error('[Store] Failed to save formation preference:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to save formation preference',
      });
    }
  },

  loadFormationTemplates: async () => {
    try {
      const templates = await db.getFormationTemplates();
      const formationTemplates = templates.length > 0 ? templates : DEFAULT_FORMATIONS;

      // Load saved preference
      let selectedId = await db.getUserPreference('selectedFormationId');

      // Legacy migration: convert 'A'/'B' to template IDs
      if (!selectedId) {
        const legacyFormation = await db.getUserPreference('selectedFormation');
        if (legacyFormation === 'B') {
          selectedId = 'builtin-3-4-1';
        } else {
          selectedId = BUILTIN_FORMATION_A.id;
        }
        await db.saveUserPreference('selectedFormationId', selectedId);
      }

      // Ensure selected template exists
      const activeTemplate = formationTemplates.find(t => t.id === selectedId) || formationTemplates[0];

      set({
        formationTemplates,
        selectedFormationId: activeTemplate.id,
        activeFormation: activeTemplate,
      });
      console.log(`[Store] Loaded ${formationTemplates.length} formation templates, active: '${activeTemplate.name}'`);
    } catch (error) {
      console.error('[Store] Failed to load formation templates:', error);
      set({
        formationTemplates: DEFAULT_FORMATIONS,
        selectedFormationId: BUILTIN_FORMATION_A.id,
        activeFormation: BUILTIN_FORMATION_A,
      });
    }
  },

  saveFormationTemplate: async (template) => {
    try {
      await db.saveFormationTemplate(template);
      const templates = await db.getFormationTemplates();
      set({ formationTemplates: templates });
      console.log(`[Store] Saved formation template: '${template.name}'`);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save formation template',
      });
    }
  },

  deleteFormationTemplate: async (id) => {
    try {
      const { selectedFormationId } = get();
      const deleted = await db.deleteFormationTemplate(id);
      if (!deleted) return false;

      const templates = await db.getFormationTemplates();

      // If we deleted the active formation, fall back to first template
      let newState: Partial<AppState> = { formationTemplates: templates };
      if (selectedFormationId === id) {
        const fallback = templates[0] || BUILTIN_FORMATION_A;
        newState = {
          ...newState,
          selectedFormationId: fallback.id,
          activeFormation: fallback,
        };
        await db.saveUserPreference('selectedFormationId', fallback.id);
      }

      set(newState as AppState);
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete formation template',
      });
      return false;
    }
  },

  changeFormationMidGame: async (templateId) => {
    try {
      const { formationTemplates, currentAssignments, currentGame } = get();
      if (!currentGame) return;

      const template = formationTemplates.find(t => t.id === templateId);
      if (!template) return;

      // Build new assignments: keep GK, reassign field players to new rows, keep bench
      const newAssignments: PositionAssignments = {};

      // Keep GK
      const gkEntry = Object.entries(currentAssignments).find(([, pos]) => pos.position === 'GK');
      if (gkEntry) {
        newAssignments[gkEntry[0]] = { position: 'GK', slot: 0 };
      }

      // Collect current field players (non-GK, non-bench)
      const fieldPlayerIds = Object.entries(currentAssignments)
        .filter(([, pos]) => pos.position !== 'GK' && pos.position !== 'BENCH')
        .map(([id]) => id);

      // Collect bench players
      const benchPlayerIds = Object.entries(currentAssignments)
        .filter(([, pos]) => pos.position === 'BENCH')
        .map(([id]) => id);

      // Assign field players to new formation rows (top-down)
      let fieldIdx = 0;
      for (const row of template.rows) {
        for (let slot = 0; slot < row.count; slot++) {
          if (fieldIdx < fieldPlayerIds.length) {
            newAssignments[fieldPlayerIds[fieldIdx]] = {
              position: row.position,
              slot,
            };
            fieldIdx++;
          }
        }
      }

      // Any remaining field players go to bench
      let benchSlot = 0;
      for (let i = fieldIdx; i < fieldPlayerIds.length; i++) {
        newAssignments[fieldPlayerIds[i]] = { position: 'BENCH', slot: benchSlot++ };
      }

      // Put original bench players on bench
      for (const id of benchPlayerIds) {
        newAssignments[id] = { position: 'BENCH', slot: benchSlot++ };
      }

      // Create rotation entry
      const newRotation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        assignments: newAssignments,
      };

      await db.addRotation(currentGame.id, newAssignments);
      await db.saveUserPreference('selectedFormationId', templateId);

      set({
        currentAssignments: newAssignments,
        currentGame: {
          ...currentGame,
          rotations: [...currentGame.rotations, newRotation],
        },
        selectedFormationId: templateId,
        activeFormation: template,
        stagedSwaps: [], // Clear any staged swaps
      });

      console.log(`[Store] Changed mid-game formation to '${template.name}'`);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to change formation',
      });
    }
  },

  // ========================================================================
  // Staged Rotations Management (v3.2.0 - drag-drop based)
  // ========================================================================

  stageSwap: (player1Id, player2Id) => {
    set((state) => {
      // Check if either player is already in a staged swap
      const existingSwapIndex = state.stagedSwaps.findIndex(
        (swap) =>
          swap.player1Id === player1Id ||
          swap.player2Id === player2Id ||
          swap.player1Id === player2Id ||
          swap.player2Id === player1Id
      );

      let newStagedSwaps: StagedSwap[];

      if (existingSwapIndex >= 0) {
        // Replace existing swap involving these players
        newStagedSwaps = [...state.stagedSwaps];
        newStagedSwaps[existingSwapIndex] = {
          id: crypto.randomUUID(),
          player1Id,
          player2Id,
          timestamp: Date.now(),
        };
      } else {
        // Add new swap
        newStagedSwaps = [
          ...state.stagedSwaps,
          {
            id: crypto.randomUUID(),
            player1Id,
            player2Id,
            timestamp: Date.now(),
          },
        ];
      }

      console.log(`[Store] Staged swap: #${player1Id} ↔ #${player2Id}`);
      return { stagedSwaps: newStagedSwaps };
    });
  },

  unstageSwap: (swapId) => {
    set((state) => ({
      stagedSwaps: state.stagedSwaps.filter((swap) => swap.id !== swapId),
    }));
  },

  clearStagedSwaps: () => {
    set({ stagedSwaps: [] });
    console.log('[Store] Cleared all staged swaps');
  },

  executeStagedSwaps: async () => {
    const { stagedSwaps, currentAssignments, currentGame } = get();

    if (!currentGame || stagedSwaps.length === 0) {
      console.log('[Store] No staged swaps to execute');
      return;
    }

    try {
      // Execute all swaps simultaneously by building new assignments
      // IMPORTANT: Snapshot original positions before any mutations to avoid
      // overlapping swaps reading mutated state (e.g., A↔B then B↔C)
      const originalAssignments = { ...currentAssignments };
      const newAssignments = { ...currentAssignments };

      for (const swap of stagedSwaps) {
        const pos1 = originalAssignments[swap.player1Id];
        const pos2 = originalAssignments[swap.player2Id];
        // Swap complete PlayerPosition objects (includes slot)
        newAssignments[swap.player1Id] = pos2;
        newAssignments[swap.player2Id] = pos1;
      }

      // Save rotation to database
      await db.addRotation(currentGame.id, newAssignments);

      // Create the new rotation object
      const newRotation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        assignments: newAssignments,
      };

      // Update store
      set({
        currentAssignments: newAssignments,
        currentGame: {
          ...currentGame,
          rotations: [...currentGame.rotations, newRotation],
        },
        stagedSwaps: [], // Clear staged swaps after execution
      });

      console.log(`[Store] Executed ${stagedSwaps.length} staged swaps`);
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to execute staged swaps',
      });
    }
  },

  // ========================================================================
  // Utilities
  // ========================================================================

  clearError: () => {
    set({ error: null });
  },
}));

// ============================================================================
// Timer Hook (runs timer updates)
// ============================================================================

// Start timer interval
// Note: Runs even when paused to recalculate elapsed time on app reopen
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useAppStore.getState();
    // Update timer if running OR if we have a startedAt timestamp (for recalculation after app reopen)
    if (state.timer.isRunning || state.timer.startedAt) {
      state.updateTimer();
    }
  }, 1000);
}

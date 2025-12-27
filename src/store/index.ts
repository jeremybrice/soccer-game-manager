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
  FormationType,
  StagedSwap,
} from '../types';
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

  // Formation State
  selectedFormation: FormationType;

  // Staged Rotations State
  planningMode: boolean;
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
  // Navigation Actions
  // ========================================================================

  /**
   * Navigate to a different view
   */
  navigateTo: (view: AppView) => void;

  // ========================================================================
  // Formation Actions
  // ========================================================================

  /**
   * Set the selected formation (A or B)
   */
  setFormation: (formation: FormationType) => Promise<void>;

  /**
   * Load formation preference from database
   */
  loadFormationPreference: () => Promise<void>;

  // ========================================================================
  // Staged Rotations Actions
  // ========================================================================

  /**
   * Toggle planning mode on/off
   */
  togglePlanningMode: () => void;

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
  selectedFormation: 'A',
  planningMode: false,
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
      await get().loadFormationPreference();
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
        }
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

        console.log('[Store] loadActiveGame: Restored timer state', restoredTimerState);

        set({
          currentGame: game,
          currentAssignments: latestRotation.assignments,
          timer: restoredTimerState,
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

        // Persist timer state to database
        if (state.currentGame) {
          db.updateGameTimerState(state.currentGame.id, {
            timerStartedAt: newTimerState.startedAt,
            timerPausedAt: undefined,
            timerTotalPausedDuration: newTimerState.totalPausedDuration,
            timerPausePeriods: newTimerState.pausePeriods,
          });
        }

        return { timer: newTimerState };
      }

      // Starting fresh
      const newTimerState = {
        ...state.timer,
        isRunning: true,
        startedAt: now,
      };

      // Persist timer state to database
      if (state.currentGame) {
        db.updateGameTimerState(state.currentGame.id, {
          timerStartedAt: now,
          timerPausedAt: undefined,
          timerTotalPausedDuration: 0,
          timerPausePeriods: [],
        });
      }

      return { timer: newTimerState };
    });
  },

  pauseTimer: () => {
    const now = new Date();
    set((state) => {
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

      return {
        timer: {
          ...state.timer,
          elapsedSeconds,
        },
      };
    });
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
  // Formation Management
  // ========================================================================

  setFormation: async (formation) => {
    try {
      await db.saveUserPreference('selectedFormation', formation);
      set({ selectedFormation: formation });
      console.log(`[Store] Formation set to ${formation}`);
    } catch (error) {
      console.error('[Store] Failed to save formation preference:', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save formation preference',
      });
    }
  },

  loadFormationPreference: async () => {
    try {
      const formation = await db.getUserPreference('selectedFormation');
      if (formation === 'A' || formation === 'B') {
        set({ selectedFormation: formation });
        console.log(`[Store] Loaded formation preference: ${formation}`);
      } else {
        // Default to Formation A
        set({ selectedFormation: 'A' });
      }
    } catch (error) {
      console.error('[Store] Failed to load formation preference:', error);
      set({ selectedFormation: 'A' });
    }
  },

  // ========================================================================
  // Staged Rotations Management
  // ========================================================================

  togglePlanningMode: () => {
    set((state) => ({
      planningMode: !state.planningMode,
      // Clear staged swaps when exiting planning mode
      stagedSwaps: !state.planningMode ? state.stagedSwaps : [],
    }));
  },

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
      // With PlayerPosition, we swap the complete objects (position + slot)
      let newAssignments = { ...currentAssignments };

      for (const swap of stagedSwaps) {
        const pos1 = newAssignments[swap.player1Id];
        const pos2 = newAssignments[swap.player2Id];
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
        planningMode: false, // Exit planning mode
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

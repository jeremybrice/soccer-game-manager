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

      // Get all players at each position BEFORE swap, preserving current order
      const getPlayersAtPosition = (position: Position): string[] => {
        return Object.entries(currentAssignments)
          .filter(([, pos]) => pos === position)
          .map(([id]) => id);
      };

      const playersAtPos1 = getPlayersAtPosition(pos1);
      const playersAtPos2 = getPlayersAtPosition(pos2);

      // Find the slot index of each player in their current position
      const slot1 = playersAtPos1.indexOf(playerId1);
      const slot2 = playersAtPos2.indexOf(playerId2);

      // Create new player lists for each position with swapped players
      const newPlayersAtPos1 = [...playersAtPos1];
      const newPlayersAtPos2 = [...playersAtPos2];

      // Swap: player1 goes to player2's slot, player2 goes to player1's slot
      newPlayersAtPos1[slot1] = playerId2;
      newPlayersAtPos2[slot2] = playerId1;

      // Rebuild assignments maintaining slot order for all positions
      // Process positions in order: GK, DEF, MID, FWD, BENCH
      const newAssignments: PositionAssignments = {};
      const positionOrder: Position[] = ['GK', 'DEF', 'MID', 'FWD', 'BENCH'];

      positionOrder.forEach((position) => {
        let orderedPlayerIds: string[];

        if (position === pos1) {
          orderedPlayerIds = newPlayersAtPos1;
        } else if (position === pos2) {
          orderedPlayerIds = newPlayersAtPos2;
        } else {
          // For other positions, maintain existing order
          orderedPlayerIds = getPlayersAtPosition(position);
        }

        // Add players to assignments in order
        orderedPlayerIds.forEach((playerId) => {
          newAssignments[playerId] = position;
        });
      });

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

      // Find who is currently at the target position
      const currentPlayerAtPosition = Object.entries(currentAssignments).find(
        ([, pos]) => pos === toPosition
      )?.[0];

      const fromPosition = currentAssignments[playerId];

      const newAssignments = { ...currentAssignments };
      newAssignments[playerId] = toPosition;

      // If someone was there, swap them
      if (currentPlayerAtPosition) {
        newAssignments[currentPlayerAtPosition] = fromPosition;
      }

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

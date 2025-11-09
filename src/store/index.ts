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
  },
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
      get().startTimer();
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
        set({
          currentGame: game,
          currentAssignments: latestRotation.assignments,
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

      const newAssignments = {
        ...currentAssignments,
        [playerId1]: pos2,
        [playerId2]: pos1,
      };

      await db.addRotation(currentGame.id, newAssignments);
      set({ currentAssignments: newAssignments });
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

      await db.addRotation(currentGame.id, newAssignments);
      set({ currentAssignments: newAssignments });
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
        return {
          timer: {
            ...state.timer,
            isRunning: true,
            startedAt: state.timer.startedAt || now,
            totalPausedDuration: state.timer.totalPausedDuration + pauseDuration,
            pausedAt: undefined,
          },
        };
      }

      // Starting fresh
      return {
        timer: {
          ...state.timer,
          isRunning: true,
          startedAt: now,
        },
      };
    });
  },

  pauseTimer: () => {
    set((state) => ({
      timer: {
        ...state.timer,
        isRunning: false,
        pausedAt: new Date(),
      },
    }));
  },

  resetTimer: () => {
    set({
      timer: {
        isRunning: false,
        elapsedSeconds: 0,
        totalPausedDuration: 0,
        pausedAt: undefined,
        startedAt: undefined,
      },
    });
  },

  updateTimer: () => {
    set((state) => {
      if (!state.timer.isRunning) return state;
      return {
        timer: {
          ...state.timer,
          elapsedSeconds: state.timer.elapsedSeconds + 1,
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
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useAppStore.getState();
    if (state.timer.isRunning) {
      state.updateTimer();
    }
  }, 1000);
}

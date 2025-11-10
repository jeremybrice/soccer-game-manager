/**
 * Core type definitions for Soccer Game Manager
 *
 * Philosophy: Simple, immutable data structures that compose elegantly.
 * Each type serves a single, clear purpose.
 */

// ============================================================================
// Position Types
// ============================================================================

/**
 * Field positions in our 3-3-2-1 formation
 * GK: Goalkeeper (1 player)
 * DEF: Defense (3 players)
 * MID: Midfield (3 players)
 * FWD: Forward/Striker (2 players)
 * BENCH: Not currently playing (5 players when full team of 14)
 */
export type Position = 'GK' | 'DEF' | 'MID' | 'FWD' | 'BENCH';

/**
 * Formation configuration - immutable structure
 */
export const FORMATION = {
  GK: 1,
  DEF: 3,
  MID: 3,
  FWD: 2,
  BENCH: 5, // 14 total - 9 on field = 5 on bench
} as const;

export const TOTAL_PLAYERS = 14;
export const FIELD_PLAYERS = 9;

// ============================================================================
// Player Types
// ============================================================================

/**
 * A player on the team.
 * Preferences are ordered - first preference is most preferred position.
 */
export interface Player {
  id: string;
  name: string;
  number: number;
  preferredPositions: Position[];
  isActive: boolean; // false if they've left the team
}

/**
 * Player creation (before ID is assigned)
 */
export type PlayerInput = Omit<Player, 'id'>;

// ============================================================================
// Game Session Types
// ============================================================================

/**
 * A single game session with rotation history
 */
export interface GameSession {
  id: string;
  date: Date;
  opponent?: string;
  rotations: Rotation[];
  isActive: boolean; // true if game is currently in progress
  startTime: Date;
  endTime?: Date;

  // Timer state persistence (added for app lifecycle timer persistence)
  timerStartedAt?: Date;
  timerPausedAt?: Date;
  timerTotalPausedDuration?: number;
  timerPausePeriods?: PausePeriod[];
}

/**
 * A snapshot of player positions at a specific moment
 * Records who is where, enabling time-based calculations
 */
export interface Rotation {
  id: string;
  timestamp: Date;
  assignments: PositionAssignments;
}

/**
 * Maps player IDs to their positions
 * Invariant: Exactly 9 players on field positions, rest on BENCH
 */
export type PositionAssignments = Record<string, Position>;

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Playing time statistics for a single player
 */
export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalMinutes: number;
  minutesByPosition: Record<Position, number>;
  gamesPlayed: number;
}

/**
 * Team-wide fairness metrics
 */
export interface FairnessMetrics {
  averageMinutesPerPlayer: number;
  standardDeviation: number;
  minMinutes: number;
  maxMinutes: number;
  mostPlayedPosition: Position;
  leastPlayedPosition: Position;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Current view in the application
 */
export type AppView = 'home' | 'roster' | 'game' | 'stats' | 'settings';

/**
 * Represents a single pause period during a game
 */
export interface PausePeriod {
  pausedAt: Date;
  resumedAt?: Date; // undefined if currently paused
}

/**
 * Timer state for active game
 */
export interface TimerState {
  isRunning: boolean;
  elapsedSeconds: number;
  startedAt?: Date;
  pausedAt?: Date;
  totalPausedDuration: number; // Total milliseconds the game has been paused
  pausePeriods: PausePeriod[]; // Array of all pause periods for overlap calculation
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Type guard to check if a position is a field position
 */
export const isFieldPosition = (pos: Position): boolean => {
  return pos !== 'BENCH';
};

/**
 * Get display name for position
 */
export const getPositionName = (pos: Position): string => {
  const names: Record<Position, string> = {
    GK: 'Goalkeeper',
    DEF: 'Defense',
    MID: 'Midfield',
    FWD: 'Forward',
    BENCH: 'Bench',
  };
  return names[pos];
};

/**
 * Get short display name for position (for tight spaces)
 */
export const getPositionShort = (pos: Position): string => {
  return pos;
};

// ============================================================================
// Help System Types
// ============================================================================

/**
 * Help section category for organization
 */
export type HelpCategory = 'getting-started' | 'features' | 'reference' | 'advanced';

/**
 * A single help documentation section
 */
export interface HelpSection {
  id: string;
  title: string;
  icon: string;
  category: HelpCategory;
  content: string; // Markdown content
  keywords: string[]; // For search functionality
  order: number;
}

/**
 * Help modal state
 */
export interface HelpState {
  isOpen: boolean;
  activeSection?: string;
  searchQuery: string;
  hasSeenTutorial: boolean;
}

/**
 * Interactive tutorial step
 */
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // CSS selector for highlighting
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // Optional action text
}

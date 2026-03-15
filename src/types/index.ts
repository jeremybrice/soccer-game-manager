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
 * Field position categories
 * GK: Goalkeeper (1 player)
 * DEF: Defense (3 players)
 * MID: Midfield (3-4 players depending on formation)
 * FWD: Forward/Striker (1-2 players depending on formation)
 * BENCH: Not currently playing (5 players when full team of 14)
 */
export type Position = 'GK' | 'DEF' | 'MID' | 'FWD' | 'BENCH';

/**
 * Player position with specific slot information
 * Enables tracking exact position within a category (e.g., LM vs CM vs RM)
 * Critical for custom formations and precise player placement
 */
export interface PlayerPosition {
  position: Position;  // Category: GK, DEF, MID, FWD, or BENCH
  slot: number;        // Index within category (0-based)
                       // DEF: 0=LD, 1=CD, 2=RD
                       // MID: 0=LM, 1=CM, 2=RM (Formation A) or 0=LM, 1=CLM, 2=CRM, 3=RM (Formation B)
                       // FWD: 0=LF, 1=RF (Formation A) or 0=CF (Formation B)
                       // BENCH: 0-4 (tracks bench order for rotation strategies)
}

// ============================================================================
// Formation Template Types (v4.0.0 - Flexible Formations)
// ============================================================================

/**
 * A single row in a formation (e.g., 3 defenders, 2 forwards)
 * Labels are optional — auto-generated from position and count if omitted
 */
export interface FormationRow {
  position: Position;         // DEF, MID, or FWD
  count: number;              // How many players in this row
  labels?: string[];          // Optional custom labels (auto-generated if omitted)
}

/**
 * A saved formation template
 * GK is always 1 and rendered separately — not part of rows.
 * Bench count is dynamic: totalActivePlayers - (1 + sum(row.count))
 */
export interface FormationTemplate {
  id: string;
  name: string;
  rows: FormationRow[];       // Ordered top-to-bottom (FWD first → DEF last)
  createdAt: number;
  isBuiltIn: boolean;         // true for default formations (can't be deleted)
}

/**
 * Get the total number of field players (excluding GK) in a formation template
 */
export const getFormationFieldCount = (template: FormationTemplate): number => {
  return template.rows.reduce((sum, row) => sum + row.count, 0);
};

/**
 * Get a compact structure string for a formation (e.g., "3-3-2")
 * Rows are displayed in reverse order (DEF first) to match soccer convention
 */
export const getFormationStructure = (template: FormationTemplate): string => {
  return [...template.rows].reverse().map(row => row.count).join('-');
};

/**
 * Auto-generate position labels for a formation row based on count
 * 1: C prefix (CF, CM, CD)
 * 2: L prefix, R prefix
 * 3: L prefix, C prefix, R prefix
 * 4: L prefix, CL prefix, CR prefix, R prefix
 * 5+: prefix + slot number
 */
export const generateRowLabels = (row: FormationRow): string[] => {
  if (row.labels && row.labels.length === row.count) return row.labels;

  const prefixMap: Record<string, string> = { DEF: 'D', MID: 'M', FWD: 'F' };
  const p = prefixMap[row.position] || row.position[0];

  switch (row.count) {
    case 1: return [`C${p}`];
    case 2: return [`L${p}`, `R${p}`];
    case 3: return [`L${p}`, `C${p}`, `R${p}`];
    case 4: return [`L${p}`, `CL${p}`, `CR${p}`, `R${p}`];
    default: return Array.from({ length: row.count }, (_, i) => `${p}${i + 1}`);
  }
};

/**
 * Get a formation config object (legacy-compatible: { GK, DEF, MID, FWD })
 * Sums all rows by position category for components that need slot counts per position
 */
export const getFormationConfig = (template: FormationTemplate): Record<Position, number> => {
  const config: Record<Position, number> = { GK: 1, DEF: 0, MID: 0, FWD: 0, BENCH: 0 };
  for (const row of template.rows) {
    config[row.position] += row.count;
  }
  return config;
};

// ============================================================================
// Built-in Formation Templates
// ============================================================================

export const BUILTIN_FORMATION_A: FormationTemplate = {
  id: 'builtin-3-3-2',
  name: '3-3-2',
  rows: [
    { position: 'FWD', count: 2, labels: ['LF', 'RF'] },
    { position: 'MID', count: 3, labels: ['LM', 'CM', 'RM'] },
    { position: 'DEF', count: 3, labels: ['LD', 'CD', 'RD'] },
  ],
  createdAt: 0,
  isBuiltIn: true,
};

export const BUILTIN_FORMATION_B: FormationTemplate = {
  id: 'builtin-3-4-1',
  name: '3-4-1',
  rows: [
    { position: 'FWD', count: 1, labels: ['CF'] },
    { position: 'MID', count: 4, labels: ['LM', 'CLM', 'CRM', 'RM'] },
    { position: 'DEF', count: 3, labels: ['LD', 'CD', 'RD'] },
  ],
  createdAt: 0,
  isBuiltIn: true,
};

export const DEFAULT_FORMATIONS: FormationTemplate[] = [
  BUILTIN_FORMATION_A,
  BUILTIN_FORMATION_B,
];

// Legacy constants kept for backward compatibility during migration
export const FORMATION_A = { GK: 1, DEF: 3, MID: 3, FWD: 2, BENCH: 5 } as const;
export const FORMATION_B = { GK: 1, DEF: 3, MID: 4, FWD: 1, BENCH: 5 } as const;
export const FORMATION = FORMATION_A;
export type FormationType = 'A' | 'B';

export const MIN_PLAYERS_TO_START = 4; // 1 GK + 3 field players minimum
export const RECOMMENDED_MIN_PLAYERS = 9; // Show warning below this

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

  // Quarter state persistence (v3.1.0 - quarter-based clock management)
  quarterConfig?: QuarterConfig;
  quarterCurrentQuarter?: number;
  quarterStartedAt?: Date;
  quarterIsAutoStopped?: boolean;
  quarterOvertimeSeconds?: number;
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
 * Maps player IDs to their positions with slot information
 * Invariant: Exactly 9 players on field positions, rest on BENCH
 * Each player has a specific slot within their position category
 *
 * Example:
 * {
 *   "player1": { position: "MID", slot: 0 },  // LM (Left Midfielder)
 *   "player2": { position: "MID", slot: 1 },  // CM (Center Midfielder)
 *   "player3": { position: "MID", slot: 2 },  // RM (Right Midfielder)
 *   "player4": { position: "BENCH", slot: 0 } // First on bench
 * }
 */
export type PositionAssignments = Record<string, PlayerPosition>;

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
export type AppView = 'home' | 'roster' | 'game' | 'stats' | 'settings' | 'formations';

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
// Quarter Management Types
// ============================================================================

/**
 * Quarter configuration - customizable per league/age group
 * Default: 4 quarters x 15 minutes (youth soccer standard)
 */
export interface QuarterConfig {
  durationSeconds: number;  // 900 = 15 minutes per quarter
  totalQuarters: number;    // 4 quarters per game
}

/**
 * Default quarter configuration for youth soccer
 */
export const DEFAULT_QUARTER_CONFIG: QuarterConfig = {
  durationSeconds: 900,  // 15 minutes
  totalQuarters: 4,
};

/**
 * Quarter state tracking for auto-pause functionality
 * Tracks current quarter progress and overtime when referee extends play
 */
export interface QuarterState {
  currentQuarter: number;           // 1-4 (which quarter we're in)
  quarterStartedAt?: Date;          // When current quarter clock started
  quarterElapsedSeconds: number;    // Seconds elapsed in current quarter
  isAutoStopped: boolean;           // True when auto-paused at quarter end
  overtimeSeconds: number;          // Seconds continued past quarter duration (referee flexibility)
}

/**
 * Default quarter state for new games
 */
export const DEFAULT_QUARTER_STATE: QuarterState = {
  currentQuarter: 1,
  quarterElapsedSeconds: 0,
  isAutoStopped: false,
  overtimeSeconds: 0,
};

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

/**
 * Get slot label for a specific position and slot index
 * Accepts either a FormationTemplate (new) or FormationType (legacy)
 */
export const getSlotLabel = (
  position: Position,
  slot: number,
  formation: FormationTemplate | FormationType
): string => {
  if (position === 'GK') return 'GK';
  if (position === 'BENCH') return 'BENCH';

  // New template-based label resolution
  if (typeof formation === 'object' && 'rows' in formation) {
    const row = formation.rows.find(r => r.position === position);
    if (row) {
      const labels = generateRowLabels(row);
      return labels[slot] || `${position}${slot}`;
    }
    return `${position}${slot}`;
  }

  // Legacy FormationType support
  if (position === 'DEF') {
    const labels = ['LD', 'CD', 'RD'];
    return labels[slot] || `DEF${slot}`;
  }

  if (position === 'MID') {
    const labels = formation === 'A'
      ? ['LM', 'CM', 'RM']
      : ['LM', 'CLM', 'CRM', 'RM'];
    return labels[slot] || `MID${slot}`;
  }

  if (position === 'FWD') {
    const labels = formation === 'A'
      ? ['LF', 'RF']
      : ['CF'];
    return labels[slot] || `FWD${slot}`;
  }

  return position;
};

/**
 * Create a PlayerPosition object
 */
export const createPlayerPosition = (position: Position, slot: number): PlayerPosition => {
  return { position, slot };
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

// ============================================================================
// Staged Rotations Types
// ============================================================================

/**
 * A pending player swap in planning mode
 * Represents any player swap to be executed later (field↔bench or field↔field)
 */
export interface StagedSwap {
  id: string;
  player1Id: string;
  player2Id: string;
  timestamp: number;
}

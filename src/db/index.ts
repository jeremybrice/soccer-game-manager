/**
 * IndexedDB Database Layer using Dexie
 *
 * Philosophy: Offline-first. The device is the source of truth.
 * Network is an enhancement, not a requirement.
 */

import Dexie, { type Table } from 'dexie';
import type { Player, GameSession, Rotation, PositionAssignments } from '../types';

/**
 * User preference storage for app settings
 */
export interface UserPreference {
  key: string;
  value: any;
  lastUpdated: number;
}

/**
 * Database schema
 * - players: Team roster
 * - games: Game sessions with rotation history
 * - rotations: Position snapshots (linked to games)
 *
 * Schema Changes:
 * v1: Initial schema
 * v2: Added timer state fields to GameSession (timerStartedAt, timerPausedAt, etc.)
 *     Note: No migration needed as fields are optional and IndexedDB stores full objects
 * v3: Changed PositionAssignments from Record<string, Position> to Record<string, PlayerPosition>
 *     Position now includes slot information for precise player placement
 *     Migration: Clears all existing games and rotations (pilot testing phase)
 */
export class SoccerDatabase extends Dexie {
  players!: Table<Player, string>;
  games!: Table<GameSession, string>;
  rotations!: Table<Rotation, string>;
  userPreferences!: Table<UserPreference, string>;

  constructor() {
    super('SoccerGameManager');

    // Schema version 1
    this.version(1).stores({
      players: 'id, number, isActive',
      games: 'id, date, isActive',
      rotations: 'id, timestamp, gameId',
    });

    // Schema version 2: Add user preferences table
    this.version(2).stores({
      players: 'id, number, isActive',
      games: 'id, date, isActive',
      rotations: 'id, timestamp, gameId',
      userPreferences: 'key, lastUpdated',
    });

    // Schema version 3: Add slot-aware positions
    this.version(3)
      .stores({
        players: 'id, number, isActive',
        games: 'id, date, isActive',
        rotations: 'id, timestamp, gameId',
        userPreferences: 'key, lastUpdated',
      })
      .upgrade(async (tx) => {
        // Clear existing games and rotations due to breaking change in PositionAssignments structure
        // Players are preserved
        console.log('[DB Migration v3] Clearing games and rotations for slot-aware position upgrade');
        await tx.table('games').clear();
        await tx.table('rotations').clear();
      });
  }

  /**
   * Initialize database with sample data if empty (first run)
   */
  async initializeIfEmpty(): Promise<void> {
    const playerCount = await this.players.count();
    if (playerCount === 0) {
      console.log('First run - database initialized');
      // Don't add sample data - let user create their team
    }
  }

  /**
   * Get all active players (sorted by number)
   * Note: Uses in-memory filtering instead of indexed query to avoid
   * IndexedDB issues with boolean indexes
   */
  async getActivePlayers(): Promise<Player[]> {
    const allPlayers = await this.players.orderBy('number').toArray();
    const activePlayers = allPlayers.filter(p => p.isActive === true);
    console.log(`[DB] getActivePlayers: Found ${activePlayers.length} active players out of ${allPlayers.length} total`);
    return activePlayers;
  }

  /**
   * Get current active game session (if any)
   * Note: Uses in-memory filtering instead of indexed query
   */
  async getActiveGame(): Promise<GameSession | undefined> {
    const allGames = await this.games.toArray();
    const activeGame = allGames.find(g => g.isActive === true);
    console.log(`[DB] getActiveGame: ${activeGame ? 'Found active game' : 'No active game'}`);
    return activeGame;
  }

  /**
   * Get all games (sorted by date, most recent first)
   */
  async getAllGames(): Promise<GameSession[]> {
    return await this.games
      .orderBy('date')
      .reverse()
      .toArray();
  }

  /**
   * Get rotations for a specific game
   */
  async getGameRotations(): Promise<Rotation[]> {
    // Note: We need to add gameId to the Rotation type
    // For now, we'll filter in memory after loading
    const allRotations = await this.rotations.toArray();
    return allRotations
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Start a new game session
   */
  async startNewGame(initialAssignments: PositionAssignments): Promise<GameSession> {
    const gameId = crypto.randomUUID();
    const rotationId = crypto.randomUUID();
    const now = new Date();

    const rotation: Rotation = {
      id: rotationId,
      timestamp: now,
      assignments: initialAssignments,
    };

    const game: GameSession = {
      id: gameId,
      date: now,
      rotations: [rotation],
      isActive: true,
      startTime: now,
    };

    // Save both
    await this.rotations.add(rotation);
    await this.games.add(game);

    return game;
  }

  /**
   * Add a rotation to the current game
   */
  async addRotation(
    gameId: string,
    assignments: PositionAssignments
  ): Promise<void> {
    const rotation: Rotation = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      assignments,
    };

    await this.rotations.add(rotation);

    // Update game's rotation list
    const game = await this.games.get(gameId);
    if (game) {
      game.rotations.push(rotation);
      await this.games.put(game);
    }
  }

  /**
   * End the current active game
   */
  async endGame(gameId: string): Promise<void> {
    const game = await this.games.get(gameId);
    if (game) {
      game.isActive = false;
      game.endTime = new Date();
      await this.games.put(game);
    }
  }

  /**
   * Update timer state for active game
   */
  async updateGameTimerState(
    gameId: string,
    timerState: {
      timerStartedAt?: Date;
      timerPausedAt?: Date;
      timerTotalPausedDuration?: number;
      timerPausePeriods?: Array<{ pausedAt: Date; resumedAt?: Date }>;
    }
  ): Promise<void> {
    const game = await this.games.get(gameId);
    if (game) {
      game.timerStartedAt = timerState.timerStartedAt;
      game.timerPausedAt = timerState.timerPausedAt;
      game.timerTotalPausedDuration = timerState.timerTotalPausedDuration ?? 0;
      game.timerPausePeriods = timerState.timerPausePeriods ?? [];
      await this.games.put(game);
      console.log(`[DB] updateGameTimerState: Updated timer state for game ${gameId}`);
    }
  }

  /**
   * Create or update a player
   */
  async savePlayer(player: Player): Promise<void> {
    await this.players.put(player);
    console.log(`[DB] savePlayer: Saved ${player.name} (#${player.number})`);
  }

  /**
   * Delete a player (soft delete - mark as inactive)
   */
  async deletePlayer(playerId: string): Promise<void> {
    const player = await this.players.get(playerId);
    if (player) {
      player.isActive = false;
      await this.players.put(player);
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll(): Promise<void> {
    await this.players.clear();
    await this.games.clear();
    await this.rotations.clear();
  }

  /**
   * Save a user preference
   */
  async saveUserPreference(key: string, value: any): Promise<void> {
    await this.userPreferences.put({
      key,
      value,
      lastUpdated: Date.now()
    });
    console.log(`[DB] saveUserPreference: Saved ${key}`);
  }

  /**
   * Get a user preference value
   */
  async getUserPreference(key: string): Promise<any> {
    const pref = await this.userPreferences.get(key);
    return pref?.value;
  }
}

// Singleton instance
export const db = new SoccerDatabase();

// Initialize on load
db.initializeIfEmpty();

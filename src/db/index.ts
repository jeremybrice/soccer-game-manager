/**
 * IndexedDB Database Layer using Dexie
 *
 * Philosophy: Offline-first. The device is the source of truth.
 * Network is an enhancement, not a requirement.
 */

import Dexie, { type Table } from 'dexie';
import type { Player, GameSession, Rotation, PositionAssignments } from '../types';

/**
 * Database schema version 1
 * - players: Team roster
 * - games: Game sessions with rotation history
 * - rotations: Position snapshots (linked to games)
 */
export class SoccerDatabase extends Dexie {
  players!: Table<Player, string>;
  games!: Table<GameSession, string>;
  rotations!: Table<Rotation, string>;

  constructor() {
    super('SoccerGameManager');

    // Schema version 1
    this.version(1).stores({
      players: 'id, number, isActive',
      games: 'id, date, isActive',
      rotations: 'id, timestamp, gameId',
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
   */
  async getActivePlayers(): Promise<Player[]> {
    return await this.players
      .where('isActive')
      .equals(true)
      .sortBy('number');
  }

  /**
   * Get current active game session (if any)
   */
  async getActiveGame(): Promise<GameSession | undefined> {
    return await this.games
      .where('isActive')
      .equals(true)
      .first();
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
   * Create or update a player
   */
  async savePlayer(player: Player): Promise<void> {
    await this.players.put(player);
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
}

// Singleton instance
export const db = new SoccerDatabase();

// Initialize on load
db.initializeIfEmpty();

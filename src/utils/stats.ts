/**
 * Statistics Calculation Utilities
 *
 * Philosophy: Pure functions. Given rotations, compute metrics.
 * No side effects. Easily testable.
 */

import type {
  Player,
  GameSession,
  Position,
  PlayerStats,
  FairnessMetrics,
  PausePeriod,
} from '../types';

/**
 * Calculate how much time in a given segment overlaps with pause periods
 */
function calculatePauseOverlap(
  segmentStart: number,
  segmentEnd: number,
  pausePeriods: PausePeriod[]
): number {
  let totalOverlap = 0;

  for (const period of pausePeriods) {
    const pauseStart = period.pausedAt.getTime();
    const pauseEnd = period.resumedAt
      ? period.resumedAt.getTime()
      : Date.now();

    // Calculate overlap using min/max logic
    const overlapStart = Math.max(segmentStart, pauseStart);
    const overlapEnd = Math.min(segmentEnd, pauseEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);

    totalOverlap += overlap;
  }

  return totalOverlap;
}

/**
 * Calculate minutes played for each position assignment between two rotations
 * Accounts for pause periods by subtracting overlapping pause time
 */
function getMinutesBetweenRotations(
  startTime: number,
  endTime: number,
  pausePeriods: PausePeriod[]
): number {
  const rawMs = endTime - startTime;
  const pauseMs = calculatePauseOverlap(startTime, endTime, pausePeriods);
  const actualMs = rawMs - pauseMs;
  return Math.max(0, actualMs / 1000 / 60); // Convert to minutes
}

/**
 * Calculate player statistics from a single game
 * Accounts for pause periods and timer start time
 */
export function calculateGameStats(
  game: GameSession,
  players: Player[]
): PlayerStats[] {
  const playerStatsMap = new Map<string, PlayerStats>();

  // Initialize stats for all players
  players.forEach((player) => {
    playerStatsMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      totalMinutes: 0,
      minutesByPosition: {
        GK: 0,
        DEF: 0,
        MID: 0,
        FWD: 0,
        BENCH: 0,
      },
      gamesPlayed: 1,
    });
  });

  // Get pause periods and timer start time from game
  const pausePeriods = game.timerPausePeriods || [];
  const gameStartTime = game.timerStartedAt?.getTime() || 0;

  // Calculate time in each position
  for (let i = 0; i < game.rotations.length - 1; i++) {
    const currentRotation = game.rotations[i];
    const nextRotation = game.rotations[i + 1];

    // Clamp start time to timer start to exclude pre-game setup time
    const rotationStart = currentRotation.timestamp.getTime();
    const startTime = Math.max(rotationStart, gameStartTime);
    const endTime = nextRotation.timestamp.getTime();

    // Skip if this segment is entirely before game started
    if (endTime <= gameStartTime) continue;

    const minutes = getMinutesBetweenRotations(startTime, endTime, pausePeriods);

    // Add minutes to each player's position
    Object.entries(currentRotation.assignments).forEach(([playerId, position]) => {
      const stats = playerStatsMap.get(playerId);
      if (stats) {
        stats.minutesByPosition[position] += minutes;
        if (position !== 'BENCH') {
          stats.totalMinutes += minutes;
        }
      }
    });
  }

  // Handle last rotation to current time (if game is active)
  if (game.isActive && game.rotations.length > 0) {
    const lastRotation = game.rotations[game.rotations.length - 1];

    // Use paused time if game is paused, otherwise current time
    const now = game.timerPausedAt ? game.timerPausedAt.getTime() : Date.now();

    // Clamp start time to timer start
    const rotationStart = lastRotation.timestamp.getTime();
    const startTime = Math.max(rotationStart, gameStartTime);

    // Skip if this segment is entirely before game started
    if (now > gameStartTime) {
      const minutes = getMinutesBetweenRotations(startTime, now, pausePeriods);

      Object.entries(lastRotation.assignments).forEach(([playerId, position]) => {
        const stats = playerStatsMap.get(playerId);
        if (stats) {
          stats.minutesByPosition[position] += minutes;
          if (position !== 'BENCH') {
            stats.totalMinutes += minutes;
          }
        }
      });
    }
  }

  return Array.from(playerStatsMap.values());
}

/**
 * Calculate cumulative player statistics across multiple games
 */
export function calculateSeasonStats(
  games: GameSession[],
  players: Player[]
): PlayerStats[] {
  const playerStatsMap = new Map<string, PlayerStats>();

  // Initialize stats for all players
  players.forEach((player) => {
    playerStatsMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      totalMinutes: 0,
      minutesByPosition: {
        GK: 0,
        DEF: 0,
        MID: 0,
        FWD: 0,
        BENCH: 0,
      },
      gamesPlayed: 0,
    });
  });

  // Aggregate across all games
  games.forEach((game) => {
    const gameStats = calculateGameStats(game, players);
    gameStats.forEach((stats) => {
      const existing = playerStatsMap.get(stats.playerId);
      if (existing) {
        existing.totalMinutes += stats.totalMinutes;
        existing.gamesPlayed += 1;
        (Object.keys(stats.minutesByPosition) as Position[]).forEach((pos) => {
          existing.minutesByPosition[pos] += stats.minutesByPosition[pos];
        });
      }
    });
  });

  return Array.from(playerStatsMap.values());
}

/**
 * Calculate fairness metrics from player stats
 */
export function calculateFairness(stats: PlayerStats[]): FairnessMetrics {
  if (stats.length === 0) {
    return {
      averageMinutesPerPlayer: 0,
      standardDeviation: 0,
      minMinutes: 0,
      maxMinutes: 0,
      mostPlayedPosition: 'BENCH',
      leastPlayedPosition: 'BENCH',
    };
  }

  const totalMinutes = stats.map((s) => s.totalMinutes);
  const average = totalMinutes.reduce((a, b) => a + b, 0) / stats.length;

  // Calculate standard deviation
  const squaredDiffs = totalMinutes.map((m) => Math.pow(m - average, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / stats.length;
  const stdDev = Math.sqrt(variance);

  const minMinutes = Math.min(...totalMinutes);
  const maxMinutes = Math.max(...totalMinutes);

  // Find most and least played positions (excluding bench)
  const positionTotals: Record<Position, number> = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0,
    BENCH: 0,
  };

  stats.forEach((s) => {
    (Object.keys(s.minutesByPosition) as Position[]).forEach((pos) => {
      positionTotals[pos] += s.minutesByPosition[pos];
    });
  });

  // Exclude BENCH from most/least calculation
  const fieldPositions = (Object.entries(positionTotals).filter(
    ([pos]) => pos !== 'BENCH'
  ) as [Position, number][]);

  const mostPlayed = fieldPositions.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  const leastPlayed = fieldPositions.reduce((a, b) => (a[1] < b[1] ? a : b))[0];

  return {
    averageMinutesPerPlayer: average,
    standardDeviation: stdDev,
    minMinutes,
    maxMinutes,
    mostPlayedPosition: mostPlayed,
    leastPlayedPosition: leastPlayed,
  };
}

/**
 * Format minutes as MM:SS
 */
export function formatMinutes(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.floor((minutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds as MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Suggest next rotation based on fairness
 * Returns suggestions for who should play where next
 */
export function suggestNextRotation(
  currentAssignments: Record<string, Position>,
  stats: PlayerStats[],
  players: Player[]
): {
  playerId: string;
  suggestedPosition: Position;
  reason: string;
}[] {
  const suggestions: {
    playerId: string;
    suggestedPosition: Position;
    reason: string;
  }[] = [];

  // Find players on bench who have played least
  const benchPlayers = Object.entries(currentAssignments)
    .filter(([, pos]) => pos === 'BENCH')
    .map(([id]) => id);

  const benchStats = benchPlayers
    .map((id) => stats.find((s) => s.playerId === id))
    .filter((s): s is PlayerStats => s !== undefined)
    .sort((a, b) => a.totalMinutes - b.totalMinutes);

  // Suggest bringing in the player with least playing time
  if (benchStats.length > 0) {
    const playerToRotateIn = benchStats[0];
    const player = players.find((p) => p.id === playerToRotateIn.playerId);

    if (player && player.preferredPositions.length > 0) {
      const preferredPos = player.preferredPositions[0];
      suggestions.push({
        playerId: player.id,
        suggestedPosition: preferredPos !== 'BENCH' ? preferredPos : 'DEF',
        reason: `Least playing time (${formatMinutes(playerToRotateIn.totalMinutes)})`,
      });
    }
  }

  return suggestions;
}

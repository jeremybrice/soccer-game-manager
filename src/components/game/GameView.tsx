/**
 * Game View - Live Game Management
 *
 * Philosophy: Glanceable. One-handed operation. No thinking required.
 * You should be able to rotate players while watching the game.
 */

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store';
import { formatTime } from '../../utils/stats';
import type { GameSession, TimerState, PausePeriod } from '../../types';
import FieldFormation from './FieldFormation';
import BenchArea from './BenchArea';
import FormationSetupView from './FormationSetupView';
import PlayingTimeSummary from './PlayingTimeSummary';
import PlanningModeToggle from './PlanningModeToggle';
import StagedSwapsPanel from './StagedSwapsPanel';

// ============================================================================
// Helper Functions (Outside Component to Prevent Recreat ion)
// ============================================================================

/**
 * Calculate how much time in a given segment overlaps with pause periods
 */
const calculatePauseOverlap = (
  segmentStart: number,
  segmentEnd: number,
  pausePeriods: PausePeriod[]
): number => {
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
};

/**
 * Calculate minutes since player entered current zone (field or bench)
 * Extracted outside component to prevent recreation on every render
 */
const calculatePlayerMinutesInCurrentZone = (
  playerId: string,
  currentGame: GameSession | null,
  timer: TimerState
): number => {
  if (!currentGame || currentGame.rotations.length === 0) return 0;

  const rotations = currentGame.rotations;
  const currentRotation = rotations[rotations.length - 1];
  const currentPosition = currentRotation.assignments[playerId];

  if (!currentPosition) return 0;

  const isOnField = currentPosition !== 'BENCH';

  // Find when player last crossed the field ↔ bench boundary
  let startTime = currentRotation.timestamp.getTime();

  for (let i = rotations.length - 2; i >= 0; i--) {
    const prevPosition = rotations[i].assignments[playerId];
    if (!prevPosition) continue;

    const wasOnField = prevPosition !== 'BENCH';

    // If zone changed (field ↔ bench), we found the transition
    if (isOnField !== wasOnField) {
      break;
    }

    // Same zone, keep going back
    startTime = rotations[i].timestamp.getTime();
  }

  // Calculate elapsed time accounting for pauses
  const now = timer.pausedAt ? timer.pausedAt.getTime() : Date.now();
  const elapsedMs = now - startTime - timer.totalPausedDuration;

  return Math.max(0, Math.floor(elapsedMs / 60000));
};

/**
 * Calculate total field time for a player across all rotations
 * Pause-aware version - subtracts pause overlap from each segment
 */
const calculatePlayerTotalFieldTime = (
  playerId: string,
  currentGame: GameSession | null,
  timer: TimerState
): number => {
  if (!currentGame || currentGame.rotations.length === 0) return 0;

  const rotations = currentGame.rotations;
  let totalMinutes = 0;

  for (let i = 0; i < rotations.length; i++) {
    const position = rotations[i].assignments[playerId];
    const startTime = rotations[i].timestamp.getTime();

    const endTime =
      i < rotations.length - 1
        ? rotations[i + 1].timestamp.getTime()
        : Date.now();

    // Only count if on field (not bench)
    if (position !== 'BENCH') {
      const durationMs = endTime - startTime;

      // Subtract pause periods that overlapped with this segment
      const pauseOverlapMs = calculatePauseOverlap(
        startTime,
        endTime,
        timer.pausePeriods || []
      );

      const actualPlayingTimeMs = durationMs - pauseOverlapMs;
      totalMinutes += Math.floor(actualPlayingTimeMs / 60000);
    }
  }

  return totalMinutes;
};

/**
 * Count field ↔ bench transitions
 */
const calculatePlayerRotationCount = (
  playerId: string,
  currentGame: GameSession | null
): number => {
  if (!currentGame || currentGame.rotations.length <= 1) return 0;

  const rotations = currentGame.rotations;
  let rotationCount = 0;

  for (let i = 1; i < rotations.length; i++) {
    const prevPosition = rotations[i - 1].assignments[playerId];
    const currentPosition = rotations[i].assignments[playerId];

    if (!prevPosition || !currentPosition) continue;

    const wasOnField = prevPosition !== 'BENCH';
    const isOnField = currentPosition !== 'BENCH';

    if (wasOnField !== isOnField) {
      rotationCount++;
    }
  }

  return rotationCount;
};

export default function GameView() {
  const {
    currentGame,
    currentAssignments,
    players,
    timer,
    startTimer,
    pauseTimer,
    endGame,
    navigateTo,
    planningMode,
    stagedSwaps,
    togglePlanningMode,
    stageSwap,
    unstageSwap,
    clearStagedSwaps,
    executeStagedSwaps,
    swapPlayers,
  } = useAppStore();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [alertedPlayers, setAlertedPlayers] = useState<Set<string>>(new Set());

  // Memoized player calculations - only recalculate when dependencies change
  const playerZoneMinutes = useMemo(() => {
    if (!currentGame) return {};
    const cache: Record<string, number> = {};
    players.forEach((p) => {
      cache[p.id] = calculatePlayerMinutesInCurrentZone(p.id, currentGame, timer);
    });
    return cache;
  }, [currentGame?.rotations.length, timer.pausedAt, timer.totalPausedDuration, timer.elapsedSeconds, players]);

  const playerTotalFieldTime = useMemo(() => {
    if (!currentGame) return {};
    const cache: Record<string, number> = {};
    players.forEach((p) => {
      cache[p.id] = calculatePlayerTotalFieldTime(p.id, currentGame, timer);
    });
    return cache;
  }, [currentGame?.rotations.length, timer.pausedAt, timer.totalPausedDuration, timer.pausePeriods, timer.elapsedSeconds, players]);

  const playerRotationCounts = useMemo(() => {
    if (!currentGame) return {};
    const cache: Record<string, number> = {};
    players.forEach((p) => {
      cache[p.id] = calculatePlayerRotationCount(p.id, currentGame);
    });
    return cache;
  }, [currentGame?.rotations.length, players]);

  // Helper function for bench time (wrapper around zone minutes)
  const getPlayerBenchTime = (playerId: string): number => {
    if (!currentGame || currentGame.rotations.length === 0) return 0;
    const currentRotation = currentGame.rotations[currentGame.rotations.length - 1];
    const currentPosition = currentRotation.assignments[playerId];
    if (currentPosition !== 'BENCH') return 0;
    return playerZoneMinutes[playerId] || 0;
  };

  // Monitor field players and alert when they hit 15 minutes
  useEffect(() => {
    if (!currentGame) return;

    players.forEach((player) => {
      const position = currentAssignments[player.id];
      const minutes = playerZoneMinutes[player.id] || 0;

      // Check if field player has hit 15-minute threshold
      if (
        position !== 'BENCH' &&
        minutes >= 15 &&
        !alertedPlayers.has(player.id)
      ) {
        // Haptic feedback (if supported by device)
        if (navigator.vibrate) {
          navigator.vibrate(200); // 200ms vibration
        }

        // Add to alerted set
        setAlertedPlayers((prev) => new Set(prev).add(player.id));

        console.log(`⚠️ ALERT: Player ${player.name} (#${player.number}) has been on field for ${minutes} minutes`);
      }

      // Clear alert if player goes to bench (allow re-alert if they return to field later)
      if (position === 'BENCH' && alertedPlayers.has(player.id)) {
        setAlertedPlayers((prev) => {
          const next = new Set(prev);
          next.delete(player.id);
          return next;
        });
      }
    });
  }, [timer.elapsedSeconds, currentGame?.rotations.length, playerZoneMinutes, currentAssignments, players, alertedPlayers]);

  // If no game, show formation setup
  if (!currentGame) {
    return <FormationSetupView />;
  }

  const handleEndGame = async () => {
    if (
      confirm(
        'End this game? All rotation data will be saved for statistics.'
      )
    ) {
      await endGame();
    }
  };

  const handlePlayerSelect = async (playerId: string) => {
    // In planning mode, stage swaps instead of executing them immediately
    if (planningMode) {
      if (selectedPlayerId && selectedPlayerId !== playerId) {
        // Determine which is bench and which is field
        const player1Pos = currentAssignments[selectedPlayerId];
        const player2Pos = currentAssignments[playerId];

        // Only allow bench ↔ field swaps in planning mode
        if (player1Pos === 'BENCH' && player2Pos !== 'BENCH') {
          stageSwap(selectedPlayerId, playerId);
          setSelectedPlayerId(null);
        } else if (player2Pos === 'BENCH' && player1Pos !== 'BENCH') {
          stageSwap(playerId, selectedPlayerId);
          setSelectedPlayerId(null);
        } else {
          // Both on field or both on bench - not allowed in planning mode
          alert('In planning mode, you can only stage bench ↔ field swaps');
          setSelectedPlayerId(null);
        }
      } else {
        // Select player
        setSelectedPlayerId(playerId);
      }
    } else {
      // Normal mode: immediate swap
      if (selectedPlayerId && selectedPlayerId !== playerId) {
        await swapPlayers(selectedPlayerId, playerId);
        setSelectedPlayerId(null);
      } else {
        setSelectedPlayerId(playerId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Timer */}
      <div className="bg-field text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('home')}
            className="text-white/90 hover:text-white font-semibold touch-target"
          >
            ← Back
          </button>

          <div className="text-center">
            <div className="text-3xl font-bold font-mono">
              {formatTime(timer.elapsedSeconds)}
            </div>
            <div className="text-xs text-white/80">Game Time</div>
          </div>

          <button
            onClick={timer.isRunning ? pauseTimer : startTimer}
            className="touch-target bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold"
          >
            {timer.isRunning ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Field Formation */}
        <div className="flex-1 bg-gradient-to-b from-field-light to-field p-4 overflow-y-auto">
          {/* Planning Mode Toggle */}
          <PlanningModeToggle
            planningMode={planningMode}
            onToggle={togglePlanningMode}
            stagedSwapCount={stagedSwaps.length}
          />

          {/* Staged Swaps Panel */}
          {planningMode && (
            <StagedSwapsPanel
              stagedSwaps={stagedSwaps}
              players={players}
              onExecuteAll={executeStagedSwaps}
              onClearAll={clearStagedSwaps}
              onRemoveSwap={unstageSwap}
            />
          )}

          {/* Color Legend */}
          <div className="flex justify-center items-center space-x-3 mb-3 bg-black/20 backdrop-blur-sm rounded-lg py-2 px-3">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-white/90 text-xs font-medium">&lt;10m</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-white/90 text-xs font-medium">10-15m</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-white/90 text-xs font-medium">&gt;15m</span>
            </div>
          </div>

          {/* Playing Time Summary */}
          <PlayingTimeSummary
            players={players}
            getPlayerTotalFieldTime={(id) => playerTotalFieldTime[id] || 0}
            totalGameMinutes={Math.floor(timer.elapsedSeconds / 60)}
          />

          <FieldFormation
            assignments={currentAssignments}
            players={players}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={handlePlayerSelect}
            getPlayerMinutes={(id) => playerZoneMinutes[id] || 0}
            getPlayerRotationCount={(id) => playerRotationCounts[id] || 0}
            alertedPlayers={alertedPlayers}
            stagedSwaps={stagedSwaps}
          />

          {/* Selection Help - Positioned above bench */}
          {selectedPlayerId && (
            <div className={`mt-4 text-white px-6 py-3 rounded-xl shadow-lg text-center font-semibold ${
              planningMode ? 'bg-orange-500' : 'bg-raiders-red'
            }`}>
              {planningMode
                ? 'Tap another player to stage a swap (bench ↔ field only)'
                : 'Tap another player to swap positions'
              }
            </div>
          )}
        </div>

        {/* Bench */}
        <div className="bg-bench-dark border-t-4 border-white/30">
          <BenchArea
            assignments={currentAssignments}
            players={players}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={handlePlayerSelect}
            getPlayerMinutes={(id) => playerZoneMinutes[id] || 0}
            getPlayerBenchTime={getPlayerBenchTime}
            getPlayerRotationCount={(id) => playerRotationCounts[id] || 0}
            alertedPlayers={alertedPlayers}
            stagedSwaps={stagedSwaps}
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t-2 border-gray-200 px-4 py-3 flex space-x-2">
        <button
          onClick={() => navigateTo('stats')}
          className="flex-1 touch-target bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl"
        >
          📊 Stats
        </button>
        <button
          onClick={handleEndGame}
          className="flex-1 touch-target bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl"
        >
          End Game
        </button>
      </div>

    </div>
  );
}

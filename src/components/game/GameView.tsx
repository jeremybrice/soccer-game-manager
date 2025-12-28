/**
 * Game View - Live Game Management
 *
 * Philosophy: Glanceable. One-handed operation. No thinking required.
 * Drag players to swap. Ghost preview shows what will happen.
 * Swipe up to execute all staged swaps.
 */

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store';
import { formatTime } from '../../utils/stats';
import type { GameSession, TimerState, PausePeriod } from '../../types';
import FieldFormation from './FieldFormation';
import BenchArea from './BenchArea';
import FormationSetupView from './FormationSetupView';
import SwipeExecuteBar from './SwipeExecuteBar';
import QuarterEndOverlay from './QuarterEndOverlay';
import { DragDropProvider } from './DragDropContext';

// ============================================================================
// Helper Functions (Outside Component to Prevent Recreation)
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

    const overlapStart = Math.max(segmentStart, pauseStart);
    const overlapEnd = Math.min(segmentEnd, pauseEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);

    totalOverlap += overlap;
  }

  return totalOverlap;
};

/**
 * Calculate minutes since player entered current zone (field or bench)
 */
const calculatePlayerMinutesInCurrentZone = (
  playerId: string,
  currentGame: GameSession | null,
  timer: TimerState
): number => {
  if (!currentGame || currentGame.rotations.length === 0) return 0;

  if (!timer.startedAt && !timer.pausedAt) return 0;

  const rotations = currentGame.rotations;
  const currentRotation = rotations[rotations.length - 1];
  const currentPlayerPosition = currentRotation.assignments[playerId];

  if (!currentPlayerPosition) return 0;

  const isOnField = currentPlayerPosition.position !== 'BENCH';

  let startTime = currentRotation.timestamp.getTime();

  for (let i = rotations.length - 2; i >= 0; i--) {
    const prevPlayerPosition = rotations[i].assignments[playerId];
    if (!prevPlayerPosition) continue;

    const wasOnField = prevPlayerPosition.position !== 'BENCH';

    if (isOnField !== wasOnField) {
      break;
    }

    startTime = rotations[i].timestamp.getTime();
  }

  const effectiveStartTime = timer.startedAt
    ? Math.max(startTime, timer.startedAt.getTime())
    : startTime;

  const now = timer.pausedAt ? timer.pausedAt.getTime() : Date.now();

  const pauseOverlap = calculatePauseOverlap(effectiveStartTime, now, timer.pausePeriods || []);
  const elapsedMs = now - effectiveStartTime - pauseOverlap;

  return Math.max(0, Math.floor(elapsedMs / 60000));
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
    stagedSwaps,
    stageSwap,
    unstageSwap,
    clearStagedSwaps,
    executeStagedSwaps,
    // Quarter management (v3.1.0)
    quarterState,
    quarterConfig,
    continueQuarter,
    startNextQuarter,
  } = useAppStore();

  const [alertedPlayers, setAlertedPlayers] = useState<Set<string>>(new Set());
  const [showQuarterModal, setShowQuarterModal] = useState(false);

  // Memoized player calculations
  const playerZoneMinutes = useMemo(() => {
    if (!currentGame) return {};
    const cache: Record<string, number> = {};
    players.forEach((p) => {
      cache[p.id] = calculatePlayerMinutesInCurrentZone(p.id, currentGame, timer);
    });
    return cache;
  }, [currentGame?.rotations.length, timer.pausedAt, timer.totalPausedDuration, timer.elapsedSeconds, players]);

  // Monitor field players and alert when they hit 15 minutes
  useEffect(() => {
    if (!currentGame) return;

    players.forEach((player) => {
      const playerPosition = currentAssignments[player.id];
      const minutes = playerZoneMinutes[player.id] || 0;

      if (
        playerPosition && playerPosition.position !== 'BENCH' &&
        minutes >= 15 &&
        !alertedPlayers.has(player.id)
      ) {
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }

        setAlertedPlayers((prev) => new Set(prev).add(player.id));

        console.log(`⚠️ ALERT: Player ${player.name} (#${player.number}) has been on field for ${minutes} minutes`);
      }

      if (playerPosition && playerPosition.position === 'BENCH' && alertedPlayers.has(player.id)) {
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

  // Handle ghost tap to clear individual swap
  const handleGhostTap = (swapId: string) => {
    unstageSwap(swapId);
  };

  // Handle swap staged via drag-drop
  const handleSwapStaged = (player1Id: string, player2Id: string) => {
    stageSwap(player1Id, player2Id);
  };

  return (
    <DragDropProvider onSwapStaged={handleSwapStaged}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header with Quarter Timer (v3.1.0) */}
        <div className="bg-field text-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateTo('home')}
              className="text-white/90 hover:text-white font-semibold touch-target"
            >
              ← Back
            </button>

            <div className="text-center">
              <div className="text-3xl font-bold font-mono flex items-center justify-center">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xl mr-2">
                  Q{quarterState.currentQuarter}
                </span>
                <span>
                  {formatTime(Math.min(quarterState.quarterElapsedSeconds, quarterConfig.durationSeconds))}
                </span>
                {quarterState.overtimeSeconds > 0 && (
                  <span className="text-yellow-300 text-xl ml-1">
                    +{formatTime(quarterState.overtimeSeconds)}
                  </span>
                )}
              </div>
              <div className="text-xs text-white/80">
                {quarterState.isAutoStopped
                  ? 'Quarter Complete'
                  : timer.isRunning
                    ? 'Game Time'
                    : 'Paused'}
              </div>
            </div>

            <button
              onClick={() => {
                if (timer.isRunning) {
                  setShowQuarterModal(true);
                } else {
                  startTimer();
                }
              }}
              disabled={quarterState.isAutoStopped}
              className={`touch-target px-4 py-2 rounded-lg font-semibold ${
                quarterState.isAutoStopped
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {timer.isRunning ? '⏹' : '▶'}
            </button>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Field Formation */}
          <div className="flex-1 bg-gradient-to-b from-field-light to-field p-4 overflow-y-auto">
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
              {/* Drag hint */}
              <div className="flex items-center space-x-1 border-l border-white/30 pl-3">
                <span className="text-white/70 text-xs">Hold & drag to swap</span>
              </div>
            </div>

            <FieldFormation
              assignments={currentAssignments}
              players={players}
              getPlayerMinutes={(id) => playerZoneMinutes[id] || 0}
              alertedPlayers={alertedPlayers}
              stagedSwaps={stagedSwaps}
              onGhostTap={handleGhostTap}
            />
          </div>

          {/* Bench Area - Always visible */}
          <BenchArea
            players={players}
            assignments={currentAssignments}
            stagedSwaps={stagedSwaps}
            getPlayerMinutes={(id) => playerZoneMinutes[id] || 0}
            onGhostTap={handleGhostTap}
          />

          {/* Swipe Execute Bar - Only shows when swaps are staged */}
          {stagedSwaps.length > 0 && (
            <SwipeExecuteBar
              swapCount={stagedSwaps.length}
              onExecute={executeStagedSwaps}
              onClear={clearStagedSwaps}
            />
          )}
        </div>

        {/* Quarter End Overlay - Shows for auto-stop (when paused) or manual stop (v3.1.0) */}
        {((quarterState.isAutoStopped && !timer.isRunning) || showQuarterModal) && (
          <QuarterEndOverlay
            mode={quarterState.isAutoStopped ? 'auto-stop' : 'manual-stop'}
            currentQuarter={quarterState.currentQuarter}
            totalQuarters={quarterConfig.totalQuarters}
            onContinue={() => {
              continueQuarter();
              setShowQuarterModal(false);
            }}
            onPause={() => {
              pauseTimer();
              setShowQuarterModal(false);
            }}
            onNextQuarter={() => {
              startNextQuarter();
              setShowQuarterModal(false);
            }}
            onEndGame={() => {
              setShowQuarterModal(false);
              handleEndGame();
            }}
            onCancel={() => setShowQuarterModal(false)}
          />
        )}
      </div>
    </DragDropProvider>
  );
}

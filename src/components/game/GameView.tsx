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
import FormationSetupView from './FormationSetupView';
import StagedSwapsPanel from './StagedSwapsPanel';
import SwapModal from './SwapModal';

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

  // If timer was never started, return 0 (game hasn't begun)
  if (!timer.startedAt && !timer.pausedAt) return 0;

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

  // Clamp startTime to timer start to exclude pre-game setup time
  const effectiveStartTime = timer.startedAt
    ? Math.max(startTime, timer.startedAt.getTime())
    : startTime;

  // Calculate elapsed time accounting for pauses
  const now = timer.pausedAt ? timer.pausedAt.getTime() : Date.now();

  // Only subtract pause time that occurred during this zone segment
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

  // Handle player selection - opens the swap modal
  const handlePlayerSelect = (playerId: string) => {
    // If tapping the same player, deselect
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    } else {
      // Select the player to open the swap modal
      setSelectedPlayerId(playerId);
    }
  };

  // Handle swap from the modal
  const handleSwapFromModal = async (targetPlayerId: string) => {
    if (!selectedPlayerId) return;

    if (planningMode) {
      // Stage any swap (field↔bench or field↔field)
      stageSwap(selectedPlayerId, targetPlayerId);
    } else {
      // Normal mode: immediate swap
      await swapPlayers(selectedPlayerId, targetPlayerId);
    }

    setSelectedPlayerId(null);
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setSelectedPlayerId(null);
  };

  // Get selected player object and position
  const selectedPlayer = selectedPlayerId
    ? players.find((p) => p.id === selectedPlayerId)
    : null;
  const selectedPlayerPosition = selectedPlayerId
    ? currentAssignments[selectedPlayerId]
    : null;

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

          <FieldFormation
            assignments={currentAssignments}
            players={players}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={handlePlayerSelect}
            getPlayerMinutes={(id) => playerZoneMinutes[id] || 0}
            alertedPlayers={alertedPlayers}
            stagedSwaps={stagedSwaps}
          />

          {/* Staged Swaps Panel - Below field formation */}
          {planningMode && (
            <StagedSwapsPanel
              stagedSwaps={stagedSwaps}
              players={players}
              assignments={currentAssignments}
              onExecuteAll={executeStagedSwaps}
              onClearAll={clearStagedSwaps}
              onRemoveSwap={unstageSwap}
            />
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t-2 border-gray-200 px-4 py-3 flex space-x-2">
        <button
          onClick={togglePlanningMode}
          className={`flex-1 touch-target font-bold py-3 rounded-xl relative ${
            planningMode
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {planningMode ? '🎯 Planning' : '⚡ Live'}
          {stagedSwaps.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {stagedSwaps.length}
            </span>
          )}
        </button>
        <button
          onClick={handleEndGame}
          className="flex-1 touch-target bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl"
        >
          End Game
        </button>
      </div>

      {/* Swap Modal - Shows when player is selected */}
      {selectedPlayer && selectedPlayerPosition && (
        <SwapModal
          selectedPlayer={selectedPlayer}
          selectedPlayerPosition={selectedPlayerPosition}
          allPlayers={players.filter((p) => p.isActive)}
          assignments={currentAssignments}
          onSwap={handleSwapFromModal}
          onCancel={handleModalCancel}
          getPlayerMinutes={(id) => playerZoneMinutes[id] || 0}
          planningMode={planningMode}
          stagedSwaps={stagedSwaps}
        />
      )}
    </div>
  );
}

/**
 * Game View - Live Game Management
 *
 * Philosophy: Glanceable. One-handed operation. No thinking required.
 * You should be able to rotate players while watching the game.
 */

import { useState } from 'react';
import { useAppStore } from '../../store';
import { formatTime } from '../../utils/stats';
import FieldFormation from './FieldFormation';
import BenchArea from './BenchArea';
import PreGameSetup from './PreGameSetup';
import PlayingTimeSummary from './PlayingTimeSummary';

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
  } = useAppStore();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // If no game, show pre-game setup
  if (!currentGame) {
    return <PreGameSetup />;
  }

  /**
   * Calculate minutes each player has been at their current position
   * Traces back through rotation history to find when THIS player
   * was first assigned to their CURRENT position
   */
  const getPlayerMinutesAtCurrentPosition = (playerId: string): number => {
    if (!currentGame || currentGame.rotations.length === 0) return 0;

    const rotations = currentGame.rotations;
    const currentRotation = rotations[rotations.length - 1];
    const currentPosition = currentRotation.assignments[playerId];

    // If player is on bench, return 0
    if (!currentPosition || currentPosition === 'BENCH') return 0;

    // Find when this player was first assigned to their current position
    // by looking backwards through rotation history
    let startTime = currentRotation.timestamp.getTime();

    for (let i = rotations.length - 2; i >= 0; i--) {
      const prevPosition = rotations[i].assignments[playerId];

      // If position changed, we found the start
      if (prevPosition !== currentPosition) {
        break;
      }

      // Same position, keep going back
      startTime = rotations[i].timestamp.getTime();
    }

    const elapsedMs = Date.now() - startTime;
    return Math.floor(elapsedMs / 60000);
  };

  /**
   * Calculate minutes a player has been on the bench
   * Same logic as field time, but for BENCH position
   */
  const getPlayerBenchTime = (playerId: string): number => {
    if (!currentGame || currentGame.rotations.length === 0) return 0;

    const rotations = currentGame.rotations;
    const currentRotation = rotations[rotations.length - 1];
    const currentPosition = currentRotation.assignments[playerId];

    // If player is not on bench, return 0
    if (currentPosition !== 'BENCH') return 0;

    // Find when this player was first put on the bench
    let startTime = currentRotation.timestamp.getTime();

    for (let i = rotations.length - 2; i >= 0; i--) {
      const prevPosition = rotations[i].assignments[playerId];

      // If position changed, we found when they were benched
      if (prevPosition !== 'BENCH') {
        break;
      }

      // Still on bench, keep going back
      startTime = rotations[i].timestamp.getTime();
    }

    const elapsedMs = Date.now() - startTime;
    return Math.floor(elapsedMs / 60000);
  };

  /**
   * Count how many times a player has changed positions
   */
  const getPlayerRotationCount = (playerId: string): number => {
    if (!currentGame || currentGame.rotations.length <= 1) return 0;

    const rotations = currentGame.rotations;
    let rotationCount = 0;

    for (let i = 1; i < rotations.length; i++) {
      const prevPosition = rotations[i - 1].assignments[playerId];
      const currentPosition = rotations[i].assignments[playerId];

      if (prevPosition !== currentPosition) {
        rotationCount++;
      }
    }

    return rotationCount;
  };

  /**
   * Calculate total field time for a player across all rotations
   * Used for the playing time summary
   */
  const getPlayerTotalFieldTime = (playerId: string): number => {
    if (!currentGame || currentGame.rotations.length === 0) return 0;

    const rotations = currentGame.rotations;
    let totalMinutes = 0;

    for (let i = 0; i < rotations.length; i++) {
      const position = rotations[i].assignments[playerId];
      const startTime = rotations[i].timestamp.getTime();

      // Find end time (next rotation or current time)
      const endTime =
        i < rotations.length - 1
          ? rotations[i + 1].timestamp.getTime()
          : Date.now();

      // Only count if on field (not bench)
      if (position !== 'BENCH') {
        const durationMs = endTime - startTime;
        totalMinutes += Math.floor(durationMs / 60000);
      }
    }

    return totalMinutes;
  };

  const handleEndGame = async () => {
    if (
      confirm(
        'End this game? All rotation data will be saved for statistics.'
      )
    ) {
      await endGame();
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null); // Deselect
    } else {
      setSelectedPlayerId(playerId);
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
            ← End
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
              <span className="text-white/90 text-xs font-medium">&lt;5m</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-white/90 text-xs font-medium">5-10m</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
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
            getPlayerTotalFieldTime={getPlayerTotalFieldTime}
            totalGameMinutes={Math.floor(timer.elapsedSeconds / 60)}
          />

          <FieldFormation
            assignments={currentAssignments}
            players={players}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={handlePlayerSelect}
            getPlayerMinutes={getPlayerMinutesAtCurrentPosition}
            getPlayerRotationCount={getPlayerRotationCount}
          />

          {/* Selection Help - Positioned above bench */}
          {selectedPlayerId && (
            <div className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg text-center font-semibold">
              Tap another player to swap positions
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
            getPlayerMinutes={getPlayerMinutesAtCurrentPosition}
            getPlayerBenchTime={getPlayerBenchTime}
            getPlayerRotationCount={getPlayerRotationCount}
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

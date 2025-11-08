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
          <FieldFormation
            assignments={currentAssignments}
            players={players}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={handlePlayerSelect}
          />
        </div>

        {/* Bench */}
        <div className="bg-bench-dark border-t-4 border-white/30">
          <BenchArea
            assignments={currentAssignments}
            players={players}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={handlePlayerSelect}
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

      {/* Selection Help */}
      {selectedPlayerId && (
        <div className="fixed bottom-24 left-0 right-0 mx-4 bg-yellow-500 text-white px-6 py-3 rounded-xl shadow-lg text-center font-semibold">
          Tap another player to swap positions
        </div>
      )}
    </div>
  );
}

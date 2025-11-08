/**
 * Home View - Landing screen
 *
 * Philosophy: Three actions, clearly presented. No confusion.
 * Everything you need, nothing you don't.
 */

import { useAppStore } from '../../store';

export default function HomeView() {
  const { navigateTo, players, currentGame } = useAppStore();

  const hasRoster = players.length >= 9; // Need at least 9 to play
  const hasActiveGame = currentGame !== null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-field-light to-field">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">
          ⚽ Soccer Manager
        </h1>
        <p className="text-white/90 text-lg">
          Track. Rotate. Play fair.
        </p>
      </div>

      {/* Main Actions */}
      <div className="w-full max-w-md space-y-4">
        {/* Resume Game (if active) */}
        {hasActiveGame && (
          <button
            onClick={() => navigateTo('game')}
            className="w-full touch-target bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-6 px-8 rounded-2xl shadow-lg transform transition hover:scale-105 active:scale-95"
          >
            <div className="text-2xl mb-1">Resume Game</div>
            <div className="text-sm opacity-90">Game in progress</div>
          </button>
        )}

        {/* Start New Game */}
        {!hasActiveGame && hasRoster && (
          <button
            onClick={() => navigateTo('game')}
            className="w-full touch-target bg-white hover:bg-gray-50 text-field-dark font-bold py-6 px-8 rounded-2xl shadow-lg transform transition hover:scale-105 active:scale-95"
          >
            <div className="text-2xl mb-1">Start New Game</div>
            <div className="text-sm opacity-70">
              {players.length} players ready
            </div>
          </button>
        )}

        {/* Manage Roster */}
        <button
          onClick={() => navigateTo('roster')}
          className="w-full touch-target bg-white/20 hover:bg-white/30 backdrop-blur text-white font-semibold py-6 px-8 rounded-2xl border-2 border-white/30 transform transition hover:scale-105 active:scale-95"
        >
          <div className="text-xl mb-1">Manage Roster</div>
          <div className="text-sm opacity-90">
            {players.length === 0
              ? 'Add your players'
              : `${players.length} players`}
          </div>
        </button>

        {/* View Stats */}
        <button
          onClick={() => navigateTo('stats')}
          className="w-full touch-target bg-white/20 hover:bg-white/30 backdrop-blur text-white font-semibold py-6 px-8 rounded-2xl border-2 border-white/30 transform transition hover:scale-105 active:scale-95"
        >
          <div className="text-xl mb-1">View Stats</div>
          <div className="text-sm opacity-90">Season statistics</div>
        </button>
      </div>

      {/* Warning if not enough players */}
      {!hasRoster && (
        <div className="mt-8 bg-red-500/20 backdrop-blur border-2 border-red-500/50 text-white px-6 py-4 rounded-xl max-w-md">
          <div className="font-semibold mb-1">⚠️ Not enough players</div>
          <div className="text-sm opacity-90">
            Add at least 9 players to start a game
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-white/60 text-sm text-center">
        <p>Designed for iPad · Works offline</p>
      </div>
    </div>
  );
}

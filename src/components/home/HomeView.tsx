/**
 * Home View - Landing screen
 *
 * Philosophy: Three actions, clearly presented. No confusion.
 * Everything you need, nothing you don't.
 */

import { useAppStore } from '../../store';
import { HelpIcon } from '../help/HelpIcon';

export default function HomeView() {
  const { navigateTo, players, currentGame } = useAppStore();

  const hasRoster = players.length >= 9; // Need at least 9 to play
  const hasActiveGame = currentGame !== null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-field-light to-field">
      {/* Help Icon - Top Right */}
      <div className="absolute top-4 right-4">
        <HelpIcon />
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="mb-4 flex justify-center">
          <img
            src="https://www.northeastraiders.org/_templates/Home-New/images/logo.png"
            alt="Raiders Logo"
            className="h-36 w-auto"
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Game Manager
        </h1>
        <p className="text-white/70 text-sm mt-2">
          Track, Rotate, Play Fair
        </p>
      </div>

      {/* Main Actions */}
      <div className="w-full max-w-md space-y-4">
        {/* Resume Game (if active) */}
        {hasActiveGame && (
          <button
            onClick={() => navigateTo('game')}
            className="w-full touch-target bg-raiders-red hover:bg-raiders-red-dark text-white font-bold py-6 px-8 rounded-2xl shadow-lg transform transition hover:scale-105 active:scale-95"
          >
            <div className="text-2xl mb-1">Resume Game</div>
            <div className="text-sm opacity-90">Game in progress</div>
          </button>
        )}

        {/* Start New Game */}
        {!hasActiveGame && hasRoster && (
          <button
            data-tour="start-game-button"
            onClick={() => navigateTo('game')}
            className="w-full touch-target bg-raiders-red hover:bg-raiders-red-dark text-white font-bold py-6 px-8 rounded-2xl shadow-lg transform transition hover:scale-105 active:scale-95"
          >
            <div className="text-2xl mb-1">Start New Game</div>
            <div className="text-sm opacity-90">
              {players.length} players ready
            </div>
          </button>
        )}

        {/* Manage Roster */}
        <button
          data-tour="roster-button"
          onClick={() => navigateTo('roster')}
          className="w-full touch-target bg-raiders-navy-light hover:bg-raiders-navy text-white font-semibold py-6 px-8 rounded-2xl border-2 border-white/30 shadow-lg transform transition hover:scale-105 active:scale-95"
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
          data-tour="stats-button"
          onClick={() => navigateTo('stats')}
          className="w-full touch-target bg-raiders-navy-light hover:bg-raiders-navy text-white font-semibold py-6 px-8 rounded-2xl border-2 border-white/30 shadow-lg transform transition hover:scale-105 active:scale-95"
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
        <p className="text-white/40 text-xs mt-1">v2.4.1 · St. Pete Raiders Edition</p>
      </div>
    </div>
  );
}

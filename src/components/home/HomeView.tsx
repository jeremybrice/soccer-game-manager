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

  const hasActiveGame = currentGame !== null;
  const hasPlayers = players.length > 0;

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
            src="/raiders-logo.png"
            alt="St. Pete Raiders Logo"
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
        {!hasActiveGame && hasPlayers && (
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

        {/* Roster & Formations - side by side */}
        <div className="flex gap-3">
          <button
            data-tour="roster-button"
            onClick={() => navigateTo('roster')}
            className="flex-1 touch-target bg-raiders-navy-light hover:bg-raiders-navy text-white font-semibold py-5 px-4 rounded-2xl border-2 border-white/30 shadow-lg transform transition hover:scale-105 active:scale-95"
          >
            <div className="text-lg mb-1">Roster</div>
            <div className="text-xs opacity-90">
              {players.length === 0
                ? 'Add players'
                : `${players.length} players`}
            </div>
          </button>

          <button
            data-tour="formations-button"
            onClick={() => navigateTo('formations')}
            className="flex-1 touch-target bg-raiders-navy-light hover:bg-raiders-navy text-white font-semibold py-5 px-4 rounded-2xl border-2 border-white/30 shadow-lg transform transition hover:scale-105 active:scale-95"
          >
            <div className="text-lg mb-1">Formations</div>
            <div className="text-xs opacity-90">Create & edit</div>
          </button>
        </div>

        {/* Stats & Settings - side by side */}
        <div className="flex gap-3">
          <button
            data-tour="stats-button"
            onClick={() => navigateTo('stats')}
            className="flex-1 touch-target bg-raiders-navy-light hover:bg-raiders-navy text-white font-semibold py-5 px-4 rounded-2xl border-2 border-white/30 shadow-lg transform transition hover:scale-105 active:scale-95"
          >
            <div className="text-lg mb-1">Stats</div>
            <div className="text-xs opacity-90">Season statistics</div>
          </button>

          <button
            data-tour="settings-button"
            onClick={() => navigateTo('settings')}
            className="flex-1 touch-target bg-raiders-navy-light hover:bg-raiders-navy text-white font-semibold py-5 px-4 rounded-2xl border-2 border-white/30 shadow-lg transform transition hover:scale-105 active:scale-95"
          >
            <div className="text-lg mb-1">Settings</div>
            <div className="text-xs opacity-90">Game options</div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-white/60 text-sm text-center">
        <p className="text-white/40 text-xs mt-1">v4.1.0 · St. Pete Raiders Edition</p>
      </div>
    </div>
  );
}

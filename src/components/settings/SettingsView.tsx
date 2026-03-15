/**
 * Settings View - App configuration
 *
 * Philosophy: Simple choices, clear consequences. Coach picks what works
 * for their league and gets back to coaching.
 */

import { useAppStore } from '../../store';
import type { GameClockMode } from '../../types';

const CLOCK_MODE_OPTIONS: {
  mode: GameClockMode;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    mode: 'simple',
    title: 'Simple Clock',
    description: 'Single continuous timer for the whole game. No periods or breaks.',
    icon: '⏱️',
  },
  {
    mode: 'halves',
    title: 'Two Halves',
    description: 'Game split into two 30-minute halves. Timer auto-pauses at halftime.',
    icon: '⏸️',
  },
  {
    mode: 'halves-with-breaks',
    title: 'Two Halves + Water Breaks',
    description: 'Each half has a water break at the 15-minute mark. Timer auto-pauses at water breaks and halftime.',
    icon: '💧',
  },
];

export default function SettingsView() {
  const { navigateTo, gameClockMode, setGameClockMode, currentGame } = useAppStore();

  const hasActiveGame = currentGame !== null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-field text-white px-4 py-4 shadow-lg">
        <div className="flex items-center">
          <button
            onClick={() => navigateTo('home')}
            className="text-white/90 hover:text-white font-semibold touch-target"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold ml-4">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        {/* Game Clock Mode Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Game Clock</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose how the game timer behaves. This applies to new games only.
          </p>

          {hasActiveGame && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-yellow-800">
                A game is in progress. Changes will apply to the next game you start.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {CLOCK_MODE_OPTIONS.map((option) => {
              const isSelected = gameClockMode === option.mode;
              return (
                <button
                  key={option.mode}
                  onClick={() => setGameClockMode(option.mode)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-raiders-red bg-red-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-0.5">{option.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-raiders-red' : 'text-gray-900'}`}>
                          {option.title}
                        </span>
                        {isSelected && (
                          <span className="bg-raiders-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

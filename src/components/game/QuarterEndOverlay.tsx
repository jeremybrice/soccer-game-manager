/**
 * Period End Overlay - Modal for game clock period management
 *
 * Philosophy: Clear decision point. Simple options. No confusion.
 * Coach needs to quickly decide what to do next.
 *
 * Two modes:
 * - auto-stop: Period reached its time limit, options are Continue or Start Next
 * - manual-stop: User pressed stop button, options are Pause or End Period
 *
 * Adapts labels based on GameClockMode:
 * - simple: No auto-stop; manual-stop shows Pause/End Game
 * - halves: "Halftime!" / "2nd Half"
 * - halves-with-breaks: "Water Break" / "Halftime!" depending on period
 */

import type { GameClockMode } from '../../types';
import { getTransitionInfo, getManualStopInfo } from '../../types';

interface QuarterEndOverlayProps {
  mode: 'auto-stop' | 'manual-stop';
  currentQuarter: number;
  totalQuarters: number;
  gameClockMode: GameClockMode;
  onContinue: () => void;    // Auto-stop: continue into overtime
  onPause: () => void;       // Manual-stop: just pause timer
  onNextQuarter: () => void; // Advance to next period
  onEndGame: () => void;     // End the game
  onCancel?: () => void;     // Close modal without action (manual-stop only)
}

export default function QuarterEndOverlay({
  mode,
  currentQuarter,
  totalQuarters,
  gameClockMode,
  onContinue,
  onPause,
  onNextQuarter,
  onEndGame,
  onCancel,
}: QuarterEndOverlayProps) {
  const isLastPeriod = currentQuarter >= totalQuarters;
  const transitionInfo = getTransitionInfo(gameClockMode, currentQuarter, totalQuarters);
  const manualInfo = getManualStopInfo(gameClockMode, currentQuarter, totalQuarters);

  const getTitle = () => {
    if (mode === 'auto-stop') {
      return transitionInfo.title;
    }
    return manualInfo.title;
  };

  const getSubtitle = () => {
    if (mode === 'auto-stop') {
      return isLastPeriod
        ? 'The game is over.'
        : transitionInfo.subtitle;
    }
    return 'What would you like to do?';
  };

  const getIcon = () => {
    if (mode === 'auto-stop') {
      if (isLastPeriod) return '🏆';
      // Water break gets a special icon
      if (gameClockMode === 'halves-with-breaks' && (currentQuarter === 1 || currentQuarter === 3)) {
        return '💧';
      }
      return '🏁';
    }
    return '⏹';
  };

  // For progress indicator, show halves (not individual periods)
  const getProgressDots = () => {
    if (gameClockMode === 'simple') return null;

    if (gameClockMode === 'halves') {
      return (
        <div className="mt-6 flex justify-center space-x-2">
          {[1, 2].map((half) => (
            <div
              key={half}
              className={`w-3 h-3 rounded-full ${
                (half === 1 && currentQuarter > 1) || (half === 2 && currentQuarter > 2)
                  ? 'bg-green-500'
                  : (half === 1 && currentQuarter === 1) || (half === 2 && currentQuarter === 2)
                    ? 'bg-yellow-500'
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      );
    }

    // halves-with-breaks: show 2 half dots with sub-dots for water breaks
    return (
      <div className="mt-6 flex justify-center space-x-4">
        {[1, 2].map((half) => {
          const periods = half === 1 ? [1, 2] : [3, 4];
          return (
            <div key={half} className="flex items-center space-x-1">
              <span className="text-xs text-gray-400 mr-1">{half}H</span>
              {periods.map((period) => (
                <div
                  key={period}
                  className={`w-2.5 h-2.5 rounded-full ${
                    period < currentQuarter
                      ? 'bg-green-500'
                      : period === currentQuarter
                        ? 'bg-yellow-500'
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        {/* Icon */}
        <div className="text-5xl mb-3">
          {getIcon()}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {getTitle()}
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 mb-6">
          {getSubtitle()}
        </p>

        {/* Action buttons */}
        <div className="space-y-3">
          {mode === 'auto-stop' && !isLastPeriod && (
            <>
              {/* Continue current period (referee still playing) */}
              <button
                onClick={onContinue}
                className="w-full touch-target bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
              >
                <div className="text-lg">{transitionInfo.continueLabel}</div>
                <div className="text-sm opacity-90">Referee still playing</div>
              </button>

              {/* Start next period */}
              <button
                onClick={onNextQuarter}
                className="w-full touch-target bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
              >
                <div className="text-lg">{transitionInfo.nextLabel}</div>
                <div className="text-sm opacity-90">Ready to continue</div>
              </button>
            </>
          )}

          {mode === 'auto-stop' && isLastPeriod && (
            <button
              onClick={onEndGame}
              className="w-full touch-target bg-raiders-red hover:bg-raiders-red-dark text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
            >
              <div className="text-lg">End Game</div>
              <div className="text-sm opacity-90">Save and view stats</div>
            </button>
          )}

          {mode === 'manual-stop' && (
            <>
              {/* Pause Timer - for injuries/timeouts */}
              <button
                onClick={onPause}
                className="w-full touch-target bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
              >
                <div className="text-lg">Pause Timer</div>
                <div className="text-sm opacity-90">Injury or timeout</div>
              </button>

              {/* End Period / End Game */}
              {!isLastPeriod && gameClockMode !== 'simple' ? (
                <button
                  onClick={onNextQuarter}
                  className="w-full touch-target bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
                >
                  <div className="text-lg">{manualInfo.nextLabel}</div>
                  <div className="text-sm opacity-90">Advance to next period</div>
                </button>
              ) : (
                <button
                  onClick={onEndGame}
                  className="w-full touch-target bg-raiders-red hover:bg-raiders-red-dark text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
                >
                  <div className="text-lg">End Game</div>
                  <div className="text-sm opacity-90">Save and view stats</div>
                </button>
              )}

              {/* Cancel - go back without action */}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="w-full touch-target bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transform transition active:scale-95"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>

        {/* Progress indicator */}
        {getProgressDots()}
      </div>
    </div>
  );
}

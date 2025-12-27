/**
 * Quarter End Overlay - Modal for quarter management
 *
 * Philosophy: Clear decision point. Simple options. No confusion.
 * Coach needs to quickly decide what to do next.
 *
 * Two modes:
 * - auto-stop: Quarter reached 15:00, options are Continue or Start Next
 * - manual-stop: User pressed stop button, options are Pause or End Quarter
 */

interface QuarterEndOverlayProps {
  mode: 'auto-stop' | 'manual-stop';
  currentQuarter: number;
  totalQuarters: number;
  onContinue: () => void;    // Auto-stop: continue into overtime
  onPause: () => void;       // Manual-stop: just pause timer
  onNextQuarter: () => void; // Advance to next quarter
  onEndGame: () => void;     // End the game
  onCancel?: () => void;     // Close modal without action (manual-stop only)
}

export default function QuarterEndOverlay({
  mode,
  currentQuarter,
  totalQuarters,
  onContinue,
  onPause,
  onNextQuarter,
  onEndGame,
  onCancel,
}: QuarterEndOverlayProps) {
  const isLastQuarter = currentQuarter >= totalQuarters;

  // Determine title and subtitle based on mode
  const getTitle = () => {
    if (mode === 'auto-stop') {
      return isLastQuarter ? 'Game Complete!' : `Quarter ${currentQuarter} Complete`;
    }
    return `Quarter ${currentQuarter} Actions`;
  };

  const getSubtitle = () => {
    if (mode === 'auto-stop') {
      return isLastQuarter
        ? 'All quarters have been played.'
        : 'Referee still playing? Tap Continue.';
    }
    return 'What would you like to do?';
  };

  const getIcon = () => {
    if (mode === 'auto-stop') {
      return isLastQuarter ? '🏆' : '🏁';
    }
    return '⏹';
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
          {mode === 'auto-stop' && !isLastQuarter && (
            <>
              {/* Continue current quarter (referee hasn't stopped) */}
              <button
                onClick={onContinue}
                className="w-full touch-target bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
              >
                <div className="text-lg">Continue Q{currentQuarter}</div>
                <div className="text-sm opacity-90">Referee still playing</div>
              </button>

              {/* Start next quarter */}
              <button
                onClick={onNextQuarter}
                className="w-full touch-target bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
              >
                <div className="text-lg">Start Q{currentQuarter + 1}</div>
                <div className="text-sm opacity-90">Ready for next quarter</div>
              </button>
            </>
          )}

          {mode === 'auto-stop' && isLastQuarter && (
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

              {/* End Quarter / End Game */}
              {!isLastQuarter ? (
                <button
                  onClick={onNextQuarter}
                  className="w-full touch-target bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
                >
                  <div className="text-lg">End Quarter</div>
                  <div className="text-sm opacity-90">Move to Q{currentQuarter + 1}</div>
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

        {/* Quarter indicator */}
        <div className="mt-6 flex justify-center space-x-2">
          {Array.from({ length: totalQuarters }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i + 1 < currentQuarter
                  ? 'bg-green-500' // Completed
                  : i + 1 === currentQuarter
                    ? 'bg-yellow-500' // Current
                    : 'bg-gray-300' // Upcoming
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

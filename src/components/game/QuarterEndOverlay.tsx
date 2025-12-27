/**
 * Quarter End Overlay - Modal shown when quarter auto-stops
 *
 * Philosophy: Clear decision point. Two options. No confusion.
 * Coach needs to quickly decide: continue this quarter or start next.
 */

interface QuarterEndOverlayProps {
  currentQuarter: number;
  totalQuarters: number;
  onContinue: () => void;
  onNextQuarter: () => void;
  onEndGame: () => void;
}

export default function QuarterEndOverlay({
  currentQuarter,
  totalQuarters,
  onContinue,
  onNextQuarter,
  onEndGame,
}: QuarterEndOverlayProps) {
  const isLastQuarter = currentQuarter >= totalQuarters;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        {/* Icon */}
        <div className="text-5xl mb-3">
          {isLastQuarter ? '🏆' : '🏁'}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isLastQuarter
            ? 'Game Complete!'
            : `Quarter ${currentQuarter} Complete`}
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 mb-6">
          {isLastQuarter
            ? 'All quarters have been played.'
            : 'Referee still playing? Tap Continue.'}
        </p>

        {/* Action buttons */}
        <div className="space-y-3">
          {!isLastQuarter && (
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

          {isLastQuarter && (
            <button
              onClick={onEndGame}
              className="w-full touch-target bg-raiders-red hover:bg-raiders-red-dark text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition active:scale-95"
            >
              <div className="text-lg">End Game</div>
              <div className="text-sm opacity-90">Save and view stats</div>
            </button>
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

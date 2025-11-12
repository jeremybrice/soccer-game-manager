/**
 * Planning Mode Toggle Component
 *
 * Philosophy: Clear mode distinction. Immediate visual feedback.
 * Toggle between immediate swaps and planned rotations.
 */

interface PlanningModeToggleProps {
  planningMode: boolean;
  onToggle: () => void;
  stagedSwapCount: number;
}

export default function PlanningModeToggle({
  planningMode,
  onToggle,
  stagedSwapCount,
}: PlanningModeToggleProps) {
  return (
    <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-bold text-gray-900 mb-0.5">
            {planningMode ? '🎯 Planning Mode' : '⚡ Instant Swap Mode'}
          </div>
          <div className="text-xs text-gray-600">
            {planningMode
              ? `Stage swaps to execute all at once (${stagedSwapCount} staged)`
              : 'Tap players to swap them immediately'}
          </div>
        </div>

        <button
          onClick={onToggle}
          className={`touch-target px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-md ${
            planningMode
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-raiders-red hover:bg-raiders-red-dark text-white'
          }`}
        >
          {planningMode ? 'Exit Planning' : 'Plan Rotations'}
        </button>
      </div>
    </div>
  );
}

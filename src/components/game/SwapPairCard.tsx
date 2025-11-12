/**
 * Swap Pair Card Component
 *
 * Philosophy: Clear visual representation of staged swap.
 * Show who is swapping with whom at a glance.
 */

import type { Player } from '../../types';

interface SwapPairCardProps {
  benchPlayer: Player;
  fieldPlayer: Player;
  onCancel: () => void;
}

export default function SwapPairCard({
  benchPlayer,
  fieldPlayer,
  onCancel,
}: SwapPairCardProps) {
  return (
    <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-3 flex items-center justify-between">
      {/* Bench Player */}
      <div className="flex items-center space-x-2 flex-1">
        <div className="bg-white rounded-lg px-3 py-2 font-bold text-gray-900 text-sm">
          #{benchPlayer.number} {benchPlayer.name.split(' ')[0]}
        </div>
        <div className="text-gray-600 text-xs">
          (Bench)
        </div>
      </div>

      {/* Arrow */}
      <div className="px-3">
        <div className="text-orange-600 font-bold text-xl">
          →
        </div>
      </div>

      {/* Field Player */}
      <div className="flex items-center space-x-2 flex-1 justify-end">
        <div className="text-gray-600 text-xs">
          (Field)
        </div>
        <div className="bg-white rounded-lg px-3 py-2 font-bold text-gray-900 text-sm">
          #{fieldPlayer.number} {fieldPlayer.name.split(' ')[0]}
        </div>
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="ml-3 touch-target bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 font-bold text-sm transition"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Staged Swaps Panel Component
 *
 * Philosophy: Clear overview. Easy management. One-tap execution.
 * Show all pending swaps with ability to edit or execute.
 */

import { useState } from 'react';
import type { Player, StagedSwap } from '../../types';
import SwapPairCard from './SwapPairCard';

interface StagedSwapsPanelProps {
  stagedSwaps: StagedSwap[];
  players: Player[];
  onExecuteAll: () => Promise<void>;
  onClearAll: () => void;
  onRemoveSwap: (swapId: string) => void;
}

export default function StagedSwapsPanel({
  stagedSwaps,
  players,
  onExecuteAll,
  onClearAll,
  onRemoveSwap,
}: StagedSwapsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  if (stagedSwaps.length === 0) {
    return null; // Don't show panel if no staged swaps
  }

  const handleExecuteAll = async () => {
    setIsExecuting(true);
    try {
      await onExecuteAll();
    } finally {
      setIsExecuting(false);
    }
  };

  const getPlayer = (playerId: string): Player | undefined => {
    return players.find(p => p.id === playerId);
  };

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-xl p-4 mb-4 border-2 border-orange-400">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 font-bold text-gray-900 touch-target"
        >
          <span className="text-xl">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span>
            Staged Rotations ({stagedSwaps.length})
          </span>
        </button>

        <div className="flex items-center space-x-2">
          {stagedSwaps.length > 1 && (
            <button
              onClick={onClearAll}
              className="touch-target text-gray-600 hover:text-gray-900 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Swap List */}
          <div className="space-y-2 mb-4">
            {stagedSwaps.map((swap) => {
              const benchPlayer = getPlayer(swap.benchPlayerId);
              const fieldPlayer = getPlayer(swap.fieldPlayerId);

              if (!benchPlayer || !fieldPlayer) {
                return null; // Skip invalid swaps
              }

              return (
                <SwapPairCard
                  key={swap.id}
                  benchPlayer={benchPlayer}
                  fieldPlayer={fieldPlayer}
                  onCancel={() => onRemoveSwap(swap.id)}
                />
              );
            })}
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecuteAll}
            disabled={isExecuting}
            className={`w-full touch-target font-bold py-4 rounded-xl transition-all transform shadow-lg ${
              isExecuting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-raiders-red hover:bg-raiders-red-dark text-white hover:scale-105 active:scale-95'
            }`}
          >
            {isExecuting
              ? 'Executing Swaps...'
              : `Execute All ${stagedSwaps.length} Swap${stagedSwaps.length > 1 ? 's' : ''}`
            }
          </button>

          {/* Info Message */}
          <div className="mt-3 text-xs text-gray-600 text-center">
            All swaps will be executed simultaneously when game is next resumed
          </div>
        </>
      )}
    </div>
  );
}

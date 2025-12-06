/**
 * Staged Swaps Panel Component
 *
 * Philosophy: Compact. Space-conscious. One-tap execution.
 * Pill-style layout for mobile-friendly display below the field.
 */

import type { Player, StagedSwap, PositionAssignments } from '../../types';
import { useAppStore } from '../../store';

interface StagedSwapsPanelProps {
  stagedSwaps: StagedSwap[];
  players: Player[];
  assignments: PositionAssignments;
  onRemoveSwap: (swapId: string) => void;
}

export default function StagedSwapsPanel({
  stagedSwaps,
  players,
  assignments,
  onRemoveSwap,
}: StagedSwapsPanelProps) {
  const { selectedFormation } = useAppStore();

  if (stagedSwaps.length === 0) {
    return null; // Don't show panel if no staged swaps
  }

  const getPlayer = (playerId: string): Player | undefined => {
    return players.find(p => p.id === playerId);
  };

  // Get position label for a player
  const getPositionLabel = (playerId: string): string => {
    const position = assignments[playerId];
    if (!position) return '?';
    if (position === 'BENCH') return 'B';

    // Get all players at this position type
    const playersAtPosition = Object.entries(assignments)
      .filter(([, pos]) => pos === position)
      .map(([id]) => id);

    const playerIndex = playersAtPosition.indexOf(playerId);

    // Position labels based on formation
    if (position === 'GK') return 'GK';
    if (position === 'DEF') {
      const defLabels = ['LD', 'CD', 'RD'];
      return defLabels[playerIndex] || 'D';
    }
    if (position === 'MID') {
      const midLabels = selectedFormation === 'A'
        ? ['LM', 'CM', 'RM']
        : ['LM', 'CLM', 'CRM', 'RM'];
      return midLabels[playerIndex] || 'M';
    }
    if (position === 'FWD') {
      const fwdLabels = selectedFormation === 'A'
        ? ['LF', 'RF']
        : ['CF'];
      return fwdLabels[playerIndex] || 'F';
    }
    return '?';
  };

  return (
    <div className="mt-4 bg-orange-100/90 backdrop-blur rounded-xl border-l-4 border-orange-500 px-3 py-2">
      <div className="flex items-center gap-2 overflow-x-auto">
        {/* Label */}
        <span className="text-sm font-semibold text-orange-700 whitespace-nowrap flex-shrink-0">
          Staged ({stagedSwaps.length}):
        </span>

        {/* Swap Pills */}
        <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
          {stagedSwaps.map((swap) => {
            const player1 = getPlayer(swap.player1Id);
            const player2 = getPlayer(swap.player2Id);

            if (!player1 || !player2) return null;

            const pos1 = getPositionLabel(swap.player1Id);
            const pos2 = getPositionLabel(swap.player2Id);

            return (
              <div
                key={swap.id}
                className="inline-flex items-center bg-orange-500 text-white rounded-full px-2 py-1 text-xs font-bold gap-1 flex-shrink-0"
              >
                <span className="opacity-80">{pos1}</span>
                <span>#{player1.number}</span>
                <span className="text-orange-200">↔</span>
                <span>#{player2.number}</span>
                <span className="opacity-80">{pos2}</span>
                <button
                  onClick={() => onRemoveSwap(swap.id)}
                  className="ml-1 text-orange-200 hover:text-white active:scale-90 transition-transform"
                  aria-label={`Remove swap between ${player1.name} and ${player2.name}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

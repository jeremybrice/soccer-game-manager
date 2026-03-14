/**
 * Bench Area Component
 *
 * Philosophy: Always visible. Clear separation from field.
 * Persistent footer showing all bench players with tap-to-select support.
 */

import type { Player, PositionAssignments, StagedSwap } from '../../types';
import PlayerCard from './PlayerCard';

interface BenchAreaProps {
  players: Player[];
  assignments: PositionAssignments;
  stagedSwaps: StagedSwap[];
  selectedPlayerId: string | null;
  getPlayerMinutes: (playerId: string) => number;
  onPlayerTap: (playerId: string) => void;
  onGhostTap: (swapId: string) => void;
}

export default function BenchArea({
  players,
  assignments,
  stagedSwaps,
  selectedPlayerId,
  getPlayerMinutes,
  onPlayerTap,
  onGhostTap,
}: BenchAreaProps) {
  // Get bench players sorted by slot
  const benchPlayers = players
    .filter((p) => {
      const pos = assignments[p.id];
      return pos && pos.position === 'BENCH';
    })
    .sort((a, b) => {
      const slotA = assignments[a.id]?.slot ?? 0;
      const slotB = assignments[b.id]?.slot ?? 0;
      return slotA - slotB;
    });

  // Check if a player is staged to move and get ghost info
  const getPlayerSwapInfo = (playerId: string): {
    isFadedOut: boolean;
    ghostPlayer: Player | null;
    swapId: string | null;
  } => {
    // Find if this player is in any staged swap
    const swap = stagedSwaps.find(
      (s) => s.player1Id === playerId || s.player2Id === playerId
    );

    if (!swap) {
      return { isFadedOut: false, ghostPlayer: null, swapId: null };
    }

    // Get the partner in this swap
    const partnerId = swap.player1Id === playerId ? swap.player2Id : swap.player1Id;
    const partnerPos = assignments[partnerId];
    const playerPos = assignments[playerId];

    // If partner is on field, this bench player is going to field (faded)
    // and the partner (field player) will appear as ghost here
    if (partnerPos && partnerPos.position !== 'BENCH' && playerPos?.position === 'BENCH') {
      const partnerPlayer = players.find((p) => p.id === partnerId);
      return {
        isFadedOut: true,
        ghostPlayer: partnerPlayer || null,
        swapId: swap.id,
      };
    }

    // If this bench player's partner is also on bench (bench-to-bench swap)
    // just show faded without ghost
    if (swap) {
      return { isFadedOut: true, ghostPlayer: null, swapId: swap.id };
    }

    return { isFadedOut: false, ghostPlayer: null, swapId: null };
  };

  if (benchPlayers.length === 0) {
    return (
      <div className="bg-gray-200 border-t-2 border-gray-300 px-4 py-3">
        <div className="text-center text-gray-500 text-sm">
          All players are on the field
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 border-t-2 border-gray-300 px-4 py-3">
      {/* Bench label */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          🪑 Bench
        </span>
        <span className="text-xs text-gray-500">
          ({benchPlayers.length} players)
        </span>
      </div>

      {/* Bench players - horizontal scrollable */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {benchPlayers.map((player) => {
          const { isFadedOut, ghostPlayer, swapId } = getPlayerSwapInfo(player.id);
          const benchTime = getPlayerMinutes(player.id);

          return (
            <div key={player.id} className="flex-shrink-0 relative">
              <PlayerCard
                player={player}
                variant="bench"
                benchTime={benchTime}
                isSelected={selectedPlayerId === player.id}
                isFadedOut={isFadedOut}
                onClick={() => onPlayerTap(player.id)}
              />
              {/* Ghost overlay - shows incoming player */}
              {ghostPlayer && (
                <div
                  className="absolute inset-0 pointer-events-none"
                >
                  <div className="pointer-events-auto">
                    <PlayerCard
                      player={ghostPlayer}
                      isGhost={true}
                      onClick={swapId ? () => onGhostTap(swapId) : undefined}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Bench Area Component
 *
 * Philosophy: Quick access to substitutes. Clear visual distinction from field.
 */

import type { Player, PositionAssignments, StagedSwap } from '../../types';
import PlayerCard from './PlayerCard';

interface BenchAreaProps {
  assignments: PositionAssignments;
  players: Player[];
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
  getPlayerMinutes: (playerId: string) => number;
  getPlayerBenchTime: (playerId: string) => number;
  alertedPlayers: Set<string>;
  stagedSwaps?: StagedSwap[];
}

export default function BenchArea({
  assignments,
  players,
  selectedPlayerId,
  onPlayerSelect,
  getPlayerMinutes,
  getPlayerBenchTime,
  alertedPlayers,
  stagedSwaps = [],
}: BenchAreaProps) {
  // Note: No longer need swapPlayers from store, parent handles it

  // Get players on bench
  const benchPlayers = Object.entries(assignments)
    .filter(([, pos]) => pos === 'BENCH')
    .map(([playerId]) => players.find((p) => p.id === playerId))
    .filter((p): p is Player => p !== undefined);

  // Check if bench player is in a staged swap
  const getPlayerStagedStatus = (playerId: string): { isStaged: boolean; direction?: 'toField' | 'toBench' } => {
    const swap = stagedSwaps.find(s => s.benchPlayerId === playerId);
    if (swap) {
      return { isStaged: true, direction: 'toField' };
    }
    return { isStaged: false };
  };

  const handleCardClick = (playerId: string) => {
    // Always delegate to parent's onPlayerSelect handler
    // GameView will handle selection, swapping, and deselection logic
    onPlayerSelect(playerId);
  };

  return (
    <div className="p-4">
      <div className="text-white/90 text-sm font-semibold mb-2 uppercase tracking-wide">
        Bench ({benchPlayers.length})
      </div>
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {benchPlayers.length === 0 ? (
          <div className="text-white/60 text-sm py-4">
            All players are on the field
          </div>
        ) : (
          benchPlayers.map((player) => {
            const stagedStatus = getPlayerStagedStatus(player.id);
            return (
              <div key={player.id} className="flex-shrink-0">
                <PlayerCard
                  player={player}
                  isSelected={selectedPlayerId === player.id}
                  onClick={() => handleCardClick(player.id)}
                  variant="bench"
                  minutesAtPosition={getPlayerMinutes(player.id)}
                  benchTime={getPlayerBenchTime(player.id)}
                  isAlerted={alertedPlayers.has(player.id)}
                  isStaged={stagedStatus.isStaged}
                  stagedDirection={stagedStatus.direction}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Bench Area Component
 *
 * Philosophy: Quick access to substitutes. Clear visual distinction from field.
 */

import type { Player, PositionAssignments } from '../../types';
import { useAppStore } from '../../store';
import PlayerCard from './PlayerCard';

interface BenchAreaProps {
  assignments: PositionAssignments;
  players: Player[];
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
}

export default function BenchArea({
  assignments,
  players,
  selectedPlayerId,
  onPlayerSelect,
}: BenchAreaProps) {
  const { swapPlayers } = useAppStore();

  // Get players on bench
  const benchPlayers = Object.entries(assignments)
    .filter(([, pos]) => pos === 'BENCH')
    .map(([playerId]) => players.find((p) => p.id === playerId))
    .filter((p): p is Player => p !== undefined);

  const handleCardClick = async (playerId: string) => {
    if (selectedPlayerId && selectedPlayerId !== playerId) {
      // Swap the two players
      await swapPlayers(selectedPlayerId, playerId);
      onPlayerSelect(''); // Deselect
    } else {
      // Select/deselect
      onPlayerSelect(playerId);
    }
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
          benchPlayers.map((player) => (
            <div key={player.id} className="flex-shrink-0">
              <PlayerCard
                player={player}
                isSelected={selectedPlayerId === player.id}
                onClick={() => handleCardClick(player.id)}
                variant="bench"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

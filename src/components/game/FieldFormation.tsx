/**
 * Field Formation Component
 *
 * Philosophy: Visual clarity. The formation should mirror reality.
 * Portrait layout: GK at top, forwards at bottom (attacking upward).
 */

import type { Player, Position, PositionAssignments } from '../../types';
import { useAppStore } from '../../store';
import PlayerCard from './PlayerCard';

interface FieldFormationProps {
  assignments: PositionAssignments;
  players: Player[];
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
}

export default function FieldFormation({
  assignments,
  players,
  selectedPlayerId,
  onPlayerSelect,
}: FieldFormationProps) {
  const { swapPlayers } = useAppStore();

  // Get players by position
  const getPlayersAtPosition = (position: Position): Player[] => {
    return Object.entries(assignments)
      .filter(([, pos]) => pos === position)
      .map(([playerId]) => players.find((p) => p.id === playerId))
      .filter((p): p is Player => p !== undefined);
  };

  const gk = getPlayersAtPosition('GK')[0];
  const defenders = getPlayersAtPosition('DEF');
  const midfielders = getPlayersAtPosition('MID');
  const forwards = getPlayersAtPosition('FWD');

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
    <div className="h-full flex flex-col justify-between py-4">
      {/* Goalkeeper */}
      <div className="flex justify-center">
        <div className="text-center">
          <div className="text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Goalkeeper
          </div>
          {gk ? (
            <PlayerCard
              player={gk}
              isSelected={selectedPlayerId === gk.id}
              onClick={() => handleCardClick(gk.id)}
            />
          ) : (
            <div className="w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed border-white/40 flex items-center justify-center">
              <span className="text-white/50 text-xs">Empty</span>
            </div>
          )}
        </div>
      </div>

      {/* Defenders (3) */}
      <div>
        <div className="text-white/70 text-xs font-semibold mb-1 text-center uppercase tracking-wide">
          Defense
        </div>
        <div className="flex justify-around px-4">
          {defenders.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={selectedPlayerId === player.id}
              onClick={() => handleCardClick(player.id)}
            />
          ))}
          {/* Fill empty spots */}
          {Array.from({ length: 3 - defenders.length }).map((_, i) => (
            <div
              key={`def-empty-${i}`}
              className="w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed border-white/40"
            />
          ))}
        </div>
      </div>

      {/* Midfielders (3) */}
      <div>
        <div className="text-white/70 text-xs font-semibold mb-1 text-center uppercase tracking-wide">
          Midfield
        </div>
        <div className="flex justify-around px-4">
          {midfielders.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={selectedPlayerId === player.id}
              onClick={() => handleCardClick(player.id)}
            />
          ))}
          {/* Fill empty spots */}
          {Array.from({ length: 3 - midfielders.length }).map((_, i) => (
            <div
              key={`mid-empty-${i}`}
              className="w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed border-white/40"
            />
          ))}
        </div>
      </div>

      {/* Forwards (2) */}
      <div>
        <div className="text-white/70 text-xs font-semibold mb-1 text-center uppercase tracking-wide">
          Forward
        </div>
        <div className="flex justify-center space-x-8">
          {forwards.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={selectedPlayerId === player.id}
              onClick={() => handleCardClick(player.id)}
            />
          ))}
          {/* Fill empty spots */}
          {Array.from({ length: 2 - forwards.length }).map((_, i) => (
            <div
              key={`fwd-empty-${i}`}
              className="w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed border-white/40"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Formation Preview Component
 *
 * Philosophy: Visual and interactive. Tap to assign players to positions.
 * Clear feedback on what's assigned and what's available.
 */

import { useState } from 'react';
import type { Player, Position, PositionAssignments, FormationType } from '../../types';
import { FORMATION_A, FORMATION_B } from '../../types';

interface FormationPreviewProps {
  formation: FormationType;
  assignments: PositionAssignments;
  players: Player[];
  onPlayerAssignment: (playerId: string, position: Position) => void;
}

export default function FormationPreview({
  formation,
  assignments,
  players,
  onPlayerAssignment,
}: FormationPreviewProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const formationConfig = formation === 'A' ? FORMATION_A : FORMATION_B;

  // Get players assigned to a position
  const getPlayersAtPosition = (position: Position): Player[] => {
    return players.filter(p => assignments[p.id] === position);
  };

  // Get players not assigned to field positions (bench + unassigned)
  const getAvailablePlayers = (): Player[] => {
    return players.filter(p => !assignments[p.id] || assignments[p.id] === 'BENCH');
  };

  const handlePositionClick = (position: Position) => {
    if (position === 'BENCH') return; // Don't allow selecting bench
    setSelectedPosition(position);
  };

  const handlePlayerClick = (player: Player) => {
    if (!selectedPosition) {
      // If no position selected, show which position this player is at
      return;
    }

    // Assign player to selected position
    onPlayerAssignment(player.id, selectedPosition);
    setSelectedPosition(null);
  };

  const handleRemovePlayer = (playerId: string) => {
    onPlayerAssignment(playerId, 'BENCH');
  };

  // Position layout helpers
  const getPositionSlots = (position: Position): number => {
    return formationConfig[position];
  };

  const getPositionLabel = (position: Position, index: number): string => {
    if (position === 'GK') return 'GK';
    if (position === 'FWD') {
      return formation === 'A'
        ? ['LF', 'RF'][index] || 'FWD'
        : 'CF'; // Formation B has only 1 forward
    }
    if (position === 'MID') {
      return formation === 'A'
        ? ['LM', 'CM', 'RM'][index] || 'MID'
        : ['LM', 'CLM', 'CRM', 'RM'][index] || 'MID';
    }
    if (position === 'DEF') {
      return ['LD', 'CD', 'RD'][index] || 'DEF';
    }
    return position;
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg">
      <h3 className="font-bold text-gray-900 mb-3">Player Assignment</h3>

      {selectedPosition && (
        <div className="bg-raiders-red text-white px-4 py-3 rounded-lg mb-4 font-semibold text-center">
          Assigning to {selectedPosition} - Tap a player below
          <button
            onClick={() => setSelectedPosition(null)}
            className="ml-3 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Field Preview */}
      <div className="bg-gradient-to-b from-field-light to-field rounded-xl p-6 min-h-[400px] relative overflow-hidden">
        {/* Raiders Logo Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="text-[200px]">🛡️</div>
        </div>

        {/* Positions Grid */}
        <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
          {/* Forwards */}
          <div className="flex justify-center gap-4">
            {Array(getPositionSlots('FWD')).fill(0).map((_, index) => {
              const assignedPlayers = getPlayersAtPosition('FWD');
              const player = assignedPlayers[index];

              return (
                <PositionSlot
                  key={`FWD-${index}`}
                  position="FWD"
                  label={getPositionLabel('FWD', index)}
                  player={player}
                  isSelected={selectedPosition === 'FWD'}
                  onPositionClick={() => handlePositionClick('FWD')}
                  onRemovePlayer={player ? () => handleRemovePlayer(player.id) : undefined}
                />
              );
            })}
          </div>

          {/* Midfielders */}
          <div className="flex justify-center gap-4">
            {Array(getPositionSlots('MID')).fill(0).map((_, index) => {
              const assignedPlayers = getPlayersAtPosition('MID');
              const player = assignedPlayers[index];

              return (
                <PositionSlot
                  key={`MID-${index}`}
                  position="MID"
                  label={getPositionLabel('MID', index)}
                  player={player}
                  isSelected={selectedPosition === 'MID'}
                  onPositionClick={() => handlePositionClick('MID')}
                  onRemovePlayer={player ? () => handleRemovePlayer(player.id) : undefined}
                />
              );
            })}
          </div>

          {/* Defenders */}
          <div className="flex justify-center gap-4">
            {Array(getPositionSlots('DEF')).fill(0).map((_, index) => {
              const assignedPlayers = getPlayersAtPosition('DEF');
              const player = assignedPlayers[index];

              return (
                <PositionSlot
                  key={`DEF-${index}`}
                  position="DEF"
                  label={getPositionLabel('DEF', index)}
                  player={player}
                  isSelected={selectedPosition === 'DEF'}
                  onPositionClick={() => handlePositionClick('DEF')}
                  onRemovePlayer={player ? () => handleRemovePlayer(player.id) : undefined}
                />
              );
            })}
          </div>

          {/* Goalkeeper */}
          <div className="flex justify-center">
            {Array(getPositionSlots('GK')).fill(0).map((_, index) => {
              const assignedPlayers = getPlayersAtPosition('GK');
              const player = assignedPlayers[index];

              return (
                <PositionSlot
                  key={`GK-${index}`}
                  position="GK"
                  label="GK"
                  player={player}
                  isSelected={selectedPosition === 'GK'}
                  onPositionClick={() => handlePositionClick('GK')}
                  onRemovePlayer={player ? () => handleRemovePlayer(player.id) : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Available Players */}
      <div className="mt-4">
        <h4 className="font-semibold text-gray-700 mb-2">Available Players ({getAvailablePlayers().length})</h4>
        <div className="flex flex-wrap gap-2">
          {getAvailablePlayers().length === 0 ? (
            <div className="text-gray-500 text-sm italic py-2">
              All players assigned to field positions
            </div>
          ) : (
            getAvailablePlayers().map(player => (
              <button
                key={player.id}
                onClick={() => handlePlayerClick(player)}
                disabled={!selectedPosition}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${
                  selectedPosition
                    ? 'bg-raiders-red text-white hover:bg-raiders-red-dark cursor-pointer'
                    : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                }`}
              >
                #{player.number} {player.name}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for position slots
interface PositionSlotProps {
  position: Position;
  label: string;
  player?: Player;
  isSelected: boolean;
  onPositionClick: () => void;
  onRemovePlayer?: () => void;
}

function PositionSlot({
  position,
  label,
  player,
  isSelected,
  onPositionClick,
  onRemovePlayer,
}: PositionSlotProps) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={player ? onRemovePlayer : onPositionClick}
        className={`w-16 h-16 rounded-xl font-bold text-sm flex flex-col items-center justify-center transition transform ${
          player
            ? 'bg-white text-gray-900 shadow-lg hover:scale-105 cursor-pointer'
            : isSelected
              ? 'bg-raiders-red text-white border-2 border-white scale-110 shadow-xl'
              : 'bg-white/30 text-white/60 border-2 border-white/40 border-dashed hover:bg-white/40 hover:border-white/60 cursor-pointer'
        }`}
      >
        {player ? (
          <>
            <div className="text-xl">{player.number}</div>
            <div className="text-[8px] leading-tight truncate max-w-full px-1">
              {player.name.split(' ')[0]}
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] opacity-60">{label}</div>
            <div className="text-xl">+</div>
          </>
        )}
      </button>
      <div className="text-white text-[10px] font-semibold mt-1">{label}</div>
    </div>
  );
}

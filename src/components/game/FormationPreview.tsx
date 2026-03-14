/**
 * Formation Preview Component (v4.0.0 - Flexible Formations)
 *
 * Philosophy: Visual and interactive. Tap to assign players to positions.
 * Clear feedback on what's assigned and what's available.
 * Renders rows dynamically from the active formation template.
 */

import { useState } from 'react';
import type { Player, Position, PlayerPosition, PositionAssignments, FormationTemplate } from '../../types';
import { createPlayerPosition, getSlotLabel, generateRowLabels, getFormationConfig } from '../../types';

interface FormationPreviewProps {
  template: FormationTemplate;
  assignments: PositionAssignments;
  players: Player[];
  onPlayerAssignment: (playerId: string, playerPosition: PlayerPosition) => void;
}

export default function FormationPreview({
  template,
  assignments,
  players,
  onPlayerAssignment,
}: FormationPreviewProps) {
  const [selectedSlot, setSelectedSlot] = useState<{ position: Position; slot: number } | null>(null);

  const formationConfig = getFormationConfig(template);

  // Get players assigned to a specific position, filling slots
  const getPlayersAtPosition = (position: Position): (Player | null)[] => {
    const slotCount = formationConfig[position];
    const result: (Player | null)[] = Array(slotCount).fill(null);

    players.forEach(player => {
      const playerPos = assignments[player.id];
      if (playerPos && playerPos.position === position && playerPos.slot < slotCount) {
        result[playerPos.slot] = player;
      }
    });

    return result;
  };

  // Get players not assigned to field positions (bench + unassigned)
  const getAvailablePlayers = (): Player[] => {
    return players.filter(p => {
      const playerPos = assignments[p.id];
      return !playerPos || playerPos.position === 'BENCH';
    });
  };

  const handlePositionClick = (position: Position, slot: number) => {
    if (position === 'BENCH') return;
    setSelectedSlot({ position, slot });
  };

  const handlePlayerClick = (player: Player) => {
    if (!selectedSlot) return;
    onPlayerAssignment(player.id, createPlayerPosition(selectedSlot.position, selectedSlot.slot));
    setSelectedSlot(null);
  };

  const handleRemovePlayer = (playerId: string) => {
    const benchPlayers = getPlayersAtPosition('BENCH').filter(p => p !== null).length;
    onPlayerAssignment(playerId, createPlayerPosition('BENCH', benchPlayers));
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg">
      <h3 className="font-bold text-gray-900 mb-3">Player Assignment</h3>

      {selectedSlot && (
        <div className="bg-raiders-red text-white px-4 py-3 rounded-lg mb-4 font-semibold text-center">
          Assigning to {getSlotLabel(selectedSlot.position, selectedSlot.slot, template)} - Tap a player below
          <button
            onClick={() => setSelectedSlot(null)}
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

        {/* Positions Grid - Dynamic rows */}
        <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
          {/* Formation rows (top-to-bottom: FWD → MID → DEF) */}
          {template.rows.map((row, rowIndex) => {
            const labels = generateRowLabels(row);
            const assignedPlayers = getPlayersAtPosition(row.position);

            return (
              <div key={rowIndex} className="flex justify-center gap-4">
                {Array(row.count).fill(0).map((_, slotIndex) => {
                  // Calculate the actual slot index across all rows of the same position
                  // For templates with multiple rows of the same position type
                  const samePositionRowsBefore = template.rows
                    .slice(0, rowIndex)
                    .filter(r => r.position === row.position)
                    .reduce((sum, r) => sum + r.count, 0);
                  const actualSlot = samePositionRowsBefore + slotIndex;
                  const player = assignedPlayers[actualSlot];

                  return (
                    <PositionSlot
                      key={`${row.position}-${actualSlot}`}
                      position={row.position}
                      label={labels[slotIndex]}
                      player={player ?? undefined}
                      isSelected={selectedSlot?.position === row.position && selectedSlot?.slot === actualSlot}
                      onPositionClick={() => handlePositionClick(row.position, actualSlot)}
                      onRemovePlayer={player ? () => handleRemovePlayer(player.id) : undefined}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Goalkeeper (always 1) */}
          <div className="flex justify-center">
            {Array(formationConfig.GK).fill(0).map((_, index) => {
              const assignedPlayers = getPlayersAtPosition('GK');
              const player = assignedPlayers[index];

              return (
                <PositionSlot
                  key={`GK-${index}`}
                  position="GK"
                  label="GK"
                  player={player ?? undefined}
                  isSelected={selectedSlot?.position === 'GK' && selectedSlot?.slot === index}
                  onPositionClick={() => handlePositionClick('GK', index)}
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
                disabled={!selectedSlot}
                className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${
                  selectedSlot
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

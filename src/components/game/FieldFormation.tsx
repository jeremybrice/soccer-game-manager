/**
 * Field Formation Component
 *
 * Philosophy: Visual clarity. The formation should mirror reality.
 * Portrait layout: Forwards at top, GK at bottom (attacking downward).
 */

import type { Player, Position, PositionAssignments, StagedSwap } from '../../types';
import { FORMATION_A, FORMATION_B } from '../../types';
import { useAppStore } from '../../store';
import PlayerCard from './PlayerCard';

interface FieldFormationProps {
  assignments: PositionAssignments;
  players: Player[];
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
  getPlayerMinutes: (playerId: string) => number;
  getPlayerRotationCount: (playerId: string) => number;
  alertedPlayers: Set<string>;
  stagedSwaps?: StagedSwap[];
}

export default function FieldFormation({
  assignments,
  players,
  selectedPlayerId,
  onPlayerSelect,
  getPlayerMinutes,
  getPlayerRotationCount,
  alertedPlayers,
  stagedSwaps = [],
}: FieldFormationProps) {
  const { swapPlayers, selectedFormation } = useAppStore();

  // Get current formation configuration
  const formationConfig = selectedFormation === 'A' ? FORMATION_A : FORMATION_B;

  // Check if player is in a staged swap
  const getPlayerStagedStatus = (playerId: string): { isStaged: boolean; direction?: 'toField' | 'toBench' } => {
    const swap = stagedSwaps.find(s => s.fieldPlayerId === playerId);
    if (swap) {
      return { isStaged: true, direction: 'toBench' };
    }
    return { isStaged: false };
  };

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

  // Position labels based on array index and formation
  const forwardLabels = selectedFormation === 'A'
    ? ['LF', 'RF'] // Formation A: 2 forwards
    : ['CF']; // Formation B: 1 forward (center)

  const midfieldLabels = selectedFormation === 'A'
    ? ['LM', 'CM', 'RM'] // Formation A: 3 midfielders
    : ['LM', 'CLM', 'CRM', 'RM']; // Formation B: 4 midfielders

  const defenseLabels = ['LD', 'CD', 'RD']; // Always 3 defenders

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
    <div className="h-full flex flex-col justify-between py-4 relative">
      {/* Raiders Logo Watermark */}
      {/* TODO: Replace with actual Raiders shield logo SVG from /public/raiders-shield.svg */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="text-[200px] select-none">🛡️</div>
      </div>

      {/* Forwards - Now at top */}
      <div>
        <div className="text-white/70 text-xs font-semibold mb-1 text-center uppercase tracking-wide">
          Forward
        </div>
        <div className="flex justify-center space-x-8">
          {forwards.map((player, index) => {
            const stagedStatus = getPlayerStagedStatus(player.id);
            return (
              <PlayerCard
                key={player.id}
                player={player}
                isSelected={selectedPlayerId === player.id}
                onClick={() => handleCardClick(player.id)}
                minutesAtPosition={getPlayerMinutes(player.id)}
                positionLabel={forwardLabels[index]}
                rotationCount={getPlayerRotationCount(player.id)}
                isAlerted={alertedPlayers.has(player.id)}
                isStaged={stagedStatus.isStaged}
                stagedDirection={stagedStatus.direction}
              />
            );
          })}
          {/* Fill empty spots */}
          {Array.from({ length: formationConfig.FWD - forwards.length }).map((_, i) => (
            <div
              key={`fwd-empty-${i}`}
              className="w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed border-white/40"
            />
          ))}
        </div>
      </div>

      {/* Midfielders */}
      <div>
        <div className="text-white/70 text-xs font-semibold mb-1 text-center uppercase tracking-wide">
          Midfield
        </div>
        <div className="flex justify-around px-4">
          {midfielders.map((player, index) => {
            const stagedStatus = getPlayerStagedStatus(player.id);
            return (
              <PlayerCard
                key={player.id}
                player={player}
                isSelected={selectedPlayerId === player.id}
                onClick={() => handleCardClick(player.id)}
                minutesAtPosition={getPlayerMinutes(player.id)}
                positionLabel={midfieldLabels[index]}
                rotationCount={getPlayerRotationCount(player.id)}
                isAlerted={alertedPlayers.has(player.id)}
                isStaged={stagedStatus.isStaged}
                stagedDirection={stagedStatus.direction}
              />
            );
          })}
          {/* Fill empty spots */}
          {Array.from({ length: formationConfig.MID - midfielders.length }).map((_, i) => (
            <div
              key={`mid-empty-${i}`}
              className="w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed border-white/40"
            />
          ))}
        </div>
      </div>

      {/* Defenders (3) */}
      <div>
        <div className="text-white/70 text-xs font-semibold mb-1 text-center uppercase tracking-wide">
          Defense
        </div>
        <div className="flex justify-around px-4">
          {defenders.map((player, index) => {
            const stagedStatus = getPlayerStagedStatus(player.id);
            return (
              <PlayerCard
                key={player.id}
                player={player}
                isSelected={selectedPlayerId === player.id}
                onClick={() => handleCardClick(player.id)}
                minutesAtPosition={getPlayerMinutes(player.id)}
                positionLabel={defenseLabels[index]}
                rotationCount={getPlayerRotationCount(player.id)}
                isAlerted={alertedPlayers.has(player.id)}
                isStaged={stagedStatus.isStaged}
                stagedDirection={stagedStatus.direction}
              />
            );
          })}
          {/* Fill empty spots */}
          {Array.from({ length: 3 - defenders.length }).map((_, i) => (
            <div
              key={`def-empty-${i}`}
              className="w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed border-white/40"
            />
          ))}
        </div>
      </div>

      {/* Goalkeeper - Now at bottom */}
      <div className="flex justify-center">
        <div className="text-center">
          <div className="text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Goalkeeper
          </div>
          {gk ? (
            (() => {
              const stagedStatus = getPlayerStagedStatus(gk.id);
              return (
                <PlayerCard
                  player={gk}
                  isSelected={selectedPlayerId === gk.id}
                  onClick={() => handleCardClick(gk.id)}
                  minutesAtPosition={getPlayerMinutes(gk.id)}
                  positionLabel="GK"
                  rotationCount={getPlayerRotationCount(gk.id)}
                  isAlerted={alertedPlayers.has(gk.id)}
                  isStaged={stagedStatus.isStaged}
                  stagedDirection={stagedStatus.direction}
                />
              );
            })()
          ) : (
            <div className="w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed border-white/40 flex items-center justify-center">
              <span className="text-white/50 text-xs">Empty</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

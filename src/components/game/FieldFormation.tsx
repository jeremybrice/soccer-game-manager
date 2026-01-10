/**
 * Field Formation Component
 *
 * Philosophy: Visual clarity. The formation should mirror reality.
 * Portrait layout: Forwards at top, GK at bottom (attacking downward).
 * Tap-to-select enabled for staging swaps with ghost previews.
 */

import type { Player, Position, PositionAssignments, StagedSwap } from '../../types';
import { FORMATION_A, FORMATION_B } from '../../types';
import { useAppStore } from '../../store';
import PlayerCard from './PlayerCard';

interface FieldFormationProps {
  assignments: PositionAssignments;
  players: Player[];
  getPlayerMinutes: (playerId: string) => number;
  alertedPlayers: Set<string>;
  stagedSwaps: StagedSwap[];
  selectedPlayerId: string | null;
  onPlayerTap: (playerId: string) => void;
  onGhostTap: (swapId: string) => void;
}

export default function FieldFormation({
  assignments,
  players,
  getPlayerMinutes,
  alertedPlayers,
  stagedSwaps,
  selectedPlayerId,
  onPlayerTap,
  onGhostTap,
}: FieldFormationProps) {
  const { selectedFormation } = useAppStore();

  // Get current formation configuration
  const formationConfig = selectedFormation === 'A' ? FORMATION_A : FORMATION_B;

  // Check if a player is staged to move and get ghost info
  const getPlayerSwapInfo = (playerId: string): {
    isFadedOut: boolean;
    ghostPlayer: Player | null;
    swapId: string | null;
  } => {
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

    // If partner is on bench, this field player is going to bench (faded)
    // and the partner (bench player) will appear as ghost here
    if (partnerPos?.position === 'BENCH' && playerPos?.position !== 'BENCH') {
      const partnerPlayer = players.find((p) => p.id === partnerId);
      return {
        isFadedOut: true,
        ghostPlayer: partnerPlayer || null,
        swapId: swap.id,
      };
    }

    // If both are on field (field-to-field swap), show faded with ghost
    if (partnerPos?.position !== 'BENCH' && playerPos?.position !== 'BENCH') {
      const partnerPlayer = players.find((p) => p.id === partnerId);
      return {
        isFadedOut: true,
        ghostPlayer: partnerPlayer || null,
        swapId: swap.id,
      };
    }

    return { isFadedOut: false, ghostPlayer: null, swapId: null };
  };

  // Get players by position, sorted by slot index
  const getPlayersAtPosition = (position: Position): Player[] => {
    const playersWithSlots = Object.entries(assignments)
      .filter(([, playerPos]) => playerPos.position === position)
      .map(([playerId, playerPos]) => ({
        player: players.find((p) => p.id === playerId),
        slot: playerPos.slot,
      }))
      .filter((item): item is { player: Player; slot: number } => item.player !== undefined)
      .sort((a, b) => a.slot - b.slot);

    return playersWithSlots.map(item => item.player);
  };

  const gk = getPlayersAtPosition('GK')[0];
  const defenders = getPlayersAtPosition('DEF');
  const midfielders = getPlayersAtPosition('MID');
  const forwards = getPlayersAtPosition('FWD');

  // Position labels based on array index and formation
  const forwardLabels = selectedFormation === 'A'
    ? ['LF', 'RF']
    : ['CF'];

  const midfieldLabels = selectedFormation === 'A'
    ? ['LM', 'CM', 'RM']
    : ['LM', 'CLM', 'CRM', 'RM'];

  const defenseLabels = ['LD', 'CD', 'RD'];

  return (
    <div className="h-full flex flex-col justify-between py-4 relative">
      {/* Raiders Logo Watermark */}
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
            const { isFadedOut, ghostPlayer, swapId } = getPlayerSwapInfo(player.id);
            return (
              <div key={player.id} className="relative">
                <PlayerCard
                  player={player}
                  variant="field"
                  minutesAtPosition={getPlayerMinutes(player.id)}
                  positionLabel={forwardLabels[index]}
                  isAlerted={alertedPlayers.has(player.id)}
                  isSelected={selectedPlayerId === player.id}
                  isFadedOut={isFadedOut}
                  onClick={() => onPlayerTap(player.id)}
                />
                {/* Ghost overlay - shows incoming player */}
                {ghostPlayer && (
                  <div
                    className="absolute inset-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (swapId) onGhostTap(swapId);
                    }}
                  >
                    <PlayerCard
                      player={ghostPlayer}
                      isGhost={true}
                      onClick={swapId ? () => onGhostTap(swapId) : undefined}
                    />
                  </div>
                )}
              </div>
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
            const { isFadedOut, ghostPlayer, swapId } = getPlayerSwapInfo(player.id);
            return (
              <div key={player.id} className="relative">
                <PlayerCard
                  player={player}
                  variant="field"
                  minutesAtPosition={getPlayerMinutes(player.id)}
                  positionLabel={midfieldLabels[index]}
                  isAlerted={alertedPlayers.has(player.id)}
                  isSelected={selectedPlayerId === player.id}
                  isFadedOut={isFadedOut}
                  onClick={() => onPlayerTap(player.id)}
                />
                {/* Ghost overlay - shows incoming player */}
                {ghostPlayer && (
                  <div
                    className="absolute inset-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (swapId) onGhostTap(swapId);
                    }}
                  >
                    <PlayerCard
                      player={ghostPlayer}
                      isGhost={true}
                      onClick={swapId ? () => onGhostTap(swapId) : undefined}
                    />
                  </div>
                )}
              </div>
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
            const { isFadedOut, ghostPlayer, swapId } = getPlayerSwapInfo(player.id);
            return (
              <div key={player.id} className="relative">
                <PlayerCard
                  player={player}
                  variant="field"
                  minutesAtPosition={getPlayerMinutes(player.id)}
                  positionLabel={defenseLabels[index]}
                  isAlerted={alertedPlayers.has(player.id)}
                  isSelected={selectedPlayerId === player.id}
                  isFadedOut={isFadedOut}
                  onClick={() => onPlayerTap(player.id)}
                />
                {/* Ghost overlay - shows incoming player */}
                {ghostPlayer && (
                  <div
                    className="absolute inset-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (swapId) onGhostTap(swapId);
                    }}
                  >
                    <PlayerCard
                      player={ghostPlayer}
                      isGhost={true}
                      onClick={swapId ? () => onGhostTap(swapId) : undefined}
                    />
                  </div>
                )}
              </div>
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
              const { isFadedOut, ghostPlayer, swapId } = getPlayerSwapInfo(gk.id);
              return (
                <div className="relative">
                  <PlayerCard
                    player={gk}
                    variant="field"
                    minutesAtPosition={getPlayerMinutes(gk.id)}
                    positionLabel="GK"
                    isAlerted={alertedPlayers.has(gk.id)}
                    isSelected={selectedPlayerId === gk.id}
                    isFadedOut={isFadedOut}
                    onClick={() => onPlayerTap(gk.id)}
                  />
                  {/* Ghost overlay - shows incoming player */}
                  {ghostPlayer && (
                    <div
                      className="absolute inset-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (swapId) onGhostTap(swapId);
                      }}
                    >
                      <PlayerCard
                        player={ghostPlayer}
                        isGhost={true}
                        onClick={swapId ? () => onGhostTap(swapId) : undefined}
                      />
                    </div>
                  )}
                </div>
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

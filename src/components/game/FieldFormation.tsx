/**
 * Field Formation Component (v4.0.0 - Flexible Formations)
 *
 * Philosophy: Visual clarity. The formation should mirror reality.
 * Portrait layout: Forwards at top, GK at bottom (attacking downward).
 * Renders rows dynamically from the active formation template.
 * Tap-to-select enabled for staging swaps with ghost previews.
 */

import type { Player, Position, PositionAssignments, StagedSwap } from '../../types';
import { generateRowLabels } from '../../types';
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
  onEmptySlotTap?: (position: Position, slot: number) => void;
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
  onEmptySlotTap,
}: FieldFormationProps) {
  const { activeFormation } = useAppStore();

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

    const partnerId = swap.player1Id === playerId ? swap.player2Id : swap.player1Id;
    const partnerPos = assignments[partnerId];
    const playerPos = assignments[playerId];

    if (partnerPos?.position === 'BENCH' && playerPos?.position !== 'BENCH') {
      const partnerPlayer = players.find((p) => p.id === partnerId);
      return {
        isFadedOut: true,
        ghostPlayer: partnerPlayer || null,
        swapId: swap.id,
      };
    }

    if (partnerPos?.position !== 'BENCH' && playerPos?.position !== 'BENCH') {
      const partnerPlayer = players.find((p) => p.id === partnerId);
      return {
        isFadedOut: false,
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

  // Render a player card with ghost overlay support
  const renderPlayerCard = (player: Player, positionLabel: string) => {
    const { isFadedOut, ghostPlayer, swapId } = getPlayerSwapInfo(player.id);
    return (
      <div key={player.id} className="relative">
        <PlayerCard
          player={player}
          variant="field"
          minutesAtPosition={getPlayerMinutes(player.id)}
          positionLabel={positionLabel}
          isAlerted={alertedPlayers.has(player.id)}
          isSelected={selectedPlayerId === player.id}
          isFadedOut={isFadedOut}
          onClick={() => onPlayerTap(player.id)}
        />
        {ghostPlayer && (
          <div className="absolute inset-0 pointer-events-none">
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
  };

  return (
    <div className="h-full flex flex-col justify-between py-4 relative">
      {/* Raiders Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="text-[200px] select-none">🛡️</div>
      </div>

      {/* Dynamic formation rows (top-to-bottom: FWD → MID → DEF) */}
      {activeFormation.rows.map((row, rowIndex) => {
        const labels = generateRowLabels(row);
        // Calculate slot offset for rows with same position type
        const samePositionRowsBefore = activeFormation.rows
          .slice(0, rowIndex)
          .filter(r => r.position === row.position)
          .reduce((sum, r) => sum + r.count, 0);

        const playersInRow = getPlayersAtPosition(row.position)
          .slice(samePositionRowsBefore, samePositionRowsBefore + row.count);

        const positionName = row.position === 'FWD' ? 'Forward' :
          row.position === 'MID' ? 'Midfield' : 'Defense';

        return (
          <div key={rowIndex}>
            <div className="text-white/70 text-xs font-semibold mb-1 text-center uppercase tracking-wide">
              {positionName}
            </div>
            <div className={`flex ${row.count <= 3 ? 'justify-center space-x-8' : 'justify-around px-4'}`}>
              {playersInRow.map((player, index) =>
                renderPlayerCard(player, labels[index])
              )}
              {/* Fill empty spots - tappable when a bench player is selected */}
              {Array.from({ length: row.count - playersInRow.length }).map((_, i) => {
                const emptySlot = samePositionRowsBefore + playersInRow.length + i;
                return (
                  <button
                    key={`empty-${rowIndex}-${i}`}
                    onClick={() => onEmptySlotTap?.(row.position, emptySlot)}
                    className={`w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed transition-all ${
                      selectedPlayerId
                        ? 'border-green-400 bg-green-400/20 active:bg-green-400/40'
                        : 'border-white/40'
                    }`}
                  >
                    {selectedPlayerId && (
                      <span className="text-white/70 text-xs font-semibold">+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Goalkeeper - Always at bottom */}
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
                  {ghostPlayer && (
                    <div className="absolute inset-0 pointer-events-none">
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
            })()
          ) : (
            <button
              onClick={() => onEmptySlotTap?.('GK', 0)}
              className={`w-20 h-20 bg-white/20 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                selectedPlayerId
                  ? 'border-green-400 bg-green-400/20 active:bg-green-400/40'
                  : 'border-white/40'
              }`}
            >
              <span className="text-white/50 text-xs">{selectedPlayerId ? '+' : 'Empty'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

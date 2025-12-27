/**
 * Swap Modal Component
 *
 * Philosophy: Zero scrolling. All players visible at once.
 * One tap to select, one tap to swap, done.
 */

import type { Player, PositionAssignments, StagedSwap } from '../../types';
import { getSlotLabel } from '../../types';
import { useAppStore } from '../../store';

interface SwapModalProps {
  selectedPlayer: Player;
  selectedPlayerPosition: string;
  allPlayers: Player[];
  assignments: PositionAssignments;
  onSwap: (targetPlayerId: string) => void;
  onCancel: () => void;
  getPlayerMinutes: (playerId: string) => number;
  planningMode: boolean;
  stagedSwaps: StagedSwap[];
}

export default function SwapModal({
  selectedPlayer,
  selectedPlayerPosition,
  allPlayers,
  assignments,
  onSwap,
  onCancel,
  getPlayerMinutes,
  planningMode,
  stagedSwaps,
}: SwapModalProps) {
  const { selectedFormation } = useAppStore();

  // Separate field and bench players (excluding selected player)
  const fieldPlayers = allPlayers.filter(
    (p) => p.id !== selectedPlayer.id && assignments[p.id]?.position !== 'BENCH'
  );
  const benchPlayers = allPlayers.filter(
    (p) => p.id !== selectedPlayer.id && assignments[p.id]?.position === 'BENCH'
  );

  const isSelectedOnBench = selectedPlayerPosition === 'BENCH';

  // Get time-based color for field players
  const getTimeBasedColor = (minutes: number): string => {
    if (minutes < 10) return 'bg-green-500 text-white';
    if (minutes < 15) return 'bg-yellow-400 text-gray-900';
    return 'bg-red-500 text-white';
  };

  // Check if player is in a staged swap
  const isPlayerStaged = (playerId: string): boolean => {
    return stagedSwaps.some(
      (s) => s.player1Id === playerId || s.player2Id === playerId
    );
  };

  // Get position label for a player using slot information
  const getPositionLabelForPlayer = (playerId: string): string | undefined => {
    const playerPosition = assignments[playerId];
    if (!playerPosition || playerPosition.position === 'BENCH') return undefined;

    return getSlotLabel(playerPosition.position, playerPosition.slot, selectedFormation);
  };

  // All players are valid targets in both modes now
  const fieldTargets = fieldPlayers;
  const benchTargets = benchPlayers;

  const renderPlayerButton = (player: Player, isOnField: boolean) => {
    const minutes = getPlayerMinutes(player.id);
    const isStaged = isPlayerStaged(player.id);
    const positionLabel = isOnField ? getPositionLabelForPlayer(player.id) : undefined;

    return (
      <button
        key={player.id}
        onClick={() => onSwap(player.id)}
        className={`
          w-16 h-16 rounded-xl font-bold flex flex-col items-center justify-center
          transform transition-all active:scale-95 touch-target hover:scale-105 shadow-md
          ${isStaged
            ? 'bg-orange-500 text-white border-2 border-orange-300'
            : isOnField
              ? getTimeBasedColor(minutes)
              : 'bg-white text-gray-900 border border-gray-300'
          }
        `}
      >
        {minutes > 0 && (
          <div className="text-[8px] font-bold opacity-80">
            {minutes}m
          </div>
        )}
        <div className="text-lg font-bold leading-none">{player.number}</div>
        <div className="text-[10px] leading-tight truncate max-w-full px-1">
          {player.name.split(' ')[0]}
        </div>
        {positionLabel && (
          <div className="text-[8px] font-semibold opacity-80">
            {positionLabel}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-slide-up safe-area-bottom">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Selected Player Header */}
        <div className={`mx-4 mb-4 p-4 rounded-2xl ${
          planningMode ? 'bg-orange-500' : 'bg-raiders-red'
        } text-white`}>
          <div className="text-center">
            <div className="text-sm font-medium opacity-90 mb-1">
              {planningMode ? 'Stage swap for' : 'Swap'}
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold">#{selectedPlayer.number}</span>
              <span className="text-xl font-semibold">{selectedPlayer.name}</span>
            </div>
            <div className="text-sm opacity-80 mt-1">
              Currently: {isSelectedOnBench ? 'Bench' : selectedPlayerPosition}
            </div>
          </div>
        </div>

        {/* Target Players Grid */}
        <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto">
          {/* Field Players Section */}
          {fieldTargets.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-field rounded-full" />
                On Field ({fieldTargets.length})
              </div>
              <div className="grid grid-cols-5 gap-2">
                {fieldTargets.map((p) => renderPlayerButton(p, true))}
              </div>
            </div>
          )}

          {/* Bench Players Section */}
          {benchTargets.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                On Bench ({benchTargets.length})
              </div>
              <div className="grid grid-cols-5 gap-2">
                {benchTargets.map((p) => renderPlayerButton(p, false))}
              </div>
            </div>
          )}

          {/* Planning mode hint */}
          {planningMode && (
            <div className="text-center text-sm text-gray-500 py-2">
              Tap any player to stage a swap
            </div>
          )}
        </div>

        {/* Cancel Button */}
        <div className="px-4 pb-6">
          <button
            onClick={onCancel}
            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl touch-target active:scale-98 transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

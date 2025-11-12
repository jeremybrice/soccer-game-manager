/**
 * Player Card Component
 *
 * Philosophy: Big touch target. Instant visual feedback.
 * Should be tappable even with gloves on.
 */

import type { Player } from '../../types';

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onClick: () => void;
  variant?: 'field' | 'bench';
  minutesAtPosition?: number; // Time in minutes at current position
  positionLabel?: string; // Specific position label (e.g., "LM", "CD", "RF")
  benchTime?: number; // Time in minutes on bench (for bench variant)
  rotationCount?: number; // Number of position changes
  isAlerted?: boolean; // Whether player has triggered 15+ min alert
  isStaged?: boolean; // Whether player is in a staged swap
  stagedDirection?: 'toField' | 'toBench'; // Direction of staged swap
}

export default function PlayerCard({
  player,
  isSelected,
  onClick,
  variant = 'field',
  minutesAtPosition = 0,
  positionLabel,
  benchTime = 0,
  rotationCount = 0,
  isAlerted = false,
  isStaged = false,
  stagedDirection,
}: PlayerCardProps) {
  const baseClasses =
    'touch-target rounded-xl font-bold transform transition-all active:scale-95';

  // Get time-based color (only for field players)
  const getTimeBasedColor = (minutes: number): string => {
    if (minutes < 5) return 'bg-green-500 text-white';
    if (minutes < 10) return 'bg-yellow-400 text-gray-900';
    if (minutes < 15) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const variantClasses =
    isStaged
      ? 'bg-orange-500 text-white border-4 border-orange-300 shadow-2xl' // Staged swap styling
      : variant === 'field'
      ? isSelected
        ? 'bg-raiders-red text-white scale-110 shadow-2xl ring-4 ring-raiders-red-light'
        : `${getTimeBasedColor(minutesAtPosition)} shadow-lg hover:shadow-xl hover:scale-105 ${
            isAlerted ? 'animate-pulse-ring' : ''
          }`
      : isSelected
      ? 'bg-raiders-red text-white scale-110 shadow-2xl ring-4 ring-raiders-red-light'
      : 'bg-white/90 text-gray-900 shadow-md hover:shadow-lg';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} w-20 h-20 flex flex-col items-center justify-center relative ${
        isAlerted && variant === 'field' && !isStaged ? 'ring-4 ring-yellow-300 ring-offset-2 ring-offset-field' : ''
      }`}
    >
      {/* Staged swap indicator - top left corner */}
      {isStaged && stagedDirection && (
        <div className="absolute top-0.5 left-0.5 bg-white text-orange-500 text-base font-bold px-1 rounded-full">
          {stagedDirection === 'toField' ? '→' : '←'}
        </div>
      )}

      {/* Rotation count badge - top right corner */}
      {rotationCount > 0 && !isStaged && (
        <div className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">
          {rotationCount}×
        </div>
      )}

      {/* Field time badge - shown only if on field and has minutes */}
      {variant === 'field' && minutesAtPosition > 0 && (
        <div className="text-[9px] font-bold opacity-90 -mt-1">
          {minutesAtPosition}m
        </div>
      )}

      {/* Bench time badge - shown only if on bench and has minutes */}
      {variant === 'bench' && benchTime > 0 && (
        <div className="text-[9px] font-bold opacity-70 -mt-1">
          {benchTime}m bench
        </div>
      )}

      <div className={`text-2xl font-bold ${(minutesAtPosition > 0 || benchTime > 0) ? '-mt-0.5' : ''}`}>
        {player.number}
      </div>
      <div className="text-xs leading-tight text-center max-w-full px-1 truncate">
        {player.name.split(' ')[0]}
      </div>
      {positionLabel && (
        <div className="text-[10px] font-semibold opacity-80 -mt-0.5">
          {positionLabel}
        </div>
      )}
    </button>
  );
}

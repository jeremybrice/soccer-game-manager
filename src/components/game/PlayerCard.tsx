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
    variant === 'field'
      ? isSelected
        ? 'bg-blue-500 text-white scale-110 shadow-2xl ring-4 ring-blue-300'
        : `${getTimeBasedColor(minutesAtPosition)} shadow-lg hover:shadow-xl hover:scale-105`
      : isSelected
      ? 'bg-blue-500 text-white scale-110 shadow-2xl ring-4 ring-blue-300'
      : 'bg-white/90 text-gray-900 shadow-md hover:shadow-lg';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} w-20 h-20 flex flex-col items-center justify-center relative`}
    >
      {/* Rotation count badge - top right corner */}
      {rotationCount > 0 && (
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

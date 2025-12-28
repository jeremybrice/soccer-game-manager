/**
 * Player Card Component
 *
 * Philosophy: Big touch target. Instant visual feedback.
 * Should be tappable even with gloves on.
 */

import type { Player } from '../../types';

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'field' | 'bench';
  minutesAtPosition?: number;
  positionLabel?: string;
  benchTime?: number;
  isAlerted?: boolean;
  isStaged?: boolean;
  stagedDirection?: 'toField' | 'toBench';
  // New ghost preview props (v3.2.0)
  isGhost?: boolean;
  isFadedOut?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

export default function PlayerCard({
  player,
  isSelected = false,
  onClick,
  variant = 'field',
  minutesAtPosition = 0,
  positionLabel,
  benchTime = 0,
  isAlerted = false,
  isStaged = false,
  stagedDirection,
  isGhost = false,
  isFadedOut = false,
  isDragging = false,
  isDropTarget = false,
}: PlayerCardProps) {
  // Get time-based color (only for field players)
  const getTimeBasedColor = (minutes: number): string => {
    if (minutes < 10) return 'bg-green-500 text-white';
    if (minutes < 15) return 'bg-yellow-400 text-gray-900';
    return 'bg-red-500 text-white';
  };

  // Ghost style - dashed border, semi-transparent
  if (isGhost) {
    return (
      <div
        onClick={onClick}
        className={`
          w-20 h-20 rounded-xl flex flex-col items-center justify-center
          border-2 border-dashed border-white/70 bg-white/20
          backdrop-blur-sm animate-pulse
          ${onClick ? 'cursor-pointer active:scale-95' : ''}
        `}
      >
        <div className="text-white/80 text-2xl font-bold">{player.number}</div>
        <div className="text-white/70 text-xs">{player.name.split(' ')[0]}</div>
        <div className="text-white/60 text-[8px] font-semibold">INCOMING</div>
      </div>
    );
  }

  // Dragging state - the original card left behind
  if (isDragging) {
    return (
      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-white/40 bg-white/10" />
    );
  }

  // Drop target highlight
  const dropTargetClasses = isDropTarget
    ? 'ring-4 ring-orange-400 ring-offset-2 ring-offset-field scale-105'
    : '';

  // Faded out - player is staged to move elsewhere
  const fadedClasses = isFadedOut ? 'opacity-50' : '';

  const baseClasses =
    'touch-target rounded-xl font-bold transform transition-all active:scale-95';

  const variantClasses =
    isStaged
      ? 'bg-orange-500 text-white border-4 border-orange-300 shadow-2xl'
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
      className={`${baseClasses} ${variantClasses} ${dropTargetClasses} ${fadedClasses} w-20 h-20 flex flex-col items-center justify-center relative ${
        isAlerted && variant === 'field' && !isStaged ? 'ring-4 ring-yellow-300 ring-offset-2 ring-offset-field' : ''
      }`}
    >
      {/* Staged swap indicator - top left corner */}
      {isStaged && stagedDirection && (
        <div className="absolute top-0.5 left-0.5 bg-white text-orange-500 text-base font-bold px-1 rounded-full">
          {stagedDirection === 'toField' ? '→' : '←'}
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

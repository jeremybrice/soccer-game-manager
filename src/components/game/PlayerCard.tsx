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
}

export default function PlayerCard({
  player,
  isSelected,
  onClick,
  variant = 'field',
}: PlayerCardProps) {
  const baseClasses =
    'touch-target rounded-xl font-bold transform transition-all active:scale-95';

  const variantClasses =
    variant === 'field'
      ? isSelected
        ? 'bg-yellow-400 text-gray-900 scale-110 shadow-2xl ring-4 ring-yellow-300'
        : 'bg-white text-gray-900 shadow-lg hover:shadow-xl hover:scale-105'
      : isSelected
      ? 'bg-yellow-400 text-gray-900 scale-110 shadow-2xl ring-4 ring-yellow-300'
      : 'bg-white/90 text-gray-900 shadow-md hover:shadow-lg';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} w-20 h-20 flex flex-col items-center justify-center`}
    >
      <div className="text-2xl font-bold">{player.number}</div>
      <div className="text-xs leading-tight text-center max-w-full px-1 truncate">
        {player.name.split(' ')[0]}
      </div>
    </button>
  );
}

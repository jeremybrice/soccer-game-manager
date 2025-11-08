/**
 * Playing Time Summary Component
 *
 * Collapsible section showing each player's total field time with progress bars
 */

import { useState } from 'react';
import type { Player } from '../../types';

interface PlayingTimeSummaryProps {
  players: Player[];
  getPlayerTotalFieldTime: (playerId: string) => number;
  totalGameMinutes: number;
}

export default function PlayingTimeSummary({
  players,
  getPlayerTotalFieldTime,
  totalGameMinutes,
}: PlayingTimeSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate stats for each player
  const playerStats = players.map((player) => {
    const fieldMinutes = getPlayerTotalFieldTime(player.id);
    const percentage =
      totalGameMinutes > 0 ? (fieldMinutes / totalGameMinutes) * 100 : 0;
    return {
      player,
      fieldMinutes,
      percentage,
    };
  });

  // Sort by field time (descending)
  playerStats.sort((a, b) => b.fieldMinutes - a.fieldMinutes);

  // Get color based on percentage of game time
  const getBarColor = (percentage: number): string => {
    if (percentage >= 60) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  return (
    <div className="mb-3 bg-black/20 backdrop-blur-sm rounded-lg overflow-hidden">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <span className="text-white/90 text-sm font-semibold">
          Playing Time Summary
        </span>
        <span className="text-white/70 text-lg">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {playerStats.map(({ player, fieldMinutes, percentage }) => (
            <div key={player.id} className="flex items-center space-x-2">
              {/* Player info */}
              <div className="w-12 text-white/90 text-xs font-semibold">
                #{player.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white/90 text-xs font-medium truncate">
                  {player.name}
                </div>
                {/* Progress bar */}
                <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full ${getBarColor(percentage)} transition-all duration-300`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
              {/* Time display */}
              <div className="w-20 text-right">
                <div className="text-white/90 text-xs font-bold">
                  {fieldMinutes}m
                </div>
                <div className="text-white/60 text-[10px]">
                  {percentage.toFixed(0)}%
                </div>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="pt-2 mt-2 border-t border-white/20 flex justify-center space-x-3 text-[10px] text-white/60">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>&gt;60%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span>40-60%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>&lt;40%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

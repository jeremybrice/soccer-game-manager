/**
 * Stats View - Player Statistics Dashboard
 *
 * Philosophy: Data tells the truth. Fairness is measurable.
 * Show playing time clearly so every parent can see it's fair.
 */

import { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { db } from '../../db';
import type { GameSession, PlayerStats } from '../../types';
import { calculateSeasonStats, calculateFairness, formatMinutes } from '../../utils/stats';

export default function StatsView() {
  const { players, navigateTo, currentGame } = useAppStore();
  const [games, setGames] = useState<GameSession[]>([]);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [players]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const allGames = await db.getAllGames();
      setGames(allGames);

      if (allGames.length > 0) {
        const seasonStats = calculateSeasonStats(allGames, players);
        setStats(seasonStats.sort((a, b) => b.totalMinutes - a.totalMinutes));
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fairness = stats.length > 0 ? calculateFairness(stats) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-field text-white px-6 py-4 sticky top-0 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('home')}
            className="touch-target text-white/90 hover:text-white font-semibold"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Season Stats</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4 space-y-4">
        {/* Games Summary */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-field mb-2">
              {games.length}
            </div>
            <div className="text-gray-600">
              {games.length === 1 ? 'Game Played' : 'Games Played'}
            </div>
            {currentGame && (
              <div className="text-sm text-yellow-600 font-semibold mt-2">
                + 1 game in progress
              </div>
            )}
          </div>
        </div>

        {/* Fairness Metrics */}
        {fairness && stats.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">
              Fairness Report
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Average Time</div>
                <div className="text-xl font-bold text-field">
                  {formatMinutes(fairness.averageMinutesPerPlayer)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Balance</div>
                <div className="text-xl font-bold text-field">
                  {fairness.standardDeviation < 5 ? '✓ Fair' : '⚠ Check'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Least Time</div>
                <div className="text-xl font-bold text-orange-600">
                  {formatMinutes(fairness.minMinutes)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Most Time</div>
                <div className="text-xl font-bold text-green-600">
                  {formatMinutes(fairness.maxMinutes)}
                </div>
              </div>
            </div>

            {fairness.standardDeviation >= 5 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> Playing time is uneven. Consider
                  rotating players with less time into key positions.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player Stats */}
      <div className="px-4 pb-4">
        <h3 className="font-bold text-gray-900 mb-3 text-lg">
          Player Statistics
        </h3>

        {stats.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-gray-600 mb-2">No stats yet</div>
            <div className="text-sm text-gray-500">
              Play a game to see statistics
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map((playerStats, index) => (
              <div
                key={playerStats.playerId}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                {/* Player Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-field text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {playerStats.playerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {playerStats.gamesPlayed}{' '}
                        {playerStats.gamesPlayed === 1 ? 'game' : 'games'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-field">
                      {formatMinutes(playerStats.totalMinutes)}
                    </div>
                    <div className="text-xs text-gray-500">Total Time</div>
                  </div>
                </div>

                {/* Position Breakdown */}
                <div className="grid grid-cols-4 gap-2">
                  {(['GK', 'DEF', 'MID', 'FWD'] as const).map((position) => {
                    const minutes = playerStats.minutesByPosition[position];
                    return (
                      <div
                        key={position}
                        className="bg-gray-50 rounded-lg p-2 text-center"
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          {position}
                        </div>
                        <div className="font-bold text-sm text-gray-900">
                          {formatMinutes(minutes)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

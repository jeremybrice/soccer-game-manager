/**
 * Pre-Game Setup Component
 *
 * Philosophy: Quick start. Smart defaults. Respect preferences.
 * Get from "Start Game" to playing in under 30 seconds.
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import type { Position, PositionAssignments } from '../../types';
import { FORMATION } from '../../types';

export default function PreGameSetup() {
  const { players, startGame, navigateTo } = useAppStore();
  const [assignments, setAssignments] = useState<PositionAssignments>({});

  // Auto-select all players on mount
  useEffect(() => {
    // Auto-assign positions based on preferences
    const initialAssignments = autoAssignPositions(players);
    setAssignments(initialAssignments);
  }, [players]);

  // Smart auto-assignment based on player preferences
  const autoAssignPositions = (playerList: typeof players): PositionAssignments => {
    const result: PositionAssignments = {};
    const unassigned = [...playerList];
    const positions: Position[] = ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD'];

    // First pass: Assign players to their preferred positions
    positions.forEach((position) => {
      const preferredPlayer = unassigned.find(
        (p) => p.preferredPositions[0] === position
      );
      if (preferredPlayer) {
        result[preferredPlayer.id] = position;
        unassigned.splice(unassigned.indexOf(preferredPlayer), 1);
      }
    });

    // Second pass: Fill remaining positions with unassigned players
    positions.forEach((position) => {
      if (!Object.values(result).includes(position)) {
        const nextPlayer = unassigned.shift();
        if (nextPlayer) {
          result[nextPlayer.id] = position;
        }
      }
    });

    // Put everyone else on bench
    unassigned.forEach((player) => {
      result[player.id] = 'BENCH';
    });

    return result;
  };

  const handleStart = async () => {
    if (Object.keys(assignments).length < 9) {
      alert('Please assign at least 9 players to start the game');
      return;
    }

    await startGame(assignments);
  };

  const canStart = Object.keys(assignments).filter((id) =>
    assignments[id] !== 'BENCH'
  ).length >= 9;

  return (
    <div className="min-h-screen bg-gradient-to-b from-field-light to-field flex flex-col">
      {/* Header */}
      <div className="bg-field-dark text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('home')}
            className="touch-target text-white/90 hover:text-white font-semibold"
          >
            ← Cancel
          </button>
          <h1 className="text-xl font-bold">New Game</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Title */}
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">⚽</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to Start
            </h2>
            <p className="text-gray-600">
              Positions have been auto-assigned based on player preferences
            </p>
          </div>

          {/* Player Count Summary */}
          <div className="bg-field-light/20 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-field-dark">
                  {Object.values(assignments).filter((p) => p !== 'BENCH').length}
                </div>
                <div className="text-sm text-gray-600">On Field</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-bench">
                  {Object.values(assignments).filter((p) => p === 'BENCH').length}
                </div>
                <div className="text-sm text-gray-600">On Bench</div>
              </div>
            </div>
          </div>

          {/* Position Breakdown */}
          <div className="space-y-2 mb-6">
            {(['GK', 'DEF', 'MID', 'FWD'] as Position[]).map((position) => {
              const count = Object.values(assignments).filter(
                (p) => p === position
              ).length;
              const expected = FORMATION[position];
              return (
                <div
                  key={position}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-semibold text-gray-700">
                    {position}
                  </span>
                  <span
                    className={`font-bold ${
                      count === expected ? 'text-green-600' : 'text-orange-600'
                    }`}
                  >
                    {count} / {expected}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> You can adjust positions during the game by
              tapping players to swap them.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={`w-full touch-target font-bold py-4 rounded-xl transform transition ${
                canStart
                  ? 'bg-field hover:bg-field-dark text-white hover:scale-105 active:scale-95 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canStart ? 'Start Game' : 'Need at least 9 players'}
            </button>

            <button
              onClick={() => navigateTo('roster')}
              className="w-full touch-target bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl"
            >
              Adjust Roster First
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

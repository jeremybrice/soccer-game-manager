/**
 * Player Add/Edit Form
 *
 * Philosophy: Fast data entry. Touch-optimized. Clear validation.
 * Every field should feel natural to fill out on iPad.
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import type { Player, Position } from '../../types';
import { getPositionName } from '../../types';

interface PlayerFormProps {
  player: Player | null; // null = new player, otherwise editing
  onClose: () => void;
}

const FIELD_POSITIONS: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

export default function PlayerForm({ player, onClose }: PlayerFormProps) {
  const { addPlayer, updatePlayer, players } = useAppStore();

  const [name, setName] = useState(player?.name || '');
  const [number, setNumber] = useState(player?.number.toString() || '');
  const [preferences, setPreferences] = useState<Position[]>(
    player?.preferredPositions || []
  );
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-suggest next available number
    if (!player && number === '') {
      const usedNumbers = players.map((p) => p.number);
      for (let i = 1; i <= 99; i++) {
        if (!usedNumbers.includes(i)) {
          setNumber(i.toString());
          break;
        }
      }
    }
  }, [player, players, number]);

  const togglePreference = (position: Position) => {
    if (preferences.includes(position)) {
      setPreferences(preferences.filter((p) => p !== position));
    } else {
      setPreferences([...preferences, position]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    const numValue = parseInt(number);
    if (isNaN(numValue) || numValue < 1 || numValue > 99) {
      setError('Number must be between 1 and 99');
      return;
    }

    // Check for duplicate number
    const duplicateNumber = players.find(
      (p) => p.number === numValue && p.id !== player?.id
    );
    if (duplicateNumber) {
      setError(`Number ${numValue} is already taken by ${duplicateNumber.name}`);
      return;
    }

    // Save
    try {
      if (player) {
        // Update existing
        await updatePlayer({
          ...player,
          name: name.trim(),
          number: numValue,
          preferredPositions: preferences,
        });
      } else {
        // Add new
        await addPlayer({
          name: name.trim(),
          number: numValue,
          preferredPositions: preferences,
          isActive: true,
        });
      }
      onClose();
    } catch (err) {
      setError('Failed to save player');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-field text-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {player ? 'Edit Player' : 'Add Player'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Player Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-field focus:outline-none"
              autoFocus
            />
          </div>

          {/* Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jersey Number *
            </label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="1-99"
              min="1"
              max="99"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-field focus:outline-none"
            />
          </div>

          {/* Position Preferences */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Preferred Positions (optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Tap to select positions this player prefers
            </p>
            <div className="grid grid-cols-2 gap-3">
              {FIELD_POSITIONS.map((position) => {
                const isSelected = preferences.includes(position);
                return (
                  <button
                    key={position}
                    type="button"
                    onClick={() => togglePreference(position)}
                    className={`touch-target py-4 px-4 rounded-xl font-semibold transition ${
                      isSelected
                        ? 'bg-field text-white scale-105 shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getPositionName(position)}
                  </button>
                );
              })}
            </div>
            {preferences.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Priority: {preferences.map((p) => getPositionName(p)).join(' → ')}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 touch-target bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 touch-target bg-field hover:bg-field-dark text-white font-bold py-3 rounded-xl"
            >
              {player ? 'Save Changes' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

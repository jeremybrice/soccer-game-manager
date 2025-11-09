/**
 * Import Confirmation Modal
 *
 * Philosophy: Show, don't hide. Users need to see what they're importing.
 * Preview before commit. No surprises.
 */

import { useState } from 'react';
import type { Player } from '../../types';
import type { PlayerCSVRow } from '../../utils/csvUtils';
import { getPositionName } from '../../types';

interface ImportConfirmationModalProps {
  players: PlayerCSVRow[];
  existingPlayers: Player[];
  onConfirm: (replaceExisting: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function ImportConfirmationModal({
  players,
  existingPlayers,
  onConfirm,
  onCancel,
}: ImportConfirmationModalProps) {
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState(false);

  // Detect conflicts
  const conflicts = players.filter((csvPlayer) =>
    existingPlayers.some((existing) => existing.number === csvPlayer.number)
  );

  const newPlayers = players.filter(
    (csvPlayer) =>
      !existingPlayers.some((existing) => existing.number === csvPlayer.number)
  );

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onConfirm(mode === 'replace');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-field text-white px-6 py-4">
          <h2 className="text-xl font-bold">
            Import Roster - {players.length} Player{players.length !== 1 ? 's' : ''} Found
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Summary */}
          {existingPlayers.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-semibold text-blue-900 mb-1">
                Import Summary
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• {newPlayers.length} new player{newPlayers.length !== 1 ? 's' : ''} will be added</div>
                {conflicts.length > 0 && (
                  <div>
                    • {conflicts.length} player{conflicts.length !== 1 ? 's' : ''} with matching numbers (#{conflicts.map((c) => c.number).join(', #')})
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Preview:</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Number</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Preferred Positions</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.slice(0, 10).map((player, idx) => {
                      const isConflict = conflicts.some(
                        (c) => c.number === player.number
                      );
                      return (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="px-3 py-2 font-semibold">
                            {player.number}
                          </td>
                          <td className="px-3 py-2">{player.name}</td>
                          <td className="px-3 py-2">
                            {player.preferredPositions.length > 0
                              ? player.preferredPositions
                                  .map((pos) => getPositionName(pos))
                                  .join(', ')
                              : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {isConflict ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                ⚠️ Exists
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                ✓ New
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {players.length > 10 && (
                <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 border-t">
                  ... and {players.length - 10} more player{players.length - 10 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Import Mode Selection */}
          {existingPlayers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Import Mode:</h3>

              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="mode"
                  value="merge"
                  checked={mode === 'merge'}
                  onChange={() => setMode('merge')}
                  className="mt-1 touch-target"
                />
                <div>
                  <div className="font-semibold">Merge with Existing</div>
                  <div className="text-sm text-gray-600">
                    Update players with matching numbers, add new ones. Your
                    current roster will be preserved.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="mode"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                  className="mt-1 touch-target"
                />
                <div>
                  <div className="font-semibold text-red-600">
                    Replace All
                  </div>
                  <div className="text-sm text-gray-600">
                    Remove current roster and import fresh. All existing
                    players will be removed.
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t">
          <button
            onClick={onCancel}
            disabled={isImporting}
            className="touch-target px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="touch-target px-6 py-3 rounded-xl font-bold bg-field hover:bg-field-dark text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isImporting ? 'Importing...' : 'Import Roster'}
          </button>
        </div>
      </div>
    </div>
  );
}

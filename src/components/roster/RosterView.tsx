/**
 * Roster Management View
 *
 * Philosophy: Quick entry. Clear feedback. Easy corrections.
 * Adding 14 kids' names should take 2 minutes, not 20.
 */

import { useState, useRef } from 'react';
import { useAppStore } from '../../store';
import type { Player } from '../../types';
import { getPositionName } from '../../types';
import PlayerForm from './PlayerForm';
import ImportConfirmationModal from './ImportConfirmationModal';
import ImportErrorModal from './ImportErrorModal';
import {
  parseCSVFile,
  downloadCSV,
  generateCSVFilename,
  type PlayerCSVRow,
  type ImportError,
} from '../../utils/csvUtils';

export default function RosterView() {
  const { players, navigateTo, removePlayer, importPlayersFromCSV, exportPlayersToCSV, currentGame } = useAppStore();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [csvData, setCsvData] = useState<PlayerCSVRow[] | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setShowForm(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('Remove this player from the roster?')) {
      await removePlayer(playerId);
    }
  };

  // CSV Export
  const handleExport = () => {
    const csvContent = exportPlayersToCSV();
    const filename = generateCSVFilename();
    downloadCSV(csvContent, filename);
    setSuccessMessage(`✓ Roster exported (${players.length} players)`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // CSV Import - Open file picker
  const handleImportClick = () => {
    // Prevent import during active game
    if (currentGame?.isActive) {
      alert('Cannot import roster during an active game. Please end the game first.');
      return;
    }
    fileInputRef.current?.click();
  };

  // CSV Import - File selected
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Parse CSV file
    const result = await parseCSVFile(file);

    if (result.success && result.players.length > 0) {
      // Show confirmation modal
      setCsvData(result.players);
    } else {
      // Show errors
      setImportErrors(result.errors);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // CSV Import - Confirmed
  const handleImportConfirm = async (replaceExisting: boolean) => {
    if (!csvData) return;

    const result = await importPlayersFromCSV(csvData, replaceExisting);

    // Close modal
    setCsvData(null);

    if (result.success) {
      // Show success message
      const message = replaceExisting
        ? `✓ Roster replaced with ${result.imported} players`
        : `✓ Imported ${result.imported} new, updated ${result.updated} existing`;
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      // Show errors
      setImportErrors(result.errors);
    }
  };

  // CSV Import - Cancelled
  const handleImportCancel = () => {
    setCsvData(null);
  };

  // Error modal close
  const handleErrorClose = () => {
    setImportErrors(null);
  };

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
          <h1 className="text-xl font-bold">Team Roster</h1>
          <div className="w-16"></div> {/* Spacer for center alignment */}
        </div>
      </div>

      {/* Player Count and Actions */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {players.length} / 14 Players
            </div>
            <div className="text-sm text-gray-600">
              {players.length >= 9
                ? 'Ready to play'
                : `Need ${9 - players.length} more to start`}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm font-semibold">
            {successMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleImportClick}
            disabled={currentGame?.isActive}
            className="touch-target bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title={currentGame?.isActive ? 'Cannot import during active game' : 'Import roster from CSV'}
          >
            <span>📥</span> Import CSV
          </button>

          <button
            onClick={handleExport}
            disabled={players.length === 0}
            className="touch-target bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <span>📤</span> Export CSV
          </button>

          <button
            onClick={handleAddPlayer}
            className="touch-target bg-field hover:bg-field-dark text-white font-bold px-6 py-3 rounded-xl transition"
          >
            + Add Player
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,application/csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Player List */}
      <div className="px-4 py-4">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚽</div>
            <div className="text-xl font-semibold text-gray-700 mb-2">
              No players yet
            </div>
            <div className="text-gray-500 mb-6">
              Add your team to get started
            </div>
            <button
              onClick={handleAddPlayer}
              className="touch-target bg-field hover:bg-field-dark text-white font-bold px-8 py-4 rounded-xl"
            >
              Add First Player
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Jersey Number */}
                    <div className="w-12 h-12 rounded-full bg-field flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {player.number}
                      </span>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">
                        {player.name}
                      </div>
                      {player.preferredPositions.length > 0 ? (
                        <div className="text-sm text-gray-600">
                          Prefers:{' '}
                          {player.preferredPositions
                            .slice(0, 3)
                            .map((pos) => getPositionName(pos))
                            .join(', ')}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          No preferences set
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPlayer(player)}
                      className="touch-target bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold px-4 py-2 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="touch-target bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Form Modal */}
      {showForm && (
        <PlayerForm player={editingPlayer} onClose={handleFormClose} />
      )}

      {/* CSV Import Confirmation Modal */}
      {csvData && (
        <ImportConfirmationModal
          players={csvData}
          existingPlayers={players}
          onConfirm={handleImportConfirm}
          onCancel={handleImportCancel}
        />
      )}

      {/* CSV Import Error Modal */}
      {importErrors && (
        <ImportErrorModal errors={importErrors} onClose={handleErrorClose} />
      )}
    </div>
  );
}

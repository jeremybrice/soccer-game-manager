/**
 * Formation Setup View - Pre-Game Formation Selection and Player Assignment
 *
 * Philosophy: Clear choices. Visual feedback. Quick setup.
 * Allow coaches to configure formation and starting lineup before game starts.
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import type { Position, PlayerPosition, PositionAssignments, FormationTemplate } from '../../types';
import { MIN_PLAYERS_TO_START, RECOMMENDED_MIN_PLAYERS, createPlayerPosition, getFormationConfig } from '../../types';
import FormationSelector from './FormationSelector';
import FormationPreview from './FormationPreview';

export default function FormationSetupView() {
  const {
    players,
    startGame,
    navigateTo,
    formationTemplates,
    selectedFormationId,
    activeFormation,
    setActiveFormation,
    saveFormationTemplate,
    deleteFormationTemplate,
  } = useAppStore();
  const [assignments, setAssignments] = useState<PositionAssignments>({});

  // Auto-assign positions when component mounts or formation changes
  useEffect(() => {
    const initialAssignments = autoAssignPositions(players, activeFormation);
    setAssignments(initialAssignments);
  }, [players, activeFormation]);

  // Smart auto-assignment based on player preferences and selected formation template
  const autoAssignPositions = (playerList: typeof players, template: FormationTemplate): PositionAssignments => {
    const result: PositionAssignments = {};
    const unassigned = [...playerList];

    // Track slot usage for each position
    const formationConfig = getFormationConfig(template);
    const slotCounters: Record<Position, number> = {
      GK: 0,
      DEF: 0,
      MID: 0,
      FWD: 0,
      BENCH: 0,
    };

    const assignPlayerToPosition = (playerId: string, position: Position) => {
      const slot = slotCounters[position];
      if (position !== 'BENCH' && slot >= formationConfig[position]) return false;
      result[playerId] = createPlayerPosition(position, slot);
      slotCounters[position]++;
      return true;
    };

    // First pass: Assign GK (most critical)
    const gkPlayer = unassigned.find(p => p.preferredPositions[0] === 'GK');
    if (gkPlayer) {
      assignPlayerToPosition(gkPlayer.id, 'GK');
      unassigned.splice(unassigned.indexOf(gkPlayer), 1);
    }

    // Second pass: Assign players to their preferred positions
    // Use the formation rows to determine which positions exist
    const positionsInFormation = template.rows.map(r => r.position);
    const positionOrder: Position[] = ['DEF', 'MID', 'FWD'].filter(
      p => positionsInFormation.includes(p as Position)
    ) as Position[];

    positionOrder.forEach((position) => {
      const needed = formationConfig[position];
      for (let i = 0; i < needed; i++) {
        const preferredPlayer = unassigned.find(
          (p) => p.preferredPositions[0] === position
        );
        if (preferredPlayer) {
          assignPlayerToPosition(preferredPlayer.id, position);
          unassigned.splice(unassigned.indexOf(preferredPlayer), 1);
        }
      }
    });

    // Third pass: Fill remaining positions with unassigned players
    positionOrder.forEach((position) => {
      const needed = formationConfig[position] - slotCounters[position];
      for (let i = 0; i < needed; i++) {
        const nextPlayer = unassigned.shift();
        if (nextPlayer) {
          assignPlayerToPosition(nextPlayer.id, position);
        }
      }
    });

    // Put everyone else on bench
    unassigned.forEach((player) => {
      assignPlayerToPosition(player.id, 'BENCH');
    });

    return result;
  };

  const handleFormationSelect = async (templateId: string) => {
    await setActiveFormation(templateId);
  };

  const handleSaveTemplate = async (template: FormationTemplate) => {
    await saveFormationTemplate(template);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await deleteFormationTemplate(templateId);
  };

  const handleStart = async () => {
    const fieldPlayerCount = Object.values(assignments).filter(p => p.position !== 'BENCH').length;

    if (fieldPlayerCount < MIN_PLAYERS_TO_START) {
      alert(`Please assign at least ${MIN_PLAYERS_TO_START} players (1 GK + field players) to start`);
      return;
    }

    // Check if GK is assigned
    const hasGK = Object.values(assignments).some(p => p.position === 'GK');
    if (!hasGK) {
      alert('A goalkeeper must be assigned before starting the game');
      return;
    }

    await startGame(assignments);
  };

  const handlePlayerAssignment = (playerId: string, playerPosition: PlayerPosition) => {
    setAssignments(prev => ({
      ...prev,
      [playerId]: playerPosition,
    }));
  };

  const fieldPlayerCount = Object.values(assignments).filter(p => p.position !== 'BENCH').length;
  const hasGK = Object.values(assignments).some(p => p.position === 'GK');
  const canStart = fieldPlayerCount >= MIN_PLAYERS_TO_START && hasGK;
  const showWarning = fieldPlayerCount < RECOMMENDED_MIN_PLAYERS && fieldPlayerCount >= MIN_PLAYERS_TO_START;

  return (
    <div className="min-h-screen bg-gradient-to-b from-field-light to-field flex flex-col">
      {/* Header */}
      <div className="bg-raiders-navy text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('home')}
            className="touch-target text-white/90 hover:text-white font-semibold"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Formation Setup</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Formation Selector */}
          <FormationSelector
            templates={formationTemplates}
            selectedTemplateId={selectedFormationId}
            onSelect={handleFormationSelect}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />

          {/* Formation Preview with Player Assignment */}
          <FormationPreview
            template={activeFormation}
            assignments={assignments}
            players={players}
            onPlayerAssignment={handlePlayerAssignment}
          />

          {/* Player Count Summary */}
          <div className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-3xl font-bold text-field-dark">
                  {fieldPlayerCount}
                </div>
                <div className="text-sm text-gray-600 font-medium">On Field</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-500">
                  {Object.values(assignments).filter(p => p.position === 'BENCH').length}
                </div>
                <div className="text-sm text-gray-600 font-medium">On Bench</div>
              </div>
            </div>
          </div>

          {/* Warning if low player count */}
          {showWarning && (
            <div className="bg-yellow-500/20 backdrop-blur border-2 border-yellow-500/50 text-yellow-900 px-6 py-4 rounded-xl">
              <div className="font-semibold mb-1">Low Player Count</div>
              <div className="text-sm">
                You have {fieldPlayerCount} field players (recommended: {RECOMMENDED_MIN_PLAYERS}).
                You can still start, but rotations may be limited.
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pb-6">
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={`w-full touch-target font-bold py-5 rounded-xl transform transition shadow-lg ${
                canStart
                  ? 'bg-raiders-red hover:bg-raiders-red-dark text-white hover:scale-105 active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canStart
                ? `Start Game with ${activeFormation.name} Formation`
                : !hasGK
                  ? 'Assign a Goalkeeper First'
                  : `Need at least ${MIN_PLAYERS_TO_START} players`
              }
            </button>

            <button
              onClick={() => navigateTo('roster')}
              className="w-full touch-target bg-white/90 hover:bg-white text-gray-700 font-semibold py-4 rounded-xl border-2 border-gray-300"
            >
              Adjust Roster First
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

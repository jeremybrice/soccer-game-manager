/**
 * Formation Selector Component
 *
 * Philosophy: Clear visual choice. Immediate feedback.
 * Show formation structure at a glance.
 */

import type { FormationType } from '../../types';

interface FormationSelectorProps {
  selectedFormation: FormationType;
  onFormationChange: (formation: FormationType) => void;
}

export default function FormationSelector({
  selectedFormation,
  onFormationChange,
}: FormationSelectorProps) {
  const formations = [
    {
      id: 'A' as FormationType,
      name: 'Formation A',
      structure: '3-3-2',
      description: '3 Defenders, 3 Midfielders, 2 Forwards',
      positions: { DEF: 3, MID: 3, FWD: 2 },
    },
    {
      id: 'B' as FormationType,
      name: 'Formation B',
      structure: '3-4-1',
      description: '3 Defenders, 4 Midfielders, 1 Forward',
      positions: { DEF: 3, MID: 4, FWD: 1 },
    },
  ];

  return (
    <div className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg">
      <h3 className="font-bold text-gray-900 mb-3">Select Formation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {formations.map((formation) => {
          const isSelected = selectedFormation === formation.id;

          return (
            <button
              key={formation.id}
              onClick={() => onFormationChange(formation.id)}
              className={`touch-target p-4 rounded-xl border-2 transition-all transform ${
                isSelected
                  ? 'bg-raiders-red text-white border-raiders-red scale-105 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-raiders-red hover:shadow-md'
              }`}
            >
              <div className="text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{formation.name}</span>
                  {isSelected && <span className="text-2xl">✓</span>}
                </div>
                <div className={`text-3xl font-bold mb-2 ${isSelected ? 'text-white' : 'text-raiders-navy'}`}>
                  {formation.structure}
                </div>
                <div className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                  {formation.description}
                </div>
              </div>

              {/* Visual Formation Preview */}
              <div className="mt-4 flex justify-around items-end h-16 border-t pt-3 border-current opacity-60">
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-1">FWD</div>
                  <div className="flex gap-1">
                    {Array(formation.positions.FWD).fill(0).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-current" />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-1">MID</div>
                  <div className="flex gap-1">
                    {Array(formation.positions.MID).fill(0).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-current" />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs mb-1">DEF</div>
                  <div className="flex gap-1">
                    {Array(formation.positions.DEF).fill(0).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-current" />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

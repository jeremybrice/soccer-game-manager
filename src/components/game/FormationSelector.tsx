/**
 * Formation Selector Component (v4.0.0 - Flexible Formations)
 *
 * Philosophy: Select only. No editing here.
 * Editing/deleting/creating formations lives on the dedicated Formations page.
 */

import type { FormationTemplate } from '../../types';
import { getFormationStructure, getFormationFieldCount } from '../../types';

interface FormationSelectorProps {
  templates: FormationTemplate[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
}

export default function FormationSelector({
  templates,
  selectedTemplateId,
  onSelect,
}: FormationSelectorProps) {
  return (
    <div className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg">
      <h3 className="font-bold text-gray-900 mb-3">Select Formation</h3>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          const structure = getFormationStructure(template);
          const fieldCount = getFormationFieldCount(template);

          return (
            <div key={template.id} className="snap-start shrink-0 w-36">
              <button
                onClick={() => onSelect(template.id)}
                className={`w-full touch-target p-3 rounded-xl border-2 transition-all transform ${
                  isSelected
                    ? 'bg-raiders-red text-white border-raiders-red scale-105 shadow-lg'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-raiders-red hover:shadow-md'
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm truncate">{template.name}</span>
                    {isSelected && <span className="text-lg ml-1">✓</span>}
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-raiders-navy'}`}>
                    {structure}
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                    {fieldCount} + GK on field
                  </div>
                </div>

                {/* Visual Formation Preview */}
                <div className="mt-2 flex flex-col gap-1 border-t pt-2 border-current opacity-60">
                  {template.rows.map((row, ri) => (
                    <div key={ri} className="flex justify-center gap-0.5">
                      {Array(row.count).fill(0).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-current" />
                      ))}
                    </div>
                  ))}
                  {/* GK dot */}
                  <div className="flex justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Formation Builder Component
 *
 * Philosophy: Touch-first, simple. Build any formation with +/- buttons.
 * Live preview updates as you adjust. Save as a reusable template.
 */

import { useState } from 'react';
import type { FormationTemplate, FormationRow, Position } from '../../types';
import { generateRowLabels, getFormationStructure } from '../../types';

interface FormationBuilderProps {
  /** Existing template to edit, or undefined for new */
  initialTemplate?: FormationTemplate;
  onSave: (template: FormationTemplate) => void;
  onCancel: () => void;
}

const POSITION_OPTIONS: { value: Position; label: string }[] = [
  { value: 'FWD', label: 'Forward' },
  { value: 'MID', label: 'Midfield' },
  { value: 'DEF', label: 'Defense' },
];

export default function FormationBuilder({
  initialTemplate,
  onSave,
  onCancel,
}: FormationBuilderProps) {
  const [name, setName] = useState(initialTemplate?.name || '');
  const [rows, setRows] = useState<FormationRow[]>(
    initialTemplate?.rows || [
      { position: 'FWD', count: 2 },
      { position: 'MID', count: 3 },
      { position: 'DEF', count: 3 },
    ]
  );

  const totalFieldPlayers = rows.reduce((sum, row) => sum + row.count, 0);

  const updateRow = (index: number, updates: Partial<FormationRow>) => {
    setRows(prev => prev.map((row, i) => i === index ? { ...row, ...updates } : row));
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    // Default to a position not yet used, or MID
    const usedPositions = new Set(rows.map(r => r.position));
    const defaultPos = POSITION_OPTIONS.find(p => !usedPositions.has(p.value))?.value || 'MID';
    setRows(prev => [...prev, { position: defaultPos, count: 1 }]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (totalFieldPlayers < 1) return;

    const template: FormationTemplate = {
      id: initialTemplate?.id || crypto.randomUUID(),
      name: name.trim(),
      rows,
      createdAt: initialTemplate?.createdAt || Date.now(),
      isBuiltIn: initialTemplate?.isBuiltIn || false,
    };

    onSave(template);
  };

  const autoName = getFormationStructure({ id: '', name: '', rows, createdAt: 0, isBuiltIn: false });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-raiders-navy text-white px-5 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold">
            {initialTemplate ? 'Edit Formation' : 'New Formation'}
          </h2>
        </div>

        <div className="p-5 space-y-5">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Formation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={autoName || 'e.g., 3-3-2 Standard'}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg font-semibold focus:border-raiders-red focus:outline-none"
            />
          </div>

          {/* Position Rows Editor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Position Rows
            </label>
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    {/* Position selector */}
                    <select
                      value={row.position}
                      onChange={(e) => updateRow(index, { position: e.target.value as Position, labels: undefined })}
                      className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold text-sm focus:border-raiders-red focus:outline-none"
                    >
                      {POSITION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    {/* Count with +/- buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateRow(index, { count: Math.max(1, row.count - 1), labels: undefined })}
                        className="touch-target w-10 h-10 bg-gray-200 rounded-lg font-bold text-xl flex items-center justify-center active:bg-gray-300"
                      >
                        -
                      </button>
                      <div className="w-10 h-10 flex items-center justify-center font-bold text-xl">
                        {row.count}
                      </div>
                      <button
                        onClick={() => updateRow(index, { count: Math.min(7, row.count + 1), labels: undefined })}
                        className="touch-target w-10 h-10 bg-gray-200 rounded-lg font-bold text-xl flex items-center justify-center active:bg-gray-300"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove row */}
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(index)}
                        className="touch-target w-10 h-10 text-red-500 rounded-lg font-bold text-lg flex items-center justify-center hover:bg-red-50"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Auto-generated labels preview */}
                  <div className="flex gap-1 mt-2">
                    {generateRowLabels(row).map((label, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-raiders-navy/10 text-raiders-navy text-xs font-semibold rounded"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <button
              onClick={addRow}
              className="w-full mt-3 touch-target py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold hover:border-raiders-red hover:text-raiders-red transition"
            >
              + Add Row
            </button>
          </div>

          {/* Live Preview */}
          <div className="bg-gradient-to-b from-field-light to-field rounded-xl p-4 min-h-[160px]">
            <div className="flex flex-col justify-between h-full space-y-3">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex}>
                  <div className="text-white/60 text-[10px] font-semibold text-center uppercase tracking-wide mb-1">
                    {POSITION_OPTIONS.find(p => p.value === row.position)?.label}
                  </div>
                  <div className="flex justify-center gap-2">
                    {generateRowLabels(row).map((label, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-white/30 rounded-lg border border-white/40 flex items-center justify-center"
                      >
                        <span className="text-white text-[8px] font-bold">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {/* GK always shown */}
              <div>
                <div className="text-white/60 text-[10px] font-semibold text-center uppercase tracking-wide mb-1">
                  Goalkeeper
                </div>
                <div className="flex justify-center">
                  <div className="w-8 h-8 bg-white/30 rounded-lg border border-white/40 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">GK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-between items-center px-2">
            <span className="text-gray-600 font-medium">
              Field Players: <span className="font-bold text-field-dark">{totalFieldPlayers}</span> + GK
            </span>
            <span className="text-gray-500 text-sm">
              Structure: <span className="font-bold">{autoName}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 touch-target py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl active:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || totalFieldPlayers < 1}
              className={`flex-1 touch-target py-4 font-bold rounded-xl ${
                name.trim() && totalFieldPlayers >= 1
                  ? 'bg-raiders-red text-white active:bg-raiders-red-dark'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {initialTemplate ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

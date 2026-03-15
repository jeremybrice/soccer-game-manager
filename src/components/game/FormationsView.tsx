/**
 * Formations Management View
 *
 * Philosophy: Dedicated space for creating and managing formations.
 * Keep the pre-game setup screen clean by handling template CRUD here.
 * Full-screen cards with clear edit/delete/create actions.
 */

import { useState } from 'react';
import { useAppStore } from '../../store';
import type { FormationTemplate } from '../../types';
import { getFormationStructure, getFormationFieldCount, generateRowLabels } from '../../types';
import FormationBuilder from './FormationBuilder';

export default function FormationsView() {
  const {
    navigateTo,
    formationTemplates,
    selectedFormationId,
    setActiveFormation,
    saveFormationTemplate,
    deleteFormationTemplate,
  } = useAppStore();

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormationTemplate | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingTemplate(undefined);
    setShowBuilder(true);
  };

  const handleEdit = (template: FormationTemplate) => {
    setEditingTemplate(template);
    setShowBuilder(true);
  };

  const handleSave = async (template: FormationTemplate) => {
    await saveFormationTemplate(template);
    await setActiveFormation(template.id);
    setShowBuilder(false);
    setEditingTemplate(undefined);
  };

  const handleDelete = async (templateId: string) => {
    await deleteFormationTemplate(templateId);
    setConfirmDeleteId(null);
  };

  const handleCancel = () => {
    setShowBuilder(false);
    setEditingTemplate(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-field-light to-field flex flex-col">
      {/* Header */}
      <div className="bg-raiders-navy text-white px-6 py-4 shadow-lg shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('home')}
            className="touch-target text-white/90 active:text-white font-semibold"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Formations</h1>
          <button
            onClick={handleCreate}
            className="touch-target text-white/90 active:text-white font-semibold"
          >
            + New
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-3">
          {formationTemplates.map((template) => {
            const isSelected = selectedFormationId === template.id;
            const structure = getFormationStructure(template);
            const fieldCount = getFormationFieldCount(template);
            const isConfirmingDelete = confirmDeleteId === template.id;

            return (
              <div
                key={template.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 transition-all ${
                  isSelected ? 'border-raiders-red' : 'border-transparent'
                }`}
              >
                <button
                  onClick={() => setActiveFormation(template.id)}
                  className="w-full text-left p-4 active:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {/* Formation dot preview */}
                    <div className="w-14 h-14 bg-gradient-to-b from-field-light to-field rounded-lg flex flex-col items-center justify-center gap-0.5 shrink-0 p-1">
                      {template.rows.map((row, ri) => (
                        <div key={ri} className="flex justify-center gap-0.5">
                          {Array(row.count).fill(0).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/80" />
                          ))}
                        </div>
                      ))}
                      <div className="flex justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 truncate">{template.name}</span>
                        {template.isBuiltIn && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium shrink-0">
                            Built-in
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-bold text-raiders-navy">{structure}</div>
                      <div className="text-xs text-gray-500">{fieldCount} + GK on field</div>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="w-8 h-8 bg-raiders-red rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Position labels */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.rows.map((row, ri) => (
                      generateRowLabels(row).map((label, li) => (
                        <span
                          key={`${ri}-${li}`}
                          className="px-2 py-0.5 bg-raiders-navy/10 text-raiders-navy text-xs font-semibold rounded"
                        >
                          {label}
                        </span>
                      ))
                    ))}
                    <span className="px-2 py-0.5 bg-raiders-navy/10 text-raiders-navy text-xs font-semibold rounded">
                      GK
                    </span>
                  </div>
                </button>

                {/* Action buttons for custom templates */}
                {!template.isBuiltIn && (
                  <div className="border-t border-gray-100 flex">
                    <button
                      onClick={() => handleEdit(template)}
                      className="flex-1 touch-target py-3 text-sm font-semibold text-raiders-navy active:bg-gray-50"
                    >
                      Edit
                    </button>
                    <div className="w-px bg-gray-100" />
                    {isConfirmingDelete ? (
                      <div className="flex-1 flex">
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="flex-1 touch-target py-3 text-sm font-bold text-red-600 bg-red-50 active:bg-red-100"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 touch-target py-3 text-sm font-semibold text-gray-500 active:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(template.id)}
                        className="flex-1 touch-target py-3 text-sm font-semibold text-red-500 active:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Create New Card */}
          <button
            onClick={handleCreate}
            className="w-full touch-target p-6 rounded-xl border-2 border-dashed border-white/40 text-white/70 active:border-white active:text-white transition flex flex-col items-center justify-center gap-1"
          >
            <div className="text-3xl">+</div>
            <div className="text-sm font-semibold">Create New Formation</div>
          </button>

          {/* Bottom spacer */}
          <div className="h-4" />
        </div>
      </div>

      {/* Formation Builder (full-screen overlay) */}
      {showBuilder && (
        <FormationBuilder
          initialTemplate={editingTemplate}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Delete confirmation is handled inline */}
    </div>
  );
}

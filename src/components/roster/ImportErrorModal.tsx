/**
 * Import Error Modal
 *
 * Philosophy: Clear errors. Actionable feedback. No jargon.
 * Tell the user exactly what's wrong and how to fix it.
 */

import type { ImportError } from '../../utils/csvUtils';

interface ImportErrorModalProps {
  errors: ImportError[];
  onClose: () => void;
}

export default function ImportErrorModal({
  errors,
  onClose,
}: ImportErrorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4">
          <h2 className="text-xl font-bold">
            ❌ Import Failed - {errors.length} Error{errors.length !== 1 ? 's' : ''} Found
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4 text-gray-700">
            Please fix the following errors in your CSV file and try again:
          </div>

          {/* Error List */}
          <div className="space-y-3">
            {errors.map((error, idx) => (
              <div
                key={idx}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="text-red-600 font-bold text-lg">!</div>
                  <div className="flex-1">
                    {error.row > 0 && (
                      <div className="text-sm font-semibold text-red-800 mb-1">
                        Row {error.row}
                        {error.field && error.field !== 'general' && (
                          <span className="text-red-600"> ({error.field})</span>
                        )}
                      </div>
                    )}
                    <div className="text-red-700">{error.message}</div>
                    {error.data &&
                      Object.keys(error.data).length > 0 &&
                      error.data.number !== undefined && (
                        <div className="text-sm text-red-600 mt-1 font-mono">
                          {error.data.name && `Name: "${error.data.name}"`}
                          {error.data.number !== undefined &&
                            ` Number: ${error.data.number}`}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="font-semibold text-blue-900 mb-2">
              CSV Format Requirements:
            </div>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Must have "Number" and "Name" columns</li>
              <li>Number: 0-99, unique for each player</li>
              <li>Name: Required, 1-50 characters</li>
              <li>
                Preferred Positions: Optional, use GK|DEF|MID|FWD (separated by
                |)
              </li>
              <li>Maximum 50 players per file</li>
            </ul>
          </div>

          {/* Example */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="font-semibold text-gray-700 mb-2">
              Example CSV Format:
            </div>
            <pre className="text-xs font-mono text-gray-600 overflow-x-auto">
              Number,Name,Preferred Positions{'\n'}
              7,Alex Martinez,MID|FWD{'\n'}
              12,Jordan Taylor,GK{'\n'}
              5,Sam Chen,DEF|MID
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end border-t">
          <button
            onClick={onClose}
            className="touch-target px-6 py-3 rounded-xl font-bold bg-field hover:bg-field-dark text-white transition"
          >
            Fix CSV & Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

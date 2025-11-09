/**
 * CSV Import/Export Utilities
 *
 * Philosophy: Robust parsing. Clear errors. No silent failures.
 * CSV is the universal data format - make it work everywhere.
 */

import type { Player, Position } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Player data from CSV row (before ID assignment)
 */
export interface PlayerCSVRow {
  number: number;
  name: string;
  preferredPositions: Position[];
}

/**
 * Import validation error
 */
export interface ImportError {
  row: number;
  field: string;
  message: string;
  data: Partial<PlayerCSVRow>;
}

/**
 * Result of CSV parsing
 */
export interface ParseResult {
  success: boolean;
  players: PlayerCSVRow[];
  errors: ImportError[];
}

/**
 * Result of import operation
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  errors: ImportError[];
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Convert players to CSV string
 */
export function exportPlayersToCSV(players: Player[]): string {
  const header = 'Number,Name,Preferred Positions';

  const rows = players
    .sort((a, b) => a.number - b.number)
    .map((p) => {
      const positions = p.preferredPositions.join('|');
      const escapedName = escapeCsvValue(p.name);
      const escapedPositions = escapeCsvValue(positions);
      return `${p.number},${escapedName},${escapedPositions}`;
    });

  return [header, ...rows].join('\n');
}

/**
 * Escape CSV values (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with current date
 */
export function generateCSVFilename(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `raiders-roster-${dateStr}.csv`;
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Parse CSV file to player data
 */
export async function parseCSVFile(file: File): Promise<ParseResult> {
  // Validate file type
  if (!file.name.endsWith('.csv')) {
    return {
      success: false,
      players: [],
      errors: [
        {
          row: 0,
          field: 'file',
          message: 'Please select a CSV file',
          data: {},
        },
      ],
    };
  }

  // Read file
  let text: string;
  try {
    text = await file.text();
  } catch (error) {
    return {
      success: false,
      players: [],
      errors: [
        {
          row: 0,
          field: 'file',
          message: 'Failed to read file',
          data: {},
        },
      ],
    };
  }

  // Parse lines
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    return {
      success: false,
      players: [],
      errors: [
        {
          row: 0,
          field: 'file',
          message: 'CSV file is empty',
          data: {},
        },
      ],
    };
  }

  const [headerLine, ...dataLines] = lines;
  const headers = parseCSVLine(headerLine);

  // Validate headers
  const numberIdx = headers.findIndex((h) =>
    h.toLowerCase().includes('number')
  );
  const nameIdx = headers.findIndex((h) => h.toLowerCase().includes('name'));
  const posIdx = headers.findIndex(
    (h) =>
      h.toLowerCase().includes('position') ||
      h.toLowerCase().includes('preferred')
  );

  if (numberIdx === -1 || nameIdx === -1) {
    return {
      success: false,
      players: [],
      errors: [
        {
          row: 0,
          field: 'headers',
          message: 'CSV must have "Number" and "Name" columns',
          data: {},
        },
      ],
    };
  }

  // Check max rows
  if (dataLines.length > 50) {
    return {
      success: false,
      players: [],
      errors: [
        {
          row: 0,
          field: 'file',
          message: 'Maximum 50 players allowed',
          data: {},
        },
      ],
    };
  }

  const players: PlayerCSVRow[] = [];
  const errors: ImportError[] = [];

  // Parse each data row
  dataLines.forEach((line, idx) => {
    const row = idx + 2; // Account for header + 0-index
    const values = parseCSVLine(line);

    const result = parsePlayerRow(values, numberIdx, nameIdx, posIdx, row);
    if (result.success && result.player) {
      players.push(result.player);
    } else {
      errors.push(...result.errors);
    }
  });

  // Check for duplicate numbers within CSV
  const numberCounts = new Map<number, number[]>();
  players.forEach((p, idx) => {
    const row = idx + 2;
    if (!numberCounts.has(p.number)) {
      numberCounts.set(p.number, []);
    }
    numberCounts.get(p.number)!.push(row);
  });

  numberCounts.forEach((rows, number) => {
    if (rows.length > 1) {
      errors.push({
        row: rows[0],
        field: 'number',
        message: `Duplicate number ${number} found in rows ${rows.join(', ')}`,
        data: { number },
      });
    }
  });

  return {
    success: errors.length === 0,
    players,
    errors,
  };
}

/**
 * Parse single CSV line (handles quoted values)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i < line.length - 1 ? line[i + 1] : null;

    if (char === '"' && nextChar === '"' && inQuotes) {
      // Escaped quote
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Push last field
  result.push(current.trim());
  return result;
}

/**
 * Parse single player row
 */
function parsePlayerRow(
  values: string[],
  numberIdx: number,
  nameIdx: number,
  posIdx: number,
  row: number
): {
  success: boolean;
  player?: PlayerCSVRow;
  errors: ImportError[];
} {
  const errors: ImportError[] = [];

  // Parse number
  const numberStr = values[numberIdx]?.trim();
  const number = parseInt(numberStr, 10);

  if (!numberStr || isNaN(number) || number < 0 || number > 99) {
    errors.push({
      row,
      field: 'number',
      message: 'Number must be between 0-99',
      data: { number: isNaN(number) ? undefined : number },
    });
  }

  // Parse name
  const name = values[nameIdx]?.trim();
  if (!name || name.length === 0) {
    errors.push({
      row,
      field: 'name',
      message: 'Name is required',
      data: {},
    });
  } else if (name.length > 50) {
    errors.push({
      row,
      field: 'name',
      message: 'Name must be less than 50 characters',
      data: { name },
    });
  }

  // Parse positions (lenient - ignore invalid ones)
  const positionsStr = posIdx >= 0 ? values[posIdx]?.trim() || '' : '';
  const positions: Position[] = [];

  if (positionsStr) {
    const parts = positionsStr.split('|').map((p) => p.trim());
    const validPositions: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

    parts.forEach((p) => {
      const upper = p.toUpperCase() as Position;
      if (validPositions.includes(upper)) {
        positions.push(upper);
      }
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    player: { number, name: name!, preferredPositions: positions },
    errors: [],
  };
}

/**
 * Check if import conflicts with existing roster
 */
export function detectConflicts(
  csvPlayers: PlayerCSVRow[],
  existingPlayers: Player[]
): PlayerCSVRow[] {
  return csvPlayers.filter((csvPlayer) =>
    existingPlayers.some((existing) => existing.number === csvPlayer.number)
  );
}

# Flexible Formations - Implementation Plan

## Problem Statement

The current system only supports two hardcoded formations (3-3-2 and 3-4-1), both assuming 9 field players. Real youth soccer scenarios vary wildly — sometimes only 6 kids show up (5 field + 1 GK). Coaches need full control over formation structure, the ability to save templates, and the ability to change formations mid-game.

## Design Overview

### Core Concept: Custom Formation Definition

Replace the hardcoded `FORMATION_A`/`FORMATION_B` with a flexible `FormationTemplate` that defines:
- A name (e.g., "5v5 Short Squad", "3-3-2 Standard")
- The number of players in each position row (GK is always 1)
- Custom position labels per slot (optional — auto-generated if not provided)

```typescript
interface FormationTemplate {
  id: string;
  name: string;
  rows: FormationRow[];       // Ordered top-to-bottom (FWD → MID → DEF)
  createdAt: number;
  isBuiltIn: boolean;         // true for the two default formations
}

interface FormationRow {
  position: Position;         // DEF, MID, or FWD
  count: number;              // How many players in this row
  labels?: string[];          // Optional custom labels (auto-generated if omitted)
}
```

**Key insight**: GK is always exactly 1 and rendered separately — it's not part of `rows`. Bench is computed dynamically: `benchCount = totalActivePlayers - (1 + sum(row.count))`.

### What Changes

#### 1. Types (`types/index.ts`)
- Add `FormationTemplate` and `FormationRow` interfaces
- Replace `FORMATION_A`/`FORMATION_B` constants with `DEFAULT_FORMATIONS` array containing the two built-in templates
- Remove `FormationType = 'A' | 'B'` — replace with `string` (template ID)
- Update `getSlotLabel()` to accept a `FormationTemplate` instead of `FormationType`
- Remove hardcoded `TOTAL_PLAYERS`, `FIELD_PLAYERS`, `BENCH` counts — these are now dynamic
- Keep `MIN_PLAYERS_TO_START` (but lower it — with 5+1 GK scenarios, 7 may be too high; consider making it `MIN_FIELD_PLAYERS = 3` + GK)
- Keep `Position`, `PlayerPosition`, `PositionAssignments` unchanged — the slot system already supports flexible formations

#### 2. Database (`db/index.ts`)
- Add `formationTemplates` table (schema v4) for saved custom formations
- Seed the two built-in formations on first run
- Store the active formation template ID on `GameSession` so game history knows which formation was used
- Migration: Convert existing `selectedFormation: 'A'|'B'` preference to template IDs

#### 3. Store (`store/index.ts`)
- Replace `selectedFormation: FormationType` with `selectedFormationId: string`
- Add `formationTemplates: FormationTemplate[]` state
- Add actions:
  - `loadFormationTemplates()` — load from DB on init
  - `saveFormationTemplate(template)` — create/update custom template
  - `deleteFormationTemplate(id)` — delete (block for built-in)
  - `setActiveFormation(id)` — set for current/upcoming game
  - `changeFormationMidGame(templateId)` — change formation during active game (reassigns players to new structure)
- Update `setFormation` → `setActiveFormation`

#### 4. Formation Setup View (`FormationSetupView.tsx`)
- Replace `FormationSelector` (A vs B radio) with a template picker:
  - Show saved templates as cards in a scrollable list
  - Each card shows: name, structure visualization (dots), player count
  - "Create New Formation" button at the end
  - Tap to select, long-press or edit icon to modify/delete
- When a template is selected, auto-assign runs using the template's row structure
- The "Start Game" button shows the formation name instead of "3-3-2"

#### 5. New: Formation Builder Component (`FormationBuilder.tsx`)
- Full-screen modal/view for creating/editing a formation template
- UI concept (touch-first, simple):
  - Formation name text input at top
  - Visual row editor: Each row (FWD/MID/DEF) shows as a horizontal bar with +/- buttons to change count
  - "Add Row" button to add another position row (e.g., a second midfield line for 4-2-3-1 style)
  - Live preview of the formation (dots on a mini field) updates as you adjust
  - Total field player count displayed prominently
  - "Save Template" button
- Validation: At least 1 field player row, total field players ≥ 1
- Pre-populate with the two defaults for easy customization

#### 6. Formation Selector Component (`FormationSelector.tsx`) — Major Rewrite
- Instead of two hardcoded buttons, render a dynamic list of `FormationTemplate` cards
- Each card shows: template name, structure string (e.g., "3-3-2"), dot visualization, field player count
- Selected template highlighted in red
- "+" card at end to create new template
- Edit/delete actions available via swipe or icon

#### 7. Formation Preview (`FormationPreview.tsx`)
- Already mostly dynamic (uses `formationConfig[position]` for slot counts)
- Change to read from `FormationTemplate.rows` instead of `FORMATION_A`/`FORMATION_B`
- Render rows dynamically: iterate `template.rows` top-to-bottom
- Position labels come from `row.labels` or auto-generated (L/C/R pattern)

#### 8. Field Formation (`FieldFormation.tsx`) — During Game
- Same approach: render rows dynamically from the active template
- Instead of hardcoded FWD/MID/DEF sections, iterate `template.rows`
- Position labels from template
- Empty slot rendering uses template's row counts

#### 9. Mid-Game Formation Change
- New button in GameView header/menu: "Change Formation"
- Opens a modal showing available templates
- On selection:
  - Maps current players to new formation structure (best-effort: keep GK, reassign field players top-down by their current row)
  - Bench players stay on bench
  - Creates a new rotation entry to capture the change
  - Coach can manually adjust after the formation change
- This is critical for scenarios like: "A player got hurt, now I need to go from 3-3-2 to 2-3-1"

#### 10. Auto-Generated Position Labels
When `FormationRow.labels` is not provided, generate labels based on count:
- 1 player: `C` + position prefix (e.g., "CF", "CM", "CD")
- 2 players: `L` + prefix, `R` + prefix
- 3 players: `L` + prefix, `C` + prefix, `R` + prefix
- 4 players: `L` + prefix, `CL` + prefix, `CR` + prefix, `R` + prefix
- 5+: prefix + slot number

Position prefix map: DEF→"D", MID→"M", FWD→"F"

### What Stays the Same

- **Timer system**: Still tracks field vs bench zones. No change needed — `Position` type still has 'BENCH' vs field positions
- **Rotation counting**: Still counts field↔bench transitions. Unchanged.
- **Drag-drop swap system**: Works with any formation — swaps operate on player IDs, not positions
- **Quarter system**: Completely orthogonal to formations
- **PlayerCard component**: No changes needed
- **BenchArea component**: Dynamic bench count already works
- **Statistics**: Position-level stats (DEF/MID/FWD time) still work since `Position` type is unchanged

### Implementation Order

1. **Types first**: Define `FormationTemplate`, `FormationRow`, update helpers — everything else depends on this
2. **Database**: Add `formationTemplates` table, migration, CRUD methods
3. **Store**: New state, actions, load on init
4. **Formation Builder**: New component for creating/editing templates
5. **Formation Selector**: Rewrite to use template list
6. **Formation Setup View**: Wire up new selector + builder
7. **Formation Preview**: Make dynamic based on template rows
8. **Field Formation**: Make dynamic based on template rows
9. **Mid-game formation change**: Add UI + store action
10. **Update version**: Bump to v4.0.0 (major: breaking DB schema change)
11. **Update CLAUDE.md**: Document new formation system

### Migration Strategy

- DB v4 migration creates `formationTemplates` table
- Seeds two built-in templates matching current Formation A and B
- Converts `selectedFormation` preference from `'A'`/`'B'` to template IDs
- Active games: If a game is in progress during migration, map its formation to the corresponding built-in template ID
- No data loss — existing rotation history still uses `PositionAssignments` which is unchanged

### Edge Cases

- **0 bench players**: Valid — all players on field (e.g., exactly 6 players with 5+GK formation)
- **More players than formation slots**: Extra players go to bench automatically
- **Fewer players than formation slots**: Empty slots shown on field (already handled)
- **Mid-game formation change with fewer rows**: Players from removed rows get moved to bench or redistributed
- **Deleting a template that's in use**: Block deletion, or fall back to a built-in template

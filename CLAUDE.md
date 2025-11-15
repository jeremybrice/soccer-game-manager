# Raiders Game Manager - Development Guide

## Project Overview

Youth soccer coaching PWA for the **St. Pete Raiders U10 Boys Jordan** team. Manages game-time rotation and fair playing time. Built for iPad, optimized for one-handed sideline operation.

**Core Philosophy**: "Glanceable. One-handed operation. No thinking required."

**Current Version**: v2.4.0 (stored in `package.json:4` and `HomeView.tsx:105`)

---

## Technical Stack

- **Frontend**: React 18 + TypeScript (strict), Vite 7.x, Tailwind CSS v3
- **State**: Zustand (global), IndexedDB via Dexie.js (persistence)
- **PWA**: vite-plugin-pwa + Workbox
- **Testing**: Playwright E2E
- **Deployment**: Netlify (`netlify.toml` config, build: `npm ci && npm run build`, publish: `dist`)

**Structure**: `src/components/{game,home,roster,stats}`, `src/{db,store,types,utils}`

---

## Raiders Branding (v2.0.0)

**Team**: St. Pete Raiders U10 Boys Jordan

**Colors**:
- **Navy Blue**: `#1B2947` (primary - field, headers, secondary buttons)
- **Red**: `#C8102E` (accent - primary buttons, selection indicators)
- **White**: Text and UI elements
- **Gray**: Bench area (neutral)

**Applied To**:
- Field background: Navy gradient (`bg-gradient-to-b from-field-light to-field`)
- Primary buttons (Start/Resume Game): Red (`bg-raiders-red`)
- Secondary buttons (Roster/Stats): Navy (`bg-raiders-navy-light`)
- Header/footer: Navy background
- Selection indicators: Red ring and background (`bg-raiders-red`)
- Logo watermark: Shield emoji placeholder on field (TODO: Replace with `/public/raiders-shield.svg`)
- PWA manifest: Navy theme/background colors

**NOT Changed**:
- Time-based player colors (green/yellow/red) - kept for safety/visibility
- Bench background - kept gray for neutral zone indication

**Files Modified**:
- `tailwind.config.js:9-33` - Raiders color definitions
- `package.json:2-4` - Name and version
- `vite.config.ts:13-17` - PWA manifest
- `HomeView.tsx:20-31,39-79,95` - Title, logo, buttons, version
- `GameView.tsx:240` - Selection indicator
- `PlayerCard.tsx:45,48` - Selection ring
- `FieldFormation.tsx:61-66` - Logo watermark

---

## Core Concepts

### Timer System (CRITICAL)

**Timers track ZONES, not positions**. Two zones: Field (GK/DEF/MID/FWD) and Bench.

**Rules**:
- Timer resets ONLY when crossing field ↔ bench boundary
- Position changes on field (LD→RF→CM) do NOT reset timer
- Pause button freezes ALL player timers (not just game clock)
- Implementation: `getPlayerMinutesInCurrentZone()` in `GameView.tsx:41-75`

**Example**: Player at LD (8m) → RF (still 8m, continues) → Bench (resets to 0m bench)

### Rotation Counting

Counts field ↔ bench transitions only. LD→RF→CM = 0 rotations; CM→Bench = 1 rotation.

### Pause Tracking

Game pause affects all timers. Store tracks:
- `pausedAt`: Timestamp when paused
- `totalPausedDuration`: Cumulative pause time (ms)
- Timer calculations subtract pause duration

### Time-Based Colors

Field/bench players show color-coded time: <10m (Green), 10-15m (Yellow), >15m (Red)

### Position Labels

**Display-only** (not in DB). Based on array index in `FieldFormation.tsx`:
- Defense: LD, CD, RD
- Midfield: LM, CM, RM
- Forward: LF, RF
- Goalkeeper: GK

### Formation Structure

3-3-2-1: 1 GK, 3 DEF, 3 MID, 2 FWD, 5 BENCH (14 total). Minimum 9 players to start.

---

## Help System (v2.2.0)

**Access**: Tap ❓ icon (top-right of home screen)

**Features**:
- Comprehensive searchable documentation (9 core sections)
- Category organization: Getting Started, Features, Reference, Advanced
- Markdown-rendered content with internal navigation
- Context-aware links between help sections
- Offline-capable (built-in content)
- Data-tour attributes for future tutorial integration

**Components**:
- Help Modal: `src/components/help/HelpModal.tsx`
- Content Data: `src/data/helpContent.ts`
- Sidebar Navigation: `src/components/help/HelpSidebar.tsx`
- Content Display: `src/components/help/HelpContent.tsx`
- Search: `src/components/help/HelpSearch.tsx`
- Help Icon: `src/components/help/HelpIcon.tsx`

**State Management**:
- Store slice: `store/index.ts` (help state and actions)
- Database: `db/index.ts` (user preferences table, schema v2)
- Preferences: Tutorial status saved to IndexedDB

**Adding New Help Content**:
1. Edit `src/data/helpContent.ts`
2. Add new `HelpSection` object with markdown content
3. Include keywords for search optimization
4. Assign category (`getting-started`, `features`, `reference`, `advanced`) and order
5. Test search and internal navigation links

**Help Sections**:
1. Quick Start Guide (🚀)
2. Timer System Explained (⏱️)
3. Player Rotations (🔄)
4. Viewing Statistics (📊)
5. AI Chat Assistant (🤖) - placeholder for future feature
6. Settings (⚙️) - placeholder for future feature
7. FAQ (❓)
8. Troubleshooting (🐛)
9. Rotation Strategies (🎯)

**Search Implementation**:
- Real-time filtering across titles, content, and keywords
- Case-insensitive search
- Highlights matching sections in sidebar

**Internal Navigation**:
- Links with `#section-id` format navigate within help modal
- External links open in new tab
- Custom markdown components for styling (tables, code blocks, headings)

---

## Design Patterns

### State Management

**Zustand** (`store/index.ts`): Single source of truth. Action → Store → UI.

**Never**:
- Modify IndexedDB directly from components
- Duplicate store state in component state
- Use nested state structures

### IndexedDB Critical Gotcha

**Cannot** use boolean indexing with `.sortBy()` in Dexie:
```typescript
// ❌ WRONG: await db.players.where('isActive').equals(true).sortBy('number');
// ✅ RIGHT:
const all = await db.players.orderBy('number').toArray();
const active = all.filter(p => p.isActive === true);
```

### Component Style

- Every component has philosophy comment block
- TypeScript strict mode, no `any`
- Functional components + hooks only
- PascalCase components, camelCase utilities
- Comments explain "why", not "what"

### Touch-First UI

- All interactive elements: `touch-target` class (min 44x44px)
- High contrast on field (white on navy)
- No hover states (use active states)
- Red selection indicator (Raiders branding) above bench
- Player cards: rotation badge (top-right), number/name (center), time badge, position label (bottom)

### Visual Hierarchy

1. Game Time (top, largest)
2. Color Legend & Playing Time Summary (collapsible)
3. Field Formation (navy gradient with Raiders logo watermark)
4. Selection Bar (red, above bench)
5. Bench (gray background)

---

## Development Workflow

### Commands
```bash
npm run dev          # Dev server http://localhost:5173
npm run build        # Production build
npx playwright test  # Run E2E tests
```

### Adding Features

1. Plan with TodoWrite tool
2. Update `types/index.ts` first
3. Add store actions in `store/index.ts`
4. Build/modify components
5. Write E2E test in `tests/`
6. Update version in `package.json` + `HomeView.tsx`

### Modifying Timers

All timer logic in `GameView.tsx`:
- `getPlayerMinutesInCurrentZone()` - Main timer (field/bench)
- `getPlayerBenchTime()` - Wrapper for bench
- `getPlayerRotationCount()` - Field↔bench transitions only
- `getPlayerTotalFieldTime()` - Cumulative for summary

**Remember**: Account for `timer.pausedAt` and `timer.totalPausedDuration`

### Changing Formation

Position labels: `FieldFormation.tsx` (display only)
Formation structure: `types/index.ts` FORMATION constant

---

## Technical Issues & Solutions

### PWA Service Worker Caching

**Problem**: New deployments don't show immediately (aggressive PWA caching)
**Solution**: Version number on home screen + user hard refresh (Ctrl+Shift+R) or clear service worker

### Boolean Indexing in Dexie

**Problem**: `.where('isActive').equals(true).sortBy()` fails
**Solution**: In-memory filtering (see Design Patterns)

### Timer Accuracy

Minute-level only (sufficient for youth soccer). Updates on component re-renders, not interval-based.

---

## Debugging Quick Reference

**Timer issues?**
- Check `timer.pausedAt`/`totalPausedDuration` in store
- Verify `getPlayerMinutesInCurrentZone()` logic
- Inspect `currentGame.rotations` array

**Data not persisting?**
- DevTools → Application → IndexedDB
- Check `db.savePlayer()`/`db.addRotation()` calls
- Look for boolean indexing mistakes

**UI not updating?**
- Zustand store state in React DevTools
- Stale service worker? Hard refresh

**Code references**: Use file:line notation (e.g., `GameView.tsx:41-75`)

---

## Communication with Claude

**Starting new conversation**: Reference CLAUDE.md, specify feature/area, mention version, share errors/screenshots

**Be specific about**:
- Timer behavior (field/bench zones)
- Pause functionality requirements
- Visual appearance & touch interaction

**Avoid**:
- Per-position timer requests (not supported)
- Breaking "glanceable" philosophy
- Adding UI complexity for live games

---

## Project Goals

**Primary**: Help coaches ensure fair playing time for all youth players

**Success Metrics**:
- Rotate players in <5 seconds
- Visual indicator when player >15 minutes
- Fair time distribution visible to parents
- Works offline at any field

**Non-Goals**: Advanced tactics, professional stats, video analysis, messaging

---

## Future Enhancements

- CSV export, season analytics, multiple formations (4-4-2, 4-3-3)
- Injury tracking, multi-game sessions, dark mode
- Rotation notifications, auto-suggest fair swaps

---

## Maintenance

**Regular**: Update deps quarterly, test PWA after Vite/Workbox updates, run Playwright before releases

**Breaking Changes to Avoid**:
- IndexedDB schema changes (need migration)
- Removing `isActive` boolean filtering
- Timer calculation changes (test extensively)
- Rotation tracking changes (affects history)

---

**Version History**:
- v1.0.0: Initial
- v1.1.0: Version display
- v1.2.0: Per-position timers, rotation counts, summary
- v1.3.0: Field/bench zones, pause-aware timers, simplified rotation counting
- v2.0.0: Raiders branding - navy/red colors, team logo, updated PWA manifest
- v2.1.0: Help system - searchable documentation, 9 help sections, markdown rendering, user preferences database
- v2.2.0: Version bump for help system release
- v2.3.0: Planning mode - staged swaps, batch rotations
- v2.3.1: Bug fixes - player swap improvements
- v2.3.2: Bug fixes - prevent player disappearing during swaps
- v2.4.0: Simplified time-based colors - reduced from 4 to 3 tiers (green <10m, yellow 10-15m, red >15m)

*Last updated: 2025-11-15 (v2.4.0)*

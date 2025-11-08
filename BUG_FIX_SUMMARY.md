# Bug Fix Summary: Player Loading Issue

## Problem
Players were being saved to IndexedDB but not appearing in the UI. The app showed "0 / 14 Players" even though players existed in the database.

## Root Cause
**IndexedDB Key Range Error with Boolean Indexes**

The database schema indexed the `isActive` field:
```typescript
players: 'id, number, isActive'  // isActive was indexed
```

The query attempted to use this indexed field with boolean values:
```typescript
async getActivePlayers(): Promise<Player[]> {
  return await this.players
    .where('isActive')
    .equals(true)  // Boolean value
    .sortBy('number');  // ← This caused the error!
}
```

**Error:** `Failed to execute 'bound' on 'IDBKeyRange': The parameter is not a valid key`

This error occurs because Dexie/IndexedDB has issues when:
1. Querying an indexed field with boolean values
2. Chaining `.sortBy()` after `.where().equals()` on boolean indexes

## Solution
Changed database queries to use **in-memory filtering** instead of indexed queries:

### Before (Broken)
```typescript
async getActivePlayers(): Promise<Player[]> {
  return await this.players
    .where('isActive')
    .equals(true)
    .sortBy('number');
}
```

### After (Fixed)
```typescript
async getActivePlayers(): Promise<Player[]> {
  const allPlayers = await this.players.orderBy('number').toArray();
  return allPlayers.filter(p => p.isActive === true);
}
```

## Changes Made

### File: `src/db/index.ts`

1. **getActivePlayers()** (lines 49-54)
   - Changed from indexed query to in-memory filtering
   - Added console logging for debugging

2. **getActiveGame()** (lines 60-65)
   - Changed from indexed query to in-memory filtering
   - Added console logging for debugging

3. **savePlayer()** (lines 155-158)
   - Added console logging for debugging

## Testing Results

### Automated Tests (Playwright)
✅ Add player: SUCCESS
✅ Save to IndexedDB: SUCCESS
✅ Load from IndexedDB: SUCCESS
✅ Display in UI: SUCCESS

```
Initial player count: 0 / 14 Players
After adding player: 1 / 14 Players  ✓
After adding 2nd player: 2 / 14 Players  ✓

IndexedDB verification:
- Players stored: 2
- isActive type: boolean
- isActive value: true
- All players visible in UI ✓
```

## Data Integrity
- Existing players in database are preserved
- Boolean `isActive` values remain unchanged
- No data migration required
- Index remains in schema (just not used for filtering)

## Performance Impact
**Minimal** - The app supports max 14 players, so:
- Memory filtering of 14 records is negligible
- No noticeable performance difference
- Actually faster since it avoids index overhead for small datasets

## Next Steps

### For Local Development
1. ✅ Fix is already applied
2. ✅ Tests pass
3. Open your browser to `http://localhost:5173/`
4. Clear IndexedDB if needed: DevTools → Application → Storage → Clear site data
5. Add players and verify they appear

### For Production Deployment
1. Build the app: `npm run build`
2. Deploy to Netlify:
   - Option A: Drag `dist` folder to netlify.com/drop
   - Option B: Push to Git and let Netlify auto-deploy
   - Option C: Use Netlify CLI: `netlify deploy --prod --dir=dist`

3. After deployment:
   - Clear browser cache/storage for the deployed URL
   - Test adding new players
   - Your 4 existing players should now appear

## Debug Logging
Console logs now show:
- `[DB] getActivePlayers: Found X active players out of Y total`
- `[DB] getActiveGame: Found active game / No active game`
- `[DB] savePlayer: Saved PlayerName (#Number)`

Open browser DevTools → Console to see these logs.

## Related Files
- **Fix**: `src/db/index.ts`
- **Tests**: `tests/add-player-test.spec.ts`, `tests/quick-test.spec.ts`
- **Schema**: No changes required (backward compatible)

## Prevention
For future development:
- ⚠️ Avoid indexing boolean fields in Dexie
- ✅ Use in-memory filtering for boolean queries
- ✅ Keep indexed queries for number/string fields only
- ✅ Test with actual data, not just empty databases

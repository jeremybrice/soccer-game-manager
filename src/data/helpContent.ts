/**
 * Help system content and tutorial steps
 *
 * Philosophy: Documentation should be searchable, scannable, and actionable.
 * Each section focuses on a single topic with clear examples and next steps.
 */

import type { HelpSection, TutorialStep } from '../types';

export const helpSections: HelpSection[] = [
  {
    id: 'quick-start',
    title: 'Quick Start Guide',
    icon: '🚀',
    category: 'getting-started',
    order: 1,
    keywords: ['start', 'begin', 'first', 'new', 'game', 'getting started'],
    content: `# Quick Start Guide

## Starting Your First Game

1. **Check Your Roster**
   - Tap "Manage Roster" button
   - Ensure at least 9 active players
   - Add/edit players if needed

2. **Start the Game**
   - Return to home screen
   - Tap red "Start Game" button
   - Timer begins in paused state

3. **Make Rotations**
   - Tap a player to select them
   - Tap another player to stage a swap (ghost preview appears)
   - Swipe up on orange bar to execute all staged swaps
   - Timer resets when crossing field ↔ bench

4. **Monitor Time**
   - Green: <10 min (fresh)
   - Yellow: 10-15 min
   - Red: >15 min (rotate soon!)

5. **End Game**
   - Tap "Back" button to return home
   - Review stats anytime
   - Start new game when ready

⏱️ **Average setup time: 2 minutes**

[Next: Understanding Timers →](#timer-system)
    `
  },
  {
    id: 'timer-system',
    title: 'Timer System Explained',
    icon: '⏱️',
    category: 'features',
    order: 2,
    keywords: ['timer', 'time', 'clock', 'pause', 'zone', 'field', 'bench'],
    content: `# ⏱️ Timer System Explained

## How Timers Work

The app tracks time in **two zones**:
- 🟢 **Field** (GK, DEF, MID, FWD positions)
- ⚪ **Bench**

### Key Rule
**Timers reset ONLY when crossing field ↔ bench**

### Example
\`\`\`
Player at Left Defense (8 min)
  → moves to Right Forward (still 8 min, continues)
  → moves to Bench (resets to 0 min bench time)
\`\`\`

### Why Zone-Based?
Youth soccer focuses on fair **field time**, not position-specific time. Moving from defense to forward keeps the timer running because the player is still on the field.

## Color Codes

| Color | Time Range | Action |
|-------|------------|--------|
| 🟢 Green | < 10 minutes | Fresh, no rush |
| 🟡 Yellow | 10-15 minutes | Plan rotation |
| 🔴 Red | > 15 minutes | Rotate ASAP |

## Pause Button

- **Freezes ALL player timers** (not just game clock)
- Use during: water breaks, injuries, referee stoppages
- **Resume**: Tap pause button again

💡 **Pro Tip**: Pause during breaks so bench time doesn't unfairly accumulate!

[Learn about rotations →](#player-rotations)
    `
  },
  {
    id: 'player-rotations',
    title: 'Player Rotations',
    icon: '🔄',
    category: 'features',
    order: 3,
    keywords: ['rotation', 'swap', 'substitute', 'change', 'switch'],
    content: `# 🔄 Player Rotations

## Making a Rotation

### Method: Tap to Stage, Swipe to Execute

1. **Tap** a player (field or bench) to select them
2. **Tap** another player to stage a swap
3. **Ghost preview** shows where players will move
4. **Swipe up** on the orange bar to execute all staged swaps

### Visual Feedback
- Selected player shows **red ring** (Raiders accent color)
- Ghost previews show staged positions (faded appearance)
- Orange execute bar appears when swaps are staged
- Swipe down on bar to clear all staged swaps
- Tap a ghost to remove that individual swap

### After Execution
- Players move to their new positions
- Timers reset for players crossing field ↔ bench
- Rotation count increments for zone changes

## Rotation Counting

**What counts as a rotation?**
- Field → Bench = +1 rotation
- Bench → Field = +1 rotation
- Field position → Field position = 0 rotations (no zone change)

### Example Season Stats
- Player #7: 12 rotations (6 games) = 2 per game
- Player #3: 8 rotations (6 games) = 1.3 per game

💡 **Fair Play Tip**: Aim for equal rotation counts across all players

## Position Changes on Field

You can swap two field players directly:

1. **Tap** first field player
2. **Tap** second field player
3. Ghost previews show the swap
4. **Swipe up** to execute

💡 **Note**: Field-to-field swaps don't count as rotations (no zone change) and timers continue running.

[View rotation strategies →](#rotation-strategies)
    `
  },
  {
    id: 'season-stats',
    title: 'Viewing Statistics',
    icon: '📊',
    category: 'features',
    order: 4,
    keywords: ['stats', 'statistics', 'data', 'history', 'games', 'performance'],
    content: `# 📊 Season Statistics

## Accessing Stats

From home screen: **Tap "View Stats" button** (navy)

## Available Data

### Per Player
- **Total Field Time**: All minutes on field across all games
- **Games Played**: Number of games participated in
- **Avg Time Per Game**: Field time ÷ games
- **Total Rotations**: Field ↔ bench transitions
- **Avg Rotations Per Game**: Rotations ÷ games

### Filtering
- **Active Players Only**: Toggle to show current roster
- **All Players**: Includes inactive/past players

### Sorting
- By player number (default)
- By total time
- By games played
- By rotations

## Interpreting Stats

### Fair Distribution Example
\`\`\`
14 players, 60-minute game, 9 on field at once

Ideal per-game stats:
- Field time: ~38-40 minutes
- Rotations: 2-3 times
- Bench time: ~20-22 minutes
\`\`\`

### Red Flags
- ⚠️ Player with <20 min avg per game
- ⚠️ Player with >50 min avg per game
- ⚠️ Rotation count variance >50% between players

[Back to Quick Start →](#quick-start)
    `
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    icon: '❓',
    category: 'reference',
    order: 5,
    keywords: ['faq', 'question', 'help', 'why', 'how'],
    content: `# ❓ Frequently Asked Questions

## Timer Questions

**Q: Why doesn't the timer reset when I move a player from defense to forward?**

A: The app tracks **zone time** (field vs bench), not position time. Moving between field positions keeps the timer running because the player is still on the field. This is intentional for fair playing time distribution.

**Q: What happens if I forget to pause during halftime?**

A: Bench players will accumulate time, but you can pause anytime and the app accounts for it. For best accuracy, pause during all stoppages.

**Q: Can I edit a player's time manually?**

A: Not currently. Timers are automatic to prevent errors. If you need to adjust, end the game and note it in your records.

## Rotation Questions

**Q: How many rotations per game is ideal?**

A: For 14 players, 60-minute game: **2-3 rotations per player** keeps everyone engaged with fair time.

**Q: Can I swap two field players directly?**

A: Yes! Tap both field players to stage a swap. The ghost previews show where they'll move. Swipe up on the orange bar to execute.

## Stats Questions

**Q: Why are some players not showing in stats?**

A: Toggle "Active Players Only" off to see inactive/past players.

**Q: How is average time calculated?**

A: Total field time ÷ games played (only counts games where player participated)

## Technical Questions

**Q: Does this work offline?**

A: Yes! Core features (timer, rotations, roster, stats) all work offline. This is a PWA designed for sideline use.

**Q: Which devices are supported?**

A: Any modern browser. Optimized for iPad (Safari). Also works on iPhone, Android tablets/phones, and desktop.

**Q: How do I update the app?**

A: It's a PWA - updates happen automatically. Check version number on home screen. If stuck, hard refresh (Ctrl+Shift+R or clear cache).

**Q: Where is my data stored?**

A: Locally in your browser's IndexedDB. Not synced to cloud. If you clear browser data, you'll lose your games.

🔮 **Future**: Cloud backup and sync across devices

[Troubleshooting →](#troubleshooting)
    `
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🐛',
    category: 'reference',
    order: 6,
    keywords: ['troubleshooting', 'problem', 'issue', 'bug', 'error', 'fix'],
    content: `# 🐛 Troubleshooting

## Common Issues

### Timer Not Updating

**Symptoms**: Time displays freeze or don't increment

**Solutions**:
1. Check if game is paused (pause button shows "Resume")
2. Refresh the page (timer recalculates on load)
3. End game and start new one if persists

### Can't Start Game

**Symptom**: "Start Game" button disabled or shows error

**Cause**: Need at least 9 active players

**Solution**:
1. Tap "Manage Roster"
2. Ensure 9+ players have green checkmarks (active)
3. Add or activate more players if needed

### Player Not Appearing in Roster

**Symptom**: Added player doesn't show up

**Solutions**:
1. Check if you saved (tap "Add Player" button)
2. Verify player is marked "Active"
3. Refresh page

### Stats Look Wrong

**Symptoms**: Times don't add up, missing games

**Solutions**:
1. Check you're viewing correct player
2. Toggle "Active Players Only" filter
3. Verify games were properly saved (not abandoned mid-game)

### App Won't Load

**Solutions**:
1. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear service worker**:
   - DevTools → Application → Service Workers → Unregister
   - Refresh page
3. **Clear cache**: Browser settings → Clear browsing data
4. **Check version**: Should show v2.1.0+ on home screen

### Data Lost After Browser Clear

**Prevention**:
- Don't clear browser data/cache if you have active season
- Export stats regularly (feature planned)
- 🔮 **Future**: Cloud backup

**Recovery**:
- Unfortunately, local data can't be recovered
- Start fresh season

## Still Having Issues?

### 1. Check Version
- Home screen shows version (bottom)
- Hard refresh if version appears old

### 2. Browser Compatibility
- **Best**: Safari on iPad (primary target)
- **Good**: Chrome, Firefox, Edge (desktop/mobile)
- **Avoid**: Internet Explorer (not supported)

### 3. Report a Bug
- GitHub: github.com/jeremybrice/soccer-game-manager/issues
- Include: version number, device, browser, steps to reproduce

## Emergency Reset

⚠️ **Warning**: This deletes ALL data (rosters, games, stats)

**Steps**:
1. Browser DevTools (F12)
2. Application tab → IndexedDB
3. Right-click "RaidersGameDB" → Delete
4. Refresh page

Use only as last resort!

[Back to Help Home →](#quick-start)
    `
  },
  {
    id: 'rotation-strategies',
    title: 'Rotation Strategies',
    icon: '🎯',
    category: 'advanced',
    order: 7,
    keywords: ['strategy', 'tactics', 'rotation', 'plan', 'coach', 'advanced'],
    content: `# 🎯 Rotation Strategies

## Fair Play Rotation (Recommended for U10)

### Goal
Every player gets equal field time regardless of skill level.

### Strategy
1. **Pre-game**: Divide players into balanced groups
2. **First half**: Rotate groups every 10-12 minutes
3. **Halftime**: Check stats, adjust for balance
4. **Second half**: Prioritize red/orange players for field time

### Using the App
- Watch color indicators: rotate red players first
- Check stats at halftime to equalize discrepancies
- Prioritize players showing yellow/red time indicators

## Skill-Based Rotation

### Goal
Balance fair time with competitive play.

### Strategy
1. **Strong players**: 55-65% field time
2. **Average players**: 45-55% field time
3. **Developing players**: 35-45% field time
4. Everyone gets meaningful minutes

### Using the App
- Manual tracking - app shows time, you decide distribution
- Use pause during strategy moments
- Post-game: review stats for next game adjustments

## Position-Specific Development

### Goal
Give players experience in multiple positions.

### Limitation
App doesn't track per-position time (zone-based only).

### Workaround
1. Track positions manually (paper/notes)
2. Use rotation count as proxy (more rotations = more variety)
3. Plan position changes during natural stoppages

### Example
\`\`\`
Game 1: Player #7 → Defense → Midfield
Game 2: Player #7 → Forward → Defense
Game 3: Player #7 → Midfield → Forward
\`\`\`

Result: Variety across games, not within-game tracking.

## Emergency Situations

### Player Injured During Game

1. **Pause timer immediately**
2. Attend to player
3. Move to bench if needed (rotation counted)
4. **Resume timer** when play continues
5. Note injury in post-game records

### Uneven Teams (Player Absences)

**9-11 players**:
- More rotations needed
- Watch for fatigue (>18 min continuous = risk)
- Prioritize defense/midfield stability

**12-14 players** (ideal):
- Standard 2-3 rotations per player
- Balanced bench time

**15+ players** (crowded):
- Risk of insufficient time
- Increase rotation frequency
- Consider 8 on field at once if allowed

## Halftime Adjustments

### Quick Stats Review
1. Tap "View Stats" during halftime
2. Sort by "Time This Game"
3. Identify red players (>15 min so far)
4. Plan to bench red players early in 2nd half

## Weather & Fatigue Management

**Hot Weather**:
- Shorter field stints (8-10 min max)
- More frequent rotations
- Use pause during water breaks

**Cold/Wet**:
- Rotate bench players sooner (keep warm)
- Extend field time slightly if player is warm

**App Support**:
- Pause during all water breaks
- Monitor time to avoid over-fatigue
- Color codes help: >15 min (red) = fatigue risk

## Parent Management

### Transparency
- "All playing time tracked in app"
- "Stats available after game"
- "Fair distribution is our goal"

### Handling Complaints
1. Show season stats (proof of balance)
2. Explain zone-based timing (field vs bench)
3. Point to specific numbers: "Your player has X minutes, average is Y"

### Proactive Communication
- Share season stats periodically
- Highlight rotation count equity
- Note improvement over time

[View stats features →](#season-stats)
    `
  }
];

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Raiders Game Manager!',
    description: 'Let\'s take a quick 30-second tour of the app. Tap "Next" to begin, or "Skip" to explore on your own.',
    position: 'bottom'
  },
  {
    id: 'roster',
    title: 'Manage Your Roster',
    description: 'Start here: Add your players with names and numbers. Need at least 9 active players to begin a game.',
    targetElement: '[data-tour="roster-button"]',
    position: 'bottom',
    action: 'Tap to add players'
  },
  {
    id: 'start-game',
    title: 'Start a Game',
    description: 'Once your roster is ready, tap here to begin. The timer starts paused so you can set up your formation.',
    targetElement: '[data-tour="start-game-button"]',
    position: 'top',
    action: 'Tap when ready'
  },
  {
    id: 'stats',
    title: 'View Statistics',
    description: 'After games, check player stats here. See total field time, rotations, and season averages.',
    targetElement: '[data-tour="stats-button"]',
    position: 'top',
    action: 'Tap to view'
  },
  {
    id: 'help',
    title: 'Need Help?',
    description: 'Tap here anytime for guides, FAQs, and troubleshooting.',
    targetElement: '[data-tour="help-icon"]',
    position: 'bottom',
    action: 'Get help'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! ⚽',
    description: 'Start by adding your roster, then begin your first game. The timer system will guide you through rotations. Good luck, Coach!',
    position: 'bottom'
  }
];

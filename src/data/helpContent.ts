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
   - Tap player on field to select
   - Tap bench player to swap
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

### Method: Tap to Select, Tap to Swap

1. **Tap** a player on the field (becomes highlighted)
2. **Tap** a bench player
3. **Automatic swap** occurs instantly

### Visual Feedback
- Selected player shows **red ring** (Raiders accent color)
- Player cards shift positions
- Timers reset for both players
- Rotation count increments

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

To move a player between field positions **without** going through bench:

**Workaround**:
1. Move player A to bench
2. Move player B to player A's old spot
3. Move player A to player B's old spot

⚠️ **Note**: This creates 2 rotations. If you need position-only swaps, this is a known limitation.

🔮 **Future Feature**: Direct field-to-field position swaps

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

💡 **Use AI Assistant**: Ask "Who needs more playing time?" for insights

[Learn about AI chat →](#ai-assistant)
    `
  },
  {
    id: 'ai-assistant',
    title: 'AI Chat Assistant',
    icon: '🤖',
    category: 'features',
    order: 5,
    keywords: ['ai', 'chat', 'assistant', 'claude', 'ask', 'question'],
    content: `# 🤖 AI Chat Assistant

## Setup Required

### 1. Get an API Key
- Visit: console.anthropic.com
- Sign up or log in
- Generate an API key (starts with \`sk-ant-\`)

### 2. Save to App
- Tap **settings icon** ⚙️ on home screen
- Enter your API key
- Tap **Save**

🔒 **Privacy**: Your key is stored locally and never sent to our servers.

## Using the Chat

### On Stats Page
1. Navigate to **View Stats**
2. Tap **chat icon** 💬 (top right, next to "Season Stats")
3. Chat modal opens

### Example Questions

**Playing Time Analysis**:
- "Who needs more playing time?"
- "How is player #7 doing this season?"
- "Which players have the most balanced time?"

**Rotation Insights**:
- "Who has the fewest rotations?"
- "Are rotations evenly distributed?"

**Game-Specific**:
- "How did the last game go?"
- "What was our average playing time last game?"

**Strategy**:
- "Which players should I rotate more often?"
- "How can I balance playing time better?"

## How It Works

The AI receives:
- ✅ All season statistics
- ✅ Player names and numbers
- ✅ Game history and durations
- ✅ Current rotation counts

The AI provides:
- 📊 Data-driven insights
- 💡 Rotation suggestions
- 🎯 Fair play recommendations

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Set up API key" | Go to Settings → enter key |
| "Invalid API key" | Check format (sk-ant-...) |
| "No internet" | Chat requires network |
| "Rate limit" | Wait 60 seconds, try again |

💰 **Costs**: API usage charges apply (your Anthropic account). Typical question costs <$0.01.

[API key security →](#faq)
    `
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    category: 'reference',
    order: 6,
    keywords: ['settings', 'config', 'api', 'key', 'anthropic'],
    content: `# ⚙️ Settings

## Accessing Settings

From home screen: **Tap settings icon** ⚙️ (top right)

## Available Settings

### Anthropic API Key

**Purpose**: Enables AI chat assistant on stats page

**Setup**:
1. Enter your API key (format: \`sk-ant-...\`)
2. Tap **Show** to verify key (optional)
3. Tap **Save**

**Security**:
- Stored in local IndexedDB (client-side only)
- Not synced to cloud
- Not accessible by other websites
- Transmitted only to Anthropic API (HTTPS)

**Updating**: Enter new key and save (overwrites old)

**Removing**: Tap **Clear** button (disables AI chat)

## Future Settings (Planned)

- 🌙 Dark mode toggle
- 🔔 Rotation reminders/alerts
- ⚽ Formation selection (4-4-2, 4-3-3)
- 📤 Export format preferences
- 🌐 Language selection

[API key FAQ →](#faq)
    `
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    icon: '❓',
    category: 'reference',
    order: 7,
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

A: Not in v2.x. You must go through the bench (see workaround in [Rotations guide](#player-rotations)). Direct swaps are planned for v3.0.

## Stats Questions

**Q: Why are some players not showing in stats?**

A: Toggle "Active Players Only" off to see inactive/past players.

**Q: How is average time calculated?**

A: Total field time ÷ games played (only counts games where player participated)

## AI Assistant Questions

**Q: Is my data private when using AI chat?**

A: Stats data is sent to Anthropic's API to provide context for your questions. Anthropic has a strict privacy policy and doesn't train on your data. Your API key and stats never leave your device otherwise.

**Q: What if I don't want to use AI?**

A: It's completely optional! The app works fully without it. Just don't set up an API key.

**Q: Can I use someone else's API key?**

A: Technically yes, but they'll be charged for your usage. Best practice: each coach gets their own key.

## Technical Questions

**Q: Does this work offline?**

A: Core features (timer, rotations, roster) work offline. Stats sync when back online. AI chat requires internet.

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
    order: 8,
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

### AI Chat Not Working

| Issue | Fix |
|-------|-----|
| "Set up API key" message | Settings → enter API key |
| "Invalid API key" | Verify key starts with \`sk-ant-\` |
| Chat button missing | Update app (v2.1.0+ required) |
| "No internet connection" | Check network, requires online |
| Slow responses | Normal, streaming can take 5-10 seconds |

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
- Should be v2.1.0 or higher for AI features
- Hard refresh if version is old

### 2. Browser Compatibility
- **Best**: Safari on iPad (primary target)
- **Good**: Chrome, Firefox, Edge (desktop/mobile)
- **Avoid**: Internet Explorer (not supported)

### 3. Report a Bug
- GitHub: github.com/jeremybrice/soccer-game-manager/issues
- Include: version number, device, browser, steps to reproduce

### 4. Ask AI
- Use chat assistant: "Why isn't my timer working?"
- AI can help diagnose stats or usage issues

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
    order: 9,
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
- Check stats at half: equalize discrepancies
- Ask AI: "Who needs more time this half?"

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

### AI-Assisted Planning
Ask during halftime:
- "Who should I rotate more in the second half?"
- "Are my rotations balanced so far?"
- "Which players have been on the bench longest?"

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
3. Use AI insights: "Data shows your player is within 5% of average"

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
    id: 'settings',
    title: 'Settings',
    description: 'Tap here to configure your API key for the AI assistant (optional).',
    targetElement: '[data-tour="settings-icon"]',
    position: 'bottom',
    action: 'Configure'
  },
  {
    id: 'help',
    title: 'Need Help?',
    description: 'Tap here anytime for guides, FAQs, and troubleshooting. You can also ask the AI assistant!',
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

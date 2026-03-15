/**
 * Help system content and tutorial steps
 *
 * Documentation describes what the app does in plain, simple language.
 * Each section focuses on a single topic with clear descriptions.
 */

import type { HelpSection, TutorialStep } from '../types';

export const helpSections: HelpSection[] = [
  {
    id: 'quick-start',
    title: 'Quick Start Guide',
    icon: '🚀',
    category: 'getting-started',
    order: 1,
    keywords: ['start', 'begin', 'first', 'new', 'game', 'getting started', 'setup'],
    content: `# Quick Start Guide

## Home Screen

The home screen has these buttons:

- **Start New Game** (or **Resume Game** if one is in progress)
- **Roster** — add and manage your players
- **Formations** — create and edit team formations
- **Stats** — view season statistics
- **Settings** — configure game clock options

The number of players on your roster is shown under the Start New Game button.

## Setting Up Your Roster

1. Tap **Roster** on the home screen
2. Tap **+ Add Player**
3. Enter the player's name and jersey number
4. Tap **Save**
5. Repeat for each player

You can also import players from a CSV file. See [Roster Management](#roster) for details.

## Starting a Game

1. Tap **Start New Game** on the home screen
2. Choose a formation and review player assignments
3. Tap **Start Game**
4. The timer begins in a paused state — tap the play button to start it

## Making Swaps During a Game

1. Tap a player to select them (a red ring appears)
2. Tap another player to stage a swap
3. A ghost preview shows where each player will move
4. Swipe up on the orange bar at the bottom to execute all staged swaps
5. To cancel a single swap, tap its ghost preview
6. To cancel all staged swaps, swipe down on the orange bar

## Color Indicators

Player cards are color-coded by how long they've been in their current zone:

| Color | Time |
|-------|------|
| 🟢 Green | Less than 10 minutes |
| 🟡 Yellow | 10 to 15 minutes |
| 🔴 Red | More than 15 minutes |

## Ending a Game

Tap the **← Back** button to return to the home screen. Your game data is saved automatically and appears in Stats.
    `
  },
  {
    id: 'timer-system',
    title: 'Timer System',
    icon: '⏱️',
    category: 'features',
    order: 2,
    keywords: ['timer', 'time', 'clock', 'pause', 'zone', 'field', 'bench', 'half', 'halftime', 'water break', 'period', 'overtime'],
    content: `# Timer System

## Zone-Based Timing

The app tracks time in two zones: **Field** and **Bench**.

A player's timer resets only when they cross the field/bench boundary. Moving between positions on the field (for example, from Left Defense to Right Forward) does not reset the timer.

### Example

\`\`\`
Player at Left Defense (8 min)
  → moves to Right Forward (still 8 min — stays on field)
  → moves to Bench (resets to 0 min bench time)
\`\`\`

## Color Codes

Player cards change color based on time in their current zone:

| Color | Time |
|-------|------|
| 🟢 Green | Less than 10 minutes |
| 🟡 Yellow | 10 to 15 minutes |
| 🔴 Red | More than 15 minutes |

When a field player reaches 15 minutes, a yellow alert ring appears on their card and the device vibrates.

## Pause Button

The pause button (top-right of the game screen) freezes the game clock and all player timers at the same time. Tap it again to resume.

## Game Clock Modes

The app supports three clock modes, configured in [Settings](#settings):

- **Simple Clock** — a single continuous timer with no periods
- **Two Halves** — two 30-minute halves with an auto-pause at halftime
- **Two Halves + Water Breaks** — each half has a water break at the 15-minute mark, with auto-pauses at water breaks and halftime

When a period ends, an overlay appears with these options:
- **Continue** — keeps the timer running past the period end (overtime is displayed as +MM:SS in yellow)
- **Start Next Period** — advances to the next period and resets the period timer
- **End Game** — available at the end of the final period
    `
  },
  {
    id: 'player-rotations',
    title: 'Player Rotations',
    icon: '🔄',
    category: 'features',
    order: 3,
    keywords: ['rotation', 'swap', 'substitute', 'change', 'switch', 'stage', 'execute', 'ghost'],
    content: `# Player Rotations

## Staging a Swap

1. Tap a player (on the field or bench) to select them — a red ring appears
2. Tap another player to stage a swap between them
3. Ghost previews appear showing where each player will move
4. The selected player appears faded to indicate they are staged to move

You can stage multiple swaps before executing them.

## Executing Swaps

When one or more swaps are staged, an orange bar appears at the bottom of the screen.

- **Swipe up** on the orange bar to execute all staged swaps at once
- The bar turns green as you swipe up, and shows "Release to execute!" at the threshold

## Clearing Swaps

- **Swipe down** on the orange bar to clear all staged swaps
- **Tap a ghost preview** to remove just that one swap

## Field-to-Field Swaps

You can swap two players who are both on the field. This switches their positions without affecting their timers or rotation counts.

## Rotation Counting

A rotation is counted each time a player crosses the field/bench boundary:

- Field → Bench = 1 rotation
- Bench → Field = 1 rotation
- Field → Field (position change) = 0 rotations

## Moving a Player to an Empty Slot

If there is an open position on the field, select a bench player and then tap the empty slot to move them directly onto the field.
    `
  },
  {
    id: 'formations',
    title: 'Formations',
    icon: '📋',
    category: 'features',
    order: 4,
    keywords: ['formation', 'template', 'custom', 'builder', 'position', 'layout', '3-3-2', '3-4-1', 'create', 'edit', 'delete'],
    content: `# Formations

## What Formations Are

A formation defines how many players are in each row on the field (Defense, Midfield, Forward). The goalkeeper is always included separately. The app comes with built-in formations like 3-3-2 and 3-4-1.

## Formations Screen

Tap **Formations** on the home screen to see all your formations. Each formation shows:

- A dot preview of the layout
- The formation name and structure (e.g., "3-3-2 + GK")
- Position labels (e.g., LD, CD, RD, LM, CM, RM, LF, RF, GK)

Tap a formation card to select it as the active formation. The active formation has a red checkmark.

## Creating a Formation

1. Tap **+ New** in the top-right corner (or tap the "Create New Formation" card at the bottom)
2. Enter a name for the formation
3. Use the **+** and **−** buttons to set how many players are in each row
4. Choose the position type for each row (Defense, Midfield, or Forward)
5. A live preview updates as you make changes
6. Position labels (like LD, CM, RF) are generated automatically based on the number of players in each row
7. Tap **Save** when done

## Editing and Deleting

Each formation card has **Edit** and **Delete** buttons at the bottom. Editing opens the same builder screen. Deleting asks for confirmation before removing the formation.

## Pre-Game Formation Setup

When you start a new game, you see the Formation Setup screen. Pick a formation and the app assigns players to positions. You can adjust assignments before tapping Start Game.

## Changing Formation During a Game

During a game, tap the formation name shown above the field. A picker appears with all your formations. Selecting a different formation reassigns field players to fit the new layout. The goalkeeper and bench players stay where they are. Any staged swaps are cleared.
    `
  },
  {
    id: 'season-stats',
    title: 'Viewing Statistics',
    icon: '📊',
    category: 'features',
    order: 5,
    keywords: ['stats', 'statistics', 'data', 'history', 'games', 'fairness', 'time'],
    content: `# Viewing Statistics

## Accessing Stats

Tap **Stats** on the home screen.

## Games Summary

Shows the total number of completed games. If a game is currently in progress, that is noted separately.

## Fairness Report

The fairness report shows:

- **Average Time** — the average playing time per player across all games
- **Balance** — displays "Fair" if playing time is evenly distributed, or "Check" if it is uneven
- **Least Time** — the player with the least total playing time
- **Most Time** — the player with the most total playing time

If the balance indicator shows "Check," a note appears explaining that playing time is uneven.

## Player Statistics

Each player's card shows:

- **Total Time** — total playing time across all games
- **Games** — number of games played
- **Position Breakdown** — time spent at each position type (GK, DEF, MID, FWD)

Players are listed in order from most to least total playing time.
    `
  },
  {
    id: 'roster',
    title: 'Roster Management',
    icon: '👥',
    category: 'features',
    order: 6,
    keywords: ['roster', 'player', 'add', 'edit', 'remove', 'import', 'export', 'csv', 'team'],
    content: `# Roster Management

## Roster Screen

Tap **Roster** on the home screen. The roster shows all players with their jersey number, name, and preferred positions.

## Adding a Player

1. Tap **+ Add Player**
2. Enter the player's name and jersey number
3. Optionally set preferred positions
4. Tap **Save**

## Editing a Player

Tap the **Edit** button on a player's card to change their name, number, or preferred positions.

## Removing a Player

Tap the **Remove** button on a player's card. A confirmation prompt appears before the player is removed.

## CSV Import

Tap **Import CSV** to load players from a CSV file. After selecting a file, a confirmation screen shows what will be imported. You can choose to:

- **Merge** — adds new players and updates existing ones that match by jersey number
- **Replace** — removes all current players and replaces them with the imported list

If the file has errors, an error screen explains what went wrong and which rows had problems.

CSV import is not available while a game is in progress.

## CSV Export

Tap **Export CSV** to download your current roster as a CSV file.
    `
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    category: 'reference',
    order: 7,
    keywords: ['settings', 'clock', 'mode', 'halves', 'simple', 'water break', 'configure', 'options'],
    content: `# Settings

## Accessing Settings

Tap **Settings** on the home screen.

## Game Clock Mode

The main setting is the game clock mode. There are three options:

### ⏱️ Simple Clock
A single continuous timer for the whole game. No periods or breaks.

### ⏸️ Two Halves
The game is split into two 30-minute halves. The timer automatically pauses at halftime and an overlay appears.

### 💧 Two Halves + Water Breaks
Each half has a water break at the 15-minute mark. The timer automatically pauses at water breaks and at halftime.

## When Settings Apply

Clock mode changes apply to the next game you start. If a game is already in progress, a yellow notice explains that the change will take effect on the next game.
    `
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🐛',
    category: 'reference',
    order: 8,
    keywords: ['troubleshooting', 'problem', 'issue', 'bug', 'error', 'fix', 'data', 'offline'],
    content: `# Troubleshooting

## Timer Not Updating

- Check if the game is paused (the pause button shows a play icon when paused)
- Refresh the page — the timer recalculates on load
- If the issue continues, end the game and start a new one

## Cannot Start Game

You need enough active players to fill the formation (at minimum, 1 goalkeeper and enough field players for the selected formation). Go to Roster and make sure you have enough players added.

## Player Not Appearing

- Make sure you tapped **Save** after adding the player
- Try refreshing the page

## Stats Look Wrong

- Make sure games were ended properly (tap **← Back** to return home)
- Only completed games appear in season statistics

## App Will Not Load

1. Hard refresh: **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac)
2. Clear the service worker: DevTools → Application → Service Workers → Unregister, then refresh
3. Clear browser cache: Browser settings → Clear browsing data

## Data Storage

All data is stored locally in your browser. It is not synced to the cloud. Clearing your browser data will delete your games and roster. The app works fully offline once loaded.

## Supported Devices

The app works on any modern browser. It is optimized for iPad (Safari) and also works on iPhone, Android tablets and phones, and desktop browsers.

## Emergency Reset

⚠️ **This deletes all data** — roster, games, and stats.

1. Open browser DevTools (F12)
2. Go to Application → IndexedDB
3. Right-click "RaidersGameDB" → Delete
4. Refresh the page

## Reporting a Bug

When reporting an issue, include:
- The version number (shown at the bottom of the home screen)
- Your device and browser
- Steps to reproduce the problem
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

# ⚽ Soccer Game Manager

A Progressive Web App (PWA) designed for managing player rotations during recreational soccer games. Built specifically for iPad Mini in portrait mode, optimized for sideline use.

## ✨ Features

- **Player Roster Management**: Add up to 14 players with position preferences
- **Live Game Management**: Visual 3-3-2-1 formation display with tap-to-swap functionality
- **Smart Rotation Tracking**: Automatically tracks playing time per player per position
- **Fairness Analytics**: Real-time statistics showing minutes played and position distribution
- **Offline-First**: Works completely offline using IndexedDB
- **Touch-Optimized**: Large touch targets designed for one-handed operation
- **PWA Support**: Install to home screen for app-like experience

## 🏗️ Technical Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v3
- **State Management**: Zustand
- **Database**: IndexedDB (via Dexie.js)
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa with Workbox

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploying

The app can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your Git repository
- **GitHub Pages**: Use GitHub Actions to deploy
- **Cloudflare Pages**: Connect repository or upload `dist`

## 📱 Using on iPad

1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. The app will now work offline and feel like a native app

## 🎮 How to Use

### Setting Up Your Team

1. **Manage Roster**: Add your 14 players
   - Enter name and jersey number
   - Optionally set position preferences (GK, DEF, MID, FWD)

### During a Game

1. **Start New Game**: App auto-assigns positions based on preferences
2. **Manage Rotations**:
   - Tap a player to select them
   - Tap another player to swap positions
   - Timer tracks playing time automatically
3. **View Stats**: See fairness metrics and playing time distribution

### After the Game

- All rotation data is automatically saved
- View season statistics to ensure fair playing time
- Check which positions each player has played

## 🏛️ Architecture

### Data Models

```typescript
Player {
  id: string
  name: string
  number: number
  preferredPositions: Position[]
  isActive: boolean
}

GameSession {
  id: string
  date: Date
  rotations: Rotation[]
  isActive: boolean
}

Rotation {
  id: string
  timestamp: Date
  assignments: Record<playerId, Position>
}
```

### State Management

- **Zustand Store**: Runtime state (current game, UI state, timer)
- **IndexedDB**: Persistent storage (players, games, rotations)
- **Automatic Sync**: Store actions automatically sync to database

### Offline Support

- **Service Worker**: Caches all app assets
- **IndexedDB**: All data stored locally
- **No Network Required**: App functions 100% offline

## 🎨 Design Philosophy

1. **Glanceable**: See the field formation at a glance
2. **Touch-Optimized**: Minimum 44x44px touch targets
3. **Portrait-First**: Optimized for holding iPad in one hand
4. **No Thinking Required**: Intuitive gestures, clear visual feedback
5. **Fairness by Design**: Automatic tracking ensures equitable playing time

## 📊 Statistics Tracking

The app tracks:

- **Total playing time** per player
- **Minutes per position** (GK, DEF, MID, FWD)
- **Fairness metrics**: Standard deviation, min/max playing time
- **Position distribution**: Most/least played positions

## 🔧 Development

### Project Structure

```
src/
├── components/     # React components
│   ├── game/      # Game view components
│   ├── home/      # Home screen
│   ├── roster/    # Roster management
│   └── stats/     # Statistics dashboard
├── db/            # IndexedDB layer (Dexie)
├── store/         # Zustand state management
├── types/         # TypeScript type definitions
└── utils/         # Utility functions (stats calculations)
```

### Adding Features

1. **New Position Type**: Update `types/index.ts` FORMATION constant
2. **New Stat**: Add calculation to `utils/stats.ts`
3. **New View**: Create component in `components/` and add to App.tsx

## 🐛 Known Issues / Future Enhancements

- [ ] Generate proper PWA icons (currently using placeholder)
- [ ] Export stats to PDF or CSV
- [ ] Multi-season support
- [ ] Game history review
- [ ] Player availability marking for future games
- [ ] Custom formation support (beyond 3-3-2-1)
- [ ] Suggested rotations based on fairness

## 📝 License

MIT

## 🙏 Acknowledgments

Built with care for youth soccer coaches managing sideline rotations. No more paper lineups!

---

**Note**: To generate PWA icons, use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator):

```bash
# Install PWA Asset Generator
npm install -g pwa-asset-generator

# Generate icons from your SVG
pwa-asset-generator public/icon.svg public --icon-only --favicon
```

/**
 * Main Application Component
 *
 * Philosophy: The app is a state machine. Each view is a distinct mode.
 * Navigation is deliberate, not accidental.
 */

import { useEffect } from 'react';
import { useAppStore } from './store';
import HomeView from './components/home/HomeView';
import RosterView from './components/roster/RosterView';
import GameView from './components/game/GameView';
import StatsView from './components/stats/StatsView';

export default function App() {
  const { currentView, initialize, isLoading, error } = useAppStore();

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            Soccer Game Manager
          </div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center px-4">
          <div className="text-xl font-bold text-red-600 mb-2">Error</div>
          <div className="text-gray-700">{error}</div>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'home' && <HomeView />}
      {currentView === 'roster' && <RosterView />}
      {currentView === 'game' && <GameView />}
      {currentView === 'stats' && <StatsView />}
    </div>
  );
}

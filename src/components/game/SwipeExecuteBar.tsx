/**
 * Swipe Execute Bar Component
 *
 * Philosophy: Intentional action. No accidental swaps.
 * Swipe up to execute all staged swaps, swipe down to clear.
 */

import { useState, useRef, useCallback } from 'react';

interface SwipeExecuteBarProps {
  swapCount: number;
  onExecute: () => void;
  onClear: () => void;
}

export default function SwipeExecuteBar({
  swapCount,
  onExecute,
  onClear,
}: SwipeExecuteBarProps) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const startYRef = useRef<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const EXECUTE_THRESHOLD = -80; // Swipe up 80px to execute
  const CLEAR_THRESHOLD = 60;    // Swipe down 60px to clear

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setSwipeProgress(0);
    setSwipeDirection(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null) return;

    const deltaY = e.touches[0].clientY - startYRef.current;
    setSwipeProgress(deltaY);

    if (deltaY < -20) {
      setSwipeDirection('up');
    } else if (deltaY > 20) {
      setSwipeDirection('down');
    } else {
      setSwipeDirection(null);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeProgress <= EXECUTE_THRESHOLD) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      onExecute();
    } else if (swipeProgress >= CLEAR_THRESHOLD) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onClear();
    }

    startYRef.current = null;
    setSwipeProgress(0);
    setSwipeDirection(null);
  }, [swipeProgress, onExecute, onClear]);

  // Calculate visual feedback
  const executeProgress = Math.min(1, Math.abs(Math.min(0, swipeProgress)) / Math.abs(EXECUTE_THRESHOLD));
  const clearProgress = Math.min(1, Math.max(0, swipeProgress) / CLEAR_THRESHOLD);

  const getBackgroundColor = () => {
    if (swipeDirection === 'up') {
      return executeProgress >= 1
        ? 'bg-green-500'
        : 'bg-gradient-to-t from-orange-500 to-green-500';
    }
    if (swipeDirection === 'down') {
      return clearProgress >= 1
        ? 'bg-red-400'
        : 'bg-gradient-to-b from-orange-500 to-red-400';
    }
    return 'bg-orange-500';
  };

  const getMessage = () => {
    if (swipeDirection === 'up') {
      return executeProgress >= 1
        ? '✓ Release to execute!'
        : '↑ Swipe up to execute';
    }
    if (swipeDirection === 'down') {
      return clearProgress >= 1
        ? '✗ Release to clear'
        : '↓ Swipe down to clear';
    }
    return `${swapCount} swap${swapCount !== 1 ? 's' : ''} staged`;
  };

  return (
    <div
      ref={barRef}
      className={`${getBackgroundColor()} text-white py-4 px-6 transition-colors touch-none select-none`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${Math.max(-20, Math.min(20, swipeProgress * 0.2))}px)`,
      }}
    >
      {/* Swipe handle */}
      <div className="flex justify-center mb-2">
        <div className={`w-12 h-1.5 rounded-full transition-colors ${
          swipeDirection === 'up' ? 'bg-green-200' :
          swipeDirection === 'down' ? 'bg-red-200' :
          'bg-white/40'
        }`} />
      </div>

      {/* Content */}
      <div className="text-center">
        <div className="font-bold text-lg">
          {getMessage()}
        </div>

        {/* Progress indicator */}
        {swipeDirection && (
          <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                swipeDirection === 'up' ? 'bg-green-300' : 'bg-red-300'
              }`}
              style={{
                width: `${(swipeDirection === 'up' ? executeProgress : clearProgress) * 100}%`
              }}
            />
          </div>
        )}

        {/* Hint when idle */}
        {!swipeDirection && (
          <div className="text-white/70 text-sm mt-1">
            Drag to execute or clear
          </div>
        )}
      </div>
    </div>
  );
}

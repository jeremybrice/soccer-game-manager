/**
 * Draggable Player Card Component
 *
 * Philosophy: Press and hold to drag. Visual feedback on all states.
 * Wraps PlayerCard with touch drag functionality.
 */

import { useRef, useCallback } from 'react';
import type { Player } from '../../types';
import { useDragDrop } from './DragDropContext';
import PlayerCard from './PlayerCard';

interface DraggablePlayerCardProps {
  player: Player;
  variant?: 'field' | 'bench';
  minutesAtPosition?: number;
  positionLabel?: string;
  benchTime?: number;
  isAlerted?: boolean;
  // Ghost preview props
  ghostPlayer?: Player | null;
  isFadedOut?: boolean;
  // Callback when ghost is tapped (to clear swap)
  onGhostTap?: () => void;
}

export default function DraggablePlayerCard({
  player,
  variant = 'field',
  minutesAtPosition = 0,
  positionLabel,
  benchTime = 0,
  isAlerted = false,
  ghostPlayer = null,
  isFadedOut = false,
  onGhostTap,
}: DraggablePlayerCardProps) {
  const { dragState, startDrag, updateDragPosition, setDropTarget, endDrag } = useDragDrop();
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const isDragging = dragState.draggedPlayerId === player.id;
  const isDropTarget = dragState.dropTargetId === player.id;
  const isAnyDragging = dragState.draggedPlayerId !== null;

  // Handle touch start - start long press timer
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };

    // Long press to start drag (300ms)
    longPressTimerRef.current = window.setTimeout(() => {
      isDraggingRef.current = true;
      startDrag(player.id, player, { x: touch.clientX, y: touch.clientY });
    }, 300);
  }, [player, startDrag]);

  // Handle touch move - update drag position or detect as drop target
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];

    // If we moved before long press completed, cancel the timer
    if (longPressTimerRef.current && startPosRef.current) {
      const dx = Math.abs(touch.clientX - startPosRef.current.x);
      const dy = Math.abs(touch.clientY - startPosRef.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // If we're the one dragging, update position
    if (isDraggingRef.current && dragState.draggedPlayerId === player.id) {
      e.preventDefault();
      updateDragPosition({ x: touch.clientX, y: touch.clientY });

      // Check what element is under the touch point
      const elementsUnder = document.elementsFromPoint(touch.clientX, touch.clientY);
      let foundDropTarget = false;

      for (const elem of elementsUnder) {
        const dropPlayerId = (elem as HTMLElement).dataset?.playerId;
        if (dropPlayerId && dropPlayerId !== player.id) {
          setDropTarget(dropPlayerId);
          foundDropTarget = true;
          break;
        }
      }

      if (!foundDropTarget) {
        setDropTarget(null);
      }
    }
  }, [dragState.draggedPlayerId, player.id, updateDragPosition, setDropTarget]);

  // Handle touch end - complete or cancel drag
  const handleTouchEnd = useCallback(() => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If we were dragging, end the drag
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      endDrag();
    }

    startPosRef.current = null;
  }, [endDrag]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isDraggingRef.current = false;
    startPosRef.current = null;
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative"
      data-player-id={player.id}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Original player card (possibly faded or dragging placeholder) */}
      <PlayerCard
        player={player}
        variant={variant}
        minutesAtPosition={minutesAtPosition}
        positionLabel={positionLabel}
        benchTime={benchTime}
        isAlerted={isAlerted}
        isDragging={isDragging}
        isDropTarget={isDropTarget && !isDragging}
        isFadedOut={isFadedOut && !isDragging}
      />

      {/* Ghost overlay - shows incoming player */}
      {ghostPlayer && !isDragging && (
        <div
          className="absolute inset-0"
          onClick={(e) => {
            e.stopPropagation();
            onGhostTap?.();
          }}
        >
          <PlayerCard
            player={ghostPlayer}
            isGhost={true}
            onClick={onGhostTap}
          />
        </div>
      )}

      {/* Drop target indicator when another player is being dragged over this one */}
      {isDropTarget && isAnyDragging && !isDragging && (
        <div className="absolute inset-0 rounded-xl ring-4 ring-orange-400 ring-offset-2 pointer-events-none animate-pulse" />
      )}
    </div>
  );
}

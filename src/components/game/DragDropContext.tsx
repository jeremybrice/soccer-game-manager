/**
 * Drag-Drop Context for Player Swaps
 *
 * Philosophy: Touch-first. Visual feedback. No accidents.
 * Manages drag state across field and bench components.
 */

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import type { Player } from '../../types';

interface DragState {
  draggedPlayerId: string | null;
  draggedPlayer: Player | null;
  dragPosition: { x: number; y: number } | null;
  dropTargetId: string | null;
}

interface DragDropContextValue {
  dragState: DragState;
  startDrag: (playerId: string, player: Player, startPos: { x: number; y: number }) => void;
  updateDragPosition: (pos: { x: number; y: number }) => void;
  setDropTarget: (playerId: string | null) => void;
  endDrag: () => { draggedPlayerId: string; dropTargetId: string } | null;
  cancelDrag: () => void;
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider');
  }
  return context;
}

interface DragDropProviderProps {
  children: ReactNode;
  onSwapStaged: (player1Id: string, player2Id: string) => void;
}

export function DragDropProvider({ children, onSwapStaged }: DragDropProviderProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedPlayerId: null,
    draggedPlayer: null,
    dragPosition: null,
    dropTargetId: null,
  });

  // Use ref to track drop target for endDrag (state may be stale in event handlers)
  const dropTargetRef = useRef<string | null>(null);

  const startDrag = useCallback((playerId: string, player: Player, startPos: { x: number; y: number }) => {
    // Haptic feedback on drag start
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setDragState({
      draggedPlayerId: playerId,
      draggedPlayer: player,
      dragPosition: startPos,
      dropTargetId: null,
    });
    dropTargetRef.current = null;
  }, []);

  const updateDragPosition = useCallback((pos: { x: number; y: number }) => {
    setDragState(prev => ({
      ...prev,
      dragPosition: pos,
    }));
  }, []);

  const setDropTarget = useCallback((playerId: string | null) => {
    dropTargetRef.current = playerId;
    setDragState(prev => ({
      ...prev,
      dropTargetId: playerId,
    }));
  }, []);

  const endDrag = useCallback(() => {
    const { draggedPlayerId } = dragState;
    const dropTargetId = dropTargetRef.current;

    if (draggedPlayerId && dropTargetId && draggedPlayerId !== dropTargetId) {
      // Haptic feedback on successful drop
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      // Stage the swap
      onSwapStaged(draggedPlayerId, dropTargetId);

      // Reset state
      setDragState({
        draggedPlayerId: null,
        draggedPlayer: null,
        dragPosition: null,
        dropTargetId: null,
      });
      dropTargetRef.current = null;

      return { draggedPlayerId, dropTargetId };
    }

    // No valid drop - cancel
    setDragState({
      draggedPlayerId: null,
      draggedPlayer: null,
      dragPosition: null,
      dropTargetId: null,
    });
    dropTargetRef.current = null;
    return null;
  }, [dragState.draggedPlayerId, onSwapStaged]);

  const cancelDrag = useCallback(() => {
    setDragState({
      draggedPlayerId: null,
      draggedPlayer: null,
      dragPosition: null,
      dropTargetId: null,
    });
    dropTargetRef.current = null;
  }, []);

  return (
    <DragDropContext.Provider
      value={{
        dragState,
        startDrag,
        updateDragPosition,
        setDropTarget,
        endDrag,
        cancelDrag,
      }}
    >
      {children}

      {/* Floating drag indicator */}
      {dragState.draggedPlayer && dragState.dragPosition && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: dragState.dragPosition.x,
            top: dragState.dragPosition.y,
          }}
        >
          <div className="w-20 h-20 bg-orange-500 text-white rounded-xl shadow-2xl flex flex-col items-center justify-center opacity-90 scale-110 border-4 border-orange-300">
            <div className="text-2xl font-bold">{dragState.draggedPlayer.number}</div>
            <div className="text-xs">{dragState.draggedPlayer.name.split(' ')[0]}</div>
          </div>
        </div>
      )}
    </DragDropContext.Provider>
  );
}

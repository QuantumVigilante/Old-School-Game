/**
 * @fileoverview Custom hook for keyboard input.
 * Tracks which keys are currently pressed for responsive game controls.
 * Separates input handling from game logic per Code Quality criteria.
 */
import { useEffect, useRef } from 'react';

/**
 * Tracks the current state of specified keyboard keys.
 * Uses refs to avoid re-renders — game loop reads values directly.
 * @returns {React.MutableRefObject<Set<string>>} Ref containing set of currently pressed keys
 */
export function useKeyboard() {
  const keysPressed = useRef(new Set());

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default for game keys to avoid scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    // Clear all keys when window loses focus to prevent stuck keys
    const handleBlur = () => {
      keysPressed.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return keysPressed;
}

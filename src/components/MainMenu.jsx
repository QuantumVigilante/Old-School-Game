/**
 * @fileoverview Main menu with stunning visual design and keyboard navigation.
 * ACCESSIBILITY: Fully keyboard-navigable, ARIA labels, focus management.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { useVoiceInput } from '../hooks/useVoiceInput';
import './MainMenu.css';

/**
 * Main menu screen with animated title, controls, and accessibility features.
 */
export default function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const score = useGameStore((s) => s.player.score);
  const coins = useGameStore((s) => s.player.coins);
  const nextLevel = useGameStore((s) => s.nextLevel);
  const setPhase = useGameStore((s) => s.setPhase);
  const { isSupported: voiceSupported } = useVoiceInput();

  const startButtonRef = useRef(null);

  // Focus the start button when menu appears
  useEffect(() => {
    if (phase === 'menu' && startButtonRef.current) {
      startButtonRef.current.focus();
    }
  }, [phase]);

  const handleStart = useCallback(() => {
    startGame();
  }, [startGame]);

  const handleRestart = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const handleNextLevel = useCallback(() => {
    nextLevel();
    // After a small delay, start playing the loaded level
    setTimeout(() => {
      setPhase('playing');
      useGameStore.setState({ levelStartTime: Date.now() });
    }, 500);
  }, [nextLevel, setPhase]);

  // Main Menu
  if (phase === 'menu') {
    return (
      <div className="menu-overlay" role="dialog" aria-label="Main Menu">
        <div className="menu-container">
          <div className="menu-stars" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <h1 className="menu-title">
            <span className="title-mario">MARIO</span>
            <span className="title-sub">Infinite Kingdoms</span>
          </h1>

          <div className="menu-tagline">🍄 AI-Powered Procedural Adventures 🌟</div>

          <button
            ref={startButtonRef}
            className="menu-button menu-button-primary"
            onClick={handleStart}
            aria-label="Start new game"
          >
            <span className="btn-icon">▶</span>
            START GAME
          </button>

          <div className="menu-controls" aria-label="Game controls">
            <h2 className="controls-title">Controls</h2>
            <div className="control-grid">
              <div className="control-item">
                <kbd>←</kbd><kbd>→</kbd><span>or</span><kbd>A</kbd><kbd>D</kbd>
                <span className="control-label">Move</span>
              </div>
              <div className="control-item">
                <kbd>↑</kbd><span>or</span><kbd>W</kbd><span>or</span><kbd>Space</kbd>
                <span className="control-label">Jump</span>
              </div>
            </div>
          </div>

          {voiceSupported && (
            <div className="menu-badge" aria-label="Voice commands available">
              🎤 Voice Commands Available
            </div>
          )}

          <div className="menu-footer">
            <span>Powered by</span>
            <span className="gemini-badge">✨ Gemini AI</span>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (phase === 'gameover') {
    return (
      <div className="menu-overlay gameover-overlay" role="dialog" aria-label="Game Over">
        <div className="menu-container gameover-container">
          <h1 className="gameover-title">GAME OVER</h1>
          <div className="gameover-stats">
            <div className="stat-item">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Coins</span>
              <span className="stat-value">🪙 {coins}</span>
            </div>
          </div>
          <button
            className="menu-button menu-button-primary"
            onClick={handleRestart}
            autoFocus
            aria-label="Try again"
          >
            🔄 TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  // Victory Screen
  if (phase === 'victory') {
    return (
      <div className="menu-overlay victory-overlay" role="dialog" aria-label="Level Complete">
        <div className="menu-container victory-container">
          <h1 className="victory-title">⭐ LEVEL COMPLETE! ⭐</h1>
          <div className="gameover-stats">
            <div className="stat-item">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Coins</span>
              <span className="stat-value">🪙 {coins}</span>
            </div>
          </div>
          <button
            className="menu-button menu-button-primary"
            onClick={handleNextLevel}
            autoFocus
            aria-label="Continue to next level"
          >
            ➡️ NEXT LEVEL
          </button>
        </div>
      </div>
    );
  }

  return null;
}

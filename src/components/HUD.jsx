/**
 * @fileoverview Heads-Up Display (HUD) overlay.
 * Shows health, coins, score, and level number.
 * ACCESSIBILITY: Uses ARIA labels, high contrast, semantic HTML.
 */
import { memo } from 'react';
import useGameStore from '../stores/gameStore';
import './HUD.css';

/**
 * Game HUD displaying vital player stats.
 * Memoized to avoid re-renders from unrelated store changes.
 */
const HUD = memo(function HUD() {
  const health = useGameStore((s) => s.player.health);
  const coins = useGameStore((s) => s.player.coins);
  const score = useGameStore((s) => s.player.score);
  const levelNumber = useGameStore((s) => s.levelNumber);
  const phase = useGameStore((s) => s.phase);

  if (phase !== 'playing' && phase !== 'victory') return null;

  return (
    <div className="hud" role="status" aria-label="Game status">
      <div className="hud-row">
        {/* Health Hearts */}
        <div className="hud-item" aria-label={`Health: ${health} of 3`}>
          <span className="hud-label">HP</span>
          <span className="hud-hearts">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`heart ${i < health ? 'heart-full' : 'heart-empty'}`}
                aria-hidden="true"
              >
                {i < health ? '❤️' : '🖤'}
              </span>
            ))}
          </span>
        </div>

        {/* Coins */}
        <div className="hud-item" aria-label={`Coins: ${coins}`}>
          <span className="hud-icon" aria-hidden="true">🪙</span>
          <span className="hud-value">{coins}</span>
        </div>

        {/* Score */}
        <div className="hud-item" aria-label={`Score: ${score}`}>
          <span className="hud-label">SCORE</span>
          <span className="hud-value">{String(score).padStart(6, '0')}</span>
        </div>

        {/* Level */}
        <div className="hud-item" aria-label={`Level ${levelNumber}`}>
          <span className="hud-label">WORLD</span>
          <span className="hud-value">1-{levelNumber}</span>
        </div>
      </div>
    </div>
  );
});

export default HUD;

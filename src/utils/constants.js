/**
 * @fileoverview Game constants shared across modules.
 * Centralizes magic numbers to improve maintainability per Code Quality criteria.
 */

/** Physics constants */
export const PHYSICS = {
  GRAVITY: -20,
  JUMP_FORCE: 8,
  MOVE_SPEED: 6,
  MAX_FALL_SPEED: -30,
  GROUND_FRICTION: 0.85,
  AIR_FRICTION: 0.95,
};

/** Player constants */
export const PLAYER = {
  WIDTH: 0.8,
  HEIGHT: 1.2,
  DEPTH: 0.8,
  MAX_HEALTH: 3,
  INVINCIBILITY_DURATION: 1500, // ms
  RESPAWN_HEIGHT: -10, // Y threshold for falling off map
};

/** Camera constants */
export const CAMERA = {
  OFFSET: [5, 4, 10],
  LERP_SPEED: 0.08,
  LOOK_AHEAD: 2,
};

/** Level generation constraints (also enforced by validator) */
export const LEVEL = {
  MAX_PLATFORMS: 50,
  MAX_ENEMIES: 15,
  MAX_COINS: 30,
  MIN_PLATFORM_WIDTH: 2,
  MAX_GAP: 8,
  MIN_DIFFICULTY: 1,
  MAX_DIFFICULTY: 10,
};

/** Coin constants */
export const COIN = {
  RADIUS: 0.3,
  SPIN_SPEED: 2,
  COLLECT_DISTANCE: 1.2,
  SCORE_VALUE: 100,
};

/** Enemy types and their base properties */
export const ENEMY_TYPES = {
  goomba: {
    color: '#8B4513',
    speed: 1.5,
    patrolRange: 4,
    width: 0.8,
    height: 0.8,
    scoreValue: 200,
  },
  koopa: {
    color: '#228B22',
    speed: 2.0,
    patrolRange: 6,
    width: 0.8,
    height: 1.0,
    scoreValue: 400,
  },
};

/** Platform visual styles */
export const PLATFORM_COLORS = {
  grass: '#4CAF50',
  brick: '#D2691E',
  stone: '#808080',
  ice: '#ADD8E6',
  lava: '#FF4500',
};

/** API configuration */
export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  DEBOUNCE_MS: 300,
  CACHE_TTL: 60000, // 1 minute
};

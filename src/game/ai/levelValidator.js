/**
 * @fileoverview Level data validator.
 * Validates Gemini-generated JSON to ensure levels are playable and safe.
 * SECURITY: Prevents generation of broken/inappropriate content.
 * TESTING: All functions are pure and easily testable.
 */

import { LEVEL } from '../../utils/constants';

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the level data is valid
 * @property {string[]} errors - List of validation error messages
 * @property {Object|null} data - Sanitized level data if valid
 */

/**
 * Validates and sanitizes level data from Gemini API response.
 * Ensures the level is playable: has spawn, reachable platforms, valid enemies.
 *
 * @param {Object} rawData - Raw parsed JSON from Gemini
 * @returns {ValidationResult} Validation result with sanitized data or errors
 */
export function validateLevelData(rawData) {
  const errors = [];

  if (!rawData || typeof rawData !== 'object') {
    return { valid: false, errors: ['Level data is not a valid object'], data: null };
  }

  // Validate platforms
  if (!Array.isArray(rawData.platforms) || rawData.platforms.length === 0) {
    errors.push('No platforms defined');
  } else if (rawData.platforms.length > LEVEL.MAX_PLATFORMS) {
    errors.push(`Too many platforms: ${rawData.platforms.length} (max ${LEVEL.MAX_PLATFORMS})`);
  }

  // Validate each platform
  const validPlatforms = (rawData.platforms || []).filter((p) => {
    if (typeof p.x !== 'number' || typeof p.y !== 'number') return false;
    if (typeof p.width !== 'number' || p.width < LEVEL.MIN_PLATFORM_WIDTH) return false;
    if (p.y < -5 || p.y > 15) return false;
    return true;
  });

  if (validPlatforms.length === 0 && !errors.length) {
    errors.push('No valid platforms after validation');
  }

  // Validate spawn point
  if (!rawData.spawnPoint || typeof rawData.spawnPoint.x !== 'number') {
    errors.push('Missing or invalid spawn point');
  }

  // Validate goal position
  if (!rawData.goalPosition || typeof rawData.goalPosition.x !== 'number') {
    errors.push('Missing or invalid goal position');
  }

  // Validate enemies
  const validEnemies = (rawData.enemies || [])
    .filter((e) => {
      if (typeof e.x !== 'number' || typeof e.y !== 'number') return false;
      if (!['goomba', 'koopa'].includes(e.type)) return false;
      if (!['patrol', 'chase'].includes(e.behavior)) e.behavior = 'patrol';
      return true;
    })
    .slice(0, LEVEL.MAX_ENEMIES);

  // Validate coins
  const validCoins = (rawData.coins || [])
    .filter((c) => typeof c.x === 'number' && typeof c.y === 'number')
    .map((c) => ({ ...c, z: 0, collected: false }))
    .slice(0, LEVEL.MAX_COINS);

  // Check platform reachability (simplified — ensure no gap > MAX_GAP)
  const sortedPlatforms = [...validPlatforms].sort((a, b) => a.x - b.x);
  for (let i = 1; i < sortedPlatforms.length; i++) {
    const prevEnd = sortedPlatforms[i - 1].x + sortedPlatforms[i - 1].width / 2;
    const currStart = sortedPlatforms[i].x - sortedPlatforms[i].width / 2;
    const gap = currStart - prevEnd;
    const heightDiff = Math.abs(sortedPlatforms[i].y - sortedPlatforms[i - 1].y);

    if (gap > LEVEL.MAX_GAP && heightDiff < 4) {
      errors.push(`Unreachable gap of ${gap.toFixed(1)} between platforms ${i - 1} and ${i}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, data: null };
  }

  // Return sanitized data
  return {
    valid: true,
    errors: [],
    data: {
      platforms: validPlatforms.map((p) => ({
        x: p.x,
        y: p.y,
        z: 0,
        width: Math.max(p.width, LEVEL.MIN_PLATFORM_WIDTH),
        height: p.height || 1,
        depth: p.depth || 4,
        type: ['grass', 'brick', 'stone', 'ice', 'lava'].includes(p.type) ? p.type : 'grass',
      })),
      coins: validCoins,
      enemies: validEnemies.map((e) => ({
        x: e.x,
        y: e.y,
        z: 0,
        type: e.type,
        behavior: e.behavior,
      })),
      difficulty: Math.min(10, Math.max(1, rawData.difficulty || 1)),
      spawnPoint: {
        x: rawData.spawnPoint?.x || 2,
        y: rawData.spawnPoint?.y || 2,
        z: 0,
      },
      goalPosition: {
        x: rawData.goalPosition?.x || 80,
        y: rawData.goalPosition?.y || 0,
        z: 0,
      },
    },
  };
}

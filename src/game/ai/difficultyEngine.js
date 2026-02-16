/**
 * @fileoverview Adaptive difficulty engine.
 * Pure functions that calculate the next difficulty level based on player performance.
 * TESTING: All functions are pure and easily unit-testable.
 *
 * @param {Object} stats - Player performance stats
 * @param {number} stats.deaths - Number of deaths in current session
 * @param {number} stats.completionTime - Time in seconds to complete last level
 * @param {number} stats.coinsCollected - Coins collected in last level
 * @param {number} stats.totalCoins - Total coins available in last level
 * @param {number} stats.currentDifficulty - Current difficulty (1-10)
 * @returns {number} New difficulty level (1-10)
 */

import { LEVEL } from '../../utils/constants';

/**
 * Calculates the next difficulty based on player performance metrics.
 * @param {Object} stats - Performance statistics
 * @param {number} stats.deaths - Total deaths this session
 * @param {number} stats.completionTime - Seconds to complete level
 * @param {number} stats.coinsCollected - Coins collected
 * @param {number} stats.totalCoins - Total coins available
 * @param {number} stats.currentDifficulty - Current difficulty (1-10)
 * @returns {number} New difficulty level clamped to [1, 10]
 */
export function calculateNextDifficulty({
  deaths = 0,
  completionTime = 60,
  coinsCollected = 0,
  totalCoins = 1,
  currentDifficulty = 1,
}) {
  let delta = 0;

  // Factor 1: Deaths (more deaths → easier)
  if (deaths >= 5) delta -= 2;
  else if (deaths >= 3) delta -= 1;
  else if (deaths === 0) delta += 1;

  // Factor 2: Completion time (fast → harder, slow → easier)
  const timePerPlatform = completionTime / Math.max(1, currentDifficulty * 3);
  if (timePerPlatform < 3) delta += 1; // Very fast
  else if (timePerPlatform > 10) delta -= 1; // Very slow

  // Factor 3: Coin collection ratio
  const coinRatio = totalCoins > 0 ? coinsCollected / totalCoins : 0;
  if (coinRatio > 0.9) delta += 1; // Thorough explorer
  else if (coinRatio < 0.3) delta -= 1; // Struggling

  // Apply delta, clamp to valid range
  const newDifficulty = currentDifficulty + delta;
  return Math.min(LEVEL.MAX_DIFFICULTY, Math.max(LEVEL.MIN_DIFFICULTY, newDifficulty));
}

/**
 * Computes a difficulty summary string for inclusion in Gemini prompts.
 * @param {number} difficulty - Current difficulty (1-10)
 * @returns {string} Human-readable difficulty description
 */
export function difficultyToDescription(difficulty) {
  if (difficulty <= 2) return 'very easy with wide platforms, few enemies, and short gaps';
  if (difficulty <= 4) return 'beginner-friendly with moderate platform spacing and a few patrolling enemies';
  if (difficulty <= 6) return 'moderate with narrower platforms, larger gaps, and enemies that chase the player';
  if (difficulty <= 8) return 'challenging with small platforms, long gaps, and aggressive enemies';
  return 'extremely difficult with tiny platforms, maximum gaps, and many aggressive enemies';
}

/**
 * @fileoverview Gemini prompt builder for procedural level generation.
 * Constructs structured prompts that request JSON-formatted level data.
 * GOOGLE SERVICES: Uses Gemini for structured output driving the 3D level builder.
 */

import { difficultyToDescription } from './difficultyEngine';
import { LEVEL } from '../../utils/constants';

/**
 * Builds a Gemini prompt that requests a valid level in JSON format.
 * The prompt includes difficulty context, constraints, and exact schema.
 *
 * @param {number} difficulty - Target difficulty (1-10)
 * @param {number} levelNumber - Current level number for theming
 * @param {Object} [playerStats] - Optional player stats for personalization
 * @returns {string} Complete prompt string for Gemini API
 */
export function buildLevelPrompt(difficulty, levelNumber, playerStats = {}) {
  const diffDescription = difficultyToDescription(difficulty);

  return `You are a Mario-style platformer level designer. Generate a 2.5D side-scrolling level as JSON.

DIFFICULTY: ${difficulty}/10 — ${diffDescription}
LEVEL NUMBER: ${levelNumber}
THEME: ${getThemeForLevel(levelNumber)}

CONSTRAINTS:
- Platforms: ${Math.min(8 + difficulty * 3, LEVEL.MAX_PLATFORMS)} total, minimum width ${LEVEL.MIN_PLATFORM_WIDTH}
- The first platform must start at x=0 and be wide (at least 15 units) as a safe starting area
- Maximum gap between platforms: ${Math.max(3, LEVEL.MAX_GAP - (10 - difficulty))} units
- All platforms must be reachable by jumping (max jump height ~4 units, max jump distance ~6 units)
- Enemies: ${Math.min(2 + difficulty, LEVEL.MAX_ENEMIES)} total
- Coins: ${Math.min(5 + difficulty * 2, LEVEL.MAX_COINS)} total, placed on or above platforms
- Goal flag at the far right end of the level
- All z-coordinates should be 0 (2.5D game)
- Platform y-coordinates between -1 and 8
- Level should extend from x=0 to approximately x=${40 + difficulty * 10}

RESPOND WITH ONLY THIS JSON SCHEMA (no markdown, no explanation):
{
  "platforms": [{"x": number, "y": number, "z": 0, "width": number, "height": number, "depth": 4, "type": "grass"|"brick"|"stone"|"ice"}],
  "coins": [{"x": number, "y": number, "z": 0, "collected": false}],
  "enemies": [{"x": number, "y": number, "z": 0, "type": "goomba"|"koopa", "behavior": "patrol"|"chase"}],
  "difficulty": ${difficulty},
  "spawnPoint": {"x": 2, "y": 2, "z": 0},
  "goalPosition": {"x": number, "y": number, "z": 0}
}`;
}

/**
 * Returns a theme string based on level number for variety.
 * @param {number} levelNumber
 * @returns {string} Theme description
 */
function getThemeForLevel(levelNumber) {
  const themes = [
    'Grassy plains with green platforms and blue sky',
    'Underground cave with stone and brick platforms',
    'Sky kingdom with floating platforms high above clouds',
    'Desert canyon with stone platforms and wide gaps',
    'Frost world with ice platforms (slippery!)',
    'Lava castle with dangerous gaps and aggressive enemies',
  ];
  return themes[(levelNumber - 1) % themes.length];
}

/**
 * Builds a prompt for NPC dialog generation.
 * @param {string} npcName - Name of the NPC
 * @param {string} playerMessage - Sanitized player message
 * @param {number} levelNumber - Current level for context
 * @returns {string} Prompt for Gemini
 */
export function buildNPCDialogPrompt(npcName, playerMessage, levelNumber) {
  return `You are ${npcName}, a friendly character in a Mario-style platformer game.
The player is on Level ${levelNumber}. They said: "${playerMessage}"

Respond in character with a short, helpful, and fun reply (1-2 sentences max).
You may give hints about the level, encourage the player, or share a fun observation.
Stay family-friendly and in the Mario universe context.
Respond with only the dialog text, no quotation marks.`;
}

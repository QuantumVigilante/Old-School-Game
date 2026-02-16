/**
 * @fileoverview Central game state management using Zustand.
 * Separates game logic from rendering — all state mutations happen here,
 * components only read slices via selectors for optimal re-renders.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/** @typedef {'menu' | 'playing' | 'paused' | 'gameover' | 'loading' | 'victory'} GamePhase */

/**
 * @typedef {Object} PlayerState
 * @property {number} health - Current health (0-3)
 * @property {number} coins - Coins collected
 * @property {number} score - Total score
 * @property {[number, number, number]} position - [x, y, z]
 * @property {[number, number, number]} velocity - [vx, vy, vz]
 * @property {boolean} isGrounded - Whether the player is on solid ground
 * @property {boolean} isInvincible - Temporary invincibility after hit
 */

/**
 * @typedef {Object} LevelData
 * @property {Array<{x:number, y:number, z:number, width:number, height:number, depth:number, type:string}>} platforms
 * @property {Array<{x:number, y:number, z:number, collected:boolean}>} coins
 * @property {Array<{x:number, y:number, z:number, type:string, behavior:string}>} enemies
 * @property {number} difficulty
 * @property {{x:number, y:number, z:number}} spawnPoint
 * @property {{x:number, y:number, z:number}} goalPosition
 */

/** Default starting level for when Gemini API isn't available */
const DEFAULT_LEVEL = {
  platforms: [
    { x: 0, y: -1, z: 0, width: 20, height: 1, depth: 4, type: 'grass' },
    { x: 25, y: -1, z: 0, width: 8, height: 1, depth: 4, type: 'grass' },
    { x: 15, y: 2, z: 0, width: 4, height: 0.5, depth: 4, type: 'brick' },
    { x: 20, y: 4, z: 0, width: 3, height: 0.5, depth: 4, type: 'brick' },
    { x: 35, y: -1, z: 0, width: 6, height: 1, depth: 4, type: 'grass' },
    { x: 30, y: 2, z: 0, width: 3, height: 0.5, depth: 4, type: 'stone' },
    { x: 45, y: -1, z: 0, width: 10, height: 1, depth: 4, type: 'grass' },
    { x: 42, y: 1.5, z: 0, width: 2, height: 0.5, depth: 4, type: 'brick' },
    { x: 55, y: -1, z: 0, width: 15, height: 1, depth: 4, type: 'grass' },
    { x: 52, y: 3, z: 0, width: 3, height: 0.5, depth: 4, type: 'brick' },
    { x: 58, y: 5, z: 0, width: 3, height: 0.5, depth: 4, type: 'stone' },
    { x: 70, y: -1, z: 0, width: 20, height: 1, depth: 4, type: 'grass' },
  ],
  coins: [
    { x: 3, y: 1, z: 0, collected: false },
    { x: 5, y: 1, z: 0, collected: false },
    { x: 7, y: 1, z: 0, collected: false },
    { x: 15, y: 4, z: 0, collected: false },
    { x: 20, y: 6, z: 0, collected: false },
    { x: 26, y: 1, z: 0, collected: false },
    { x: 28, y: 1, z: 0, collected: false },
    { x: 30, y: 4, z: 0, collected: false },
    { x: 37, y: 1, z: 0, collected: false },
    { x: 45, y: 1, z: 0, collected: false },
    { x: 47, y: 1, z: 0, collected: false },
    { x: 52, y: 5, z: 0, collected: false },
    { x: 58, y: 7, z: 0, collected: false },
    { x: 72, y: 1, z: 0, collected: false },
    { x: 75, y: 1, z: 0, collected: false },
  ],
  enemies: [
    { x: 12, y: 0.5, z: 0, type: 'goomba', behavior: 'patrol' },
    { x: 33, y: 0.5, z: 0, type: 'goomba', behavior: 'patrol' },
    { x: 48, y: 0.5, z: 0, type: 'koopa', behavior: 'chase' },
    { x: 65, y: 0.5, z: 0, type: 'goomba', behavior: 'patrol' },
    { x: 73, y: 0.5, z: 0, type: 'koopa', behavior: 'chase' },
  ],
  difficulty: 1,
  spawnPoint: { x: 0, y: 2, z: 0 },
  goalPosition: { x: 80, y: 0, z: 0 },
};

const useGameStore = create(
  subscribeWithSelector((set, get) => ({
    // --- Game Phase ---
    /** @type {GamePhase} */
    phase: 'menu',
    setPhase: (phase) => set({ phase }),

    // --- Player State ---
    /** @type {PlayerState} */
    player: {
      health: 3,
      coins: 0,
      score: 0,
      position: [0, 2, 0],
      velocity: [0, 0, 0],
      isGrounded: false,
      isInvincible: false,
    },
    setPlayerPosition: (pos) =>
      set((state) => ({ player: { ...state.player, position: pos } })),
    setPlayerVelocity: (vel) =>
      set((state) => ({ player: { ...state.player, velocity: vel } })),
    setPlayerGrounded: (grounded) =>
      set((state) => ({ player: { ...state.player, isGrounded: grounded } })),

    collectCoin: (coinIndex) =>
      set((state) => {
        const newCoins = [...state.levelData.coins];
        if (newCoins[coinIndex] && !newCoins[coinIndex].collected) {
          newCoins[coinIndex] = { ...newCoins[coinIndex], collected: true };
          return {
            player: {
              ...state.player,
              coins: state.player.coins + 1,
              score: state.player.score + 100,
            },
            levelData: { ...state.levelData, coins: newCoins },
          };
        }
        return state;
      }),

    takeDamage: () =>
      set((state) => {
        if (state.player.isInvincible) return state;
        const newHealth = state.player.health - 1;
        if (newHealth <= 0) {
          return {
            player: { ...state.player, health: 0 },
            phase: 'gameover',
          };
        }
        return {
          player: { ...state.player, health: newHealth, isInvincible: true },
        };
      }),

    clearInvincibility: () =>
      set((state) => ({
        player: { ...state.player, isInvincible: false },
      })),

    // --- Level ---
    /** @type {LevelData} */
    levelData: DEFAULT_LEVEL,
    levelNumber: 1,
    setLevelData: (data) => set({ levelData: data }),

    // --- Difficulty ---
    difficulty: 1,
    deaths: 0,
    completionTimes: [],
    incrementDeaths: () => set((state) => ({ deaths: state.deaths + 1 })),
    addCompletionTime: (time) =>
      set((state) => ({
        completionTimes: [...state.completionTimes, time],
      })),
    setDifficulty: (d) => set({ difficulty: Math.min(10, Math.max(1, d)) }),

    // --- NPC Dialog ---
    activeDialog: null,
    dialogHistory: [],
    setActiveDialog: (dialog) => set({ activeDialog: dialog }),
    addDialogEntry: (entry) =>
      set((state) => ({
        dialogHistory: [...state.dialogHistory, entry],
      })),

    // --- Voice Input ---
    voiceTranscript: '',
    isListening: false,
    setVoiceTranscript: (t) => set({ voiceTranscript: t }),
    setIsListening: (l) => set({ isListening: l }),

    // --- Timer ---
    levelStartTime: 0,
    setLevelStartTime: (t) => set({ levelStartTime: t }),

    // --- Reset ---
    resetGame: () =>
      set({
        phase: 'playing',
        player: {
          health: 3,
          coins: 0,
          score: 0,
          position: [...DEFAULT_LEVEL.spawnPoint ? [DEFAULT_LEVEL.spawnPoint.x, DEFAULT_LEVEL.spawnPoint.y, DEFAULT_LEVEL.spawnPoint.z] : [0, 2, 0]],
          velocity: [0, 0, 0],
          isGrounded: false,
          isInvincible: false,
        },
        levelData: DEFAULT_LEVEL,
        levelNumber: 1,
        difficulty: 1,
        deaths: 0,
        completionTimes: [],
        activeDialog: null,
        dialogHistory: [],
        levelStartTime: Date.now(),
      }),

    startGame: () =>
      set({
        phase: 'playing',
        levelStartTime: Date.now(),
        player: {
          health: 3,
          coins: 0,
          score: 0,
          position: [0, 2, 0],
          velocity: [0, 0, 0],
          isGrounded: false,
          isInvincible: false,
        },
      }),

    nextLevel: () =>
      set((state) => ({
        phase: 'loading',
        levelNumber: state.levelNumber + 1,
      })),
  }))
);

export default useGameStore;

/**
 * @fileoverview Enemy entities — STABLE version using kinematicPosition bodies.
 * Enemies use kinematic bodies (not dynamic) so they don't fall through platforms,
 * jitter, or interact chaotically with physics. Movement is purely animated.
 * Collision with player detected via distance check with debounce.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import useGameStore from '../../stores/gameStore';
import { ENEMY_TYPES } from '../../utils/constants';

/**
 * Single enemy component with stable FSM behavior.
 * Uses kinematicPosition — no physics simulation, just animated position.
 */
function EnemyUnit({ data, index }) {
  const rigidBodyRef = useRef(null);
  const meshRef = useRef(null);
  const aliveRef = useRef(true);
  const lastDamageTime = useRef(0);
  const stateRef = useRef({
    startX: data.x,
    currentX: data.x,
    direction: 1,
    state: data.behavior === 'chase' ? 'patrol' : 'patrol',
  });

  const config = ENEMY_TYPES[data.type] || ENEMY_TYPES.goomba;

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || !aliveRef.current) return;

    const phase = useGameStore.getState().phase;
    if (phase !== 'playing') return;

    const playerPos = useGameStore.getState().player.position;
    const st = stateRef.current;

    const dx = playerPos[0] - st.currentX;
    const dy = playerPos[1] - data.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // --- State transitions ---
    if (data.behavior === 'chase' && dist < 8) {
      st.state = 'chase';
    } else if (data.behavior === 'chase' && dist >= 12) {
      st.state = 'patrol';
    }

    // --- Movement (purely animated, no physics) ---
    let moveSpeed = 0;
    if (st.state === 'patrol') {
      moveSpeed = st.direction * config.speed;
      if (st.currentX > st.startX + config.patrolRange) st.direction = -1;
      if (st.currentX < st.startX - config.patrolRange) st.direction = 1;
    } else if (st.state === 'chase') {
      moveSpeed = Math.sign(dx) * config.speed * 1.3;
    }

    // Clamp delta to prevent huge jumps on frame stutters
    const clampedDelta = Math.min(delta, 0.05);
    st.currentX += moveSpeed * clampedDelta;

    // Set kinematic position (stable, no physics jitter)
    rigidBodyRef.current.setNextKinematicTranslation({
      x: st.currentX,
      y: data.y,
      z: 0,
    });

    // Flip mesh direction
    if (meshRef.current) {
      meshRef.current.scale.x = moveSpeed >= 0 ? 1 : -1;
    }

    // --- Player collision (distance-based with debounce) ---
    if (dist < 1.2) {
      const now = Date.now();
      // If player is falling onto enemy from above → stomp
      if (playerPos[1] > data.y + config.height * 0.3 && 
          useGameStore.getState().player.velocity?.[1] < 0) {
        // Kill enemy
        aliveRef.current = false;
        rigidBodyRef.current.setNextKinematicTranslation({ x: st.currentX, y: -100, z: 0 });
        // Update score through store action
        useGameStore.setState((state) => ({
          player: { ...state.player, score: state.player.score + config.scoreValue }
        }));
      } else if (now - lastDamageTime.current > 1500) {
        // Player takes damage (with debounce)
        lastDamageTime.current = now;
        useGameStore.getState().takeDamage();
      }
    }
  });

  if (!aliveRef.current) return null;

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      position={[data.x, data.y, 0]}
      colliders={false}
      name={`enemy-${index}`}
    >
      <CuboidCollider
        args={[config.width / 2, config.height / 2, 0.4]}
        sensor
      />
      <group ref={meshRef}>
        {/* Enemy body */}
        <mesh castShadow>
          <boxGeometry args={[config.width, config.height, 0.8]} />
          <meshStandardMaterial color={config.color} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.15, config.height * 0.2, 0.41]}>
          <boxGeometry args={[0.15, 0.15, 0.02]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[-0.15, config.height * 0.2, 0.41]}>
          <boxGeometry args={[0.15, 0.15, 0.02]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Pupils */}
        <mesh position={[0.18, config.height * 0.18, 0.43]}>
          <boxGeometry args={[0.07, 0.07, 0.02]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.12, config.height * 0.18, 0.43]}>
          <boxGeometry args={[0.07, 0.07, 0.02]} />
          <meshStandardMaterial color="black" />
        </mesh>
        {/* Shell/feet for Koopa */}
        {data.type === 'koopa' && (
          <mesh position={[0, -config.height * 0.3, 0]} castShadow>
            <boxGeometry args={[config.width * 1.1, config.height * 0.3, 0.85]} />
            <meshStandardMaterial color="#1B5E20" />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
}

/**
 * Renders all enemies from level data.
 */
export default function Enemies() {
  const enemies = useGameStore((s) => s.levelData.enemies);

  return (
    <>
      {enemies.map((enemy, i) => (
        <EnemyUnit key={`enemy-${i}`} data={enemy} index={i} />
      ))}
    </>
  );
}

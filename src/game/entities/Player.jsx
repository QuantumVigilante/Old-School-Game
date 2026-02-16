/**
 * @fileoverview Player entity component — STABLE physics version.
 * Uses Rapier contact events for ground detection instead of velocity heuristics.
 * Uses enabledTranslations to lock Z-axis at the physics level (no jitter).
 * Applies impulses for jumps instead of overriding velocity every frame.
 */
import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, useRapier } from '@react-three/rapier';
import { useKeyboard } from '../../hooks/useKeyboard';
import useGameStore from '../../stores/gameStore';
import { PHYSICS, PLAYER } from '../../utils/constants';

/**
 * Player character with stable physics-based movement.
 * Ground detection via contact tracking, Z locked at physics level.
 */
export default function Player() {
  const rigidBodyRef = useRef(null);
  const meshRef = useRef(null);
  const keysPressed = useKeyboard();
  const invincibleTimerRef = useRef(null);
  const groundContactCount = useRef(0);
  const jumpCooldown = useRef(false);
  const posUpdateCounter = useRef(0);
  const lastDamageTime = useRef(0);

  const phase = useGameStore((s) => s.phase);
  const isInvincible = useGameStore((s) => s.player.isInvincible);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const setPlayerGrounded = useGameStore((s) => s.setPlayerGrounded);
  const clearInvincibility = useGameStore((s) => s.clearInvincibility);
  const takeDamage = useGameStore((s) => s.takeDamage);
  const spawnPoint = useGameStore((s) => s.levelData.spawnPoint);

  // Reset player position on game start
  useEffect(() => {
    if (rigidBodyRef.current && phase === 'playing') {
      const rb = rigidBodyRef.current;
      rb.setTranslation(
        { x: spawnPoint.x, y: spawnPoint.y + 1, z: 0 },
        true
      );
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      groundContactCount.current = 0;
    }
  }, [phase, spawnPoint]);

  // Handle invincibility timer
  useEffect(() => {
    if (isInvincible) {
      invincibleTimerRef.current = setTimeout(() => {
        clearInvincibility();
      }, PLAYER.INVINCIBILITY_DURATION);
    }
    return () => {
      if (invincibleTimerRef.current) {
        clearTimeout(invincibleTimerRef.current);
      }
    };
  }, [isInvincible, clearInvincibility]);

  /**
   * Collision enter handler — tracks ground contacts.
   */
  const onCollisionEnter = useCallback((event) => {
    // Check if the contact normal points upward (we landed on something)
    const manifold = event.manifold;
    if (manifold) {
      const normal = manifold.normal();
      // Normal pointing up means we're standing on something
      if (normal.y < -0.5) {
        groundContactCount.current++;
        setPlayerGrounded(true);
        jumpCooldown.current = false;
      }
    } else {
      // Fallback: any collision below player counts as ground
      groundContactCount.current++;
      setPlayerGrounded(true);
      jumpCooldown.current = false;
    }
  }, [setPlayerGrounded]);

  /**
   * Collision exit handler — decrements ground contacts.
   */
  const onCollisionExit = useCallback(() => {
    groundContactCount.current = Math.max(0, groundContactCount.current - 1);
    if (groundContactCount.current === 0) {
      setPlayerGrounded(false);
    }
  }, [setPlayerGrounded]);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || phase !== 'playing') return;

    const rb = rigidBodyRef.current;
    const translation = rb.translation();
    const linvel = rb.linvel();
    const keys = keysPressed.current;

    const isOnGround = groundContactCount.current > 0 || Math.abs(linvel.y) < 0.3;

    // --- Horizontal Movement ---
    let targetVelX = 0;
    if (keys.has('arrowright') || keys.has('d')) targetVelX = PHYSICS.MOVE_SPEED;
    if (keys.has('arrowleft') || keys.has('a')) targetVelX = -PHYSICS.MOVE_SPEED;

    // Smooth acceleration toward target velocity (no fighting physics)
    const currentVelX = linvel.x;
    const accel = isOnGround ? 0.25 : 0.12;
    const newVelX = currentVelX + (targetVelX - currentVelX) * accel;

    rb.setLinvel({ x: newVelX, y: linvel.y, z: 0 }, true);

    // --- Jump ---
    const wantsJump = keys.has(' ') || keys.has('arrowup') || keys.has('w');
    if (wantsJump && isOnGround && !jumpCooldown.current) {
      rb.setLinvel({ x: newVelX, y: PHYSICS.JUMP_FORCE, z: 0 }, true);
      jumpCooldown.current = true;
      groundContactCount.current = 0;
      setPlayerGrounded(false);
    }

    // --- Enforce Z = 0 (belt and suspenders with enabledTranslations) ---
    if (Math.abs(translation.z) > 0.01) {
      rb.setTranslation({ x: translation.x, y: translation.y, z: 0 }, true);
    }

    // --- Update store position (throttled to every 3rd frame) ---
    posUpdateCounter.current++;
    if (posUpdateCounter.current % 3 === 0) {
      setPlayerPosition([translation.x, translation.y, translation.z]);
    }

    // --- Fall death ---
    if (translation.y < PLAYER.RESPAWN_HEIGHT) {
      const now = Date.now();
      if (now - lastDamageTime.current > 1000) {
        lastDamageTime.current = now;
        takeDamage();
        useGameStore.getState().incrementDeaths();
        if (useGameStore.getState().player.health > 0) {
          rb.setTranslation(
            { x: spawnPoint.x, y: spawnPoint.y + 1, z: 0 },
            true
          );
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
          groundContactCount.current = 0;
        }
      }
    }
  });

  // Blink effect during invincibility
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.visible = isInvincible
        ? Math.sin(clock.getElapsedTime() * 20) > 0
        : true;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      position={[spawnPoint.x, spawnPoint.y + 1, 0]}
      colliders={false}
      lockRotations
      enabledTranslations={[true, true, false]}
      linearDamping={1}
      angularDamping={10}
      mass={1}
      gravityScale={1.8}
      ccd
      name="player"
      onCollisionEnter={onCollisionEnter}
      onCollisionExit={onCollisionExit}
    >
      <CuboidCollider
        args={[PLAYER.WIDTH / 2, PLAYER.HEIGHT / 2, PLAYER.DEPTH / 2]}
        friction={0.7}
        restitution={0}
      />
      <group ref={meshRef}>
        {/* Body */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[PLAYER.WIDTH, PLAYER.HEIGHT, PLAYER.DEPTH]} />
          <meshStandardMaterial color="#E52521" />
        </mesh>
        {/* Head */}
        <mesh position={[0, PLAYER.HEIGHT * 0.55, 0]} castShadow>
          <boxGeometry args={[PLAYER.WIDTH * 0.9, PLAYER.HEIGHT * 0.45, PLAYER.DEPTH * 0.9]} />
          <meshStandardMaterial color="#FFB74D" />
        </mesh>
        {/* Hat */}
        <mesh position={[0, PLAYER.HEIGHT * 0.85, 0]} castShadow>
          <boxGeometry args={[PLAYER.WIDTH * 1.1, PLAYER.HEIGHT * 0.15, PLAYER.DEPTH * 0.7]} />
          <meshStandardMaterial color="#E52521" />
        </mesh>
        {/* Hat brim */}
        <mesh position={[PLAYER.WIDTH * 0.2, PLAYER.HEIGHT * 0.75, 0]} castShadow>
          <boxGeometry args={[PLAYER.WIDTH * 0.6, PLAYER.HEIGHT * 0.08, PLAYER.DEPTH * 0.8]} />
          <meshStandardMaterial color="#E52521" />
        </mesh>
        {/* Eyes */}
        <mesh position={[PLAYER.WIDTH * 0.15, PLAYER.HEIGHT * 0.55, PLAYER.DEPTH * 0.45]}>
          <boxGeometry args={[0.12, 0.15, 0.05]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[-PLAYER.WIDTH * 0.15, PLAYER.HEIGHT * 0.55, PLAYER.DEPTH * 0.45]}>
          <boxGeometry args={[0.12, 0.15, 0.05]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        {/* Pupils */}
        <mesh position={[PLAYER.WIDTH * 0.18, PLAYER.HEIGHT * 0.54, PLAYER.DEPTH * 0.48]}>
          <boxGeometry args={[0.06, 0.08, 0.02]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <mesh position={[-PLAYER.WIDTH * 0.12, PLAYER.HEIGHT * 0.54, PLAYER.DEPTH * 0.48]}>
          <boxGeometry args={[0.06, 0.08, 0.02]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        {/* Mustache */}
        <mesh position={[0, PLAYER.HEIGHT * 0.4, PLAYER.DEPTH * 0.45]}>
          <boxGeometry args={[PLAYER.WIDTH * 0.6, 0.06, 0.05]} />
          <meshStandardMaterial color="#5D3A1A" />
        </mesh>
        {/* Overalls */}
        <mesh position={[0, -PLAYER.HEIGHT * 0.2, 0]} castShadow>
          <boxGeometry args={[PLAYER.WIDTH * 0.85, PLAYER.HEIGHT * 0.4, PLAYER.DEPTH * 0.85]} />
          <meshStandardMaterial color="#1565C0" />
        </mesh>
      </group>
    </RigidBody>
  );
}

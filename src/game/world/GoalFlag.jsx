/**
 * @fileoverview Goal flag component — reaching it triggers level completion.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useGameStore from '../../stores/gameStore';

/**
 * Animated goal flag at the end of each level.
 * Triggers victory when player gets close.
 */
export default function GoalFlag() {
  const goalPos = useGameStore((s) => s.levelData.goalPosition);
  const playerPos = useGameStore((s) => s.player.position);
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const flagRef = useRef(null);

  useFrame(({ clock }) => {
    if (phase !== 'playing') return;

    // Animate flag waving
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 3) * 0.15;
    }

    // Check if player reached the goal
    const dx = playerPos[0] - goalPos.x;
    const dy = playerPos[1] - goalPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2.0) {
      setPhase('victory');
    }
  });

  return (
    <group position={[goalPos.x, goalPos.y, goalPos.z]}>
      {/* Flag pole */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
        <meshStandardMaterial color="#808080" metalness={0.6} />
      </mesh>
      {/* Pole top ball */}
      <mesh position={[0, 6.1, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFA000" emissiveIntensity={0.5} />
      </mesh>
      {/* Flag */}
      <group ref={flagRef} position={[0.5, 5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 0.7, 0.05]} />
          <meshStandardMaterial color="#E52521" />
        </mesh>
        {/* Star on flag */}
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.25, 0.25, 0.02]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFD700"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
      {/* Base */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.0, 0.3, 1.0]} />
        <meshStandardMaterial color="#808080" />
      </mesh>
    </group>
  );
}

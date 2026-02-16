/**
 * @fileoverview Coin collectibles rendered with InstancedMesh.
 * Each coin spins and can be collected by proximity to the player.
 * EFFICIENCY: Single InstancedMesh for all coins, animation in useFrame.
 */
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Color } from 'three';
import useGameStore from '../../stores/gameStore';
import { COIN } from '../../utils/constants';

const tempObject = new Object3D();

/**
 * Renders coins as spinning golden cylinders using InstancedMesh.
 * Checks proximity to player each frame for collection.
 */
export default function Coins() {
  const coins = useGameStore((s) => s.levelData.coins);
  const playerPos = useGameStore((s) => s.player.position);
  const collectCoin = useGameStore((s) => s.collectCoin);
  const phase = useGameStore((s) => s.phase);
  const meshRef = useRef(null);

  const activeCoins = useMemo(
    () => coins.map((c, i) => ({ ...c, index: i })),
    [coins]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current || phase !== 'playing') return;

    const time = clock.getElapsedTime();

    activeCoins.forEach((coin, i) => {
      if (coin.collected) {
        // Hide collected coins by scaling to zero
        tempObject.position.set(0, -100, 0);
        tempObject.scale.set(0, 0, 0);
      } else {
        // Spin animation + float bob
        tempObject.position.set(
          coin.x,
          coin.y + Math.sin(time * 2 + i) * 0.15,
          coin.z
        );
        tempObject.rotation.set(0, time * COIN.SPIN_SPEED + i, 0);
        tempObject.scale.set(1, 1, 1);

        // Proximity collection check
        const dx = playerPos[0] - coin.x;
        const dy = playerPos[1] - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < COIN.COLLECT_DISTANCE) {
          collectCoin(coin.index);
        }
      }

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Set initial color
  useEffect(() => {
    if (!meshRef.current) return;
    const color = new Color('#FFD700');
    for (let i = 0; i < activeCoins.length; i++) {
      meshRef.current.setColorAt(i, color);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [activeCoins.length]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, activeCoins.length]}>
      <cylinderGeometry args={[COIN.RADIUS, COIN.RADIUS, 0.1, 8]} />
      <meshStandardMaterial
        color="#FFD700"
        emissive="#FFA000"
        emissiveIntensity={0.4}
        metalness={0.8}
        roughness={0.2}
      />
    </instancedMesh>
  );
}

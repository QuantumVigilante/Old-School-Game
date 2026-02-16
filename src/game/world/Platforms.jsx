/**
 * @fileoverview Platform rendering — STABLE version.
 * InstancedMesh for visuals, fixed RigidBody colliders with proper friction/restitution.
 * Colliders set to zero restitution to prevent bouncing.
 */
import { useRef, useMemo, useEffect } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Object3D, Color } from 'three';
import useGameStore from '../../stores/gameStore';
import { PLATFORM_COLORS } from '../../utils/constants';

const tempObject = new Object3D();
const tempColor = new Color();

/**
 * Renders all level platforms using InstancedMesh for performance.
 * Each platform gets a fixed RigidBody with friction and zero restitution.
 */
export default function Platforms() {
  const platforms = useGameStore((s) => s.levelData.platforms);
  const meshRef = useRef(null);

  const instanceData = useMemo(() => {
    return platforms.map((p, i) => ({
      ...p,
      index: i,
      color: PLATFORM_COLORS[p.type] || PLATFORM_COLORS.grass,
    }));
  }, [platforms]);

  useEffect(() => {
    if (!meshRef.current) return;

    instanceData.forEach((p, i) => {
      tempObject.position.set(p.x, p.y, p.z);
      tempObject.scale.set(p.width, p.height, p.depth);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);

      tempColor.set(p.color);
      meshRef.current.setColorAt(i, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instanceData]);

  return (
    <>
      {/* Visual: InstancedMesh for efficient rendering */}
      <instancedMesh
        ref={meshRef}
        args={[null, null, platforms.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial vertexColors />
      </instancedMesh>

      {/* Physics: Fixed colliders with proper friction and zero bounce */}
      {platforms.map((p, i) => (
        <RigidBody
          key={`platform-${i}`}
          type="fixed"
          position={[p.x, p.y, p.z]}
          name={`platform-${i}`}
          friction={1}
          restitution={0}
        >
          <CuboidCollider
            args={[p.width / 2, p.height / 2, p.depth / 2]}
            friction={1}
            restitution={0}
          />
        </RigidBody>
      ))}
    </>
  );
}

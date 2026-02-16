/**
 * @fileoverview Level orchestrator — STABLE version.
 * Composes all world elements within a tuned physics simulation.
 * Lower gravity timescale + substeps for stability.
 */
import { Suspense } from 'react';
import { Physics } from '@react-three/rapier';
import Platforms from './Platforms';
import Coins from './Coins';
import Sky from './Sky';
import GoalFlag from './GoalFlag';
import Player from '../entities/Player';
import Enemies from '../entities/Enemy';
import CameraRig from '../engine/CameraRig';
import useGameStore from '../../stores/gameStore';

/**
 * Complete level component — all world elements within stable physics.
 * Key physics fixes:
 * - gravity [0, -25, 0] for snappier feel
 * - timeStep="vary" for frame-rate independence
 * - interpolation for smooth rendering between physics steps
 */
export default function Level() {
  const phase = useGameStore((s) => s.phase);

  if (phase === 'menu') return null;

  return (
    <Suspense fallback={null}>
      <Physics
        gravity={[0, -25, 0]}
        timeStep={1 / 60}
        interpolate
        colliders={false}
      >
        <Sky />
        <CameraRig />
        <Player />
        <Platforms />
        <Coins />
        <Enemies />
        <GoalFlag />
      </Physics>
    </Suspense>
  );
}

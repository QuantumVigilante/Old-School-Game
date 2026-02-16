/**
 * @fileoverview Smooth follow camera rig.
 * Tracks the player position with lerped offset for cinematic feel.
 * Separated from player logic per Code Quality criteria.
 */
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import useGameStore from '../../stores/gameStore';
import { CAMERA } from '../../utils/constants';

const targetPos = new Vector3();
const cameraPos = new Vector3();

/**
 * Camera rig that smoothly follows the player.
 * Uses lerp interpolation for cinematic movement.
 */
export default function CameraRig() {
  const { camera } = useThree();
  const lastPlayerX = useRef(0);

  useFrame(() => {
    const phase = useGameStore.getState().phase;
    if (phase !== 'playing' && phase !== 'victory') return;

    const [px, py] = useGameStore.getState().player.position;

    // Look-ahead: If player is moving right, shift camera slightly right
    const lookAhead = px > lastPlayerX.current ? CAMERA.LOOK_AHEAD : 0;
    lastPlayerX.current = px;

    // Target camera position with offset
    targetPos.set(
      px + CAMERA.OFFSET[0] + lookAhead,
      Math.max(py + CAMERA.OFFSET[1], CAMERA.OFFSET[1]),
      CAMERA.OFFSET[2]
    );

    // Smooth lerp toward target
    cameraPos.copy(camera.position).lerp(targetPos, CAMERA.LERP_SPEED);
    camera.position.copy(cameraPos);

    // Look at player (slightly above for better framing)
    camera.lookAt(px + lookAhead, py + 1, 0);
  });

  return null;
}

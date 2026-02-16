/**
 * @fileoverview Sky and environmental effects.
 * Provides atmosphere with gradient sky, clouds, and lighting.
 */
import { Sky as DreiSky, Cloud, Stars } from '@react-three/drei';

/**
 * Environment component with sky, clouds, and ambient atmosphere.
 */
export default function Sky() {
  return (
    <>
      {/* Dynamic sky with sun */}
      <DreiSky
        distance={450000}
        sunPosition={[100, 50, 100]}
        inclination={0.55}
        azimuth={0.25}
        turbidity={8}
        rayleigh={2}
      />

      {/* Decorative clouds */}
      <Cloud
        position={[-20, 15, -15]}
        speed={0.3}
        opacity={0.6}
        width={15}
        depth={3}
        segments={20}
      />
      <Cloud
        position={[30, 18, -20]}
        speed={0.2}
        opacity={0.5}
        width={12}
        depth={3}
        segments={15}
      />
      <Cloud
        position={[60, 14, -18]}
        speed={0.25}
        opacity={0.55}
        width={18}
        depth={4}
        segments={20}
      />
      <Cloud
        position={[90, 16, -22]}
        speed={0.15}
        opacity={0.45}
        width={14}
        depth={3}
        segments={15}
      />

      {/* Lights */}
      <ambientLight intensity={0.5} color="#FFE4B5" />
      <directionalLight
        position={[50, 30, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={30}
        shadow-camera-bottom={-10}
        shadow-camera-far={100}
      />
      <hemisphereLight
        skyColor="#87CEEB"
        groundColor="#4CAF50"
        intensity={0.4}
      />
    </>
  );
}

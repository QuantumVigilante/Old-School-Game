/**
 * @fileoverview Root application component.
 * Composes the R3F Canvas, game world, and React UI overlay.
 * Separates 3D rendering (Canvas) from 2D UI (HTML overlay) per Code Quality criteria.
 */
import { Canvas } from '@react-three/fiber';
import Level from './game/world/Level';
import HUD from './components/HUD';
import MainMenu from './components/MainMenu';
import useGameStore from './stores/gameStore';
import './App.css';

/**
 * Root app — renders the Three.js Canvas and HTML overlays.
 */
function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="app-container" role="application" aria-label="Mario Infinite Kingdoms">
      {/* 3D Game Canvas */}
      <Canvas
        className="game-canvas"
        shadows
        camera={{ position: [5, 4, 10], fov: 60, near: 0.1, far: 500 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={[1, 1.5]} // Limit device pixel ratio for performance
      >
        <color attach="background" args={['#87CEEB']} />
        {phase !== 'menu' && <Level />}
      </Canvas>

      {/* HTML UI Overlay (sits on top of Canvas) */}
      <HUD />
      <MainMenu />
    </div>
  );
}

export default App;

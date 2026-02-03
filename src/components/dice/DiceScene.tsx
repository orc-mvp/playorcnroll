import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Die3D } from './Die3D';

interface DiceSceneProps {
  dice1: number;
  dice2: number;
  isRolling: boolean;
  onRollComplete?: () => void;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#d4af37" />
    </>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1a1510" roughness={0.8} />
    </mesh>
  );
}

export function DiceScene({ dice1, dice2, isRolling, onRollComplete }: DiceSceneProps) {
  return (
    <div className="w-full h-64 relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 6]} fov={45} />
        <Suspense fallback={null}>
          <Lights />
          <Floor />
          
          <Die3D
            value={dice1}
            isRolling={isRolling}
            position={[-1, 0, 0]}
            rotationOffset={0}
            onRollComplete={onRollComplete}
          />
          
          <Die3D
            value={dice2}
            isRolling={isRolling}
            position={[1, 0, 0]}
            rotationOffset={1}
          />
          
          <Environment preset="night" />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Die3DProps {
  value: number;
  isRolling: boolean;
  position: [number, number, number];
  rotationOffset?: number;
  onRollComplete?: () => void;
}

// Dice face positions (relative rotations to show each number)
const faceRotations: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [0, Math.PI / 2, 0],
  3: [Math.PI / 2, 0, 0],
  4: [-Math.PI / 2, 0, 0],
  5: [0, -Math.PI / 2, 0],
  6: [Math.PI, 0, 0],
};

export function Die3D({ value, isRolling, position, rotationOffset = 0, onRollComplete }: Die3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rollTimeRef = useRef(0);
  const targetRotation = useRef<THREE.Euler | null>(null);
  const hasCompletedRef = useRef(false);
  
  // Calculate target rotation based on value
  const targetFaceRotation = useMemo(() => {
    const [x, y, z] = faceRotations[value] || [0, 0, 0];
    return new THREE.Euler(x, y, z);
  }, [value]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (isRolling) {
      rollTimeRef.current += delta;
      hasCompletedRef.current = false;
      
      const speed = Math.max(0.5, 8 - rollTimeRef.current * 3);
      
      // Tumbling animation
      meshRef.current.rotation.x += speed * delta * (1 + rotationOffset * 0.5);
      meshRef.current.rotation.y += speed * delta * 1.3 * (1 - rotationOffset * 0.3);
      meshRef.current.rotation.z += speed * delta * 0.7;
      
      // Slight vertical bounce
      meshRef.current.position.y = position[1] + Math.sin(rollTimeRef.current * 10) * 0.1;
    } else {
      rollTimeRef.current = 0;
      
      // Smoothly interpolate to target rotation
      const targetRot = targetFaceRotation;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.x, 0.15);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.y, 0.15);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.15);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1], 0.1);
      
      // Check if animation is complete
      const isSettled = 
        Math.abs(meshRef.current.rotation.x - targetRot.x) < 0.01 &&
        Math.abs(meshRef.current.rotation.y - targetRot.y) < 0.01;
        
      if (isSettled && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onRollComplete?.();
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <RoundedBox args={[1, 1, 1]} radius={0.1} smoothness={4}>
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.4} />
        </RoundedBox>
        
        {/* Face 1 - Front */}
        <group position={[0, 0, 0.51]}>
          <Text fontSize={0.5} color="#d4af37" anchorX="center" anchorY="middle">
            1
          </Text>
        </group>
        
        {/* Face 6 - Back */}
        <group position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
          <Text fontSize={0.5} color="#d4af37" anchorX="center" anchorY="middle">
            6
          </Text>
        </group>
        
        {/* Face 2 - Right */}
        <group position={[0.51, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Text fontSize={0.5} color="#d4af37" anchorX="center" anchorY="middle">
            2
          </Text>
        </group>
        
        {/* Face 5 - Left */}
        <group position={[-0.51, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <Text fontSize={0.5} color="#d4af37" anchorX="center" anchorY="middle">
            5
          </Text>
        </group>
        
        {/* Face 3 - Top */}
        <group position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <Text fontSize={0.5} color="#d4af37" anchorX="center" anchorY="middle">
            3
          </Text>
        </group>
        
        {/* Face 4 - Bottom */}
        <group position={[0, -0.51, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <Text fontSize={0.5} color="#d4af37" anchorX="center" anchorY="middle">
            4
          </Text>
        </group>
      </mesh>
    </group>
  );
}

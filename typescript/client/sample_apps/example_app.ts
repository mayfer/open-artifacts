export const example_app = {
    '/index.tsx': `
import React, { useRef, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useThree } from "@react-three/fiber"
import * as THREE from 'three'

interface BoxProps {
position: [number, number, number];
color: string;
}

function Box({ position, color }: BoxProps) {
const ref = useRef<THREE.Mesh>(null)

useLayoutEffect(() => {
  if (ref.current) {
    ref.current.rotation.x = 0.01
    ref.current.rotation.y = 0.01
  }
}, [])

return (
  <mesh position={position} ref={ref}>
    <boxGeometry args={[1, 1, 1]} />
    <meshPhongMaterial color={color} />
  </mesh>
)
}

function Scene() {
const { gl, scene, camera } = useThree()

useLayoutEffect(() => {
  gl.render(scene, camera)
  gl.setAnimationLoop(null)
}, [gl, scene, camera])

return (
  <>
    <Box color="#18a3fe" position={[-1, 0, 3]} />
    <Box color="#f56f42" position={[1, 0, 3]} />
    <directionalLight color="#ffffff" intensity={1} position={[-1, 2, 4]} />
  </>
)
}

function App(): JSX.Element {
return (
  <Canvas>
    <Scene />
  </Canvas>
)
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
`
  }
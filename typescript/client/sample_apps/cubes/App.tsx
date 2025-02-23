import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const CUBE_COUNT = 1000
const GRID_SIZE = 10
const SPACING = 4

function InstancedCubes() {
  const meshRef = useRef()
  const tempMatrix = useMemo(() => new THREE.Matrix4(), [])
  const tempPosition = useMemo(() => new THREE.Vector3(), [])
  const tempRotation = useMemo(() => new THREE.Euler(), [])
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const tempScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])

  // Generate initial positions
  const [matrices, colors] = useMemo(() => {
    const tempMatrices = []
    const tempColors = []
    let index = 0

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          const matrix = new THREE.Matrix4()
          matrix.setPosition(
            (x - GRID_SIZE / 2) * SPACING,
            (y - GRID_SIZE / 2) * SPACING,
            (z - GRID_SIZE / 2) * SPACING
          )
          tempMatrices.push(matrix)
          
          // Generate random color
          const color = new THREE.Color(
            Math.random(),
            Math.random(),
            Math.random()
          )
          tempColors.push(color)
          index++
        }
      }
    }
    return [tempMatrices, tempColors]
  }, [])

  useFrame((state) => {
    const { clock } = state
    const time = clock.getElapsedTime()

    let index = 0
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          // Calculate position
          tempPosition.set(
            (x - GRID_SIZE / 2) * SPACING,
            (y - GRID_SIZE / 2) * SPACING,
            (z - GRID_SIZE / 2) * SPACING
          )

          // Calculate rotation
          tempRotation.set(
            time * 0.5 + x * 0.1,
            time * 0.3 + y * 0.1,
            time * 0.2 + z * 0.1
          )
          tempQuaternion.setFromEuler(tempRotation)

          // Compose matrix
          tempMatrix.compose(tempPosition, tempQuaternion, tempScale)
          meshRef.current.setMatrixAt(index, tempMatrix)
          index++
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, CUBE_COUNT]}>
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[Float32Array.from(colors.flatMap(c => [c.r, c.g, c.b])), 3]}
        />
      </boxGeometry>
      <meshPhongMaterial vertexColors shininess={60} />
    </instancedMesh>
  )
}

console.log(window.innerHeight)

export default function Scene() {
  return (
    <div className="h-screen w-full">
      <Canvas
        camera={{ position: [20, 20, 20], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        className="h-full w-full"
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />
        <InstancedCubes />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
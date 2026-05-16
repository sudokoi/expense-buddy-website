'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, Points, PointMaterial } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'

const ORION_STARS = [
  {
    id: 'betelgeuse',
    position: [-1.18, 0.92, 0.04],
    color: '#ffb0a1',
    size: 0.16,
  },
  {
    id: 'bellatrix',
    position: [1.08, 0.82, 0.04],
    color: '#d9e6ff',
    size: 0.12,
  },
  {
    id: 'alnitak',
    position: [-0.56, 0.14, 0.05],
    color: '#d7ebff',
    size: 0.11,
  },
  {
    id: 'alnilam',
    position: [0, 0.08, 0.06],
    color: '#e4efff',
    size: 0.12,
  },
  {
    id: 'mintaka',
    position: [0.55, 0.02, 0.05],
    color: '#eef4ff',
    size: 0.11,
  },
  {
    id: 'saiph',
    position: [-0.68, -1.2, 0.03],
    color: '#ffe3d2',
    size: 0.11,
  },
  {
    id: 'rigel',
    position: [1.02, -1.08, 0.08],
    color: '#8ec5ff',
    size: 0.16,
  },
  {
    id: 'meissa',
    position: [-0.04, 1.42, 0.08],
    color: '#d8f0ff',
    size: 0.08,
  },
  {
    id: 'hatysa',
    position: [-0.08, -0.46, -0.02],
    color: '#dff0ff',
    size: 0.07,
  },
  {
    id: 'theta-orionis',
    position: [0.02, -0.82, -0.05],
    color: '#fff0f3',
    size: 0.08,
  },
] as const

const STAR_LINKS = [
  ['betelgeuse', 'bellatrix'],
  ['betelgeuse', 'alnitak'],
  ['bellatrix', 'mintaka'],
  ['alnitak', 'alnilam'],
  ['alnilam', 'mintaka'],
  ['alnitak', 'saiph'],
  ['mintaka', 'rigel'],
  ['betelgeuse', 'meissa'],
  ['bellatrix', 'meissa'],
  ['alnilam', 'hatysa'],
  ['hatysa', 'theta-orionis'],
] as const

const BACKGROUND_STARS = [
  [-2.6, 1.3, -0.2],
  [-2.15, -0.86, -0.18],
  [-1.7, 1.9, -0.14],
  [1.9, 1.72, -0.12],
  [2.34, 0.42, -0.18],
  [2.1, -1.12, -0.16],
] as const

const NEBULA_PARTICLES = [
  [-0.14, -0.32, -0.1],
  [-0.08, -0.44, -0.08],
  [-0.02, -0.58, -0.1],
  [0.06, -0.46, -0.12],
  [0.12, -0.62, -0.08],
  [-0.04, -0.72, -0.06],
  [0.08, -0.78, -0.08],
] as const

function OrionFigure() {
  const group = useRef<Group>(null)
  const starLookup = useMemo(
    () => Object.fromEntries(ORION_STARS.map((star) => [star.id, star.position])),
    [],
  )

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.012
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.16) * 0.03
  })

  return (
    <group ref={group} position={[0.05, 0.8, 0]} scale={1.55}>
      <Float speed={0.55} rotationIntensity={0.012} floatIntensity={0.06}>
        {STAR_LINKS.map(([from, to]) => (
          <Line
            key={`${from}-${to}`}
            points={[starLookup[from], starLookup[to]]}
            color="#fff4f7"
            lineWidth={0.65}
            transparent
            opacity={0.32}
          />
        ))}

        {ORION_STARS.map((star) => (
          <Points
            key={star.id}
            positions={Float32Array.from(star.position)}
            stride={3}
            frustumCulled
          >
            <PointMaterial
              color={star.color}
              transparent
              opacity={0.98}
              size={star.size}
              sizeAttenuation
              depthWrite={false}
            />
          </Points>
        ))}
      </Float>
    </group>
  )
}

function OrionNebula() {
  const group = useRef<Group>(null)
  const positions = useMemo(() => Float32Array.from(NEBULA_PARTICLES.flatMap((point) => point)), [])

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.z = -Math.sin(state.clock.elapsedTime * 0.18) * 0.02
  })

  return (
    <group ref={group} position={[0.05, 0.8, 0]} scale={1.55}>
      <Points positions={positions} stride={3} frustumCulled>
        <PointMaterial
          color="#ff8c94"
          transparent
          opacity={0.38}
          size={0.085}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
      <Points positions={Float32Array.from([0.02, -0.56, -0.18])} stride={3} frustumCulled>
        <PointMaterial
          color="#ffb6c1"
          transparent
          opacity={0.24}
          size={0.28}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    </group>
  )
}

function BackgroundStars() {
  const positions = useMemo(() => Float32Array.from(BACKGROUND_STARS.flatMap((point) => point)), [])

  return (
    <Points positions={positions} stride={3} frustumCulled>
      <PointMaterial
        color="#fffaf5"
        transparent
        opacity={0.58}
        size={0.075}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  )
}

export function HomeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 24 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#fff8f0', 4.8, 8.6]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[1.2, 2.2, 4]} intensity={0.9} color="#fff8f0" />
      <directionalLight position={[-1.8, 0.8, 3]} intensity={0.35} color="#e9efff" />
      <pointLight position={[-1.18, 1.7, 2.3]} intensity={7} distance={4.2} color="#ff9f8d" />
      <pointLight position={[1.05, -0.3, 2.3]} intensity={7} distance={4.5} color="#90c7ff" />
      <pointLight position={[0.08, -0.05, 1.6]} intensity={5} distance={2.6} color="#ff8c94" />
      <OrionFigure />
      <OrionNebula />
      <BackgroundStars />
    </Canvas>
  )
}

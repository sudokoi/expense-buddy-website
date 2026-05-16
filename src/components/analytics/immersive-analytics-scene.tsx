'use client'

import { Line, OrbitControls, Points, PointMaterial, Sphere } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { AdditiveBlending } from 'three'

import type { AnalyticsSceneData } from '@/features/analytics/scene-data'
import type { AnalyticsViewLayer } from '@/features/dashboards/schema'

function HeroOrb({ intensity }: { intensity: number }) {
  const group = useRef<Group>(null)

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 0.12
    const scale = 1 + Math.sin(state.clock.elapsedTime * 1.7) * 0.04 + intensity * 0.02
    group.current.scale.setScalar(scale)
  })

  return (
    <group ref={group}>
      <Sphere args={[0.65, 48, 48]}>
        <meshStandardMaterial
          color="#ff91a4"
          emissive="#ff91a4"
          emissiveIntensity={1.2}
          transparent
          opacity={0.72}
        />
      </Sphere>
      <Sphere args={[1.12, 48, 48]}>
        <meshBasicMaterial color="#d4c4fb" transparent opacity={0.12} blending={AdditiveBlending} />
      </Sphere>
    </group>
  )
}

function PaymentModeLayer({
  data,
  highlightedSeriesId,
}: {
  data: AnalyticsSceneData
  highlightedSeriesId: string | null
}) {
  return (
    <group position={[0, 0.05, 0]}>
      {data.lineSeries.map((series, index) => {
        const isActive = !highlightedSeriesId || highlightedSeriesId === series.id
        const zOffset = index * -0.16

        return (
          <group key={series.id} position={[0, 0, zOffset]}>
            <Line
              points={series.points.map((point) => [point.x, point.y, 0])}
              color={series.color}
              lineWidth={isActive ? 2.4 : 1.2}
              transparent
              opacity={isActive ? 0.94 : 0.28}
            />
            <Points
              positions={Float32Array.from(series.points.flatMap((point) => [point.x, point.y, 0]))}
              stride={3}
              frustumCulled
            >
              <PointMaterial
                color={series.color}
                size={isActive ? 0.12 : 0.08}
                sizeAttenuation
                transparent
                opacity={isActive ? 0.88 : 0.22}
                depthWrite={false}
              />
            </Points>
          </group>
        )
      })}
    </group>
  )
}

function CategoryLayer({ data, active }: { data: AnalyticsSceneData; active: boolean }) {
  return (
    <group>
      {data.categoryClusters.map((cluster) => {
        const x = Math.cos(cluster.angle) * cluster.radius * 1.8
        const y = Math.sin(cluster.angle) * cluster.radius * 1.1
        return (
          <group key={cluster.id} position={[x, y, -0.8]}>
            <Sphere args={[0.22 + cluster.percentage / 55, 24, 24]}>
              <meshStandardMaterial
                color={cluster.color}
                emissive={cluster.color}
                emissiveIntensity={active ? 1.1 : 0.35}
                transparent
                opacity={active ? 0.84 : 0.24}
              />
            </Sphere>
          </group>
        )
      })}
    </group>
  )
}

function SceneBackdrop() {
  const positions = useMemo(() => {
    const points = new Float32Array(180)

    for (let index = 0; index < points.length; index += 3) {
      points[index] = (Math.random() - 0.5) * 12
      points[index + 1] = (Math.random() - 0.5) * 7
      points[index + 2] = -1.5 - Math.random() * 5
    }

    return points
  }, [])

  return (
    <Points positions={positions} stride={3} frustumCulled>
      <PointMaterial
        color="#f0e6f6"
        transparent
        opacity={0.35}
        size={0.055}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  )
}

export function ImmersiveAnalyticsScene({
  data,
  activeLayer,
  highlightedSeriesId,
}: {
  data: AnalyticsSceneData
  activeLayer: AnalyticsViewLayer
  highlightedSeriesId: string | null
}) {
  const categoryActive = activeLayer.dimension === 'category'
  const showPaymentLayer = data.view.layers.some((layer) => layer.dimension === 'payment_method')
  const showCategoryLayer = data.view.layers.some((layer) => layer.dimension === 'category')
  const heroIntensity = Math.min(1, data.heroValue / Math.max(data.maxLineValue * 20, 1))

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 34 }}
      dpr={[1, 1.7]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={['#130f1f']} />
      <fog attach="fog" args={['#130f1f', 5, 16]} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[2.5, 4, 4]} intensity={1.2} color="#fff8f0" />
      <pointLight position={[-2.8, 1.8, 2.2]} intensity={38} distance={10} color="#ff91a4" />
      <pointLight position={[3.5, -1.6, 1]} intensity={28} distance={10} color="#98fb98" />
      <pointLight position={[0, 3.8, -0.8]} intensity={20} distance={9} color="#d4c4fb" />
      <SceneBackdrop />
      <HeroOrb intensity={heroIntensity} />
      {showPaymentLayer ? (
        <PaymentModeLayer data={data} highlightedSeriesId={highlightedSeriesId} />
      ) : null}
      {showCategoryLayer ? <CategoryLayer data={data} active={categoryActive} /> : null}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 1.9}
        minPolarAngle={Math.PI / 2.7}
        autoRotate
        autoRotateSpeed={0.25}
      />
    </Canvas>
  )
}

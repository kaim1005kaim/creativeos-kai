import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ThoughtNode } from '../types/ThoughtNode'

interface SynapseConnectionProps {
  startNode: ThoughtNode
  endNode: ThoughtNode
  color?: string
}

export function SynapseConnection({ startNode, endNode, color = '#00ffff' }: SynapseConnectionProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const pulseRef = useRef<THREE.Mesh>(null)
  const time = useRef(0)

  // Create curve between nodes
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...startNode.position)
    const end = new THREE.Vector3(...endNode.position)
    
    // Create a curved path
    const midPoint = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5)
    
    // Add some curvature
    const distance = start.distanceTo(end)
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * distance * 0.2,
      (Math.random() - 0.5) * distance * 0.2,
      (Math.random() - 0.5) * distance * 0.2
    )
    midPoint.add(offset)
    
    return new THREE.QuadraticBezierCurve3(start, midPoint, end)
  }, [startNode.position, endNode.position])

  // Create tube geometry
  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 32, 0.02, 8, false)
  }, [curve])

  // Animate pulse
  useFrame((state, delta) => {
    time.current += delta
    
    if (pulseRef.current && meshRef.current) {
      // Move pulse along the curve
      const t = (time.current * 0.3) % 1
      const point = curve.getPoint(t)
      pulseRef.current.position.copy(point)
      
      // Pulse size animation
      const scale = 1 + Math.sin(time.current * 10) * 0.3
      pulseRef.current.scale.setScalar(scale)
      
      // Connection glow effect
      if (meshRef.current.material) {
        ;(meshRef.current.material as THREE.MeshBasicMaterial).opacity = 
          0.3 + Math.sin(time.current * 2) * 0.1
      }
    }
  })

  return (
    <group>
      {/* Connection line */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Traveling pulse */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
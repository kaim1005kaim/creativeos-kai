import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThoughtNode } from '../types/ThoughtNode'

interface ParticleSphereProps {
  nodes: ThoughtNode[]
  onNodeClick?: (node: ThoughtNode) => void
}

// Fibonacci sphere distribution
function fibonacciSphere(samples: number, radius: number = 15): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  const phi = Math.PI * (3 - Math.sqrt(5)) // Golden angle in radians
  
  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2 // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y) // radius at y
    
    const theta = phi * i // golden angle increment
    
    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY
    
    points.push(new THREE.Vector3(x * radius, y * radius, z * radius))
  }
  
  return points
}

// Noise function for smooth animation
function noise3D(x: number, y: number, z: number, time: number): number {
  return (
    Math.sin(x + time * 0.5) * 0.3 +
    Math.sin(y + time * 0.7) * 0.2 +
    Math.sin(z + time * 0.3) * 0.1
  )
}

export function ParticleSphere({ nodes, onNodeClick }: ParticleSphereProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const connectionsRef = useRef<THREE.LineSegments>(null)
  const mouseRef = useRef(new THREE.Vector2())
  const originalPositionsRef = useRef<THREE.Vector3[]>([])
  const time = useRef(0)
  
  const { camera, raycaster, gl } = useThree()
  
  // Calculate number of particles based on nodes
  const particleCount = Math.max(nodes.length, 800)
  
  // Generate Fibonacci sphere positions
  const { positions, connections } = useMemo(() => {
    const spherePoints = fibonacciSphere(particleCount)
    originalPositionsRef.current = spherePoints.map(p => p.clone())
    
    const positionsArray = new Float32Array(particleCount * 3)
    spherePoints.forEach((point, i) => {
      positionsArray[i * 3] = point.x
      positionsArray[i * 3 + 1] = point.y
      positionsArray[i * 3 + 2] = point.z
    })
    
    // Generate connections between nearby particles
    const connectionPairs: number[] = []
    const maxDistance = 5 // Connection threshold
    
    for (let i = 0; i < spherePoints.length; i++) {
      for (let j = i + 1; j < spherePoints.length; j++) {
        const distance = spherePoints[i].distanceTo(spherePoints[j])
        if (distance < maxDistance) {
          connectionPairs.push(i, j)
        }
      }
    }
    
    const connectionsArray = new Float32Array(connectionPairs.length * 3)
    for (let i = 0; i < connectionPairs.length; i++) {
      const particleIndex = connectionPairs[i]
      const point = spherePoints[particleIndex]
      connectionsArray[i * 3] = point.x
      connectionsArray[i * 3 + 1] = point.y
      connectionsArray[i * 3 + 2] = point.z
    }
    
    return {
      positions: positionsArray,
      connections: connectionsArray
    }
  }, [particleCount])
  
  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
    
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    return () => gl.domElement.removeEventListener('mousemove', handleMouseMove)
  }, [gl])
  
  useFrame((state, delta) => {
    time.current += delta
    
    if (!particlesRef.current || !connectionsRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const connectionPositions = connectionsRef.current.geometry.attributes.position.array as Float32Array
    
    // Convert mouse position to world coordinates
    const mouse3D = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0.5)
    mouse3D.unproject(camera)
    
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)
    mouse3D.add(cameraDirection.multiplyScalar(-camera.position.z))
    
    // Update particle positions
    for (let i = 0; i < particleCount; i++) {
      const originalPos = originalPositionsRef.current[i]
      
      // Noise-based ambient animation
      const noiseX = noise3D(originalPos.x * 0.1, originalPos.y * 0.1, originalPos.z * 0.1, time.current)
      const noiseY = noise3D(originalPos.y * 0.1, originalPos.z * 0.1, originalPos.x * 0.1, time.current + 100)
      const noiseZ = noise3D(originalPos.z * 0.1, originalPos.x * 0.1, originalPos.y * 0.1, time.current + 200)
      
      let x = originalPos.x + noiseX * 0.5
      let y = originalPos.y + noiseY * 0.5
      let z = originalPos.z + noiseZ * 0.5
      
      // Mouse repulsion effect
      const particlePos = new THREE.Vector3(x, y, z)
      const distanceToMouse = particlePos.distanceTo(mouse3D)
      const repulsionRadius = 8
      
      if (distanceToMouse < repulsionRadius) {
        const repulsionForce = (repulsionRadius - distanceToMouse) / repulsionRadius
        const direction = particlePos.clone().sub(mouse3D).normalize()
        const repulsion = direction.multiplyScalar(repulsionForce * 3)
        
        x += repulsion.x
        y += repulsion.y
        z += repulsion.z
      }
      
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    }
    
    // Update connection positions to match particles
    for (let i = 0; i < connectionPositions.length / 3; i++) {
      const particleIndex = Math.floor(i / 2)
      if (particleIndex < particleCount) {
        connectionPositions[i * 3] = positions[particleIndex * 3]
        connectionPositions[i * 3 + 1] = positions[particleIndex * 3 + 1]
        connectionPositions[i * 3 + 2] = positions[particleIndex * 3 + 2]
      }
    }
    
    // Smooth rotation of entire sphere
    if (particlesRef.current.parent) {
      particlesRef.current.parent.rotation.y += 0.001
      particlesRef.current.parent.rotation.x += 0.0005
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    connectionsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <group>
      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.8}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Connections */}
      <lineSegments ref={connectionsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={connections.length / 3}
            array={connections}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}
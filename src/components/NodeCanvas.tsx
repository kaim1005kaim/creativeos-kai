import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Text } from '@react-three/drei'
import { useNodeStore } from '../store/nodes'
import { useColorSchemeStore } from './ColorSchemeSelector'
import { getNodeColor } from '../lib/nodeColors'
import { ThoughtNode } from '../types/ThoughtNode'

interface NodeSphereProps {
  node: ThoughtNode
  onClick: (node: ThoughtNode) => void
  color: string
}

function NodeSphere({ node, onClick, color }: NodeSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <group position={node.position}>
      <Sphere
        ref={meshRef}
        args={[0.5, 32, 32]}
        onClick={() => onClick(node)}
      >
        <meshStandardMaterial color={color} />
      </Sphere>
      <Text
        position={[0, 1, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.comment.substring(0, 20)}
      </Text>
    </group>
  )
}

function NodeConnections() {
  const getDisplayNodes = useNodeStore((state) => state.getDisplayNodes)
  
  const displayNodes = getDisplayNodes()
  
  return (
    <>
      {displayNodes.map((node) =>
        node.linkedNodeIds.map((linkedId) => {
          const linkedNode = displayNodes.find((n) => n.id === linkedId)
          if (!linkedNode) return null
          
          return (
            <line key={`${node.id}-${linkedId}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    ...node.position,
                    ...linkedNode.position,
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#888" />
            </line>
          )
        })
      )}
    </>
  )
}

export default function NodeCanvas() {
  const getDisplayNodes = useNodeStore((state) => state.getDisplayNodes)
  const setSelectedNode = useNodeStore((state) => state.setSelectedNode)
  const selectedScheme = useColorSchemeStore((state) => state.selectedScheme)

  const displayNodes = getDisplayNodes()

  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {displayNodes.map((node) => (
        <NodeSphere
          key={node.id}
          node={node}
          onClick={setSelectedNode}
          color={getNodeColor(node, selectedScheme)}
        />
      ))}
      
      <NodeConnections />
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </Canvas>
  )
}
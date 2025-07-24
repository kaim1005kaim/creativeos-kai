import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Stars } from '@react-three/drei'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'
import { SynapseConnection } from './SynapseConnection'
import { calculateForceLayout } from '../lib/forceLayout'
import * as THREE from 'three'

// Helper function to clean up title text
function cleanTitle(title: string): string {
  if (!title) return ''
  
  // Remove <think> tags and their content
  let cleaned = title.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  cleaned = cleaned.replace(/<think>[\s\S]*/g, '').trim()
  
  // Remove any remaining artifacts from the beginning
  cleaned = cleaned.replace(/^[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u0041-\u005A\u0061-\u007A\u0030-\u0039]+/, '').trim()
  
  // If result is empty or still contains think-related text, return empty
  if (!cleaned || cleaned.toLowerCase().includes('think')) {
    return ''
  }
  
  return cleaned
}

interface NodeSphereProps {
  node: ThoughtNode
  onClick: (node: ThoughtNode, event?: any) => void
  onContextMenu: (node: ThoughtNode, event?: any) => void
  isHighlighted?: boolean
}

function NodeSphere({ node, onClick, onContextMenu, isHighlighted = false }: NodeSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const time = useRef(0)
  
  // Synapse-like colors
  const nodeColor = node.type === 'x-post' 
    ? '#00bfff' // Bright cyan for X posts
    : node.linkedNodeIds.length > 2 
      ? '#ff00ff' // Magenta for hub nodes
      : '#00ffff' // Cyan for regular nodes
  
  // Force re-render when node data changes
  const displayText = useMemo(() => {
    // If title is explicitly set, always use it first
    if (node.title) {
      return cleanTitle(node.title).substring(0, 20)
    }
    
    // For X posts, use cleaned text if available
    if (node.type === 'x-post' && node.xPostData?.text) {
      return node.xPostData.text.substring(0, 20) + '...'
    }
    
    // Fall back to comment
    return node.comment.substring(0, 20)
  }, [node.title, node.type, node.xPostData, node.comment])

  useFrame((state, delta) => {
    time.current += delta
    
    if (meshRef.current) {
      // Pulsing effect
      const baseScale = hovered || isHighlighted ? 1.2 : 1
      const pulse = Math.sin(time.current * 2) * 0.05
      meshRef.current.scale.setScalar(baseScale + pulse)
      
      // Subtle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + node.position[0]) * 0.09
    }
    
    if (glowRef.current) {
      // Glow animation
      glowRef.current.scale.setScalar(1.5 + Math.sin(time.current * 3) * 0.2)
      ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity = 
        0.3 + Math.sin(time.current * 2) * 0.1
    }
  })

  return (
    <group position={node.position}>
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Main node */}
      <mesh
        ref={meshRef}
        onClick={(event) => onClick(node, event)}
        onContextMenu={(event) => {
          event.stopPropagation()
          onContextMenu(node, event)
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhongMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={0.2}
          shininess={100}
        />
      </mesh>
      
      {/* Text label */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {displayText}
      </Text>
      {node.type === 'x-post' && node.xPostData && (hovered || isHighlighted) && (
        <Text
          position={[0, -1.1, 0]}
          fontSize={0.1}
          color="#aaaaaa"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.8}
        >
          {node.xPostData.author.name}
        </Text>
      )}
    </group>
  )
}

interface ConnectionLineProps {
  start: [number, number, number]
  end: [number, number, number]
}

function ConnectionLine({ start, end }: ConnectionLineProps) {
  const ref = useRef<THREE.BufferGeometry>(null)

  useEffect(() => {
    if (ref.current) {
      const positions = new Float32Array([...start, ...end])
      ref.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    }
  }, [start, end])

  return (
    <line>
      <bufferGeometry ref={ref} />
      <lineBasicMaterial color="#444444" opacity={0.6} transparent />
    </line>
  )
}

export function NodeCanvas() {
  const { nodes, deleteNode } = useNodeStore()
  const [filters] = useState({ categories: [], tags: [], timeRange: null })
  const [searchQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<{ node: ThoughtNode; position: [number, number] } | null>(null)
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set())
  const canvasRef = useRef<HTMLDivElement>(null)

  // Apply force-directed layout
  useEffect(() => {
    if (nodes.length > 0 && nodes.every(n => n.position[0] === 0 && n.position[1] === 0)) {
      const newPositions = calculateForceLayout(nodes)
      // TODO: Implement updateNodePositions in store if needed
      console.log('New positions calculated:', newPositions)
    }
  }, [nodes])

  // Filter nodes based on search and filters
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      // Search filter
      if (searchQuery && !node.comment.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !node.summary.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(node.category || 'その他')) {
        return false
      }
      
      // Tag filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => node.tags?.includes(tag))) {
        return false
      }
      
      // Time filter
      if (filters.timeRange) {
        const nodeDate = new Date(node.createdAt)
        const now = new Date()
        const dayInMs = 24 * 60 * 60 * 1000
        
        switch (filters.timeRange) {
          case 'today':
            if (now.getTime() - nodeDate.getTime() > dayInMs) return false
            break
          case 'week':
            if (now.getTime() - nodeDate.getTime() > 7 * dayInMs) return false
            break
          case 'month':
            if (now.getTime() - nodeDate.getTime() > 30 * dayInMs) return false
            break
        }
      }
      
      return true
    })
  }, [nodes, searchQuery, filters])

  // Calculate connections for filtered nodes
  const connections = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    const links: Array<[string, string]> = []
    
    filteredNodes.forEach(node => {
      node.linkedNodeIds.forEach(linkedId => {
        if (nodeIds.has(linkedId) && node.id < linkedId) {
          links.push([node.id, linkedId])
        }
      })
    })
    
    return links
  }, [filteredNodes])

  const handleNodeClick = (node: ThoughtNode) => {
    window.open(node.url, '_blank')
  }

  const handleNodeContextMenu = (node: ThoughtNode, event: any) => {
    event.nativeEvent.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setContextMenu({
        node,
        position: [
          event.nativeEvent.clientX - rect.left,
          event.nativeEvent.clientY - rect.top
        ]
      })
    }
  }

  const handleCanvasClick = () => {
    setContextMenu(null)
  }

  const handleEditNode = () => {
    if (contextMenu) {
      // Edit functionality has been removed
      // TODO: Implement inline editing or alternative edit method
      setContextMenu(null)
    }
  }

  const handleDeleteNode = async () => {
    if (contextMenu && window.confirm('このノードを削除しますか？')) {
      await deleteNode(contextMenu.node.id)
      setContextMenu(null)
    }
  }

  const handleSearchRelated = () => {
    if (contextMenu) {
      // Highlight connected nodes
      const connectedIds = new Set([contextMenu.node.id])
      contextMenu.node.linkedNodeIds.forEach(id => connectedIds.add(id))
      
      // Also add nodes that link to this node
      nodes.forEach(node => {
        if (node.linkedNodeIds.includes(contextMenu.node.id)) {
          connectedIds.add(node.id)
        }
      })
      
      setHighlightedNodeIds(connectedIds)
      setContextMenu(null)
      
      // Clear highlights after 5 seconds
      setTimeout(() => setHighlightedNodeIds(new Set()), 5000)
    }
  }

  return (
    <div ref={canvasRef} className="relative w-full h-full">
      <Canvas
        style={{ background: 'linear-gradient(to bottom, #000428, #004e92)' }}
        camera={{ position: [0, 0, 50], fov: 60 }}
        onPointerMissed={handleCanvasClick}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Space background */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        
        {/* Lighting for synapse effect */}
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />

        {/* Render synapse connections */}
        {connections.map(([startId, endId], index) => {
          const startNode = filteredNodes.find(n => n.id === startId)
          const endNode = filteredNodes.find(n => n.id === endId)
          if (!startNode || !endNode) return null

          return (
            <SynapseConnection
              key={`${startId}-${endId}-${index}`}
              startNode={startNode}
              endNode={endNode}
              color="#00ffff"
            />
          )
        })}

        {/* Render nodes */}
        {filteredNodes.map(node => (
          <NodeSphere
            key={node.id}
            node={node}
            onClick={handleNodeClick}
            onContextMenu={handleNodeContextMenu}
            isHighlighted={highlightedNodeIds.has(node.id)}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.5}
        />
        
        {/* Fog effect for depth */}
        <fog attach="fog" args={['#000428', 50, 200]} />
      </Canvas>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute bg-white rounded-lg shadow-lg py-2 z-50"
          style={{
            left: contextMenu.position[0],
            top: contextMenu.position[1],
          }}
        >
          <button
            onClick={handleEditNode}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            編集
          </button>
          <button
            onClick={handleSearchRelated}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            関連ノードを表示
          </button>
          <button
            onClick={handleDeleteNode}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
          >
            削除
          </button>
        </div>
      )}
    </div>
  )
}
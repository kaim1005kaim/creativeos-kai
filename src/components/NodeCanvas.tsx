import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'
// Note: NodeEditModal removed during cleanup
import { calculateForceLayout } from '../lib/forceLayout'

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
  const outlineRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  // OZ-inspired colorful node colors (Summer Wars style) - excluding red tones to avoid confusion with border
  const ozColors = [
    '#4ecdc4', // Cyan
    '#45b7d1', // Blue
    '#96ceb4', // Green
    '#ffd93d', // Yellow
    '#ff9f43', // Orange
    '#a8e6cf', // Light green
    '#82b1ff', // Light blue
    '#ce93d8', // Purple
    '#ffab40', // Amber
    '#80cbc4', // Teal
    '#b8e6b8', // Light mint
    '#87ceeb'  // Sky blue
  ]
  
  // Assign color based on node ID for consistency
  const colorIndex = parseInt(node.id.slice(-2), 16) % ozColors.length
  const nodeColor = node.type === 'x-post' 
    ? '#4ecdc4' // Special cyan for X posts (instead of red)
    : ozColors[colorIndex]
  
  // Debug: log color assignment
  console.log(`Node ${node.id}: slice(-2)="${node.id.slice(-2)}", parseInt=${parseInt(node.id.slice(-2), 16)}, colorIndex=${colorIndex}, color=${nodeColor}`)
  
  // Force re-render when node data changes
  const displayText = useMemo(() => {
    // If title is explicitly set, always use it first
    if (node.title) {
      return cleanTitle(node.title).substring(0, 20)
    }
    // Otherwise, use X post text or comment
    return node.type === 'x-post' && node.xPostData
      ? `@${node.xPostData.author.username}: ${node.xPostData.text.substring(0, 20)}...`
      : node.comment.substring(0, 20)
  }, [node.type, node.xPostData, node.title, node.comment])
  
  useFrame((state) => {
    if (meshRef.current) {
      // OZ-style floating animation - more dynamic
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5 + node.position[0]) * 0.12
      
      // Slight rotation for anime effect
      if (hovered || isHighlighted) {
        meshRef.current.rotation.y += 0.02
      }
    }
    
    if (outlineRef.current) {
      // Sync outline with main sphere
      outlineRef.current.position.y = meshRef.current?.position.y || 0
      outlineRef.current.rotation.y = meshRef.current?.rotation.y || 0
    }
  })

  return (
    <group position={node.position}>
      {/* Red outline sphere (behind) - anime-style border */}
      <mesh
        ref={outlineRef}
        onClick={(event) => onClick(node, event)}
        onContextMenu={(event) => {
          event.stopPropagation()
          onContextMenu(node, event)
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hovered ? 0.152 : 0.102, 20, 20]} />
        <meshBasicMaterial 
          color="#f13321"
          transparent
          opacity={hovered || isHighlighted ? 0.5 : 0.3}
        />
      </mesh>
      
      {/* Main colorful sphere (in front) */}
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
        <sphereGeometry args={[hovered ? 0.15 : 0.1, 20, 20]} />
        <meshPhongMaterial 
          color={nodeColor}
          shininess={100}
          specular="#ffffff"
          transparent
          opacity={0.95}
        />
      </mesh>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.14}
        color="#2d3748"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#ffffff"
        fillOpacity={hovered || isHighlighted ? 1 : 0.8}
        fontWeight="bold"
      >
        {displayText}
      </Text>
      {node.type === 'x-post' && node.xPostData && (hovered || isHighlighted) && (
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.1}
          color="#4a5568"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#ffffff"
          fillOpacity={0.9}
        >
          {node.xPostData.author.name}
        </Text>
      )}
      
      {/* Category badge - OZ style */}
      {node.category && (hovered || isHighlighted) && (
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.08}
          color="#f13321"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#ffffff"
          fillOpacity={0.95}
          fontWeight="bold"
        >
          📁 {node.category}
        </Text>
      )}
      
      {/* Tags badges - OZ style */}
      {node.tags && node.tags.length > 0 && (hovered || isHighlighted) && (
        <Text
          position={[0, -0.6, 0]}
          fontSize={0.07}
          color="#2d3748"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#ffffff"
          fillOpacity={0.9}
        >
          🏷️ {node.tags.slice(0, 3).join(' • ')}
        </Text>
      )}
    </group>
  )
}

interface NodeConnectionsProps {
  nodes: ThoughtNode[]
}

function NodeConnections({ nodes }: NodeConnectionsProps) {
  const drawnConnections = new Set<string>()
  
  return (
    <>
      {nodes.flatMap((node, i) =>
        nodes.slice(i + 1).map((otherNode) => {
          // Create connection between every pair of nodes
          const connectionKey = [node.id, otherNode.id].sort().join('-')
          if (drawnConnections.has(connectionKey)) return null
          drawnConnections.add(connectionKey)
          
          // Calculate distance to determine line opacity
          const distance = Math.sqrt(
            Math.pow(node.position[0] - otherNode.position[0], 2) +
            Math.pow(node.position[1] - otherNode.position[1], 2) +
            Math.pow(node.position[2] - otherNode.position[2], 2)
          )
          
          // Closer nodes have more visible connections
          const opacity = Math.max(0.05, 0.3 - distance * 0.02)
          
          return (
            <line key={connectionKey}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    ...node.position,
                    ...otherNode.position,
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color="#000000" 
                opacity={opacity}
                transparent
                linewidth={1}
              />
            </line>
          )
        })
      )}
    </>
  )
}

export default function NodeCanvas() {
  const nodes = useNodeStore((state) => state.nodes)
  const filteredNodes = useNodeStore((state) => state.filteredNodes)
  const getDisplayNodes = useNodeStore((state) => state.getDisplayNodes)
  const setSelectedNode = useNodeStore((state) => state.setSelectedNode)
  const setSelectedNodeId = useNodeStore((state) => state.setSelectedNodeId)
  const selectedNodeId = useNodeStore((state) => state.selectedNodeId)
  // Note: editing functionality removed during cleanup
  const deleteNode = useNodeStore((state) => state.deleteNode)
  const [layoutedNodes, setLayoutedNodes] = useState<ThoughtNode[]>([])
  const [useForceLayout, setUseForceLayout] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    node: ThoughtNode
    x: number
    y: number
  } | null>(null)

  // Apply force layout when enabled
  useEffect(() => {
    const displayNodes = getDisplayNodes()
    if (useForceLayout && displayNodes.length > 1) {
      const newLayoutedNodes = calculateForceLayout(displayNodes, {
        iterations: 30,
        repulsionStrength: 150,
        attractionStrength: 0.08,
        similarityThreshold: 0.4
      })
      setLayoutedNodes(newLayoutedNodes)
    } else {
      setLayoutedNodes(displayNodes)
    }
  }, [nodes, filteredNodes, useForceLayout, getDisplayNodes])

  // Update positions when nodes change but preserve existing positions
  useEffect(() => {
    setLayoutedNodes(currentLayouted => {
      const displayNodes = getDisplayNodes()
      return displayNodes.map(node => {
        const existing = currentLayouted.find(n => n.id === node.id)
        return existing ? { ...node, position: existing.position } : node
      })
    })
  }, [nodes, getDisplayNodes])

  // Close context menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null)
      }
    }
    
    if (contextMenu) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  const handleNodeClick = (node: ThoughtNode, event?: any) => {
    // 常に最新のノード情報を取得
    const latestNode = nodes.find(n => n.id === node.id) || node
    
    // Ctrl/Cmd + Click
    if (event && (event.ctrlKey || event.metaKey)) {
      handleNodeContextMenu(node, event)
    } else {
      // Normal click - navigate to URL
      if (latestNode.url) {
        window.open(latestNode.url, '_blank')
      }
    }
  }

  const handleNodeContextMenu = (node: ThoughtNode, event?: any) => {
    // 常に最新のノード情報を取得
    const latestNode = nodes.find(n => n.id === node.id) || node
    
    setSelectedNode(latestNode)
    setSelectedNodeId(node.id)
    
    // Get mouse position for context menu
    const rect = document.querySelector('canvas')?.getBoundingClientRect()
    const x = event?.clientX || (rect ? rect.left + 100 : 100)
    const y = event?.clientY || (rect ? rect.top + 100 : 100)
    
    setContextMenu({
      node: latestNode,
      x,
      y
    })
  }

  const toggleForceLayout = () => {
    setUseForceLayout(!useForceLayout)
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

  return (
    <>
      {/* Force Layout Toggle Button */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '6px',
        padding: '8px'
      }}>
        <button
          onClick={toggleForceLayout}
          style={{
            padding: '6px 12px',
            backgroundColor: useForceLayout ? '#4ecdc4' : '#666',
            color: useForceLayout ? '#000' : '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {useForceLayout ? '🎯 類似度レイアウト' : '📍 固定レイアウト'}
        </button>
      </div>
      
      <Canvas 
        camera={{ position: [15, 15, 15], fov: 50 }}
        style={{ background: '#ffffff' }}
        onClick={handleCanvasClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        
        <NodeConnections nodes={layoutedNodes} />
        
        {layoutedNodes.map((node) => {
          // Always use the latest node data from the store
          const latestNode = nodes.find(n => n.id === node.id) || node
          const nodeWithUpdatedPosition = { ...latestNode, position: node.position }
          const titleHash = (latestNode.title || latestNode.comment || '').slice(0, 10)
          return (
            <NodeSphere
              key={`${node.id}-${titleHash}`}
              node={nodeWithUpdatedPosition}
              onClick={handleNodeClick}
              onContextMenu={handleNodeContextMenu}
              isHighlighted={node.id === selectedNodeId}
            />
          )
        })}
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          autoRotate
          autoRotateSpeed={0.3}
          minDistance={5}
          maxDistance={50}
        />
        
        {/* Add fog for depth with white background */}
        <fog attach="fog" args={['#ffffff', 15, 60]} />
      </Canvas>
      
      {/* Note: editing modal removed during cleanup */}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '8px 0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 2000,
            minWidth: '150px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleEditNode}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              textAlign: 'left',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✏️ ノードを編集
          </button>
          <button
            onClick={handleDeleteNode}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ff6b6b',
              textAlign: 'left',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            🗑️ ノードを削除
          </button>
        </div>
      )}
    </>
  )
}
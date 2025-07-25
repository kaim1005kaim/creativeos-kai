import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'
import NodeEditModal from './NodeEditModal'
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
  onHover?: (node: ThoughtNode, event?: any) => void
  onHoverEnd?: () => void
  isHighlighted?: boolean
  onPositionUpdate?: (nodeId: string, position: [number, number, number]) => void
}

function NodeSphere({ node, onClick, onContextMenu, onHover, onHoverEnd, isHighlighted = false, onPositionUpdate }: NodeSphereProps) {
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
      // OZ-style floating animation - smaller, more random movement
      const time = state.clock.elapsedTime
      const nodeOffset = node.position[0] + node.position[2] // Use node position for uniqueness
      
      const animatedX = Math.sin(time * 1.2 + nodeOffset) * 0.08
      const animatedY = Math.sin(time * 1.5 + nodeOffset + 1) * 0.08
      const animatedZ = Math.cos(time * 1.3 + nodeOffset + 2) * 0.08
      
      meshRef.current.position.x = animatedX
      meshRef.current.position.y = animatedY
      meshRef.current.position.z = animatedZ
      
      // Slight rotation for anime effect
      if (hovered || isHighlighted) {
        meshRef.current.rotation.y += 0.02
      }
      
      // Update animated position for line connections
      if (onPositionUpdate) {
        const currentPos: [number, number, number] = [
          node.position[0] + animatedX,
          node.position[1] + animatedY,
          node.position[2] + animatedZ
        ]
        onPositionUpdate(node.id, currentPos)
      }
    }
    
    if (outlineRef.current) {
      // Sync outline with main sphere
      outlineRef.current.position.x = meshRef.current?.position.x || 0
      outlineRef.current.position.y = meshRef.current?.position.y || 0
      outlineRef.current.position.z = meshRef.current?.position.z || 0
      outlineRef.current.rotation.y = meshRef.current?.rotation.y || 0
    }
  })

  return (
    <group position={node.position}>
      {/* Red outline using A-Frame technique - scaled back-face */}
      <mesh
        ref={outlineRef}
        onClick={(event) => onClick(node, event)}
        onContextMenu={(event) => {
          event.stopPropagation()
          onContextMenu(node, event)
        }}
        onPointerOver={(event) => {
          setHovered(true)
          if (onHover) onHover(node, event)
        }}
        onPointerOut={() => {
          setHovered(false)
          if (onHoverEnd) onHoverEnd()
        }}
        scale={hovered ? 1.09 : 1.06}
      >
        <sphereGeometry args={[hovered ? 0.15 : 0.1, 20, 20]} />
        <meshBasicMaterial 
          color="#f13321"
          side={THREE.BackSide}
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
        onPointerOver={(event) => {
          setHovered(true)
          if (onHover) onHover(node, event)
        }}
        onPointerOut={() => {
          setHovered(false)
          if (onHoverEnd) onHoverEnd()
        }}
      >
        <sphereGeometry args={[hovered ? 0.15 : 0.1, 20, 20]} />
        <meshBasicMaterial 
          color={nodeColor}
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

      {/* 3D Space Tooltip - Fade in on hover */}
      {hovered && (
        <group position={[0.8, 0, 0]}>
          {/* Comment */}
          {node.comment && (
            <Text
              position={[0, 0.1, 0]}
              fontSize={0.08}
              color="#4a5568"
              anchorX="left"
              anchorY="middle"
              outlineWidth={0.005}
              outlineColor="#ffffff"
              fillOpacity={0.9}
              maxWidth={3}
            >
              💬 {node.comment}
            </Text>
          )}
          
          {/* Summary */}
          {node.summary && (
            <Text
              position={[0, -0.1, 0]}
              fontSize={0.06}
              color="#718096"
              anchorX="left"
              anchorY="middle"
              outlineWidth={0.003}
              outlineColor="#ffffff"
              fillOpacity={0.85}
              maxWidth={4}
            >
              📝 {node.summary.substring(0, 100)}
              {node.summary.length > 100 ? '...' : ''}
            </Text>
          )}
        </group>
      )}
    </group>
  )
}

interface NodeConnectionsProps {
  nodes: ThoughtNode[]
  animatedPositions: Map<string, [number, number, number]>
}

function NodeConnections({ nodes, animatedPositions }: NodeConnectionsProps) {
  const drawnConnections = new Set<string>()
  
  return (
    <>
      {nodes.flatMap((node, i) =>
        nodes.slice(i + 1).map((otherNode) => {
          // Only show connections for linked nodes or very close nodes
          const isLinked = node.linkedNodeIds?.includes(otherNode.id) || 
                          otherNode.linkedNodeIds?.includes(node.id)
          
          if (!isLinked) return null
          
          const connectionKey = [node.id, otherNode.id].sort().join('-')
          if (drawnConnections.has(connectionKey)) return null
          drawnConnections.add(connectionKey)
          
          // Get animated positions or fall back to static positions
          const nodeAnimatedPos = animatedPositions.get(node.id) || node.position
          const otherNodeAnimatedPos = animatedPositions.get(otherNode.id) || otherNode.position
          
          // Skip if either position is invalid
          if (!nodeAnimatedPos || !otherNodeAnimatedPos || 
              nodeAnimatedPos.length !== 3 || otherNodeAnimatedPos.length !== 3) {
            return null
          }
          
          // Calculate distance for opacity
          const distance = Math.sqrt(
            Math.pow(nodeAnimatedPos[0] - otherNodeAnimatedPos[0], 2) +
            Math.pow(nodeAnimatedPos[1] - otherNodeAnimatedPos[1], 2) +
            Math.pow(nodeAnimatedPos[2] - otherNodeAnimatedPos[2], 2)
          )
          
          // Only show if distance is reasonable
          if (distance > 15) return null
          
          const opacity = Math.max(0.1, 0.4 - distance * 0.02)
          
          return (
            <line key={connectionKey}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    ...nodeAnimatedPos,
                    ...otherNodeAnimatedPos,
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color="#333333" 
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
  const deleteNode = useNodeStore((state) => state.deleteNode)
  const [layoutedNodes, setLayoutedNodes] = useState<ThoughtNode[]>([])
  const [useForceLayout, setUseForceLayout] = useState(true)
  const [editingNode, setEditingNode] = useState<ThoughtNode | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    node: ThoughtNode
    x: number
    y: number
  } | null>(null)
  // Track animated positions for dynamic line connections
  const [animatedPositions, setAnimatedPositions] = useState<Map<string, [number, number, number]>>(new Map())

  // Apply force layout when enabled
  useEffect(() => {
    const displayNodes = getDisplayNodes()
    if (useForceLayout && displayNodes.length > 1) {
      const newLayoutedNodes = calculateForceLayout(displayNodes, {
        iterations: 50,
        repulsionStrength: 30,
        attractionStrength: 0.08,
        similarityThreshold: 0.3,
        centeringForce: 0.05,
        maxDistance: 10,
        minDistance: 2,
        damping: 0.85
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
    
    // Get mouse position for context menu from R3F event
    const rect = document.querySelector('canvas')?.getBoundingClientRect()
    let x, y
    
    if (event?.nativeEvent) {
      x = event.nativeEvent.clientX
      y = event.nativeEvent.clientY
    } else {
      // Fallback position
      x = (rect ? rect.left + 100 : 100)
      y = (rect ? rect.top + 100 : 100)
    }
    
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
      setEditingNode(contextMenu.node)
      setContextMenu(null)
    }
  }

  // 3D tooltips are now handled directly in NodeSphere component
  const handleNodeHover = (node: ThoughtNode, event?: any) => {
    // No longer needed - 3D tooltip is handled by hover state in NodeSphere
  }

  const handleNodeHoverEnd = () => {
    // No longer needed - 3D tooltip is handled by hover state in NodeSphere
  }

  const handleDeleteNode = async () => {
    if (contextMenu && window.confirm('このノードを削除しますか？')) {
      await deleteNode(contextMenu.node.id)
      setContextMenu(null)
    }
  }

  const handlePositionUpdate = (nodeId: string, position: [number, number, number]) => {
    setAnimatedPositions(prev => {
      const newMap = new Map(prev)
      newMap.set(nodeId, position)
      return newMap
    })
  }

  return (
    <>
      {/* Simple Layout Toggle */}
      <div 
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          zIndex: 1000,
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={toggleForceLayout}
      >
        <span style={{
          color: '#f13321',
          fontSize: '11px',
          fontWeight: '500',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          {useForceLayout ? '類似度' : '固定'}
        </span>
      </div>
      
      <Canvas 
        camera={{ position: [15, 15, 15], fov: 50 }}
        style={{ background: '#ffffff' }}
        onClick={handleCanvasClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        
        <NodeConnections nodes={layoutedNodes} animatedPositions={animatedPositions} />
        
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
              onHover={handleNodeHover}
              onHoverEnd={handleNodeHoverEnd}
              isHighlighted={node.id === selectedNodeId}
              onPositionUpdate={handlePositionUpdate}
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
      
      {/* Node Edit Modal */}
      <NodeEditModal
        node={editingNode}
        isOpen={!!editingNode}
        onClose={() => setEditingNode(null)}
      />

      
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
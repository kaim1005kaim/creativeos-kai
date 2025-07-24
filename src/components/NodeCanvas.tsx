import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'
import { ParticleSphere } from './ParticleSphere'
import * as THREE from 'three'


export function NodeCanvas() {
  const { nodes, deleteNode } = useNodeStore()
  const [filters] = useState({ categories: [], tags: [], timeRange: null })
  const [searchQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<{ node: ThoughtNode; position: [number, number] } | null>(null)
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set())
  const canvasRef = useRef<HTMLDivElement>(null)

  // Simple filtered nodes for the particle sphere
  const filteredNodes = useMemo(() => {
    return nodes
  }, [nodes])

  const handleNodeClick = (node: ThoughtNode) => {
    window.open(node.url, '_blank')
  }

  const handleNodeContextMenu = (node: ThoughtNode, event?: any) => {
    // Simplified context menu handling
    console.log('Context menu for node:', node.comment)
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
    <div ref={canvasRef} style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden' 
    }}>
      <Canvas
        style={{ 
          width: '100%', 
          height: '100%',
          background: '#111111'
        }}
        camera={{ position: [0, 0, 50], fov: 60 }}
        onPointerMissed={handleCanvasClick}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Minimal lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />

        {/* Particle Sphere */}
        <ParticleSphere
          nodes={filteredNodes}
          onNodeClick={handleNodeClick}
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.3}
          zoomSpeed={0.8}
          minDistance={20}
          maxDistance={80}
        />
        
        {/* Subtle fog for depth */}
        <fog attach="fog" args={['#111111', 30, 100]} />
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
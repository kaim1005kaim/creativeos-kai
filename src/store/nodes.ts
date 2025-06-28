import { create } from 'zustand'
import { ThoughtNode } from '../types/ThoughtNode'
import { generateSummary, getOGPMetadata } from '../lib/api'
import { useModelStore } from './model'
import { calculateSimilarity } from '../lib/similarity'

interface NodeStore {
  nodes: ThoughtNode[]
  filteredNodes: ThoughtNode[] | null
  selectedNode: ThoughtNode | null
  isLoading: boolean
  addNode: (url: string, comment: string) => Promise<void>
  updateNode: (updatedNode: ThoughtNode) => Promise<void>
  setSelectedNode: (node: ThoughtNode | null) => void
  setFilteredNodes: (filtered: ThoughtNode[]) => void
  clearFilter: () => void
  getDisplayNodes: () => ThoughtNode[]
  loadNodes: () => Promise<void>
  saveNodes: () => Promise<void>
}

const generateRandomPosition = (): [number, number, number] => {
  const radius = 10
  const theta = Math.random() * Math.PI * 2
  const phi = Math.random() * Math.PI
  
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  ]
}

export const useNodeStore = create<NodeStore>((set, get) => ({
  nodes: [],
  filteredNodes: null,
  selectedNode: null,
  isLoading: false,

  addNode: async (url: string, comment: string) => {
    set({ isLoading: true })
    
    try {
      const nodeId = crypto.randomUUID()
      
      // Get selected model ID
      const selectedModelId = useModelStore.getState().selectedModelId
      
      // Fetch OGP metadata and summary in parallel
      const [summary, ogpData] = await Promise.all([
        generateSummary(url, comment, selectedModelId),
        getOGPMetadata(url, nodeId)
      ])
      
      const response = await fetch('/api/embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${comment} ${summary}` }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate embedding')
      }
      
      const { embedding } = await response.json()
      
      const newNode: ThoughtNode = {
        id: nodeId,
        url,
        ogpImageUrl: ogpData.imageUrl,
        comment,
        summary,
        embedding,
        createdAt: Date.now(),
        position: generateRandomPosition(),
        linkedNodeIds: [],
      }
      
      const { nodes } = get()
      const similarities = nodes.map((node) => ({
        nodeId: node.id,
        similarity: calculateSimilarity(embedding, node.embedding),
      }))
      
      const strongConnections = similarities
        .filter((s) => s.similarity > 0.7)
        .map((s) => s.nodeId)
      
      newNode.linkedNodeIds = strongConnections
      
      strongConnections.forEach((nodeId) => {
        const existingNode = nodes.find((n) => n.id === nodeId)
        if (existingNode && !existingNode.linkedNodeIds.includes(newNode.id)) {
          existingNode.linkedNodeIds.push(newNode.id)
        }
      })
      
      set({ nodes: [...nodes, newNode] })
      await get().saveNodes()
      
    } catch (error) {
      console.error('Failed to add node:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  setFilteredNodes: (filtered) => set({ filteredNodes: filtered }),
  
  clearFilter: () => set({ filteredNodes: null }),
  
  getDisplayNodes: () => {
    const { nodes, filteredNodes } = get()
    return filteredNodes || nodes
  },

  updateNode: async (updatedNode: ThoughtNode) => {
    const { nodes } = get()
    const updatedNodes = nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    )
    set({ nodes: updatedNodes })
    await get().saveNodes()
  },

  loadNodes: async () => {
    try {
      const response = await fetch('/api/nodes')
      if (response.ok) {
        const nodes = await response.json()
        set({ nodes })
      }
    } catch (error) {
      console.error('Failed to load nodes:', error)
    }
  },

  saveNodes: async () => {
    try {
      const { nodes } = get()
      await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodes),
      })
    } catch (error) {
      console.error('Failed to save nodes:', error)
    }
  },
}))
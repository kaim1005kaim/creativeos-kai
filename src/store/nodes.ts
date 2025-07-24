import { create } from 'zustand'
import { ThoughtNode } from '../types/ThoughtNode'
import { generateSummary, generateTitle, getOGPMetadata, getXPostData, getXPostDataViaMCP, isXPostUrl, extractTags } from '../lib/api'
import { useModelStore } from './model'
import { calculateSimilarity } from '../lib/similarity'

interface NodeStore {
  nodes: ThoughtNode[]
  filteredNodes: string[] | null
  selectedNode: ThoughtNode | null
  selectedNodeId: string | null
  editingNode: ThoughtNode | null
  isLoading: boolean
  addNode: (url: string, comment: string, options?: { useMCP?: boolean }) => Promise<void>
  updateNode: (updatedNode: ThoughtNode) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  setSelectedNode: (node: ThoughtNode | null) => void
  setSelectedNodeId: (nodeId: string | null) => void
  setEditingNode: (node: ThoughtNode | null) => void
  setNodes: (nodes: ThoughtNode[]) => void
  setFilteredNodes: (filteredIds: string[]) => void
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
  selectedNodeId: null,
  editingNode: null,
  isLoading: false,

  addNode: async (url: string, comment: string, options?: { useMCP?: boolean }) => {
    set({ isLoading: true })
    
    try {
      const nodeId = crypto.randomUUID()
      
      // Get selected model ID
      const selectedModelId = useModelStore.getState().selectedModelId
      
      // Check if this is an X/Twitter post
      if (isXPostUrl(url)) {
        // Handle X post - use MCP if requested and available
        const xPostData = options?.useMCP 
          ? await getXPostDataViaMCP(url)
          : await getXPostData(url)
        
        // Use X post text + comment for summary and embedding
        const fullText = `${xPostData.text} ${comment}`.trim()
        
        const [summary, title, tagData] = await Promise.all([
          generateSummary(url, fullText, selectedModelId),
          generateTitle(url, fullText, selectedModelId),
          extractTags(fullText, url, selectedModelId)
        ])
        
        const response = await fetch('/api/embedding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: fullText }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate embedding')
        }
        
        const { embedding } = await response.json()
        
        const newNode: ThoughtNode = {
          id: nodeId,
          url,
          ogpImageUrl: xPostData.images[0] || xPostData.author.avatarUrl,
          comment,
          title: title || xPostData.text.slice(0, 50) + '...',
          summary,
          embedding,
          createdAt: Date.now(),
          position: generateRandomPosition(),
          linkedNodeIds: [],
          tags: tagData.tags,
          category: tagData.category,
          type: 'x-post',
          xPostData
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
        return
      }
      
      // Handle regular URL
      // Fetch OGP metadata, title, summary, and tags in parallel
      const [summary, title, ogpData, tagData] = await Promise.all([
        generateSummary(url, comment, selectedModelId),
        generateTitle(url, comment, selectedModelId),
        getOGPMetadata(url, nodeId),
        extractTags(`${comment}`, url, selectedModelId)
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
        title,
        summary,
        embedding,
        createdAt: Date.now(),
        position: generateRandomPosition(),
        linkedNodeIds: [],
        tags: tagData.tags,
        category: tagData.category,
        type: 'default'
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

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  setEditingNode: (node) => set({ editingNode: node }),

  setNodes: (nodes) => set({ nodes }),

  setFilteredNodes: (filteredIds) => set({ filteredNodes: filteredIds }),
  
  clearFilter: () => set({ filteredNodes: null }),
  
  getDisplayNodes: () => {
    const { nodes, filteredNodes } = get()
    if (filteredNodes === null) return nodes
    return nodes.filter(node => filteredNodes.includes(node.id))
  },

  updateNode: async (updatedNode: ThoughtNode) => {
    const { nodes, editingNode, selectedNode } = get()
    
    // Add lastUpdated timestamp to force re-render
    const nodeWithTimestamp = {
      ...updatedNode,
      lastUpdated: Date.now()
    }
    
    const updatedNodes = nodes.map(node => 
      node.id === updatedNode.id ? nodeWithTimestamp : node
    )
    
    // Update all related states
    const newState: Partial<NodeStore> = { nodes: updatedNodes }
    if (editingNode && editingNode.id === updatedNode.id) {
      newState.editingNode = nodeWithTimestamp
    }
    if (selectedNode && selectedNode.id === updatedNode.id) {
      newState.selectedNode = nodeWithTimestamp
    }
    
    set(newState)
    await get().saveNodes()
  },

  deleteNode: async (nodeId: string) => {
    const { nodes, selectedNode, editingNode } = get()
    
    // Remove node from array
    const updatedNodes = nodes.filter(node => node.id !== nodeId)
    
    // Remove references from other nodes' linkedNodeIds
    updatedNodes.forEach(node => {
      if (node.linkedNodeIds.includes(nodeId)) {
        node.linkedNodeIds = node.linkedNodeIds.filter(id => id !== nodeId)
      }
    })
    
    // Clear selection if deleted node was selected
    const newState: Partial<NodeStore> = { nodes: updatedNodes }
    if (selectedNode && selectedNode.id === nodeId) {
      newState.selectedNode = null
      newState.selectedNodeId = null
    }
    if (editingNode && editingNode.id === nodeId) {
      newState.editingNode = null
    }
    
    set(newState)
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
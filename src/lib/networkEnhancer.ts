import { ThoughtNode } from '../types/ThoughtNode'
import { calculateSimilarity } from './similarity'

// Enhance network connectivity by adding missing links between existing nodes
export function enhanceNetworkConnectivity(nodes: ThoughtNode[]): ThoughtNode[] {
  const enhancedNodes = [...nodes]
  
  for (let i = 0; i < enhancedNodes.length; i++) {
    const currentNode = enhancedNodes[i]
    const similarities = []
    
    for (let j = 0; j < enhancedNodes.length; j++) {
      if (i !== j) {
        const otherNode = enhancedNodes[j]
        const similarity = calculateSimilarity(currentNode.embedding, otherNode.embedding)
        similarities.push({
          nodeId: otherNode.id,
          similarity
        })
      }
    }
    
    // Find missing strong connections
    const potentialConnections = similarities
      .filter(s => s.similarity > 0.25) // Lower threshold for enhancement
      .filter(s => !currentNode.linkedNodeIds.includes(s.nodeId))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 2) // Add up to 2 missing connections
      .map(s => s.nodeId)
    
    // Add missing connections
    currentNode.linkedNodeIds.push(...potentialConnections)
    
    // Ensure bidirectional connections
    potentialConnections.forEach(nodeId => {
      const targetNode = enhancedNodes.find(n => n.id === nodeId)
      if (targetNode && !targetNode.linkedNodeIds.includes(currentNode.id)) {
        targetNode.linkedNodeIds.push(currentNode.id)
      }
    })
  }
  
  // Remove duplicates
  enhancedNodes.forEach(node => {
    node.linkedNodeIds = [...new Set(node.linkedNodeIds)]
  })
  
  return enhancedNodes
}

// Apply category-based connections for related nodes
export function addCategoryConnections(nodes: ThoughtNode[]): ThoughtNode[] {
  const enhancedNodes = [...nodes]
  
  // Group nodes by category
  const categoryGroups: { [key: string]: ThoughtNode[] } = {}
  enhancedNodes.forEach(node => {
    const category = node.category || 'その他'
    if (!categoryGroups[category]) {
      categoryGroups[category] = []
    }
    categoryGroups[category].push(node)
  })
  
  // Connect nodes within same category
  Object.values(categoryGroups).forEach(categoryNodes => {
    if (categoryNodes.length > 1) {
      categoryNodes.forEach(node => {
        // Connect to at least one other node in same category
        const sameCategory = categoryNodes
          .filter(n => n.id !== node.id)
          .filter(n => !node.linkedNodeIds.includes(n.id))
          .slice(0, 1) // Add one category connection
        
        sameCategory.forEach(targetNode => {
          node.linkedNodeIds.push(targetNode.id)
          if (!targetNode.linkedNodeIds.includes(node.id)) {
            targetNode.linkedNodeIds.push(node.id)
          }
        })
      })
    }
  })
  
  return enhancedNodes
}
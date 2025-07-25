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
    
    // Find missing connections with much more aggressive approach
    const strongConnections = similarities
      .filter(s => s.similarity > 0.1) // Very low threshold
      .filter(s => !currentNode.linkedNodeIds.includes(s.nodeId))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3) // Add up to 3 strong connections
      .map(s => s.nodeId)
    
    // Also add weaker connections to ensure connectivity
    const weakConnections = similarities
      .filter(s => s.similarity > 0.05 && s.similarity <= 0.1) // Even weaker connections
      .filter(s => !currentNode.linkedNodeIds.includes(s.nodeId))
      .filter(s => !strongConnections.includes(s.nodeId))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 2) // Add up to 2 weak connections
      .map(s => s.nodeId)
    
    const potentialConnections = [...strongConnections, ...weakConnections]
    
    // Fallback: if still no connections, force connect to top similarity nodes
    if (potentialConnections.length === 0 && currentNode.linkedNodeIds.length === 0) {
      const forceConnections = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 2) // Force at least 2 connections
        .map(s => s.nodeId)
      potentialConnections.push(...forceConnections)
    }
    
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
        // Connect to all other nodes in same category (for small groups)
        const sameCategory = categoryNodes
          .filter(n => n.id !== node.id)
          .filter(n => !node.linkedNodeIds.includes(n.id))
          .slice(0, categoryNodes.length <= 4 ? categoryNodes.length - 1 : 3) // Connect more aggressively
        
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
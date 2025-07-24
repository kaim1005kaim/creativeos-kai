import { ThoughtNode } from '../types/ThoughtNode'
import { calculateSimilarity } from './similarity'

export interface LayoutNode {
  id: string
  position: [number, number, number]
  velocity: [number, number, number]
  force: [number, number, number]
  fixed?: boolean
}

export interface LayoutConfig {
  iterations: number
  repulsionStrength: number
  attractionStrength: number
  damping: number
  centeringForce: number
  similarityThreshold: number
  maxDistance: number
  minDistance: number
}

const defaultConfig: LayoutConfig = {
  iterations: 50,
  repulsionStrength: 100,
  attractionStrength: 0.05,
  damping: 0.9,
  centeringForce: 0.01,
  similarityThreshold: 0.3,
  maxDistance: 25,
  minDistance: 2
}

// Calculate the ideal distance between two nodes based on their similarity
function getIdealDistance(similarity: number, config: LayoutConfig): number {
  // Higher similarity = shorter ideal distance
  if (similarity < config.similarityThreshold) {
    return config.maxDistance
  }
  
  // Map similarity (threshold to 1.0) to distance (maxDistance to minDistance)
  const normalizedSimilarity = (similarity - config.similarityThreshold) / (1.0 - config.similarityThreshold)
  return config.maxDistance - (normalizedSimilarity * (config.maxDistance - config.minDistance))
}

// Apply repulsion force between all nodes
function applyRepulsion(layoutNodes: LayoutNode[], config: LayoutConfig) {
  for (let i = 0; i < layoutNodes.length; i++) {
    for (let j = i + 1; j < layoutNodes.length; j++) {
      const nodeA = layoutNodes[i]
      const nodeB = layoutNodes[j]
      
      const dx = nodeA.position[0] - nodeB.position[0]
      const dy = nodeA.position[1] - nodeB.position[1]
      const dz = nodeA.position[2] - nodeB.position[2]
      
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (distance < 0.1) continue // Avoid division by zero
      
      const force = config.repulsionStrength / (distance * distance)
      const fx = (dx / distance) * force
      const fy = (dy / distance) * force
      const fz = (dz / distance) * force
      
      nodeA.force[0] += fx
      nodeA.force[1] += fy
      nodeA.force[2] += fz
      
      nodeB.force[0] -= fx
      nodeB.force[1] -= fy
      nodeB.force[2] -= fz
    }
  }
}

// Apply attraction force based on similarity
function applyAttraction(
  layoutNodes: LayoutNode[], 
  thoughtNodes: ThoughtNode[], 
  config: LayoutConfig
) {
  const nodeMap = new Map(layoutNodes.map(n => [n.id, n]))
  
  for (let i = 0; i < thoughtNodes.length; i++) {
    for (let j = i + 1; j < thoughtNodes.length; j++) {
      const nodeA = thoughtNodes[i]
      const nodeB = thoughtNodes[j]
      
      const similarity = calculateSimilarity(nodeA.embedding, nodeB.embedding)
      if (similarity < config.similarityThreshold) continue
      
      const layoutA = nodeMap.get(nodeA.id)
      const layoutB = nodeMap.get(nodeB.id)
      if (!layoutA || !layoutB) continue
      
      const dx = layoutB.position[0] - layoutA.position[0]
      const dy = layoutB.position[1] - layoutA.position[1]
      const dz = layoutB.position[2] - layoutA.position[2]
      
      const currentDistance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const idealDistance = getIdealDistance(similarity, config)
      
      if (currentDistance < 0.1) continue
      
      const distanceError = currentDistance - idealDistance
      const force = config.attractionStrength * distanceError * similarity
      
      const fx = (dx / currentDistance) * force
      const fy = (dy / currentDistance) * force
      const fz = (dz / currentDistance) * force
      
      layoutA.force[0] += fx
      layoutA.force[1] += fy
      layoutA.force[2] += fz
      
      layoutB.force[0] -= fx
      layoutB.force[1] -= fy
      layoutB.force[2] -= fz
    }
  }
}

// Apply centering force to keep nodes around origin
function applyCentering(layoutNodes: LayoutNode[], config: LayoutConfig) {
  for (const node of layoutNodes) {
    const distance = Math.sqrt(
      node.position[0] * node.position[0] + 
      node.position[1] * node.position[1] + 
      node.position[2] * node.position[2]
    )
    
    if (distance > 0.1) {
      const force = config.centeringForce * distance
      node.force[0] -= (node.position[0] / distance) * force
      node.force[1] -= (node.position[1] / distance) * force
      node.force[2] -= (node.position[2] / distance) * force
    }
  }
}

// Update positions based on forces
function updatePositions(layoutNodes: LayoutNode[], config: LayoutConfig) {
  for (const node of layoutNodes) {
    if (node.fixed) continue
    
    // Update velocity
    node.velocity[0] = (node.velocity[0] + node.force[0]) * config.damping
    node.velocity[1] = (node.velocity[1] + node.force[1]) * config.damping
    node.velocity[2] = (node.velocity[2] + node.force[2]) * config.damping
    
    // Update position
    node.position[0] += node.velocity[0]
    node.position[1] += node.velocity[1]
    node.position[2] += node.velocity[2]
    
    // Reset forces
    node.force[0] = 0
    node.force[1] = 0
    node.force[2] = 0
  }
}

// Main force-directed layout algorithm
export function calculateForceLayout(
  thoughtNodes: ThoughtNode[],
  config: Partial<LayoutConfig> = {}
): ThoughtNode[] {
  const finalConfig = { ...defaultConfig, ...config }
  
  // Initialize layout nodes
  const layoutNodes: LayoutNode[] = thoughtNodes.map(node => ({
    id: node.id,
    position: [...node.position] as [number, number, number],
    velocity: [0, 0, 0],
    force: [0, 0, 0]
  }))
  
  // Run simulation
  for (let iteration = 0; iteration < finalConfig.iterations; iteration++) {
    applyRepulsion(layoutNodes, finalConfig)
    applyAttraction(layoutNodes, thoughtNodes, finalConfig)
    applyCentering(layoutNodes, finalConfig)
    updatePositions(layoutNodes, finalConfig)
  }
  
  // Update thought nodes with new positions
  const layoutMap = new Map(layoutNodes.map(n => [n.id, n.position]))
  
  return thoughtNodes.map(node => ({
    ...node,
    position: layoutMap.get(node.id) || node.position
  }))
}

// Calculate similarity matrix for visualization
export function calculateSimilarityMatrix(nodes: ThoughtNode[]): number[][] {
  const matrix: number[][] = []
  
  for (let i = 0; i < nodes.length; i++) {
    matrix[i] = []
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0
      } else {
        matrix[i][j] = calculateSimilarity(nodes[i].embedding, nodes[j].embedding)
      }
    }
  }
  
  return matrix
}
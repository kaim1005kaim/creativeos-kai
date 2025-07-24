import { ThoughtNode } from '../types/ThoughtNode'
import { calculateSimilarity } from './similarity'

export interface GraphNode {
  id: string
  node: ThoughtNode
  x: number
  y: number
  z: number
  connections: GraphConnection[]
  centralityScore: number
  communityId?: string
  importance: number
  depth: number
}

export interface GraphConnection {
  source: string
  target: string
  weight: number
  type: 'semantic' | 'category' | 'tag' | 'domain' | 'temporal'
  strength: 'weak' | 'medium' | 'strong'
  color: string
}

export interface Community {
  id: string
  nodes: string[]
  label: string
  color: string
  density: number
  centerNode: string
}

export interface GraphMetrics {
  totalNodes: number
  totalConnections: number
  averageDegree: number
  density: number
  diameter: number
  communities: Community[]
  centralNodes: string[]
  isolatedNodes: string[]
  stronglyConnectedComponents: string[][]
}

// 関係性の種類を判定
export function determineConnectionType(
  nodeA: ThoughtNode, 
  nodeB: ThoughtNode
): { type: GraphConnection['type']; weight: number } {
  let weight = 0
  let primaryType: GraphConnection['type'] = 'semantic'
  
  // セマンティック類似度
  const semanticSimilarity = calculateSimilarity(nodeA.embedding, nodeB.embedding)
  weight += semanticSimilarity * 0.4
  
  // カテゴリ一致
  if (nodeA.category && nodeB.category && nodeA.category === nodeB.category) {
    weight += 0.3
    if (semanticSimilarity < 0.3) primaryType = 'category'
  }
  
  // タグ共通性
  const commonTags = (nodeA.tags || []).filter(tag => (nodeB.tags || []).includes(tag))
  if (commonTags.length > 0) {
    weight += Math.min(0.2, commonTags.length * 0.1)
    if (semanticSimilarity < 0.3 && primaryType === 'semantic') primaryType = 'tag'
  }
  
  // ドメイン一致
  try {
    const domainA = new URL(nodeA.url).hostname
    const domainB = new URL(nodeB.url).hostname
    if (domainA === domainB) {
      weight += 0.1
      if (semanticSimilarity < 0.2 && primaryType === 'semantic') primaryType = 'domain'
    }
  } catch {}
  
  // 時間的近接性
  const timeDiff = Math.abs(nodeA.createdAt - nodeB.createdAt)
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
  if (daysDiff < 7) {
    weight += Math.max(0, 0.1 - daysDiff * 0.01)
    if (semanticSimilarity < 0.2 && primaryType === 'semantic') primaryType = 'temporal'
  }
  
  return { type: primaryType, weight: Math.min(1, weight) }
}

// 接続の強度を計算
export function calculateConnectionStrength(weight: number): GraphConnection['strength'] {
  if (weight > 0.7) return 'strong'
  if (weight > 0.4) return 'medium'
  return 'weak'
}

// 接続の色を決定
export function getConnectionColor(connection: GraphConnection): string {
  const alpha = connection.strength === 'strong' ? '1' : 
                connection.strength === 'medium' ? '0.6' : '0.3'
  
  switch (connection.type) {
    case 'semantic': return `rgba(59, 130, 246, ${alpha})` // Blue
    case 'category': return `rgba(16, 185, 129, ${alpha})` // Green
    case 'tag': return `rgba(245, 158, 11, ${alpha})` // Amber
    case 'domain': return `rgba(139, 92, 246, ${alpha})` // Purple
    case 'temporal': return `rgba(239, 68, 68, ${alpha})` // Red
    default: return `rgba(107, 114, 128, ${alpha})` // Gray
  }
}

// ナレッジグラフの構築
export function buildKnowledgeGraph(
  nodes: ThoughtNode[],
  minConnectionWeight: number = 0.3
): { graphNodes: GraphNode[]; connections: GraphConnection[]; metrics: GraphMetrics } {
  const connections: GraphConnection[] = []
  const adjacencyMatrix = new Map<string, Set<string>>()
  
  // 初期化
  nodes.forEach(node => {
    adjacencyMatrix.set(node.id, new Set())
  })
  
  // すべてのノードペアで接続を計算
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i]
      const nodeB = nodes[j]
      
      const { type, weight } = determineConnectionType(nodeA, nodeB)
      
      if (weight >= minConnectionWeight) {
        const connection: GraphConnection = {
          source: nodeA.id,
          target: nodeB.id,
          weight,
          type,
          strength: calculateConnectionStrength(weight),
          color: getConnectionColor({ 
            type, 
            weight, 
            strength: calculateConnectionStrength(weight), 
            source: nodeA.id, 
            target: nodeB.id,
            color: ''
          })
        }
        
        connections.push(connection)
        adjacencyMatrix.get(nodeA.id)!.add(nodeB.id)
        adjacencyMatrix.get(nodeB.id)!.add(nodeA.id)
      }
    }
  }
  
  // 中心性スコアの計算
  const centralityScores = calculateCentralityScores(nodes, adjacencyMatrix)
  
  // コミュニティ検出
  const communities = detectCommunities(nodes, adjacencyMatrix)
  
  // GraphNodeの構築
  const graphNodes: GraphNode[] = nodes.map(node => ({
    id: node.id,
    node,
    x: node.position[0],
    y: node.position[1],
    z: node.position[2],
    connections: connections.filter(c => c.source === node.id || c.target === node.id),
    centralityScore: centralityScores.get(node.id) || 0,
    communityId: communities.find(c => c.nodes.includes(node.id))?.id,
    importance: calculateNodeImportance(node, centralityScores.get(node.id) || 0),
    depth: calculateNodeDepth(node.id, adjacencyMatrix)
  }))
  
  // メトリクスの計算
  const metrics = calculateGraphMetrics(graphNodes, connections, communities)
  
  return { graphNodes, connections, metrics }
}

// 中心性スコアの計算（PageRankアルゴリズム）
function calculateCentralityScores(
  nodes: ThoughtNode[], 
  adjacencyMatrix: Map<string, Set<string>>,
  damping: number = 0.85,
  iterations: number = 100
): Map<string, number> {
  const scores = new Map<string, number>()
  const nodeIds = nodes.map(n => n.id)
  
  // 初期化
  nodeIds.forEach(id => scores.set(id, 1.0))
  
  for (let iter = 0; iter < iterations; iter++) {
    const newScores = new Map<string, number>()
    
    nodeIds.forEach(nodeId => {
      let score = (1 - damping)
      
      // 入力リンクからのスコア
      nodeIds.forEach(otherId => {
        if (adjacencyMatrix.get(otherId)?.has(nodeId)) {
          const outDegree = adjacencyMatrix.get(otherId)!.size
          score += damping * (scores.get(otherId) || 0) / Math.max(1, outDegree)
        }
      })
      
      newScores.set(nodeId, score)
    })
    
    // スコアの更新
    newScores.forEach((score, nodeId) => {
      scores.set(nodeId, score)
    })
  }
  
  return scores
}

// コミュニティ検出（Louvainアルゴリズムの簡易版）
function detectCommunities(
  nodes: ThoughtNode[], 
  adjacencyMatrix: Map<string, Set<string>>
): Community[] {
  const communities: Community[] = []
  const visited = new Set<string>()
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
  
  nodes.forEach((node, index) => {
    if (!visited.has(node.id)) {
      const community = exploreConnectedComponent(node.id, adjacencyMatrix, visited)
      
      if (community.length > 1) {
        // コミュニティの中心ノードを決定
        const centerNode = community.reduce((center, nodeId) => {
          const centerConnections = adjacencyMatrix.get(center)?.size || 0
          const nodeConnections = adjacencyMatrix.get(nodeId)?.size || 0
          return nodeConnections > centerConnections ? nodeId : center
        })
        
        // コミュニティ密度の計算
        const possibleConnections = community.length * (community.length - 1) / 2
        const actualConnections = community.reduce((count, nodeId) => {
          return count + Array.from(adjacencyMatrix.get(nodeId) || [])
            .filter(targetId => community.includes(targetId)).length
        }, 0) / 2
        
        const density = actualConnections / possibleConnections
        
        communities.push({
          id: `community-${communities.length}`,
          nodes: community,
          label: generateCommunityLabel(community, nodes),
          color: colors[communities.length % colors.length],
          density,
          centerNode
        })
      }
    }
  })
  
  return communities
}

// 連結成分の探索
function exploreConnectedComponent(
  startNodeId: string,
  adjacencyMatrix: Map<string, Set<string>>,
  visited: Set<string>
): string[] {
  const component: string[] = []
  const stack = [startNodeId]
  
  while (stack.length > 0) {
    const nodeId = stack.pop()!
    
    if (!visited.has(nodeId)) {
      visited.add(nodeId)
      component.push(nodeId)
      
      const neighbors = adjacencyMatrix.get(nodeId) || new Set()
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          stack.push(neighborId)
        }
      })
    }
  }
  
  return component
}

// コミュニティのラベル生成
function generateCommunityLabel(nodeIds: string[], allNodes: ThoughtNode[]): string {
  const communityNodes = allNodes.filter(n => nodeIds.includes(n.id))
  
  // カテゴリで分類
  const categories = communityNodes
    .map(n => n.category)
    .filter(Boolean)
    .reduce((acc, cat) => {
      acc[cat!] = (acc[cat!] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  const topCategory = Object.entries(categories)
    .sort(([,a], [,b]) => b - a)[0]?.[0]
  
  if (topCategory && categories[topCategory] >= communityNodes.length * 0.5) {
    return `${topCategory}グループ`
  }
  
  // ドメインで分類
  const domains = communityNodes
    .map(n => {
      try {
        return new URL(n.url).hostname.replace('www.', '')
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .reduce((acc, domain) => {
      acc[domain!] = (acc[domain!] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  const topDomain = Object.entries(domains)
    .sort(([,a], [,b]) => b - a)[0]?.[0]
  
  if (topDomain && domains[topDomain] >= communityNodes.length * 0.5) {
    return `${topDomain}関連`
  }
  
  return `クラスタ${nodeIds.length}`
}

// ノードの重要度計算
function calculateNodeImportance(node: ThoughtNode, centralityScore: number): number {
  let importance = centralityScore * 0.4
  
  // 接続数による重要度
  importance += Math.min(0.3, node.linkedNodeIds.length * 0.05)
  
  // タグ数による重要度
  importance += Math.min(0.1, (node.tags?.length || 0) * 0.02)
  
  // 新しさによる重要度
  const daysSinceCreation = (Date.now() - node.createdAt) / (1000 * 60 * 60 * 24)
  importance += Math.max(0, 0.2 - daysSinceCreation * 0.01)
  
  return Math.min(1, importance)
}

// ノードの深度計算
function calculateNodeDepth(
  nodeId: string, 
  adjacencyMatrix: Map<string, Set<string>>
): number {
  const visited = new Set<string>()
  const queue = [{ id: nodeId, depth: 0 }]
  let maxDepth = 0
  
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!
    
    if (!visited.has(id)) {
      visited.add(id)
      maxDepth = Math.max(maxDepth, depth)
      
      const neighbors = adjacencyMatrix.get(id) || new Set()
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, depth: depth + 1 })
        }
      })
    }
  }
  
  return maxDepth
}

// グラフメトリクスの計算
function calculateGraphMetrics(
  graphNodes: GraphNode[], 
  connections: GraphConnection[], 
  communities: Community[]
): GraphMetrics {
  const totalNodes = graphNodes.length
  const totalConnections = connections.length
  const averageDegree = totalConnections * 2 / totalNodes
  const density = totalConnections / (totalNodes * (totalNodes - 1) / 2)
  
  // 中心性の高いノード
  const centralNodes = graphNodes
    .sort((a, b) => b.centralityScore - a.centralityScore)
    .slice(0, Math.min(5, Math.floor(totalNodes * 0.1)))
    .map(n => n.id)
  
  // 孤立ノード
  const isolatedNodes = graphNodes
    .filter(n => n.connections.length === 0)
    .map(n => n.id)
  
  // 強連結成分
  const stronglyConnectedComponents = communities
    .filter(c => c.density > 0.7)
    .map(c => c.nodes)
  
  // 直径の計算（最短経路の最大値）
  const diameter = calculateGraphDiameter(graphNodes, connections)
  
  return {
    totalNodes,
    totalConnections,
    averageDegree,
    density,
    diameter,
    communities,
    centralNodes,
    isolatedNodes,
    stronglyConnectedComponents
  }
}

// グラフの直径計算
function calculateGraphDiameter(graphNodes: GraphNode[], connections: GraphConnection[]): number {
  const adjacencyList = new Map<string, string[]>()
  
  graphNodes.forEach(node => {
    adjacencyList.set(node.id, [])
  })
  
  connections.forEach(conn => {
    adjacencyList.get(conn.source)!.push(conn.target)
    adjacencyList.get(conn.target)!.push(conn.source)
  })
  
  let maxDistance = 0
  
  for (const startNode of graphNodes) {
    const distances = new Map<string, number>()
    const queue = [startNode.id]
    distances.set(startNode.id, 0)
    
    while (queue.length > 0) {
      const current = queue.shift()!
      const currentDistance = distances.get(current)!
      
      const neighbors = adjacencyList.get(current) || []
      neighbors.forEach(neighbor => {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDistance + 1)
          queue.push(neighbor)
          maxDistance = Math.max(maxDistance, currentDistance + 1)
        }
      })
    }
  }
  
  return maxDistance
}
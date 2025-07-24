import { ThoughtNode } from '../types/ThoughtNode'

export interface Cluster {
  id: string
  center: number[]
  nodes: ThoughtNode[]
  label: string
  color: string
}

// k-means距離計算
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0))
}

// コサイン類似度
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0
  return dotProduct / (magnitudeA * magnitudeB)
}

// ベクトルの平均値計算
function calculateCentroid(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return []
  
  const dimensions = embeddings[0].length
  const centroid = new Array(dimensions).fill(0)
  
  embeddings.forEach(embedding => {
    embedding.forEach((value, i) => {
      centroid[i] += value
    })
  })
  
  return centroid.map(sum => sum / embeddings.length)
}

// クラスターラベル生成（カテゴリとタグを活用）
function generateClusterLabel(nodes: ThoughtNode[]): string {
  // カテゴリ別分類（最優先）
  const categories = nodes
    .map(node => node.category)
    .filter(Boolean) as string[]
  
  if (categories.length > 0) {
    const categoryCounts = categories.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    if (topCategory && categoryCounts[topCategory] >= nodes.length * 0.3) {
      return `${topCategory} (${nodes.length})`
    }
  }
  
  // タグ別分類（次優先）
  const tags = nodes
    .flatMap(node => node.tags || [])
    .filter(Boolean)
  
  if (tags.length > 0) {
    const tagCounts = tags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const topTag = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    if (topTag && tagCounts[topTag] >= 2) {
      return `${topTag} (${nodes.length})`
    }
  }
  
  // ドメイン別分類（従来の方法）
  const domains = nodes.map(node => {
    try {
      return new URL(node.url).hostname.replace('www.', '')
    } catch {
      return 'unknown'
    }
  })
  
  const domainCounts = domains.reduce((acc, domain) => {
    acc[domain] = (acc[domain] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topDomain = Object.entries(domainCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0]
  
  // キーワード抽出（コメントから）
  const keywords = nodes.flatMap(node => 
    node.comment.split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => word.toLowerCase())
  )
  
  const keywordCounts = keywords.reduce((acc, keyword) => {
    acc[keyword] = (acc[keyword] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topKeyword = Object.entries(keywordCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0]
  
  // ラベル生成
  if (topDomain && topDomain !== 'unknown') {
    return `${topDomain} (${nodes.length})`
  } else if (topKeyword) {
    return `${topKeyword} (${nodes.length})`
  } else {
    return `クラスター ${nodes.length}`
  }
}

// k-meansクラスタリング実装
export function performKMeansClustering(
  nodes: ThoughtNode[], 
  k: number = 5,
  maxIterations: number = 100
): Cluster[] {
  if (nodes.length === 0) return []
  if (k >= nodes.length) k = Math.max(1, Math.floor(nodes.length / 2))
  
  const embeddings = nodes.map(node => node.embedding)
  const dimensions = embeddings[0].length
  
  // 初期クラスター中心をランダムに設定
  let centroids: number[][] = []
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * embeddings.length)
    centroids.push([...embeddings[randomIndex]])
  }
  
  let assignments = new Array(nodes.length).fill(0)
  let converged = false
  let iterations = 0
  
  while (!converged && iterations < maxIterations) {
    const newAssignments = new Array(nodes.length)
    
    // 各ノードを最も近いクラスターに割り当て
    for (let i = 0; i < embeddings.length; i++) {
      let minDistance = Infinity
      let bestCluster = 0
      
      for (let j = 0; j < k; j++) {
        const distance = euclideanDistance(embeddings[i], centroids[j])
        if (distance < minDistance) {
          minDistance = distance
          bestCluster = j
        }
      }
      
      newAssignments[i] = bestCluster
    }
    
    // 収束判定
    converged = assignments.every((assignment, i) => assignment === newAssignments[i])
    assignments = newAssignments
    
    // クラスター中心を更新
    if (!converged) {
      for (let j = 0; j < k; j++) {
        const clusterEmbeddings = embeddings.filter((_, i) => assignments[i] === j)
        if (clusterEmbeddings.length > 0) {
          centroids[j] = calculateCentroid(clusterEmbeddings)
        }
      }
    }
    
    iterations++
  }
  
  // クラスター結果を構築
  const clusters: Cluster[] = []
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ]
  
  for (let i = 0; i < k; i++) {
    const clusterNodes = nodes.filter((_, j) => assignments[j] === i)
    
    if (clusterNodes.length > 0) {
      clusters.push({
        id: `cluster-${i}`,
        center: centroids[i],
        nodes: clusterNodes,
        label: generateClusterLabel(clusterNodes),
        color: colors[i % colors.length]
      })
    }
  }
  
  // ノード数でソート（大きいクラスターから）
  return clusters.sort((a, b) => b.nodes.length - a.nodes.length)
}

// 自動クラスター数決定（エルボー法の簡易版）
export function findOptimalClusterCount(nodes: ThoughtNode[], maxK: number = 10): number {
  if (nodes.length < 4) return 1
  
  const maxClusters = Math.min(maxK, Math.floor(nodes.length / 2))
  let bestK = 3
  let bestScore = Infinity
  
  for (let k = 2; k <= maxClusters; k++) {
    const clusters = performKMeansClustering(nodes, k, 20) // 高速化のため反復数を制限
    
    // クラスター内分散の計算
    let totalVariance = 0
    clusters.forEach(cluster => {
      cluster.nodes.forEach(node => {
        const distance = euclideanDistance(node.embedding, cluster.center)
        totalVariance += distance * distance
      })
    })
    
    // ペナルティ付きスコア（クラスター数が多すぎることを防ぐ）
    const score = totalVariance + (k * 0.1 * nodes.length)
    
    if (score < bestScore) {
      bestScore = score
      bestK = k
    }
  }
  
  return bestK
}

// カテゴリベースクラスタリング
export function performCategoryBasedClustering(nodes: ThoughtNode[]): Cluster[] {
  if (nodes.length === 0) return []
  
  // カテゴリ別にグループ化
  const categoryGroups = new Map<string, ThoughtNode[]>()
  const uncategorizedNodes: ThoughtNode[] = []
  
  nodes.forEach(node => {
    if (node.category && node.category !== 'その他') {
      if (!categoryGroups.has(node.category)) {
        categoryGroups.set(node.category, [])
      }
      categoryGroups.get(node.category)!.push(node)
    } else {
      uncategorizedNodes.push(node)
    }
  })
  
  const clusters: Cluster[] = []
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ]
  
  let colorIndex = 0
  
  // カテゴリ別クラスターを作成
  categoryGroups.forEach((categoryNodes, category) => {
    if (categoryNodes.length > 0) {
      const centroid = calculateCentroid(categoryNodes.map(n => n.embedding))
      clusters.push({
        id: `category-${category}`,
        center: centroid,
        nodes: categoryNodes,
        label: `${category} (${categoryNodes.length})`,
        color: colors[colorIndex % colors.length]
      })
      colorIndex++
    }
  })
  
  // 未分類ノードがある場合は、k-meansでクラスタリング
  if (uncategorizedNodes.length > 0) {
    const k = Math.min(3, Math.max(1, Math.floor(uncategorizedNodes.length / 3)))
    const uncategorizedClusters = performKMeansClustering(uncategorizedNodes, k, 50)
    
    uncategorizedClusters.forEach((cluster, i) => {
      clusters.push({
        ...cluster,
        id: `uncategorized-${i}`,
        label: `その他 (${cluster.nodes.length})`,
        color: colors[colorIndex % colors.length]
      })
      colorIndex++
    })
  }
  
  return clusters.sort((a, b) => b.nodes.length - a.nodes.length)
}

// 自動クラスタリング（カテゴリ＋k-means）
export function performHybridClustering(nodes: ThoughtNode[]): Cluster[] {
  if (nodes.length === 0) return []
  
  // カテゴリ情報が豊富な場合はカテゴリベース
  const categorizedNodes = nodes.filter(n => n.category && n.category !== 'その他')
  const categoryRatio = categorizedNodes.length / nodes.length
  
  if (categoryRatio > 0.5) {
    return performCategoryBasedClustering(nodes)
  } else {
    // 従来のk-meansクラスタリング
    const optimalK = findOptimalClusterCount(nodes)
    return performKMeansClustering(nodes, optimalK)
  }
}

// クラスター統計情報
export function getClusterStats(clusters: Cluster[]): {
  totalNodes: number
  clusterCount: number
  averageClusterSize: number
  largestCluster: number
  smallestCluster: number
} {
  if (clusters.length === 0) {
    return {
      totalNodes: 0,
      clusterCount: 0,
      averageClusterSize: 0,
      largestCluster: 0,
      smallestCluster: 0
    }
  }
  
  const sizes = clusters.map(c => c.nodes.length)
  const totalNodes = sizes.reduce((sum, size) => sum + size, 0)
  
  return {
    totalNodes,
    clusterCount: clusters.length,
    averageClusterSize: totalNodes / clusters.length,
    largestCluster: Math.max(...sizes),
    smallestCluster: Math.min(...sizes)
  }
}
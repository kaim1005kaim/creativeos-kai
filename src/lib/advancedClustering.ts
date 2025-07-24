import { ThoughtNode } from '../types/ThoughtNode'
import { calculateSimilarity } from './similarity'

export interface ClusterNode {
  id: string
  node: ThoughtNode
  cluster: number
  centroid?: number[]
  clusterScore: number
}

export interface Cluster {
  id: number
  nodes: ClusterNode[]
  centroid: number[]
  label: string
  description: string
  color: string
  coherence: number
  topics: string[]
}

export interface ClusteringResult {
  clusters: Cluster[]
  silhouetteScore: number
  recommendedK: number
}

// 高度なクラスタリングアルゴリズム
export class AdvancedClustering {
  private nodes: ThoughtNode[]
  private embeddings: number[][]
  
  constructor(nodes: ThoughtNode[]) {
    this.nodes = nodes.filter(node => node.embedding && node.embedding.length > 0)
    this.embeddings = this.nodes.map(node => node.embedding)
  }

  // メインのクラスタリング関数
  async performClustering(options: {
    method?: 'kmeans' | 'hierarchical' | 'dbscan' | 'auto'
    k?: number
    minClusterSize?: number
    useSemanticLabeling?: boolean
  } = {}): Promise<ClusteringResult> {
    const {
      method = 'auto',
      k,
      minClusterSize = 2,
      useSemanticLabeling = true
    } = options

    if (this.nodes.length < 2) {
      return {
        clusters: [],
        silhouetteScore: 0,
        recommendedK: 0
      }
    }

    let clusterAssignments: number[]
    let optimalK: number

    switch (method) {
      case 'kmeans':
        optimalK = k || await this.findOptimalK()
        clusterAssignments = this.kMeansClustering(optimalK)
        break
      case 'hierarchical':
        optimalK = k || await this.findOptimalK()
        clusterAssignments = this.hierarchicalClustering(optimalK)
        break
      case 'dbscan':
        const dbscanResult = this.dbscanClustering()
        clusterAssignments = dbscanResult.assignments
        optimalK = dbscanResult.clusterCount
        break
      case 'auto':
      default:
        optimalK = k || await this.findOptimalK()
        // 複数の手法を試して最良の結果を選択
        const results = await Promise.all([
          this.evaluateMethod('kmeans', optimalK),
          this.evaluateMethod('hierarchical', optimalK),
          this.evaluateMethod('dbscan', undefined)
        ])
        const bestResult = results.reduce((best, current) => 
          current.silhouetteScore > best.silhouetteScore ? current : best
        )
        clusterAssignments = bestResult.assignments
        optimalK = bestResult.clusterCount
    }

    // クラスター構築
    const clusters = await this.buildClusters(clusterAssignments, optimalK, useSemanticLabeling)
    
    // シルエットスコア計算
    const silhouetteScore = this.calculateSilhouetteScore(clusterAssignments)

    return {
      clusters: clusters.filter(cluster => cluster.nodes.length >= minClusterSize),
      silhouetteScore,
      recommendedK: optimalK
    }
  }

  // 最適なクラスター数を自動決定
  private async findOptimalK(): Promise<number> {
    const maxK = Math.min(Math.floor(Math.sqrt(this.nodes.length)), 10)
    const scores: number[] = []

    for (let k = 2; k <= maxK; k++) {
      const assignments = this.kMeansClustering(k)
      const silhouette = this.calculateSilhouetteScore(assignments)
      const inertia = this.calculateInertia(assignments, k)
      
      // エルボー法とシルエット法の組み合わせ
      scores.push(silhouette * 0.7 + (1 - inertia / this.embeddings.length) * 0.3)
    }

    const bestK = scores.indexOf(Math.max(...scores)) + 2
    return bestK
  }

  // K-meansクラスタリング
  private kMeansClustering(k: number): number[] {
    const centroids = this.initializeCentroids(k)
    const assignments = new Array(this.nodes.length).fill(0)
    const maxIterations = 100
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let changed = false
      
      // 各点を最も近いセントロイドに割り当て
      for (let i = 0; i < this.embeddings.length; i++) {
        const newCluster = this.findNearestCentroid(this.embeddings[i], centroids)
        if (assignments[i] !== newCluster) {
          assignments[i] = newCluster
          changed = true
        }
      }
      
      if (!changed) break
      
      // セントロイドを更新
      this.updateCentroids(centroids, assignments)
    }
    
    return assignments
  }

  // 階層クラスタリング
  private hierarchicalClustering(k: number): number[] {
    const n = this.embeddings.length
    const distances = this.calculateDistanceMatrix()
    const clusters = Array.from({ length: n }, (_, i) => [i])
    
    while (clusters.length > k) {
      // 最も近いクラスターペアを見つけて結合
      let minDistance = Infinity
      let mergeIndices = [0, 1]
      
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const distance = this.calculateClusterDistance(clusters[i], clusters[j], distances)
          if (distance < minDistance) {
            minDistance = distance
            mergeIndices = [i, j]
          }
        }
      }
      
      // クラスターを結合
      const [i, j] = mergeIndices
      clusters[i] = [...clusters[i], ...clusters[j]]
      clusters.splice(j, 1)
    }
    
    // 割り当て配列を生成
    const assignments = new Array(n).fill(0)
    clusters.forEach((cluster, clusterIndex) => {
      cluster.forEach(nodeIndex => {
        assignments[nodeIndex] = clusterIndex
      })
    })
    
    return assignments
  }

  // DBSCANクラスタリング
  private dbscanClustering(eps: number = 0.3, minPts: number = 3): { assignments: number[], clusterCount: number } {
    const n = this.embeddings.length
    const visited = new Array(n).fill(false)
    const assignments = new Array(n).fill(-1) // -1 = ノイズ
    let clusterCount = 0

    for (let i = 0; i < n; i++) {
      if (visited[i]) continue
      
      visited[i] = true
      const neighbors = this.regionQuery(i, eps)
      
      if (neighbors.length < minPts) {
        continue // ノイズポイント
      }
      
      // 新しいクラスターを開始
      assignments[i] = clusterCount
      const seedSet = [...neighbors]
      
      for (let j = 0; j < seedSet.length; j++) {
        const q = seedSet[j]
        
        if (!visited[q]) {
          visited[q] = true
          const qNeighbors = this.regionQuery(q, eps)
          if (qNeighbors.length >= minPts) {
            seedSet.push(...qNeighbors)
          }
        }
        
        if (assignments[q] === -1) {
          assignments[q] = clusterCount
        }
      }
      
      clusterCount++
    }

    return { assignments, clusterCount }
  }

  // クラスター構築
  private async buildClusters(assignments: number[], numClusters: number, useSemanticLabeling: boolean): Promise<Cluster[]> {
    const clusterGroups: { [key: number]: ClusterNode[] } = {}
    
    // ノードをクラスターごとにグループ化
    assignments.forEach((clusterId, nodeIndex) => {
      if (clusterId === -1) return // ノイズを除外
      
      if (!clusterGroups[clusterId]) {
        clusterGroups[clusterId] = []
      }
      
      clusterGroups[clusterId].push({
        id: this.nodes[nodeIndex].id,
        node: this.nodes[nodeIndex],
        cluster: clusterId,
        clusterScore: this.calculateNodeClusterScore(nodeIndex, assignments)
      })
    })

    const clusters: Cluster[] = []
    const colors = this.generateClusterColors(numClusters)

    for (const [clusterIdStr, clusterNodes] of Object.entries(clusterGroups)) {
      const clusterId = parseInt(clusterIdStr)
      const centroid = this.calculateClusterCentroid(clusterNodes.map(cn => cn.node.embedding))
      
      // クラスターのトピック抽出
      const topics = this.extractClusterTopics(clusterNodes.map(cn => cn.node))
      
      // セマンティックラベル生成
      let label = `クラスター ${clusterId + 1}`
      let description = `${clusterNodes.length}個のノードを含むクラスター`
      
      if (useSemanticLabeling && topics.length > 0) {
        const semanticInfo = await this.generateSemanticLabel(clusterNodes.map(cn => cn.node), topics)
        label = semanticInfo.label
        description = semanticInfo.description
      }

      clusters.push({
        id: clusterId,
        nodes: clusterNodes,
        centroid,
        label,
        description,
        color: colors[clusterId % colors.length],
        coherence: this.calculateClusterCoherence(clusterNodes.map(cn => cn.node.embedding)),
        topics
      })
    }

    return clusters.sort((a, b) => b.nodes.length - a.nodes.length)
  }

  // セマンティックラベル生成
  private async generateSemanticLabel(nodes: ThoughtNode[], topics: string[]): Promise<{ label: string; description: string }> {
    try {
      const sampleTexts = nodes.slice(0, 3).map(node => 
        node.title || node.comment || node.summary
      ).join('\n')
      
      const prompt = `以下のノード群の共通テーマを分析し、簡潔なラベル（3-5文字）と説明（20文字以内）を日本語で生成してください：

ノード例:
${sampleTexts}

主要トピック: ${topics.join(', ')}

形式:
ラベル: [ラベル]
説明: [説明]`

      const response = await fetch('/api/ollama-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-r1',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      })

      if (response.ok) {
        const data = await response.json()
        const result = data.message?.content || ''
        
        const labelMatch = result.match(/ラベル[:：]\s*(.+)/)
        const descMatch = result.match(/説明[:：]\s*(.+)/)
        
        return {
          label: labelMatch?.[1]?.trim() || topics[0] || 'テーマ',
          description: descMatch?.[1]?.trim() || `${topics.join('・')}に関するノード群`
        }
      }
    } catch (error) {
      console.error('Semantic labeling failed:', error)
    }

    return {
      label: topics[0] || 'テーマ',
      description: `${topics.join('・')}に関するノード群`
    }
  }

  // ヘルパーメソッド群
  private initializeCentroids(k: number): number[][] {
    const centroids: number[][] = []
    const embeddingDim = this.embeddings[0].length
    
    for (let i = 0; i < k; i++) {
      // K-means++初期化
      if (i === 0) {
        centroids.push([...this.embeddings[Math.floor(Math.random() * this.embeddings.length)]])
      } else {
        const distances = this.embeddings.map(embedding => {
          const minDist = Math.min(...centroids.map(centroid => 
            this.euclideanDistance(embedding, centroid)
          ))
          return minDist * minDist
        })
        
        const totalDist = distances.reduce((sum, dist) => sum + dist, 0)
        const threshold = Math.random() * totalDist
        
        let cumSum = 0
        for (let j = 0; j < distances.length; j++) {
          cumSum += distances[j]
          if (cumSum >= threshold) {
            centroids.push([...this.embeddings[j]])
            break
          }
        }
      }
    }
    
    return centroids
  }

  private findNearestCentroid(embedding: number[], centroids: number[][]): number {
    let minDistance = Infinity
    let nearestCentroid = 0
    
    centroids.forEach((centroid, index) => {
      const distance = this.euclideanDistance(embedding, centroid)
      if (distance < minDistance) {
        minDistance = distance
        nearestCentroid = index
      }
    })
    
    return nearestCentroid
  }

  private updateCentroids(centroids: number[][], assignments: number[]): void {
    const clusterSums: number[][] = centroids.map(c => new Array(c.length).fill(0))
    const clusterCounts = new Array(centroids.length).fill(0)
    
    assignments.forEach((cluster, index) => {
      clusterCounts[cluster]++
      this.embeddings[index].forEach((value, dim) => {
        clusterSums[cluster][dim] += value
      })
    })
    
    centroids.forEach((centroid, clusterIndex) => {
      if (clusterCounts[clusterIndex] > 0) {
        centroid.forEach((_, dim) => {
          centroid[dim] = clusterSums[clusterIndex][dim] / clusterCounts[clusterIndex]
        })
      }
    })
  }

  private calculateDistanceMatrix(): number[][] {
    const n = this.embeddings.length
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = 1 - calculateSimilarity(this.embeddings[i], this.embeddings[j])
        matrix[i][j] = matrix[j][i] = distance
      }
    }
    
    return matrix
  }

  private calculateClusterDistance(cluster1: number[], cluster2: number[], distances: number[][]): number {
    // Average linkage
    let totalDistance = 0
    let count = 0
    
    for (const i of cluster1) {
      for (const j of cluster2) {
        totalDistance += distances[i][j]
        count++
      }
    }
    
    return count > 0 ? totalDistance / count : Infinity
  }

  private regionQuery(pointIndex: number, eps: number): number[] {
    const neighbors: number[] = []
    
    for (let i = 0; i < this.embeddings.length; i++) {
      if (i === pointIndex) continue
      
      const distance = 1 - calculateSimilarity(this.embeddings[pointIndex], this.embeddings[i])
      if (distance <= eps) {
        neighbors.push(i)
      }
    }
    
    return neighbors
  }

  private calculateSilhouetteScore(assignments: number[]): number {
    if (assignments.length === 0) return 0
    
    const scores: number[] = []
    
    for (let i = 0; i < assignments.length; i++) {
      const a = this.calculateIntraClusterDistance(i, assignments)
      const b = this.calculateNearestClusterDistance(i, assignments)
      
      const silhouette = b > 0 ? (b - a) / Math.max(a, b) : 0
      scores.push(silhouette)
    }
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private calculateIntraClusterDistance(pointIndex: number, assignments: number[]): number {
    const cluster = assignments[pointIndex]
    const clusterPoints = assignments
      .map((c, i) => c === cluster ? i : -1)
      .filter(i => i !== -1 && i !== pointIndex)
    
    if (clusterPoints.length === 0) return 0
    
    const distances = clusterPoints.map(i => 
      1 - calculateSimilarity(this.embeddings[pointIndex], this.embeddings[i])
    )
    
    return distances.reduce((sum, dist) => sum + dist, 0) / distances.length
  }

  private calculateNearestClusterDistance(pointIndex: number, assignments: number[]): number {
    const currentCluster = assignments[pointIndex]
    const otherClusters = [...new Set(assignments)].filter(c => c !== currentCluster)
    
    if (otherClusters.length === 0) return 0
    
    const clusterDistances = otherClusters.map(cluster => {
      const clusterPoints = assignments
        .map((c, i) => c === cluster ? i : -1)
        .filter(i => i !== -1)
      
      if (clusterPoints.length === 0) return Infinity
      
      const distances = clusterPoints.map(i => 
        1 - calculateSimilarity(this.embeddings[pointIndex], this.embeddings[i])
      )
      
      return distances.reduce((sum, dist) => sum + dist, 0) / distances.length
    })
    
    return Math.min(...clusterDistances)
  }

  private calculateInertia(assignments: number[], k: number): number {
    const centroids = this.calculateFinalCentroids(assignments, k)
    let totalInertia = 0
    
    assignments.forEach((cluster, index) => {
      const distance = this.euclideanDistance(this.embeddings[index], centroids[cluster])
      totalInertia += distance * distance
    })
    
    return totalInertia
  }

  private calculateFinalCentroids(assignments: number[], k: number): number[][] {
    const centroids: number[][] = []
    const embeddingDim = this.embeddings[0].length
    
    for (let i = 0; i < k; i++) {
      const clusterPoints = assignments
        .map((c, idx) => c === i ? this.embeddings[idx] : null)
        .filter(e => e !== null) as number[][]
      
      if (clusterPoints.length === 0) {
        centroids.push(new Array(embeddingDim).fill(0))
        continue
      }
      
      const centroid = new Array(embeddingDim).fill(0)
      clusterPoints.forEach(point => {
        point.forEach((value, dim) => {
          centroid[dim] += value
        })
      })
      
      centroid.forEach((_, dim) => {
        centroid[dim] /= clusterPoints.length
      })
      
      centroids.push(centroid)
    }
    
    return centroids
  }

  private calculateClusterCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return []
    
    const centroid = new Array(embeddings[0].length).fill(0)
    embeddings.forEach(embedding => {
      embedding.forEach((value, dim) => {
        centroid[dim] += value
      })
    })
    
    return centroid.map(sum => sum / embeddings.length)
  }

  private extractClusterTopics(nodes: ThoughtNode[]): string[] {
    const topicCount: { [topic: string]: number } = {}
    
    nodes.forEach(node => {
      // タグとadvancedSummaryのトピックを収集
      const allTopics = [
        ...(node.tags || []),
        ...(node.advancedSummary?.topics || []),
        ...(node.category ? [node.category] : [])
      ]
      
      allTopics.forEach(topic => {
        topicCount[topic] = (topicCount[topic] || 0) + 1
      })
    })
    
    return Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic)
  }

  private calculateClusterCoherence(embeddings: number[][]): number {
    if (embeddings.length < 2) return 1
    
    let totalSimilarity = 0
    let pairCount = 0
    
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        totalSimilarity += calculateSimilarity(embeddings[i], embeddings[j])
        pairCount++
      }
    }
    
    return pairCount > 0 ? totalSimilarity / pairCount : 0
  }

  private calculateNodeClusterScore(nodeIndex: number, assignments: number[]): number {
    const nodeCluster = assignments[nodeIndex]
    const sameClusterNodes = assignments
      .map((cluster, index) => cluster === nodeCluster ? index : -1)
      .filter(index => index !== -1 && index !== nodeIndex)
    
    if (sameClusterNodes.length === 0) return 0
    
    const similarities = sameClusterNodes.map(index => 
      calculateSimilarity(this.embeddings[nodeIndex], this.embeddings[index])
    )
    
    return similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0))
  }

  private generateClusterColors(numClusters: number): string[] {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ]
    
    if (numClusters <= colors.length) {
      return colors.slice(0, numClusters)
    }
    
    // より多くの色が必要な場合はHSLで生成
    const generatedColors = []
    for (let i = 0; i < numClusters; i++) {
      const hue = (i * 360) / numClusters
      generatedColors.push(`hsl(${hue}, 70%, 50%)`)
    }
    
    return generatedColors
  }

  private async evaluateMethod(method: 'kmeans' | 'hierarchical' | 'dbscan', k?: number): Promise<{ assignments: number[], silhouetteScore: number, clusterCount: number }> {
    let assignments: number[]
    let clusterCount: number

    switch (method) {
      case 'kmeans':
        assignments = this.kMeansClustering(k!)
        clusterCount = k!
        break
      case 'hierarchical':
        assignments = this.hierarchicalClustering(k!)
        clusterCount = k!
        break
      case 'dbscan':
        const result = this.dbscanClustering()
        assignments = result.assignments
        clusterCount = result.clusterCount
        break
    }

    const silhouetteScore = this.calculateSilhouetteScore(assignments)
    
    return { assignments, silhouetteScore, clusterCount }
  }
}
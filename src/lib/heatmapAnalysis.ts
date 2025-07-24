import { ThoughtNode } from '../types/ThoughtNode'
import { calculateSimilarity } from './similarity'

// ヒートマップのメトリクス
export interface HeatmapMetrics {
  importance: number      // 重要度 (0-1)
  connectivity: number    // 接続度 (0-1)
  centrality: number     // 中心性 (0-1)
  recency: number        // 新しさ (0-1)
  engagement: number     // エンゲージメント (0-1)
  diversity: number      // 多様性 (0-1)
  overall: number        // 総合スコア (0-1)
}

export interface NodeHeatmapData {
  nodeId: string
  node: ThoughtNode
  metrics: HeatmapMetrics
  position: [number, number]  // 2Dマップ用座標
  color: string
  size: number
}

export interface HeatmapVisualizationData {
  nodes: NodeHeatmapData[]
  grid: number[][]  // グリッドベースのヒートマップ
  minMax: {
    importance: [number, number]
    connectivity: [number, number]
    centrality: [number, number]
    recency: [number, number]
    engagement: [number, number]
    diversity: [number, number]
    overall: [number, number]
  }
  correlations: {
    [metric1: string]: {
      [metric2: string]: number
    }
  }
}

export type HeatmapMode = 'importance' | 'connectivity' | 'centrality' | 'recency' | 'engagement' | 'diversity' | 'overall'

// ヒートマップ分析クラス
export class HeatmapAnalyzer {
  private nodes: ThoughtNode[]
  private similarityMatrix: number[][]
  
  constructor(nodes: ThoughtNode[]) {
    this.nodes = nodes.filter(node => node.embedding && node.embedding.length > 0)
    this.similarityMatrix = this.calculateSimilarityMatrix()
  }

  // メインのヒートマップ生成関数
  async generateHeatmap(): Promise<HeatmapVisualizationData> {
    const nodeMetrics = await this.calculateAllMetrics()
    const positions = this.calculateNodePositions()
    
    const nodesData: NodeHeatmapData[] = this.nodes.map((node, index) => ({
      nodeId: node.id,
      node,
      metrics: nodeMetrics[index],
      position: positions[index],
      color: this.calculateNodeColor(nodeMetrics[index]),
      size: this.calculateNodeSize(nodeMetrics[index])
    }))

    const grid = this.generateHeatmapGrid(nodesData, 'overall')
    const minMax = this.calculateMinMaxValues(nodeMetrics)
    const correlations = this.calculateMetricCorrelations(nodeMetrics)

    return {
      nodes: nodesData,
      grid,
      minMax,
      correlations
    }
  }

  // 全メトリクスの計算
  private async calculateAllMetrics(): Promise<HeatmapMetrics[]> {
    const importance = this.calculateImportanceScores()
    const connectivity = this.calculateConnectivityScores()
    const centrality = this.calculateCentralityScores()
    const recency = this.calculateRecencyScores()
    const engagement = await this.calculateEngagementScores()
    const diversity = this.calculateDiversityScores()

    return this.nodes.map((_, index) => {
      const metrics = {
        importance: importance[index],
        connectivity: connectivity[index],
        centrality: centrality[index],
        recency: recency[index],
        engagement: engagement[index],
        diversity: diversity[index],
        overall: 0
      }
      
      // 総合スコアの計算（重み付け平均）
      metrics.overall = (
        metrics.importance * 0.25 +
        metrics.connectivity * 0.2 +
        metrics.centrality * 0.2 +
        metrics.recency * 0.15 +
        metrics.engagement * 0.1 +
        metrics.diversity * 0.1
      )

      return metrics
    })
  }

  // 重要度スコア（リンク数とコンテンツ品質）
  private calculateImportanceScores(): number[] {
    const linkCounts = this.nodes.map(node => node.linkedNodeIds.length)
    const maxLinks = Math.max(...linkCounts)
    
    return this.nodes.map((node, index) => {
      // リンク数による重要度
      const linkScore = maxLinks > 0 ? linkCounts[index] / maxLinks : 0
      
      // コンテンツ品質による重要度
      const contentLength = (node.summary || node.comment).length
      const hasTitle = node.title ? 1 : 0
      const hasTags = (node.tags?.length || 0) > 0 ? 1 : 0
      const hasAdvancedSummary = node.advancedSummary ? 1 : 0
      
      const qualityScore = (
        Math.min(contentLength / 500, 1) * 0.4 +
        hasTitle * 0.2 +
        hasTags * 0.2 +
        hasAdvancedSummary * 0.2
      )
      
      return (linkScore * 0.6 + qualityScore * 0.4)
    })
  }

  // 接続度スコア（他ノードとの類似性の総和）
  private calculateConnectivityScores(): number[] {
    return this.nodes.map((_, index) => {
      const connections = this.similarityMatrix[index]
      const totalSimilarity = connections.reduce((sum, sim) => sum + sim, 0)
      const avgSimilarity = totalSimilarity / (connections.length - 1) // 自分自身を除く
      
      return avgSimilarity
    })
  }

  // 中心性スコア（ネットワーク中心性）
  private calculateCentralityScores(): number[] {
    const betweennessCentrality = this.calculateBetweennessCentrality()
    const closenessCentrality = this.calculateClosenessCentrality()
    const eigenvectorCentrality = this.calculateEigenvectorCentrality()

    return this.nodes.map((_, index) => {
      return (
        betweennessCentrality[index] * 0.4 +
        closenessCentrality[index] * 0.3 +
        eigenvectorCentrality[index] * 0.3
      )
    })
  }

  // 新しさスコア（作成時間に基づく）
  private calculateRecencyScores(): number[] {
    const now = Date.now()
    const timestamps = this.nodes.map(node => node.createdAt)
    const oldestTime = Math.min(...timestamps)
    const timeRange = now - oldestTime

    return this.nodes.map(node => {
      if (timeRange === 0) return 1
      
      const age = now - node.createdAt
      const recencyScore = 1 - (age / timeRange)
      
      // より新しいノードに重みを付ける
      return Math.pow(recencyScore, 0.5)
    })
  }

  // エンゲージメントスコア（更新頻度、アクセス頻度など）
  private async calculateEngagementScores(): Promise<number[]> {
    return this.nodes.map(node => {
      // 更新回数（バージョン履歴から）
      const updateCount = node.history?.length || 0
      const updateScore = Math.min(updateCount / 5, 1)
      
      // 最近の更新
      const recentUpdate = node.lastUpdated ? 
        Math.max(0, 1 - (Date.now() - node.lastUpdated) / (30 * 24 * 60 * 60 * 1000)) : 0
      
      // 高度な要約の有無
      const advancedScore = node.advancedSummary ? 0.3 : 0
      
      return (updateScore * 0.4 + recentUpdate * 0.4 + advancedScore * 0.2)
    })
  }

  // 多様性スコア（カテゴリ、タグの多様性）
  private calculateDiversityScores(): number[] {
    // 全体のカテゴリとタグの分布を計算
    const allCategories = new Set(this.nodes.map(node => node.category).filter(Boolean))
    const allTags = new Set(this.nodes.flatMap(node => node.tags || []))
    
    return this.nodes.map(node => {
      // カテゴリの希少性
      const categoryRarity = node.category ? 
        1 - (this.nodes.filter(n => n.category === node.category).length / this.nodes.length) : 0
      
      // タグの多様性
      const uniqueTags = new Set(node.tags || [])
      const tagDiversity = uniqueTags.size / Math.max(allTags.size / 10, 1) // 正規化
      
      // トピックの多様性
      const topicDiversity = node.advancedSummary?.topics?.length || 0
      const topicScore = Math.min(topicDiversity / 5, 1)
      
      return (categoryRarity * 0.4 + Math.min(tagDiversity, 1) * 0.4 + topicScore * 0.2)
    })
  }

  // 類似性マトリックスの計算
  private calculateSimilarityMatrix(): number[][] {
    const matrix: number[][] = []
    
    for (let i = 0; i < this.nodes.length; i++) {
      matrix[i] = []
      for (let j = 0; j < this.nodes.length; j++) {
        if (i === j) {
          matrix[i][j] = 1
        } else {
          matrix[i][j] = calculateSimilarity(
            this.nodes[i].embedding,
            this.nodes[j].embedding
          )
        }
      }
    }
    
    return matrix
  }

  // ベトウィーンネス中心性の計算
  private calculateBetweennessCentrality(): number[] {
    const n = this.nodes.length
    const centrality = new Array(n).fill(0)
    
    // 簡略化されたベトウィーンネス中心性
    for (let s = 0; s < n; s++) {
      for (let t = 0; t < n; t++) {
        if (s === t) continue
        
        // s から t への最短パスを通る中間ノードをカウント
        for (let v = 0; v < n; v++) {
          if (v === s || v === t) continue
          
          const directPath = this.similarityMatrix[s][t]
          const viaVPath = this.similarityMatrix[s][v] * this.similarityMatrix[v][t]
          
          if (viaVPath > directPath) {
            centrality[v] += 1
          }
        }
      }
    }
    
    const maxCentrality = Math.max(...centrality)
    return centrality.map(c => maxCentrality > 0 ? c / maxCentrality : 0)
  }

  // クローズネス中心性の計算
  private calculateClosenessCentrality(): number[] {
    return this.nodes.map((_, index) => {
      const distances = this.similarityMatrix[index]
      const avgDistance = distances.reduce((sum, dist) => sum + (1 - dist), 0) / (distances.length - 1)
      
      return avgDistance > 0 ? 1 / avgDistance : 0
    })
  }

  // 固有ベクトル中心性の計算（簡略版）
  private calculateEigenvectorCentrality(): number[] {
    const n = this.nodes.length
    let scores = new Array(n).fill(1)
    
    // パワー法による近似計算
    for (let iter = 0; iter < 10; iter++) {
      const newScores = new Array(n).fill(0)
      
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newScores[i] += this.similarityMatrix[i][j] * scores[j]
        }
      }
      
      // 正規化
      const norm = Math.sqrt(newScores.reduce((sum, score) => sum + score * score, 0))
      scores = newScores.map(score => norm > 0 ? score / norm : 0)
    }
    
    const maxScore = Math.max(...scores)
    return scores.map(score => maxScore > 0 ? score / maxScore : 0)
  }

  // ノードの2D座標計算（t-SNEまたはPCA風）
  private calculateNodePositions(): [number, number][] {
    // 簡易的な多次元尺度法（MDS）
    const positions: [number, number][] = []
    
    for (let i = 0; i < this.nodes.length; i++) {
      // 他のノードとの類似性に基づいて座標を計算
      let x = 0, y = 0
      
      for (let j = 0; j < this.nodes.length; j++) {
        if (i === j) continue
        
        const similarity = this.similarityMatrix[i][j]
        const angle = (j / this.nodes.length) * 2 * Math.PI
        
        x += similarity * Math.cos(angle)
        y += similarity * Math.sin(angle)
      }
      
      positions.push([x, y])
    }
    
    // 座標を0-1の範囲に正規化
    const xValues = positions.map(pos => pos[0])
    const yValues = positions.map(pos => pos[1])
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)
    
    return positions.map(([x, y]) => [
      maxX > minX ? (x - minX) / (maxX - minX) : 0.5,
      maxY > minY ? (y - minY) / (maxY - minY) : 0.5
    ])
  }

  // ノードの色を計算
  private calculateNodeColor(metrics: HeatmapMetrics): string {
    const hue = metrics.overall * 240 // 青(240)から赤(0)
    const saturation = 70 + metrics.importance * 30 // 70-100%
    const lightness = 40 + metrics.connectivity * 20 // 40-60%
    
    return `hsl(${240 - hue}, ${saturation}%, ${lightness}%)`
  }

  // ノードのサイズを計算
  private calculateNodeSize(metrics: HeatmapMetrics): number {
    return 0.5 + metrics.overall * 1.5 // 0.5-2.0の範囲
  }

  // グリッドベースのヒートマップ生成
  private generateHeatmapGrid(nodes: NodeHeatmapData[], mode: HeatmapMode, gridSize: number = 20): number[][] {
    const grid: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0))
    const counts: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0))
    
    nodes.forEach(nodeData => {
      const x = Math.floor(nodeData.position[0] * (gridSize - 1))
      const y = Math.floor(nodeData.position[1] * (gridSize - 1))
      
      const value = nodeData.metrics[mode]
      grid[y][x] += value
      counts[y][x] += 1
    })
    
    // 平均値で正規化
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (counts[i][j] > 0) {
          grid[i][j] /= counts[i][j]
        }
      }
    }
    
    return grid
  }

  // 最小値・最大値の計算
  private calculateMinMaxValues(metrics: HeatmapMetrics[]): HeatmapVisualizationData['minMax'] {
    const metricNames: (keyof HeatmapMetrics)[] = [
      'importance', 'connectivity', 'centrality', 'recency', 'engagement', 'diversity', 'overall'
    ]
    
    const result: any = {}
    
    metricNames.forEach(metric => {
      const values = metrics.map(m => m[metric])
      result[metric] = [Math.min(...values), Math.max(...values)]
    })
    
    return result
  }

  // メトリクス間の相関計算
  private calculateMetricCorrelations(metrics: HeatmapMetrics[]): HeatmapVisualizationData['correlations'] {
    const metricNames: (keyof HeatmapMetrics)[] = [
      'importance', 'connectivity', 'centrality', 'recency', 'engagement', 'diversity'
    ]
    
    const correlations: any = {}
    
    metricNames.forEach(metric1 => {
      correlations[metric1] = {}
      
      metricNames.forEach(metric2 => {
        const values1 = metrics.map(m => m[metric1])
        const values2 = metrics.map(m => m[metric2])
        
        correlations[metric1][metric2] = this.calculateCorrelation(values1, values2)
      })
    })
    
    return correlations
  }

  // ピアソン相関係数の計算
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length
    if (n === 0) return 0
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / n
    const meanY = y.reduce((sum, val) => sum + val, 0) / n
    
    let numerator = 0
    let denomX = 0
    let denomY = 0
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX
      const dy = y[i] - meanY
      
      numerator += dx * dy
      denomX += dx * dx
      denomY += dy * dy
    }
    
    const denominator = Math.sqrt(denomX * denomY)
    return denominator > 0 ? numerator / denominator : 0
  }
}

// ヒートマップの更新
export async function updateHeatmapForMode(
  data: HeatmapVisualizationData, 
  mode: HeatmapMode
): Promise<HeatmapVisualizationData> {
  const updatedNodes = data.nodes.map(nodeData => ({
    ...nodeData,
    color: calculateColorForMode(nodeData.metrics, mode),
    size: calculateSizeForMode(nodeData.metrics, mode)
  }))
  
  const analyzer = new (HeatmapAnalyzer as any)([])
  const grid = analyzer.generateHeatmapGrid(updatedNodes, mode)
  
  return {
    ...data,
    nodes: updatedNodes,
    grid
  }
}

// モード別色計算
function calculateColorForMode(metrics: HeatmapMetrics, mode: HeatmapMode): string {
  const value = metrics[mode]
  const hue = value * 240 // 青から赤
  return `hsl(${240 - hue}, 70%, 50%)`
}

// モード別サイズ計算
function calculateSizeForMode(metrics: HeatmapMetrics, mode: HeatmapMode): number {
  const value = metrics[mode]
  return 0.5 + value * 1.5
}
import { ThoughtNode } from '../types/ThoughtNode'
import { calculateSimilarity } from './similarity'

// 関連性分析の結果
export interface RelationshipResult {
  nodeId: string
  score: number
  type: RelationshipType
  explanation: string
  confidence: number
}

export type RelationshipType = 
  | 'semantic' // 意味的類似性
  | 'temporal' // 時間的関連性
  | 'categorical' // カテゴリ的類似性
  | 'topical' // トピック的関連性
  | 'cross-domain' // 分野横断的関連性

// 高度な関連性検出システム
export class AdvancedRelationshipDetector {
  private nodes: ThoughtNode[]
  
  constructor(nodes: ThoughtNode[]) {
    this.nodes = nodes
  }

  // メインの関連性分析関数
  async analyzeRelationships(targetNode: ThoughtNode): Promise<RelationshipResult[]> {
    const relationships: RelationshipResult[] = []
    
    for (const node of this.nodes) {
      if (node.id === targetNode.id) continue
      
      // 複数の関連性アルゴリズムを並行実行
      const [
        semanticScore,
        temporalScore, 
        categoricalScore,
        topicalScore,
        crossDomainScore
      ] = await Promise.all([
        this.calculateSemanticSimilarity(targetNode, node),
        this.calculateTemporalRelationship(targetNode, node),
        this.calculateCategoricalSimilarity(targetNode, node),
        this.calculateTopicalSimilarity(targetNode, node),
        this.calculateCrossDomainRelationship(targetNode, node)
      ])
      
      // 最も高いスコアを主要な関連性タイプとして選択
      const scores = [
        { type: 'semantic' as RelationshipType, score: semanticScore },
        { type: 'temporal' as RelationshipType, score: temporalScore },
        { type: 'categorical' as RelationshipType, score: categoricalScore },
        { type: 'topical' as RelationshipType, score: topicalScore },
        { type: 'cross-domain' as RelationshipType, score: crossDomainScore }
      ]
      
      const bestRelation = scores.reduce((best, current) => 
        current.score > best.score ? current : best
      )
      
      // 閾値を超える関連性のみ追加
      if (bestRelation.score > 0.3) {
        relationships.push({
          nodeId: node.id,
          score: bestRelation.score,
          type: bestRelation.type,
          explanation: this.generateExplanation(bestRelation.type, bestRelation.score, targetNode, node),
          confidence: this.calculateConfidence(bestRelation.score, scores)
        })
      }
    }
    
    // スコア順にソート
    return relationships.sort((a, b) => b.score - a.score)
  }

  // 意味的類似性（既存の埋め込みベクトル使用）
  private async calculateSemanticSimilarity(node1: ThoughtNode, node2: ThoughtNode): Promise<number> {
    if (!node1.embedding || !node2.embedding) return 0
    return calculateSimilarity(node1.embedding, node2.embedding)
  }

  // 時間的関連性（作成時間の近さ）
  private async calculateTemporalRelationship(node1: ThoughtNode, node2: ThoughtNode): Promise<number> {
    const timeDiff = Math.abs(node1.createdAt - node2.createdAt)
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
    
    // 1日以内: 0.9, 1週間以内: 0.7, 1ヶ月以内: 0.5, それ以降は急激に減少
    if (daysDiff <= 1) return 0.9
    if (daysDiff <= 7) return 0.7
    if (daysDiff <= 30) return 0.5
    if (daysDiff <= 90) return 0.3
    return Math.max(0, 0.1 - (daysDiff - 90) * 0.001)
  }

  // カテゴリ的類似性
  private async calculateCategoricalSimilarity(node1: ThoughtNode, node2: ThoughtNode): Promise<number> {
    if (!node1.category || !node2.category) return 0
    
    // 完全一致
    if (node1.category === node2.category) return 0.9
    
    // カテゴリの階層構造を考慮した類似性
    const categoryHierarchy = this.getCategoryHierarchy()
    return this.calculateHierarchicalSimilarity(node1.category, node2.category, categoryHierarchy)
  }

  // トピック的類似性（タグとトピックの重複）
  private async calculateTopicalSimilarity(node1: ThoughtNode, node2: ThoughtNode): Promise<number> {
    const tags1 = new Set([
      ...(node1.tags || []),
      ...(node1.advancedSummary?.topics || [])
    ])
    const tags2 = new Set([
      ...(node2.tags || []),
      ...(node2.advancedSummary?.topics || [])
    ])
    
    if (tags1.size === 0 || tags2.size === 0) return 0
    
    const intersection = new Set([...tags1].filter(x => tags2.has(x)))
    const union = new Set([...tags1, ...tags2])
    
    return intersection.size / union.size // Jaccard係数
  }

  // 分野横断的関連性（異なるカテゴリでも関連性があるもの）
  private async calculateCrossDomainRelationship(node1: ThoughtNode, node2: ThoughtNode): Promise<number> {
    // 異なるカテゴリでも関連性が高い組み合わせを定義
    const crossDomainPatterns = [
      { pattern: ['技術', 'ビジネス'], score: 0.7 },
      { pattern: ['研究', '実装'], score: 0.8 },
      { pattern: ['理論', '実践'], score: 0.8 },
      { pattern: ['問題', '解決'], score: 0.9 },
      { pattern: ['ツール', '手法'], score: 0.6 },
      { pattern: ['データ', '分析'], score: 0.8 }
    ]
    
    const cat1 = node1.category?.toLowerCase()
    const cat2 = node2.category?.toLowerCase()
    
    if (!cat1 || !cat2 || cat1 === cat2) return 0
    
    for (const { pattern, score } of crossDomainPatterns) {
      if ((cat1.includes(pattern[0]) && cat2.includes(pattern[1])) ||
          (cat1.includes(pattern[1]) && cat2.includes(pattern[0]))) {
        // セマンティック類似性も考慮
        const semanticBonus = await this.calculateSemanticSimilarity(node1, node2)
        return Math.min(0.95, score * 0.7 + semanticBonus * 0.3)
      }
    }
    
    return 0
  }

  // カテゴリ階層構造の定義
  private getCategoryHierarchy(): { [key: string]: string[] } {
    return {
      '技術': ['プログラミング', 'AI', 'データサイエンス', 'Web開発', 'インフラ'],
      'ビジネス': ['マーケティング', '経営', '戦略', 'スタートアップ'],
      '学術': ['研究', '論文', '理論', '実験'],
      'クリエイティブ': ['デザイン', 'アート', '音楽', '文学'],
      'ライフスタイル': ['健康', '旅行', '料理', 'スポーツ']
    }
  }

  // 階層的類似性計算
  private calculateHierarchicalSimilarity(cat1: string, cat2: string, hierarchy: { [key: string]: string[] }): number {
    for (const [parent, children] of Object.entries(hierarchy)) {
      const cat1InChildren = children.some(child => cat1.includes(child))
      const cat2InChildren = children.some(child => cat2.includes(child))
      
      if (cat1InChildren && cat2InChildren) return 0.7 // 同じ親カテゴリ
    }
    return 0
  }

  // 関連性の説明文生成
  private generateExplanation(type: RelationshipType, score: number, node1: ThoughtNode, node2: ThoughtNode): string {
    const scoreLevel = score > 0.8 ? '高い' : score > 0.6 ? '中程度の' : '低い'
    
    switch (type) {
      case 'semantic':
        return `コンテンツの意味的な類似性が${scoreLevel}です`
      case 'temporal':
        const daysDiff = Math.abs(node1.createdAt - node2.createdAt) / (1000 * 60 * 60 * 24)
        return `${Math.round(daysDiff)}日以内に作成された時間的に関連性の${scoreLevel}ノードです`
      case 'categorical':
        return `「${node1.category}」と「${node2.category}」のカテゴリ的類似性が${scoreLevel}です`
      case 'topical':
        const commonTopics = this.getCommonTopics(node1, node2)
        return `「${commonTopics.join('、')}」などの共通トピックがあります`
      case 'cross-domain':
        return `異なる分野ながら${scoreLevel}関連性があります`
      default:
        return `${scoreLevel}関連性があります`
    }
  }

  // 共通トピック取得
  private getCommonTopics(node1: ThoughtNode, node2: ThoughtNode): string[] {
    const topics1 = new Set([
      ...(node1.tags || []),
      ...(node1.advancedSummary?.topics || [])
    ])
    const topics2 = new Set([
      ...(node2.tags || []),
      ...(node2.advancedSummary?.topics || [])
    ])
    
    return [...topics1].filter(topic => topics2.has(topic)).slice(0, 3)
  }

  // 信頼度計算
  private calculateConfidence(bestScore: number, allScores: { type: RelationshipType; score: number }[]): number {
    // 最高スコアと2番目のスコアの差が大きいほど信頼度が高い
    const sortedScores = allScores.map(s => s.score).sort((a, b) => b - a)
    const scoreDiff = sortedScores[0] - sortedScores[1]
    
    // ベーススコア + 差分ボーナス
    return Math.min(0.95, bestScore * 0.7 + scoreDiff * 0.3)
  }
}

// グローバル関連性分析関数
export async function analyzeGlobalRelationships(nodes: ThoughtNode[]): Promise<{ [nodeId: string]: RelationshipResult[] }> {
  const detector = new AdvancedRelationshipDetector(nodes)
  const results: { [nodeId: string]: RelationshipResult[] } = {}
  
  // 並行処理で全ノードの関連性を分析
  const analysisPromises = nodes.map(async (node) => {
    const relationships = await detector.analyzeRelationships(node)
    return { nodeId: node.id, relationships }
  })
  
  const analysisResults = await Promise.all(analysisPromises)
  
  for (const { nodeId, relationships } of analysisResults) {
    results[nodeId] = relationships
  }
  
  return results
}

// 影響度分析
export function calculateNodeInfluence(nodeId: string, relationships: { [nodeId: string]: RelationshipResult[] }): number {
  // 他のノードからこのノードへの関連性スコアの合計
  let totalInfluence = 0
  let connectionCount = 0
  
  for (const [otherNodeId, relations] of Object.entries(relationships)) {
    if (otherNodeId === nodeId) continue
    
    const relationToTarget = relations.find(r => r.nodeId === nodeId)
    if (relationToTarget) {
      totalInfluence += relationToTarget.score * relationToTarget.confidence
      connectionCount++
    }
  }
  
  // 平均影響度に接続数の重みを加える
  const avgInfluence = connectionCount > 0 ? totalInfluence / connectionCount : 0
  const connectionBonus = Math.min(1, connectionCount / 10) * 0.2
  
  return Math.min(1, avgInfluence + connectionBonus)
}
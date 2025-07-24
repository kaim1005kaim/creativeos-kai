import { ThoughtNode } from '../types/ThoughtNode'
import { calculateSimilarity } from './similarity'

export interface LinkSuggestion {
  nodeId: string
  targetNodeId: string
  similarity: number
  reason: string
  strength: 'weak' | 'medium' | 'strong'
}

export interface LinkAnalysisResult {
  suggestions: LinkSuggestion[]
  autoLinked: number
  statistics: {
    averageSimilarity: number
    strongLinks: number
    mediumLinks: number
    weakLinks: number
  }
}

// 類似度の閾値設定
const SIMILARITY_THRESHOLDS = {
  STRONG: 0.8,    // 自動リンク
  MEDIUM: 0.65,   // 提案リンク
  WEAK: 0.5       // 弱い関連
}

// URLドメインの抽出
function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url)
    return hostname.replace('www.', '')
  } catch {
    return ''
  }
}

// 共通キーワードの抽出
function extractCommonKeywords(text1: string, text2: string): string[] {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  
  const commonWords = words1.filter(word => words2.includes(word))
  return [...new Set(commonWords)]
}

// リンク強度の判定
function getLinkStrength(similarity: number): 'weak' | 'medium' | 'strong' {
  if (similarity >= SIMILARITY_THRESHOLDS.STRONG) return 'strong'
  if (similarity >= SIMILARITY_THRESHOLDS.MEDIUM) return 'medium'
  return 'weak'
}

// リンクの理由を生成
function generateLinkReason(
  node1: ThoughtNode,
  node2: ThoughtNode,
  similarity: number
): string {
  const reasons: string[] = []
  
  // ベクトル類似度
  if (similarity >= SIMILARITY_THRESHOLDS.STRONG) {
    reasons.push('内容が非常に似ています')
  } else if (similarity >= SIMILARITY_THRESHOLDS.MEDIUM) {
    reasons.push('関連性が高いです')
  }
  
  // ドメインチェック
  const domain1 = extractDomain(node1.url)
  const domain2 = extractDomain(node2.url)
  if (domain1 && domain1 === domain2) {
    reasons.push(`同じドメイン (${domain1})`)
  }
  
  // 共通キーワード
  const commonKeywords = extractCommonKeywords(
    `${node1.comment} ${node1.summary}`,
    `${node2.comment} ${node2.summary}`
  )
  if (commonKeywords.length > 0) {
    reasons.push(`共通キーワード: ${commonKeywords.slice(0, 3).join(', ')}`)
  }
  
  // 時間的近接性
  const timeDiff = Math.abs(node1.createdAt - node2.createdAt)
  const hoursDiff = timeDiff / (1000 * 60 * 60)
  if (hoursDiff < 24) {
    reasons.push('同じ日に作成')
  } else if (hoursDiff < 168) {
    reasons.push('同じ週に作成')
  }
  
  return reasons.join(' / ')
}

// 全ノードのリンク分析
export function analyzeNodeLinks(nodes: ThoughtNode[]): LinkAnalysisResult {
  const suggestions: LinkSuggestion[] = []
  let autoLinked = 0
  let strongLinks = 0
  let mediumLinks = 0
  let weakLinks = 0
  let totalSimilarity = 0
  let comparisonCount = 0
  
  // 全ノードペアを比較
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i]
      const node2 = nodes[j]
      
      // すでにリンクされている場合はスキップ
      if (node1.linkedNodeIds.includes(node2.id) || 
          node2.linkedNodeIds.includes(node1.id)) {
        continue
      }
      
      const similarity = calculateSimilarity(node1.embedding, node2.embedding)
      
      if (similarity >= SIMILARITY_THRESHOLDS.WEAK) {
        const strength = getLinkStrength(similarity)
        const reason = generateLinkReason(node1, node2, similarity)
        
        suggestions.push({
          nodeId: node1.id,
          targetNodeId: node2.id,
          similarity,
          reason,
          strength
        })
        
        // 統計更新
        switch (strength) {
          case 'strong':
            strongLinks++
            autoLinked++
            break
          case 'medium':
            mediumLinks++
            break
          case 'weak':
            weakLinks++
            break
        }
      }
      
      totalSimilarity += similarity
      comparisonCount++
    }
  }
  
  return {
    suggestions: suggestions.sort((a, b) => b.similarity - a.similarity),
    autoLinked,
    statistics: {
      averageSimilarity: comparisonCount > 0 ? totalSimilarity / comparisonCount : 0,
      strongLinks,
      mediumLinks,
      weakLinks
    }
  }
}

// 自動リンクの適用
export function applyAutoLinks(
  nodes: ThoughtNode[],
  suggestions: LinkSuggestion[]
): ThoughtNode[] {
  const updatedNodes = nodes.map(node => ({ ...node }))
  const nodeMap = new Map(updatedNodes.map(n => [n.id, n]))
  
  suggestions
    .filter(s => s.strength === 'strong')
    .forEach(suggestion => {
      const node1 = nodeMap.get(suggestion.nodeId)
      const node2 = nodeMap.get(suggestion.targetNodeId)
      
      if (node1 && node2) {
        // 双方向リンクを追加
        if (!node1.linkedNodeIds.includes(suggestion.targetNodeId)) {
          node1.linkedNodeIds.push(suggestion.targetNodeId)
        }
        if (!node2.linkedNodeIds.includes(suggestion.nodeId)) {
          node2.linkedNodeIds.push(suggestion.nodeId)
        }
      }
    })
  
  return updatedNodes
}

// 手動リンクの追加/削除
export function toggleNodeLink(
  nodes: ThoughtNode[],
  nodeId: string,
  targetNodeId: string
): ThoughtNode[] {
  const updatedNodes = nodes.map(node => ({ ...node }))
  const node1 = updatedNodes.find(n => n.id === nodeId)
  const node2 = updatedNodes.find(n => n.id === targetNodeId)
  
  if (!node1 || !node2) return nodes
  
  const isLinked = node1.linkedNodeIds.includes(targetNodeId)
  
  if (isLinked) {
    // リンクを削除
    node1.linkedNodeIds = node1.linkedNodeIds.filter(id => id !== targetNodeId)
    node2.linkedNodeIds = node2.linkedNodeIds.filter(id => id !== nodeId)
  } else {
    // リンクを追加
    node1.linkedNodeIds.push(targetNodeId)
    node2.linkedNodeIds.push(nodeId)
  }
  
  return updatedNodes
}

// 類似度マトリックスの生成（ヒートマップ用）
export function generateSimilarityMatrix(nodes: ThoughtNode[]): number[][] {
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
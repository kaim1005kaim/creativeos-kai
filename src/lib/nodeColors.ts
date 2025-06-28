import { ThoughtNode } from '../types/ThoughtNode'

export type ColorScheme = 'default' | 'model' | 'age' | 'connections' | 'domain'

export function getNodeColor(node: ThoughtNode, colorScheme: ColorScheme): string {
  switch (colorScheme) {
    case 'model':
      return getModelColor(node)
    case 'age':
      return getAgeColor(node)
    case 'connections':
      return getConnectionsColor(node)
    case 'domain':
      return getDomainColor(node)
    default:
      return '#4f46e5' // デフォルトの紫
  }
}

function getModelColor(node: ThoughtNode): string {
  // 要約の特徴からモデルを推定（仮実装）
  // 将来的にはノードにモデル情報を保存すべき
  const isDeepSeek = node.summary.length > 100 || node.summary.includes('詳細') || node.summary.includes('具体')
  
  if (isDeepSeek) {
    return '#e11d48' // DeepSeek: 赤系
  } else {
    return '#059669' // Hunyuan: 緑系
  }
}

function getAgeColor(node: ThoughtNode): string {
  const now = Date.now()
  const ageInDays = (now - node.createdAt) / (24 * 60 * 60 * 1000)
  
  if (ageInDays < 1) {
    return '#10b981' // 新しい: 緑
  } else if (ageInDays < 7) {
    return '#f59e0b' // 1週間以内: 黄色
  } else if (ageInDays < 30) {
    return '#f97316' // 1ヶ月以内: オレンジ
  } else {
    return '#6b7280' // 古い: グレー
  }
}

function getConnectionsColor(node: ThoughtNode): string {
  const connections = node.linkedNodeIds.length
  
  if (connections === 0) {
    return '#6b7280' // 孤立: グレー
  } else if (connections <= 2) {
    return '#3b82f6' // 少ない: 青
  } else if (connections <= 5) {
    return '#8b5cf6' // 中程度: 紫
  } else {
    return '#ef4444' // 多い: 赤
  }
}

function getDomainColor(node: ThoughtNode): string {
  try {
    const hostname = new URL(node.url).hostname.toLowerCase()
    
    // ドメインごとの色分け
    if (hostname.includes('github')) return '#24292f'
    if (hostname.includes('stackoverflow')) return '#f48024'
    if (hostname.includes('youtube')) return '#ff0000'
    if (hostname.includes('twitter') || hostname.includes('x.com')) return '#1da1f2'
    if (hostname.includes('medium')) return '#12100e'
    if (hostname.includes('qiita')) return '#55c500'
    if (hostname.includes('zenn')) return '#3ea8ff'
    if (hostname.includes('note')) return '#41c9b4'
    if (hostname.includes('wikipedia')) return '#000000'
    if (hostname.includes('arxiv')) return '#b31b1b'
    
    // デフォルト: ドメイン文字列のハッシュベースの色
    return generateColorFromString(hostname)
  } catch {
    return '#6b7280' // 無効なURL: グレー
  }
}

function generateColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash) % 360
  const saturation = 60 + (Math.abs(hash) % 30) // 60-90%
  const lightness = 40 + (Math.abs(hash) % 20)  // 40-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export const COLOR_SCHEME_LABELS = {
  default: 'デフォルト',
  model: 'モデル別',
  age: '作成日時',
  connections: '関連数',
  domain: 'ドメイン別'
}

export const COLOR_LEGENDS = {
  model: [
    { color: '#e11d48', label: 'DeepSeek-R1' },
    { color: '#059669', label: 'Hunyuan-A13B' }
  ],
  age: [
    { color: '#10b981', label: '24時間以内' },
    { color: '#f59e0b', label: '1週間以内' },
    { color: '#f97316', label: '1ヶ月以内' },
    { color: '#6b7280', label: '1ヶ月以上' }
  ],
  connections: [
    { color: '#6b7280', label: '関連なし' },
    { color: '#3b82f6', label: '1-2個' },
    { color: '#8b5cf6', label: '3-5個' },
    { color: '#ef4444', label: '6個以上' }
  ],
  domain: [
    { color: '#24292f', label: 'GitHub' },
    { color: '#f48024', label: 'Stack Overflow' },
    { color: '#ff0000', label: 'YouTube' },
    { color: '#1da1f2', label: 'Twitter/X' },
    { color: '#55c500', label: 'Qiita' },
    { color: 'hsl(180, 60%, 50%)', label: 'その他' }
  ]
}
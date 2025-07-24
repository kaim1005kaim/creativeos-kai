import { XPostData } from './XPostData'

export type ThoughtNode = {
  id: string
  url: string
  ogpImageUrl: string
  comment: string
  title?: string
  summary: string
  embedding: number[]
  createdAt: number
  position: [number, number, number]
  linkedNodeIds: string[]
  tags?: string[]
  category?: string
  type?: 'default' | 'x-post'
  xPostData?: XPostData
  lastUpdated?: number
  // 高度な要約情報
  advancedSummary?: {
    keyPoints: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
    topics: string[]
    readingTime: number
    confidence: number
  }
  // 関連性分析
  relationshipScores?: { [nodeId: string]: number }
  // バージョン管理
  version?: number
  history?: Array<{
    version: number
    timestamp: number
    changes: string[]
  }>
}
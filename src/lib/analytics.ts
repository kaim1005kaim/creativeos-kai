import { ThoughtNode } from '../types/ThoughtNode'

export interface NodeStats {
  totalNodes: number
  categoryCounts: Record<string, number>
  tagCounts: Record<string, number>
  dailyCreations: Record<string, number>
  weeklyCreations: Record<string, number>
  monthlyCreations: Record<string, number>
  averageLinkedNodes: number
  mostConnectedNode: ThoughtNode | null
  oldestNode: ThoughtNode | null
  newestNode: ThoughtNode | null
  topDomains: Record<string, number>
  xPostCount: number
  regularUrlCount: number
}

export function calculateNodeStats(nodes: ThoughtNode[]): NodeStats {
  if (nodes.length === 0) {
    return {
      totalNodes: 0,
      categoryCounts: {},
      tagCounts: {},
      dailyCreations: {},
      weeklyCreations: {},
      monthlyCreations: {},
      averageLinkedNodes: 0,
      mostConnectedNode: null,
      oldestNode: null,
      newestNode: null,
      topDomains: {},
      xPostCount: 0,
      regularUrlCount: 0
    }
  }

  // 基本統計
  const totalNodes = nodes.length
  const xPostCount = nodes.filter(n => n.type === 'x-post').length
  const regularUrlCount = totalNodes - xPostCount

  // カテゴリ統計
  const categoryCounts = nodes.reduce((acc, node) => {
    const category = node.category || 'その他'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // タグ統計
  const tagCounts = nodes.reduce((acc, node) => {
    (node.tags || []).forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  // ドメイン統計
  const topDomains = nodes.reduce((acc, node) => {
    try {
      const domain = new URL(node.url).hostname.replace('www.', '')
      acc[domain] = (acc[domain] || 0) + 1
    } catch {
      acc['その他'] = (acc['その他'] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // 時系列統計
  const dailyCreations = nodes.reduce((acc, node) => {
    const date = new Date(node.createdAt).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const weeklyCreations = nodes.reduce((acc, node) => {
    const date = new Date(node.createdAt)
    const week = getWeekKey(date)
    acc[week] = (acc[week] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const monthlyCreations = nodes.reduce((acc, node) => {
    const date = new Date(node.createdAt)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 接続統計
  const totalConnections = nodes.reduce((sum, node) => sum + node.linkedNodeIds.length, 0)
  const averageLinkedNodes = totalConnections / totalNodes

  const mostConnectedNode = nodes.reduce((max, node) => 
    !max || node.linkedNodeIds.length > max.linkedNodeIds.length ? node : max
  , null as ThoughtNode | null)

  // 最古・最新ノード
  const sortedByDate = [...nodes].sort((a, b) => a.createdAt - b.createdAt)
  const oldestNode = sortedByDate[0]
  const newestNode = sortedByDate[sortedByDate.length - 1]

  return {
    totalNodes,
    categoryCounts,
    tagCounts,
    dailyCreations,
    weeklyCreations,
    monthlyCreations,
    averageLinkedNodes,
    mostConnectedNode,
    oldestNode,
    newestNode,
    topDomains,
    xPostCount,
    regularUrlCount
  }
}

function getWeekKey(date: Date): string {
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())
  return startOfWeek.toISOString().split('T')[0]
}

export interface CategoryDistribution {
  category: string
  count: number
  percentage: number
  color: string
}

export function getCategoryDistribution(stats: NodeStats): CategoryDistribution[] {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ]

  return Object.entries(stats.categoryCounts)
    .map(([category, count], index) => ({
      category,
      count,
      percentage: (count / stats.totalNodes) * 100,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.count - a.count)
}

export interface TagPopularity {
  tag: string
  count: number
  percentage: number
}

export function getTopTags(stats: NodeStats, limit: number = 10): TagPopularity[] {
  const totalTags = Object.values(stats.tagCounts).reduce((sum, count) => sum + count, 0)
  
  return Object.entries(stats.tagCounts)
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: (count / totalTags) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export interface TimeSeriesData {
  date: string
  count: number
  label: string
}

export function getTimeSeriesData(
  stats: NodeStats, 
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  limit: number = 30
): TimeSeriesData[] {
  let data: Record<string, number>
  
  switch (period) {
    case 'weekly':
      data = stats.weeklyCreations
      break
    case 'monthly':
      data = stats.monthlyCreations
      break
    default:
      data = stats.dailyCreations
  }

  return Object.entries(data)
    .map(([date, count]) => ({
      date,
      count,
      label: formatDateLabel(date, period)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit)
}

function formatDateLabel(date: string, period: 'daily' | 'weekly' | 'monthly'): string {
  const d = new Date(date)
  
  switch (period) {
    case 'weekly':
      return `${d.getMonth() + 1}/${d.getDate()}`
    case 'monthly':
      return `${d.getFullYear()}/${d.getMonth() + 1}`
    default:
      return `${d.getMonth() + 1}/${d.getDate()}`
  }
}
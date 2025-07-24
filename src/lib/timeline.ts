import { ThoughtNode } from '../types/ThoughtNode'

export interface TimelineEntry {
  id: string
  date: Date
  timestamp: number
  nodes: ThoughtNode[]
  label: string
  type: 'day' | 'week' | 'month'
}

export interface TimelineGroup {
  period: string
  entries: TimelineEntry[]
  nodeCount: number
}

// 日付をフォーマット
export function formatDate(date: Date, format: 'day' | 'week' | 'month'): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  switch (format) {
    case 'day':
      return `${year}-${month}-${day}`
    case 'week':
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${formatDate(weekStart, 'day')} ~ ${formatDate(weekEnd, 'day')}`
    case 'month':
      return `${year}-${month}`
    default:
      return `${year}-${month}-${day}`
  }
}

// 週の開始日を取得
function getWeekStart(date: Date): Date {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

// 月の開始日を取得
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// ノードを期間別にグループ化
export function groupNodesByTimeline(
  nodes: ThoughtNode[], 
  groupBy: 'day' | 'week' | 'month' = 'day'
): TimelineGroup[] {
  if (nodes.length === 0) return []

  // ノードを作成日時でソート
  const sortedNodes = [...nodes].sort((a, b) => b.createdAt - a.createdAt)

  // 期間別にグループ化
  const grouped = new Map<string, ThoughtNode[]>()

  sortedNodes.forEach(node => {
    const date = new Date(node.createdAt)
    let key: string
    let groupDate: Date

    switch (groupBy) {
      case 'week':
        groupDate = getWeekStart(date)
        key = formatDate(groupDate, 'week')
        break
      case 'month':
        groupDate = getMonthStart(date)
        key = formatDate(groupDate, 'month')
        break
      default: // day
        groupDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        key = formatDate(groupDate, 'day')
        break
    }

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(node)
  })

  // TimelineGroup形式に変換
  const timelineGroups: TimelineGroup[] = []
  
  grouped.forEach((groupNodes, period) => {
    const entries: TimelineEntry[] = []
    
    if (groupBy === 'day') {
      // 日別の場合は1つのエントリ
      entries.push({
        id: `timeline-${period}`,
        date: new Date(groupNodes[0].createdAt),
        timestamp: groupNodes[0].createdAt,
        nodes: groupNodes,
        label: `${groupNodes.length}個のノード`,
        type: 'day'
      })
    } else if (groupBy === 'week') {
      // 週別の場合は日毎にサブエントリを作成
      const dailyGroups = new Map<string, ThoughtNode[]>()
      
      groupNodes.forEach(node => {
        const date = new Date(node.createdAt)
        const dayKey = formatDate(date, 'day')
        if (!dailyGroups.has(dayKey)) {
          dailyGroups.set(dayKey, [])
        }
        dailyGroups.get(dayKey)!.push(node)
      })

      dailyGroups.forEach((dayNodes, dayKey) => {
        entries.push({
          id: `timeline-${dayKey}`,
          date: new Date(dayNodes[0].createdAt),
          timestamp: dayNodes[0].createdAt,
          nodes: dayNodes,
          label: `${dayNodes.length}個のノード`,
          type: 'day'
        })
      })
    } else {
      // 月別の場合は週毎にサブエントリを作成
      const weeklyGroups = new Map<string, ThoughtNode[]>()
      
      groupNodes.forEach(node => {
        const date = new Date(node.createdAt)
        const weekKey = formatDate(getWeekStart(date), 'week')
        if (!weeklyGroups.has(weekKey)) {
          weeklyGroups.set(weekKey, [])
        }
        weeklyGroups.get(weekKey)!.push(node)
      })

      weeklyGroups.forEach((weekNodes, weekKey) => {
        entries.push({
          id: `timeline-${weekKey}`,
          date: getWeekStart(new Date(weekNodes[0].createdAt)),
          timestamp: weekNodes[0].createdAt,
          nodes: weekNodes,
          label: `${weekNodes.length}個のノード`,
          type: 'week'
        })
      })
    }

    // エントリを日時順でソート
    entries.sort((a, b) => b.timestamp - a.timestamp)

    timelineGroups.push({
      period,
      entries,
      nodeCount: groupNodes.length
    })
  })

  // グループを期間順でソート（新しいものから）
  return timelineGroups.sort((a, b) => {
    const dateA = new Date(a.entries[0]?.timestamp || 0)
    const dateB = new Date(b.entries[0]?.timestamp || 0)
    return dateB.getTime() - dateA.getTime()
  })
}

// 特定期間のノードを取得
export function getNodesInDateRange(
  nodes: ThoughtNode[],
  startDate: Date,
  endDate: Date
): ThoughtNode[] {
  const start = startDate.getTime()
  const end = endDate.getTime()
  
  return nodes.filter(node => {
    const nodeDate = node.createdAt
    return nodeDate >= start && nodeDate <= end
  })
}

// 統計情報を計算
export function getTimelineStats(groups: TimelineGroup[]): {
  totalDays: number
  totalNodes: number
  averageNodesPerDay: number
  mostActiveDay: string
  mostActiveDayCount: number
} {
  if (groups.length === 0) {
    return {
      totalDays: 0,
      totalNodes: 0,
      averageNodesPerDay: 0,
      mostActiveDay: '',
      mostActiveDayCount: 0
    }
  }

  const totalNodes = groups.reduce((sum, group) => sum + group.nodeCount, 0)
  const totalDays = groups.reduce((sum, group) => sum + group.entries.length, 0)
  
  // 最も活発な日を見つける
  let mostActiveDay = ''
  let mostActiveDayCount = 0
  
  groups.forEach(group => {
    group.entries.forEach(entry => {
      if (entry.nodes.length > mostActiveDayCount) {
        mostActiveDayCount = entry.nodes.length
        mostActiveDay = formatDate(entry.date, 'day')
      }
    })
  })

  return {
    totalDays,
    totalNodes,
    averageNodesPerDay: totalDays > 0 ? totalNodes / totalDays : 0,
    mostActiveDay,
    mostActiveDayCount
  }
}

// 検索とフィルタリング
export function filterTimelineByKeyword(
  groups: TimelineGroup[],
  keyword: string
): TimelineGroup[] {
  if (!keyword.trim()) return groups

  const lowerKeyword = keyword.toLowerCase()
  
  return groups.map(group => {
    const filteredEntries = group.entries.map(entry => {
      const filteredNodes = entry.nodes.filter(node => 
        node.comment.toLowerCase().includes(lowerKeyword) ||
        node.summary.toLowerCase().includes(lowerKeyword) ||
        node.url.toLowerCase().includes(lowerKeyword)
      )
      
      return {
        ...entry,
        nodes: filteredNodes,
        label: `${filteredNodes.length}個のノード`
      }
    }).filter(entry => entry.nodes.length > 0)

    return {
      ...group,
      entries: filteredEntries,
      nodeCount: filteredEntries.reduce((sum, entry) => sum + entry.nodes.length, 0)
    }
  }).filter(group => group.entries.length > 0)
}

// タイムライン上での位置計算（アニメーション用）
export function calculateTimelinePosition(
  timestamp: number,
  startTime: number,
  endTime: number,
  containerHeight: number
): number {
  if (endTime <= startTime) return 0
  
  const progress = (timestamp - startTime) / (endTime - startTime)
  return progress * containerHeight
}
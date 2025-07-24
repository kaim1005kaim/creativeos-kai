import React, { useState, useEffect, useMemo } from 'react'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'

interface TimelineEntry {
  date: string
  nodes: ThoughtNode[]
  dayOfWeek: string
  isToday: boolean
  isThisWeek: boolean
}

interface TimelineViewProps {
  onNodeSelect?: (nodeId: string) => void
}

export default function TimelineView({ onNodeSelect }: TimelineViewProps) {
  const nodes = useNodeStore((state) => state.nodes)
  const setSelectedNode = useNodeStore((state) => state.setSelectedNode)
  const setEditingNode = useNodeStore((state) => state.setEditingNode)
  
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  // タイムライン用のデータを生成
  const timelineData = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    
    // 表示期間を設定
    switch (viewMode) {
      case 'day':
        startDate.setDate(today.getDate() - 7) // 過去7日
        break
      case 'week':
        startDate.setDate(today.getDate() - 30) // 過去30日
        break
      case 'month':
        startDate.setMonth(today.getMonth() - 6) // 過去6ヶ月
        break
    }
    
    // 日付ごとにノードをグループ化
    const groupedNodes: { [key: string]: ThoughtNode[] } = {}
    
    nodes.forEach(node => {
      const nodeDate = new Date(node.createdAt)
      if (nodeDate >= startDate) {
        const dateKey = nodeDate.toISOString().split('T')[0]
        if (!groupedNodes[dateKey]) {
          groupedNodes[dateKey] = []
        }
        groupedNodes[dateKey].push(node)
      }
    })
    
    // タイムラインエントリに変換
    const timeline: TimelineEntry[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const dayNodes = groupedNodes[dateKey] || []
      
      timeline.push({
        date: dateKey,
        nodes: dayNodes.sort((a, b) => b.createdAt - a.createdAt),
        dayOfWeek: currentDate.toLocaleDateString('ja-JP', { weekday: 'short' }),
        isToday: dateKey === today.toISOString().split('T')[0],
        isThisWeek: Math.abs(currentDate.getTime() - today.getTime()) < 7 * 24 * 60 * 60 * 1000
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return timeline.reverse() // 新しい日付を上に
  }, [nodes, viewMode])
  
  // ノード統計
  const stats = useMemo(() => {
    const totalNodes = nodes.length
    const recentNodes = nodes.filter(node => 
      Date.now() - node.createdAt < 7 * 24 * 60 * 60 * 1000
    ).length
    
    const categoryCount: { [key: string]: number } = {}
    nodes.forEach(node => {
      if (node.category) {
        categoryCount[node.category] = (categoryCount[node.category] || 0) + 1
      }
    })
    
    return {
      total: totalNodes,
      thisWeek: recentNodes,
      topCategory: Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]
    }
  }, [nodes])

  const handleNodeClick = (node: ThoughtNode) => {
    setSelectedNode(node)
    if (onNodeSelect) {
      onNodeSelect(node.id)
    }
  }

  const handleNodeEdit = (node: ThoughtNode) => {
    setEditingNode(node)
  }

  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      background: '#0a0a0a'
    },
    header: {
      padding: '1rem',
      borderBottom: '1px solid #333',
      background: '#111'
    },
    title: {
      margin: '0 0 1rem 0',
      fontSize: '1.2rem',
      color: '#fff'
    },
    controls: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    viewModeButton: (active: boolean) => ({
      padding: '0.5rem 1rem',
      backgroundColor: active ? '#4f46e5' : '#333',
      color: active ? '#fff' : '#ccc',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.85rem'
    }),
    stats: {
      display: 'flex',
      gap: '2rem',
      fontSize: '0.85rem',
      color: '#888'
    },
    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '1rem'
    },
    timelineEntry: {
      marginBottom: '2rem'
    },
    dateHeader: (isToday: boolean, isThisWeek: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1rem',
      padding: '0.75rem',
      backgroundColor: isToday ? '#1e3a8a' : isThisWeek ? '#1e293b' : '#111',
      borderRadius: '6px',
      borderLeft: isToday ? '4px solid #3b82f6' : isThisWeek ? '4px solid #64748b' : '4px solid #333'
    }),
    dateText: {
      fontSize: '1rem',
      fontWeight: 'bold',
      color: '#fff'
    },
    dayOfWeek: {
      fontSize: '0.85rem',
      color: '#888'
    },
    nodeCount: {
      fontSize: '0.8rem',
      color: '#666',
      marginLeft: 'auto'
    },
    nodesList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.75rem',
      marginLeft: '1rem'
    },
    nodeCard: {
      padding: '1rem',
      backgroundColor: '#1a1a1a',
      borderRadius: '6px',
      border: '1px solid #333',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative' as const
    },
    nodeCardHover: {
      backgroundColor: '#222',
      borderColor: '#555'
    },
    nodeHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '0.5rem'
    },
    nodeImage: {
      width: '32px',
      height: '32px',
      borderRadius: '4px',
      objectFit: 'cover' as const
    },
    nodeTitle: {
      fontSize: '0.95rem',
      fontWeight: '500',
      color: '#fff',
      flex: 1
    },
    nodeTime: {
      fontSize: '0.8rem',
      color: '#666'
    },
    nodeComment: {
      fontSize: '0.85rem',
      color: '#ccc',
      marginBottom: '0.5rem',
      lineHeight: 1.4
    },
    nodeTags: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '0.25rem'
    },
    tag: {
      padding: '0.25rem 0.5rem',
      backgroundColor: '#333',
      borderRadius: '12px',
      fontSize: '0.75rem',
      color: '#ccc'
    },
    categoryBadge: {
      padding: '0.25rem 0.5rem',
      backgroundColor: '#4f46e5',
      borderRadius: '12px',
      fontSize: '0.75rem',
      color: '#fff',
      fontWeight: '500'
    },
    emptyState: {
      textAlign: 'center' as const,
      color: '#666',
      fontSize: '0.9rem',
      fontStyle: 'italic',
      padding: '2rem'
    },
    contextMenu: {
      position: 'absolute' as const,
      top: '0.5rem',
      right: '0.5rem',
      opacity: 0,
      transition: 'opacity 0.2s'
    },
    contextMenuVisible: {
      opacity: 1
    },
    editButton: {
      padding: '0.25rem',
      backgroundColor: 'rgba(79, 70, 229, 0.8)',
      border: 'none',
      borderRadius: '4px',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '0.8rem'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📅 タイムライン</h2>
        
        <div style={styles.controls}>
          <button
            onClick={() => setViewMode('day')}
            style={styles.viewModeButton(viewMode === 'day')}
          >
            日単位
          </button>
          <button
            onClick={() => setViewMode('week')}
            style={styles.viewModeButton(viewMode === 'week')}
          >
            週単位
          </button>
          <button
            onClick={() => setViewMode('month')}
            style={styles.viewModeButton(viewMode === 'month')}
          >
            月単位
          </button>
        </div>
        
        <div style={styles.stats}>
          <span>総ノード数: {stats.total}</span>
          <span>今週: {stats.thisWeek}個</span>
          {stats.topCategory && (
            <span>人気カテゴリ: {stats.topCategory[0]} ({stats.topCategory[1]}個)</span>
          )}
        </div>
      </div>
      
      <div style={styles.content}>
        {timelineData.map((entry) => (
          <div key={entry.date} style={styles.timelineEntry}>
            <div style={styles.dateHeader(entry.isToday, entry.isThisWeek)}>
              <span style={styles.dateText}>
                {new Date(entry.date).toLocaleDateString('ja-JP', {
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span style={styles.dayOfWeek}>({entry.dayOfWeek})</span>
              <span style={styles.nodeCount}>
                {entry.nodes.length}個のノード
              </span>
            </div>
            
            {entry.nodes.length > 0 ? (
              <div style={styles.nodesList}>
                {entry.nodes.map((node) => (
                  <div
                    key={node.id}
                    style={styles.nodeCard}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, styles.nodeCardHover)
                      const menu = e.currentTarget.querySelector('.context-menu') as HTMLElement
                      if (menu) Object.assign(menu.style, styles.contextMenuVisible)
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.currentTarget.style, styles.nodeCard)
                      const menu = e.currentTarget.querySelector('.context-menu') as HTMLElement
                      if (menu) menu.style.opacity = '0'
                    }}
                  >
                    <div
                      className="context-menu"
                      style={{...styles.contextMenu}}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNodeEdit(node)
                      }}
                    >
                      <button style={styles.editButton}>✏️</button>
                    </div>
                    
                    <div style={styles.nodeHeader}>
                      <img
                        src={node.ogpImageUrl || `https://placehold.co/32x32/4f46e5/ffffff?text=${encodeURIComponent(node.url.slice(8, 9).toUpperCase())}`}
                        alt="Node thumbnail"
                        style={styles.nodeImage}
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/32x32/4f46e5/ffffff?text=${encodeURIComponent(node.url.slice(8, 9).toUpperCase())}`
                        }}
                      />
                      <span style={styles.nodeTitle}>
                        {node.title || node.comment.slice(0, 50)}
                      </span>
                      <span style={styles.nodeTime}>
                        {new Date(node.createdAt).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div style={styles.nodeComment}>
                      {node.summary || node.comment}
                    </div>
                    
                    <div style={styles.nodeTags}>
                      {node.category && (
                        <span style={styles.categoryBadge}>{node.category}</span>
                      )}
                      {node.tags?.slice(0, 3).map((tag, index) => (
                        <span key={index} style={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                この日にはノードが作成されていません
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
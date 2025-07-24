import React, { useState, useEffect, useMemo } from 'react'
import { ThoughtNode } from '../types/ThoughtNode'
import { 
  TimelineGroup, 
  TimelineEntry,
  groupNodesByTimeline, 
  getTimelineStats,
  filterTimelineByKeyword,
  formatDate
} from '../lib/timeline'

interface TimelineVisualizationProps {
  nodes: ThoughtNode[]
  onNodeSelect?: (nodeId: string) => void
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void
}

const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  nodes,
  onNodeSelect,
  onDateRangeSelect
}) => {
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // タイムラインデータを計算
  const timelineGroups = useMemo(() => {
    const groups = groupNodesByTimeline(nodes, groupBy)
    return filterTimelineByKeyword(groups, searchKeyword)
  }, [nodes, groupBy, searchKeyword])

  const stats = useMemo(() => getTimelineStats(timelineGroups), [timelineGroups])

  // 初期状態で最新のグループを展開
  useEffect(() => {
    if (timelineGroups.length > 0) {
      setExpandedGroups(new Set([timelineGroups[0].period]))
    }
  }, [timelineGroups])

  const toggleGroupExpansion = (period: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(period)) {
      newExpanded.delete(period)
    } else {
      newExpanded.add(period)
    }
    setExpandedGroups(newExpanded)
  }

  const handleEntryClick = (entry: TimelineEntry) => {
    setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)
    
    if (onDateRangeSelect && entry.nodes.length > 0) {
      const startDate = new Date(Math.min(...entry.nodes.map(n => n.createdAt)))
      const endDate = new Date(Math.max(...entry.nodes.map(n => n.createdAt)))
      onDateRangeSelect(startDate, endDate)
    }
  }

  const getActivityColor = (nodeCount: number): string => {
    if (nodeCount === 0) return '#1a1a1a'
    if (nodeCount <= 2) return '#39a0ed'
    if (nodeCount <= 5) return '#4ecdc4'
    if (nodeCount <= 10) return '#feca57'
    return '#ff6b6b'
  }

  const getActivityLevel = (nodeCount: number): string => {
    if (nodeCount === 0) return '活動なし'
    if (nodeCount <= 2) return '低活動'
    if (nodeCount <= 5) return '中活動'
    if (nodeCount <= 10) return '高活動'
    return '非常に高活動'
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minHeight: 0
    }}>
      <div style={{
        padding: '20px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        color: '#ffffff',
        overflow: 'auto',
        flex: 1
      }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>
          タイムライン
        </h3>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="day">日別</option>
            <option value="week">週別</option>
            <option value="month">月別</option>
          </select>
        </div>
      </div>

      {/* 検索バー */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="タイムラインを検索..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2a2a2a',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* 統計情報 */}
      {timelineGroups.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#2a2a2a',
          borderRadius: '6px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ecdc4' }}>
              {stats.totalNodes}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>総ノード数</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff6b6b' }}>
              {stats.totalDays}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>アクティブ日数</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#45b7d1' }}>
              {stats.averageNodesPerDay.toFixed(1)}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>日平均</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#96ceb4' }}>
              {stats.mostActiveDayCount}
            </div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>最高活動</div>
          </div>
        </div>
      )}

      {/* タイムライン */}
      {timelineGroups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {timelineGroups.map((group) => (
            <div
              key={group.period}
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {/* グループヘッダー */}
              <div
                onClick={() => toggleGroupExpansion(group.period)}
                style={{
                  padding: '15px',
                  backgroundColor: '#3a3a3a',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    transform: expandedGroups.has(group.period) ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '12px'
                  }}>
                    ▶
                  </span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {group.period}
                  </span>
                </div>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: getActivityColor(group.nodeCount),
                  color: group.nodeCount > 0 ? '#000' : '#fff',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {group.nodeCount} nodes
                </span>
              </div>

              {/* エントリ一覧 */}
              {expandedGroups.has(group.period) && (
                <div style={{ padding: '10px 15px' }}>
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => handleEntryClick(entry)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        backgroundColor: selectedEntry?.id === entry.id ? '#4a4a4a' : '#1a1a1a',
                        borderRadius: '6px',
                        border: `2px solid ${selectedEntry?.id === entry.id ? getActivityColor(entry.nodes.length) : 'transparent'}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: selectedEntry?.id === entry.id ? '10px' : '0'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            {formatDate(entry.date, entry.type)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#aaa' }}>
                            {entry.label} - {getActivityLevel(entry.nodes.length)}
                          </div>
                        </div>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: getActivityColor(entry.nodes.length),
                            borderRadius: '50%'
                          }}
                        />
                      </div>

                      {/* ノード詳細 */}
                      {selectedEntry?.id === entry.id && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '8px',
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid #444'
                        }}>
                          {entry.nodes.map((node) => (
                            <div
                              key={node.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                onNodeSelect?.(node.id)
                              }}
                              style={{
                                padding: '8px',
                                backgroundColor: '#0a0a0a',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                border: '1px solid #444',
                                transition: 'border-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = getActivityColor(entry.nodes.length)
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#444'
                              }}
                            >
                              <div style={{
                                fontWeight: 'bold',
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {node.comment}
                              </div>
                              <div style={{
                                color: '#888',
                                fontSize: '10px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginBottom: '4px'
                              }}>
                                {node.url}
                              </div>
                              <div style={{
                                color: '#666',
                                fontSize: '10px'
                              }}>
                                {new Date(node.createdAt).toLocaleTimeString('ja-JP')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#666',
          padding: '40px 20px'
        }}>
          {searchKeyword ? 
            '検索条件に一致するノードが見つかりません' : 
            'タイムライン表示用のノードがありません'
          }
        </div>
      )}
      </div>
    </div>
  )
}

export default TimelineVisualization
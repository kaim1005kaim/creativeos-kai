import React, { useMemo } from 'react'
import { useNodeStore } from '../store/nodes'
import { useTheme } from '../contexts/ThemeContext'
import { ThoughtNode } from '../types/ThoughtNode'
import { MCPStatusCard } from './MCPStatus'
import { MCPController } from './MCPController'

export default function Dashboard() {
  const nodes = useNodeStore((state) => state.nodes)
  const { colors } = useTheme()

  // Calculate statistics
  const stats = useMemo(() => {
    if (nodes.length === 0) {
      return {
        totalNodes: 0,
        totalConnections: 0,
        avgConnectionsPerNode: 0,
        mostConnectedNode: null,
        domains: {},
        tags: {},
        creationActivity: {},
        recentNodes: []
      }
    }

    // Basic stats
    const totalNodes = nodes.length
    const totalConnections = nodes.reduce((sum, node) => sum + (node.linkedNodeIds?.length || 0), 0) / 2 // Divide by 2 for bidirectional links

    // Most connected node
    const mostConnectedNode = nodes.reduce((prev, current) => 
      (current.linkedNodeIds?.length || 0) > (prev.linkedNodeIds?.length || 0) ? current : prev
    )

    // Domain analysis
    const domains: Record<string, number> = {}
    nodes.forEach(node => {
      try {
        const hostname = new URL(node.url).hostname.replace('www.', '')
        domains[hostname] = (domains[hostname] || 0) + 1
      } catch {
        domains['invalid-url'] = (domains['invalid-url'] || 0) + 1
      }
    })

    // Tag analysis
    const tags: Record<string, number> = {}
    nodes.forEach(node => {
      if (node.tags) {
        node.tags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1
        })
      }
    })

    // Creation activity (last 30 days)
    const now = Date.now()
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
    const creationActivity: Record<string, number> = {}
    
    nodes.filter(node => node.createdAt >= thirtyDaysAgo).forEach(node => {
      const dateKey = new Date(node.createdAt).toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric' 
      })
      creationActivity[dateKey] = (creationActivity[dateKey] || 0) + 1
    })

    // Recent nodes (last 7 days)
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
    const recentNodes = nodes
      .filter(node => node.createdAt >= sevenDaysAgo)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)

    return {
      totalNodes,
      totalConnections,
      avgConnectionsPerNode: totalConnections / totalNodes,
      mostConnectedNode,
      domains,
      tags,
      creationActivity,
      recentNodes
    }
  }, [nodes])

  // Helper function to get top items from object
  const getTopItems = (obj: Record<string, number>, limit = 5) => {
    return Object.entries(obj)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color = '#4ecdc4' 
  }: { 
    title: string
    value: string | number
    subtitle?: string
    icon: string
    color?: string
  }) => (
    <div style={{
      backgroundColor: colors.surface,
      borderRadius: '8px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '24px',
        marginBottom: '8px'
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: color,
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '14px',
        color: colors.text,
        marginBottom: subtitle ? '4px' : '0'
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '12px',
          color: '#999'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  )

  const ChartBar = ({ 
    label, 
    value, 
    maxValue, 
    color = '#4ecdc4' 
  }: { 
    label: string
    value: number
    maxValue: number
    color?: string
  }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px'
    }}>
      <div style={{
        width: '120px',
        fontSize: '12px',
        color: '#ccc',
        textAlign: 'right',
        marginRight: '12px'
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        height: '20px',
        backgroundColor: colors.border,
        borderRadius: '10px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(value / maxValue) * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '10px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <div style={{
        width: '40px',
        fontSize: '12px',
        color: '#ccc',
        textAlign: 'left',
        marginLeft: '12px'
      }}>
        {value}
      </div>
    </div>
  )

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
        backgroundColor: colors.surface,
        borderRadius: '8px',
        color: colors.text,
        overflow: 'auto',
        flex: 1
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h3 style={{ margin: 0, fontSize: '20px' }}>
            📊 ダッシュボード
          </h3>
          <div style={{
            fontSize: '12px',
            color: '#666'
          }}>
            {new Date().toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* MCP Controller - Top Priority */}
        <div style={{ marginBottom: '25px' }}>
          <MCPController />
        </div>

        {/* Main Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <StatCard
            icon="📚"
            title="総ノード数"
            value={stats.totalNodes}
            color="#4ecdc4"
          />
          <StatCard
            icon="🔗"
            title="総接続数"
            value={stats.totalConnections}
            color="#ff6b6b"
          />
          <StatCard
            icon="📈"
            title="平均接続数"
            value={stats.avgConnectionsPerNode.toFixed(1)}
            subtitle="ノード当たり"
            color="#96ceb4"
          />
          <StatCard
            icon="⭐"
            title="最多接続"
            value={stats.mostConnectedNode?.linkedNodeIds?.length || 0}
            subtitle={stats.mostConnectedNode?.title || stats.mostConnectedNode?.comment.substring(0, 15) + '...'}
            color="#feca57"
          />
        </div>


        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '25px'
        }}>
          {/* Domain Analysis */}
          <div style={{
            backgroundColor: colors.background,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              fontSize: '16px',
              color: colors.text
            }}>
              🌐 ドメイン別分析
            </h4>
            {getTopItems(stats.domains).length > 0 ? (
              <div>
                {getTopItems(stats.domains).map(([domain, count], index) => (
                  <ChartBar
                    key={domain}
                    label={domain.length > 15 ? domain.substring(0, 15) + '...' : domain}
                    value={count}
                    maxValue={getTopItems(stats.domains)[0]?.[1] || 1}
                    color={['#4ecdc4', '#ff6b6b', '#96ceb4', '#feca57', '#ff9ff3'][index % 5]}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '12px',
                padding: '20px'
              }}>
                データがありません
              </div>
            )}
          </div>

          {/* Tag Analysis */}
          <div style={{
            backgroundColor: colors.background,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              fontSize: '16px',
              color: colors.text
            }}>
              🏷️ タグ別分析
            </h4>
            {getTopItems(stats.tags).length > 0 ? (
              <div>
                {getTopItems(stats.tags).map(([tag, count], index) => (
                  <ChartBar
                    key={tag}
                    label={tag}
                    value={count}
                    maxValue={getTopItems(stats.tags)[0]?.[1] || 1}
                    color={['#ff6b6b', '#4ecdc4', '#feca57', '#96ceb4', '#ff9ff3'][index % 5]}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '12px',
                padding: '20px'
              }}>
                タグが設定されていません
              </div>
            )}
          </div>
        </div>

        {/* Activity and Recent Nodes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }}>
          {/* Creation Activity */}
          <div style={{
            backgroundColor: colors.background,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              fontSize: '16px',
              color: colors.text
            }}>
              📅 作成アクティビティ (30日間)
            </h4>
            {Object.keys(stats.creationActivity).length > 0 ? (
              <div>
                {Object.entries(stats.creationActivity)
                  .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                  .map(([date, count]) => (
                    <ChartBar
                      key={date}
                      label={date}
                      value={count}
                      maxValue={Math.max(...Object.values(stats.creationActivity))}
                      color="#96ceb4"
                    />
                  ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '12px',
                padding: '20px'
              }}>
                最近のアクティビティがありません
              </div>
            )}
          </div>

          {/* Recent Nodes */}
          <div style={{
            backgroundColor: colors.background,
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h4 style={{
              margin: '0 0 15px 0',
              fontSize: '16px',
              color: colors.text
            }}>
              🕒 最近のノード (7日間)
            </h4>
            {stats.recentNodes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.recentNodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      padding: '10px',
                      backgroundColor: colors.surface,
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: colors.primary,
                      marginBottom: '4px'
                    }}>
                      {node.title || node.comment.substring(0, 25) + '...'}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#999',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>
                        {new Date(node.createdAt).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>
                        {node.linkedNodeIds?.length || 0}接続
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '12px',
                padding: '20px'
              }}>
                最近のノードがありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
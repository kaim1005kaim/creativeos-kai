import React, { useState, useEffect, useMemo } from 'react'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'
import { HeatmapAnalyzer, HeatmapVisualizationData, HeatmapMode, NodeHeatmapData, updateHeatmapForMode } from '../lib/heatmapAnalysis'

interface HeatmapViewProps {
  onNodeSelect?: (nodeId: string) => void
}

export default function HeatmapView({ onNodeSelect }: HeatmapViewProps) {
  const nodes = useNodeStore((state) => state.nodes)
  const setSelectedNode = useNodeStore((state) => state.setSelectedNode)
  const setEditingNode = useNodeStore((state) => state.setEditingNode)
  
  const [heatmapData, setHeatmapData] = useState<HeatmapVisualizationData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentMode, setCurrentMode] = useState<HeatmapMode>('overall')
  const [selectedNode, setSelectedNodeState] = useState<NodeHeatmapData | null>(null)
  const [viewType, setViewType] = useState<'scatter' | 'grid' | 'network'>('scatter')
  const [showTooltip, setShowTooltip] = useState<{ node: NodeHeatmapData; x: number; y: number } | null>(null)

  // ヒートマップ分析実行
  const performAnalysis = async () => {
    if (nodes.length < 2) return

    setIsAnalyzing(true)
    try {
      const analyzer = new HeatmapAnalyzer(nodes)
      const data = await analyzer.generateHeatmap()
      setHeatmapData(data)
    } catch (error) {
      console.error('Heatmap analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 初期分析実行
  useEffect(() => {
    if (nodes.length >= 2) {
      performAnalysis()
    }
  }, [nodes.length])

  // モード変更時のヒートマップ更新
  useEffect(() => {
    if (heatmapData) {
      updateHeatmapForMode(heatmapData, currentMode).then(setHeatmapData)
    }
  }, [currentMode])

  // 統計情報
  const stats = useMemo(() => {
    if (!heatmapData) return null

    const metric = currentMode
    const values = heatmapData.nodes.map(n => n.metrics[metric])
    const sorted = [...values].sort((a, b) => b - a)
    
    return {
      max: sorted[0],
      min: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      topNodes: heatmapData.nodes
        .sort((a, b) => b.metrics[metric] - a.metrics[metric])
        .slice(0, 5)
    }
  }, [heatmapData, currentMode])

  const handleNodeClick = (nodeData: NodeHeatmapData) => {
    setSelectedNode(nodeData.node)
    setSelectedNodeState(nodeData)
    if (onNodeSelect) {
      onNodeSelect(nodeData.nodeId)
    }
  }

  const handleNodeEdit = (nodeData: NodeHeatmapData) => {
    setEditingNode(nodeData.node)
  }

  // カラーレジェンドの生成
  const generateColorLegend = () => {
    const steps = 10
    const legend = []
    for (let i = 0; i < steps; i++) {
      const value = i / (steps - 1)
      const hue = 240 - (value * 240) // 青から赤
      legend.push({
        color: `hsl(${hue}, 70%, 50%)`,
        value: value,
        label: (value * 100).toFixed(0) + '%'
      })
    }
    return legend
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
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    controls: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem'
    },
    controlGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.85rem',
      color: '#ccc',
      fontWeight: '500'
    },
    select: {
      padding: '0.5rem',
      backgroundColor: '#222',
      border: '1px solid #444',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '0.85rem'
    },
    modeButtons: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '0.5rem'
    },
    modeButton: (active: boolean) => ({
      padding: '0.5rem 0.75rem',
      backgroundColor: active ? '#4f46e5' : '#333',
      color: active ? '#fff' : '#ccc',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      whiteSpace: 'nowrap' as const
    }),
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: '#111',
      borderRadius: '6px',
      marginTop: '1rem'
    },
    statItem: {
      textAlign: 'center' as const
    },
    statValue: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#4f46e5'
    },
    statLabel: {
      fontSize: '0.75rem',
      color: '#888',
      marginTop: '0.25rem'
    },
    content: {
      flex: 1,
      display: 'flex',
      gap: '1rem',
      padding: '1rem'
    },
    visualization: {
      flex: 1,
      backgroundColor: '#111',
      borderRadius: '8px',
      position: 'relative' as const,
      overflow: 'hidden',
      minHeight: '400px'
    },
    scatterPlot: {
      width: '100%',
      height: '100%',
      position: 'relative' as const
    },
    scatterNode: (nodeData: NodeHeatmapData, isSelected: boolean) => ({
      position: 'absolute' as const,
      left: `${nodeData.position[0] * 100}%`,
      top: `${nodeData.position[1] * 100}%`,
      width: `${nodeData.size * 20}px`,
      height: `${nodeData.size * 20}px`,
      backgroundColor: nodeData.color,
      borderRadius: '50%',
      border: isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
      cursor: 'pointer',
      transform: 'translate(-50%, -50%)',
      transition: 'all 0.2s',
      zIndex: isSelected ? 10 : 1
    }),
    gridView: {
      display: 'grid',
      gridTemplateColumns: 'repeat(20, 1fr)',
      gridTemplateRows: 'repeat(20, 1fr)',
      width: '100%',
      height: '100%',
      gap: '1px'
    },
    gridCell: (intensity: number) => ({
      backgroundColor: `hsl(${240 - (intensity * 240)}, 70%, 50%)`,
      opacity: intensity * 0.8 + 0.2
    }),
    sidebar: {
      width: '320px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    legend: {
      backgroundColor: '#111',
      borderRadius: '8px',
      padding: '1rem'
    },
    legendTitle: {
      fontSize: '0.9rem',
      color: '#fff',
      marginBottom: '0.75rem',
      fontWeight: '500'
    },
    legendScale: {
      display: 'flex',
      height: '20px',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '0.5rem'
    },
    legendStep: (color: string) => ({
      flex: 1,
      backgroundColor: color
    }),
    legendLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.75rem',
      color: '#888'
    },
    nodeInfo: {
      backgroundColor: '#111',
      borderRadius: '8px',
      padding: '1rem'
    },
    nodeInfoTitle: {
      fontSize: '0.9rem',
      color: '#fff',
      marginBottom: '0.75rem',
      fontWeight: '500'
    },
    nodeInfoContent: {
      fontSize: '0.85rem',
      color: '#ccc',
      lineHeight: 1.4
    },
    nodeMetrics: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.5rem',
      marginTop: '0.75rem'
    },
    metricItem: {
      padding: '0.5rem',
      backgroundColor: '#222',
      borderRadius: '4px'
    },
    metricLabel: {
      fontSize: '0.75rem',
      color: '#888',
      marginBottom: '0.25rem'
    },
    metricValue: {
      fontSize: '0.9rem',
      color: '#fff',
      fontWeight: '500'
    },
    metricBar: {
      width: '100%',
      height: '4px',
      backgroundColor: '#333',
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '0.25rem'
    },
    metricFill: (value: number, color: string) => ({
      width: `${value * 100}%`,
      height: '100%',
      backgroundColor: color,
      transition: 'width 0.3s ease'
    }),
    topNodes: {
      backgroundColor: '#111',
      borderRadius: '8px',
      padding: '1rem'
    },
    topNodesTitle: {
      fontSize: '0.9rem',
      color: '#fff',
      marginBottom: '0.75rem',
      fontWeight: '500'
    },
    topNodesList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem'
    },
    topNodeItem: {
      padding: '0.5rem',
      backgroundColor: '#222',
      borderRadius: '4px',
      cursor: 'pointer',
      border: '1px solid #333',
      transition: 'all 0.2s'
    },
    topNodeItemHover: {
      backgroundColor: '#333',
      borderColor: '#555'
    },
    topNodeTitle: {
      fontSize: '0.85rem',
      color: '#fff',
      marginBottom: '0.25rem'
    },
    topNodeScore: {
      fontSize: '0.75rem',
      color: '#888'
    },
    tooltip: {
      position: 'absolute' as const,
      backgroundColor: '#1a1a1a',
      border: '1px solid #444',
      borderRadius: '6px',
      padding: '0.75rem',
      fontSize: '0.8rem',
      color: '#fff',
      zIndex: 1000,
      maxWidth: '200px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
      color: '#666',
      fontSize: '0.9rem'
    },
    emptyState: {
      textAlign: 'center' as const,
      color: '#666',
      fontSize: '0.9rem',
      padding: '3rem'
    }
  }

  const modeLabels = {
    overall: '総合',
    importance: '重要度',
    connectivity: '接続度',
    centrality: '中心性',
    recency: '新しさ',
    engagement: 'エンゲージメント',
    diversity: '多様性'
  }

  const metricDescriptions = {
    overall: '全指標の重み付け総合スコア',
    importance: 'リンク数とコンテンツ品質',
    connectivity: '他ノードとの類似性',
    centrality: 'ネットワーク中心性',
    recency: '作成時間の新しさ',
    engagement: '更新頻度・アクセス頻度',
    diversity: 'カテゴリ・タグの多様性'
  }

  if (nodes.length < 2) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔥 ヒートマップ分析</h2>
        </div>
        <div style={styles.emptyState}>
          ヒートマップ分析には最低2つのノードが必要です
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          🔥 ヒートマップ分析
          {isAnalyzing && <span style={{ fontSize: '0.8rem', color: '#666' }}>分析中...</span>}
        </h2>
        
        <div style={styles.controls}>
          <div style={styles.controlGroup}>
            <label style={styles.label}>表示タイプ</label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as any)}
              style={styles.select}
            >
              <option value="scatter">散布図</option>
              <option value="grid">グリッド</option>
              <option value="network">ネットワーク</option>
            </select>
          </div>
          
          <div style={styles.controlGroup}>
            <label style={styles.label}>分析指標</label>
            <div style={styles.modeButtons}>
              {(Object.keys(modeLabels) as HeatmapMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCurrentMode(mode)}
                  style={styles.modeButton(currentMode === mode)}
                >
                  {modeLabels[mode]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {stats && (
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{(stats.max * 100).toFixed(1)}%</div>
              <div style={styles.statLabel}>最高値</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{(stats.avg * 100).toFixed(1)}%</div>
              <div style={styles.statLabel}>平均値</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{(stats.median * 100).toFixed(1)}%</div>
              <div style={styles.statLabel}>中央値</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{(stats.min * 100).toFixed(1)}%</div>
              <div style={styles.statLabel}>最小値</div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.content}>
        <div style={styles.visualization}>
          {isAnalyzing ? (
            <div style={styles.loading}>
              🔄 ヒートマップを生成中...
            </div>
          ) : !heatmapData ? (
            <div style={styles.emptyState}>
              ヒートマップデータがありません
            </div>
          ) : viewType === 'scatter' ? (
            <div style={styles.scatterPlot}>
              {heatmapData.nodes.map((nodeData) => (
                <div
                  key={nodeData.nodeId}
                  style={styles.scatterNode(nodeData, selectedNode?.nodeId === nodeData.nodeId)}
                  onClick={() => handleNodeClick(nodeData)}
                  onMouseEnter={(e) => {
                    setShowTooltip({
                      node: nodeData,
                      x: e.pageX,
                      y: e.pageY
                    })
                  }}
                  onMouseLeave={() => setShowTooltip(null)}
                />
              ))}
            </div>
          ) : viewType === 'grid' ? (
            <div style={styles.gridView}>
              {heatmapData.grid.flat().map((intensity, index) => (
                <div
                  key={index}
                  style={styles.gridCell(intensity)}
                />
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              ネットワークビューは開発中です
            </div>
          )}
        </div>

        <div style={styles.sidebar}>
          <div style={styles.legend}>
            <div style={styles.legendTitle}>
              {modeLabels[currentMode]} スケール
            </div>
            <div style={styles.legendScale}>
              {generateColorLegend().map((step, index) => (
                <div key={index} style={styles.legendStep(step.color)} />
              ))}
            </div>
            <div style={styles.legendLabels}>
              <span>低</span>
              <span>高</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
              {metricDescriptions[currentMode]}
            </div>
          </div>

          {selectedNode && (
            <div style={styles.nodeInfo}>
              <div style={styles.nodeInfoTitle}>ノード詳細</div>
              <div style={styles.nodeInfoContent}>
                <strong>{selectedNode.node.title || selectedNode.node.comment}</strong>
                <br />
                {selectedNode.node.summary}
              </div>
              <div style={styles.nodeMetrics}>
                {(Object.keys(modeLabels) as HeatmapMode[]).map((metric) => (
                  <div key={metric} style={styles.metricItem}>
                    <div style={styles.metricLabel}>{modeLabels[metric]}</div>
                    <div style={styles.metricValue}>
                      {(selectedNode.metrics[metric] * 100).toFixed(1)}%
                    </div>
                    <div style={styles.metricBar}>
                      <div style={styles.metricFill(
                        selectedNode.metrics[metric],
                        metric === currentMode ? selectedNode.color : '#666'
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats && (
            <div style={styles.topNodes}>
              <div style={styles.topNodesTitle}>
                {modeLabels[currentMode]} Top 5
              </div>
              <div style={styles.topNodesList}>
                {stats.topNodes.map((nodeData) => (
                  <div
                    key={nodeData.nodeId}
                    style={styles.topNodeItem}
                    onClick={() => handleNodeClick(nodeData)}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.topNodeItemHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.topNodeItem)}
                  >
                    <div style={styles.topNodeTitle}>
                      {nodeData.node.title || nodeData.node.comment.slice(0, 30)}
                    </div>
                    <div style={styles.topNodeScore}>
                      {(nodeData.metrics[currentMode] * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showTooltip && (
        <div
          style={{
            ...styles.tooltip,
            left: showTooltip.x + 10,
            top: showTooltip.y - 10
          }}
        >
          <strong>{showTooltip.node.node.title || showTooltip.node.node.comment.slice(0, 30)}</strong>
          <br />
          {modeLabels[currentMode]}: {(showTooltip.node.metrics[currentMode] * 100).toFixed(1)}%
        </div>
      )}
    </div>
  )
}
import React, { useState, useEffect, useMemo } from 'react'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'
import { AdvancedClustering, Cluster, ClusteringResult } from '../lib/advancedClustering'

interface AdvancedClusterViewProps {
  onNodeSelect?: (nodeId: string) => void
  onClusterSelect?: (cluster: Cluster | null) => void
}

export default function AdvancedClusterView({ onNodeSelect, onClusterSelect }: AdvancedClusterViewProps) {
  const nodes = useNodeStore((state) => state.nodes)
  const setSelectedNode = useNodeStore((state) => state.setSelectedNode)
  const setEditingNode = useNodeStore((state) => state.setEditingNode)
  
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null)
  const [clusteringMethod, setClusteringMethod] = useState<'auto' | 'kmeans' | 'hierarchical' | 'dbscan'>('auto')
  const [numClusters, setNumClusters] = useState<number>(5)
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview')

  // クラスタリング実行
  const performClustering = async () => {
    if (nodes.length < 2) return

    setIsAnalyzing(true)
    try {
      const clustering = new AdvancedClustering(nodes)
      const result = await clustering.performClustering({
        method: clusteringMethod,
        k: clusteringMethod === 'auto' ? undefined : numClusters,
        minClusterSize: 2,
        useSemanticLabeling: true
      })
      
      setClusteringResult(result)
    } catch (error) {
      console.error('Clustering failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 初期クラスタリング実行
  useEffect(() => {
    if (nodes.length >= 2) {
      performClustering()
    }
  }, [nodes.length])

  // クラスター統計
  const clusterStats = useMemo(() => {
    if (!clusteringResult) return null

    const totalNodes = clusteringResult.clusters.reduce((sum, cluster) => sum + cluster.nodes.length, 0)
    const avgClusterSize = totalNodes / clusteringResult.clusters.length
    const largestCluster = clusteringResult.clusters.reduce((largest, cluster) => 
      cluster.nodes.length > largest.nodes.length ? cluster : largest
    )

    return {
      totalClusters: clusteringResult.clusters.length,
      totalNodes,
      avgClusterSize: Math.round(avgClusterSize * 10) / 10,
      largestCluster,
      silhouetteScore: Math.round(clusteringResult.silhouetteScore * 1000) / 1000
    }
  }, [clusteringResult])

  const handleNodeClick = (node: ThoughtNode) => {
    setSelectedNode(node)
    if (onNodeSelect) {
      onNodeSelect(node.id)
    }
  }

  const handleClusterClick = (cluster: Cluster) => {
    setSelectedCluster(cluster)
    if (onClusterSelect) {
      onClusterSelect(cluster)
    }
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
    input: {
      padding: '0.5rem',
      backgroundColor: '#222',
      border: '1px solid #444',
      borderRadius: '4px',
      color: '#fff',
      fontSize: '0.85rem',
      width: '80px'
    },
    button: (variant: 'primary' | 'secondary' = 'secondary') => ({
      padding: '0.5rem 1rem',
      backgroundColor: variant === 'primary' ? '#4f46e5' : '#333',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      disabled: isAnalyzing
    }),
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: '#111',
      borderRadius: '6px'
    },
    statItem: {
      textAlign: 'center' as const
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#4f46e5'
    },
    statLabel: {
      fontSize: '0.8rem',
      color: '#888',
      marginTop: '0.25rem'
    },
    modeToggle: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem'
    },
    modeButton: (active: boolean) => ({
      padding: '0.5rem 1rem',
      backgroundColor: active ? '#4f46e5' : '#333',
      color: active ? '#fff' : '#ccc',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.85rem'
    }),
    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '1rem'
    },
    clusterGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1rem'
    },
    clusterCard: (cluster: Cluster, isSelected: boolean) => ({
      padding: '1rem',
      backgroundColor: isSelected ? '#1e293b' : '#1a1a1a',
      border: `2px solid ${isSelected ? cluster.color : '#333'}`,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    clusterHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.75rem'
    },
    clusterTitle: (color: string) => ({
      fontSize: '1rem',
      fontWeight: 'bold',
      color: color,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }),
    clusterBadge: (color: string) => ({
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: color
    }),
    clusterMeta: {
      fontSize: '0.8rem',
      color: '#666'
    },
    clusterDescription: {
      fontSize: '0.85rem',
      color: '#ccc',
      marginBottom: '0.75rem',
      lineHeight: 1.4
    },
    clusterTopics: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '0.25rem',
      marginBottom: '0.75rem'
    },
    topicTag: {
      padding: '0.25rem 0.5rem',
      backgroundColor: '#333',
      borderRadius: '12px',
      fontSize: '0.75rem',
      color: '#ccc'
    },
    clusterNodes: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem',
      maxHeight: '200px',
      overflowY: 'auto' as const
    },
    nodeItem: {
      padding: '0.5rem',
      backgroundColor: '#222',
      borderRadius: '4px',
      cursor: 'pointer',
      border: '1px solid #333',
      transition: 'all 0.2s'
    },
    nodeItemHover: {
      backgroundColor: '#333',
      borderColor: '#555'
    },
    nodeTitle: {
      fontSize: '0.85rem',
      fontWeight: '500',
      color: '#fff',
      marginBottom: '0.25rem'
    },
    nodeComment: {
      fontSize: '0.8rem',
      color: '#aaa',
      lineHeight: 1.3
    },
    coherenceBar: {
      width: '100%',
      height: '4px',
      backgroundColor: '#333',
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '0.5rem'
    },
    coherenceFill: (coherence: number, color: string) => ({
      width: `${coherence * 100}%`,
      height: '100%',
      backgroundColor: color,
      transition: 'width 0.3s ease'
    }),
    detailView: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem',
      height: '100%'
    },
    detailPanel: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
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

  if (nodes.length < 2) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            🔮 高度なクラスタリング
          </h2>
        </div>
        <div style={styles.emptyState}>
          クラスタリングには最低2つのノードが必要です
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          🔮 高度なクラスタリング
          {isAnalyzing && <span style={{ fontSize: '0.8rem', color: '#666' }}>分析中...</span>}
        </h2>
        
        <div style={styles.controls}>
          <div style={styles.controlGroup}>
            <label style={styles.label}>手法</label>
            <select
              value={clusteringMethod}
              onChange={(e) => setClusteringMethod(e.target.value as any)}
              style={styles.select}
            >
              <option value="auto">自動選択</option>
              <option value="kmeans">K-means</option>
              <option value="hierarchical">階層クラスタリング</option>
              <option value="dbscan">DBSCAN</option>
            </select>
          </div>
          
          {clusteringMethod !== 'auto' && clusteringMethod !== 'dbscan' && (
            <div style={styles.controlGroup}>
              <label style={styles.label}>クラスター数</label>
              <input
                type="number"
                min="2"
                max="20"
                value={numClusters}
                onChange={(e) => setNumClusters(parseInt(e.target.value))}
                style={styles.input}
              />
            </div>
          )}
          
          <div style={styles.controlGroup}>
            <label style={styles.label}>実行</label>
            <button
              onClick={performClustering}
              disabled={isAnalyzing}
              style={styles.button('primary')}
            >
              {isAnalyzing ? '分析中...' : '再実行'}
            </button>
          </div>
        </div>

        {clusterStats && (
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{clusterStats.totalClusters}</div>
              <div style={styles.statLabel}>クラスター数</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{clusterStats.totalNodes}</div>
              <div style={styles.statLabel}>総ノード数</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{clusterStats.avgClusterSize}</div>
              <div style={styles.statLabel}>平均サイズ</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{clusterStats.silhouetteScore}</div>
              <div style={styles.statLabel}>品質スコア</div>
            </div>
          </div>
        )}

        <div style={styles.modeToggle}>
          <button
            onClick={() => setViewMode('overview')}
            style={styles.modeButton(viewMode === 'overview')}
          >
            概要表示
          </button>
          <button
            onClick={() => setViewMode('detail')}
            style={styles.modeButton(viewMode === 'detail')}
          >
            詳細表示
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {isAnalyzing ? (
          <div style={styles.loading}>
            🔄 クラスター分析を実行中...
          </div>
        ) : !clusteringResult ? (
          <div style={styles.emptyState}>
            クラスタリング結果がありません
          </div>
        ) : viewMode === 'overview' ? (
          <div style={styles.clusterGrid}>
            {clusteringResult.clusters.map((cluster) => (
              <div
                key={cluster.id}
                style={styles.clusterCard(cluster, selectedCluster?.id === cluster.id)}
                onClick={() => handleClusterClick(cluster)}
              >
                <div style={styles.clusterHeader}>
                  <div style={styles.clusterTitle(cluster.color)}>
                    <div style={styles.clusterBadge(cluster.color)} />
                    {cluster.label}
                  </div>
                  <div style={styles.clusterMeta}>
                    {cluster.nodes.length}個のノード
                  </div>
                </div>

                <div style={styles.clusterDescription}>
                  {cluster.description}
                </div>

                <div style={styles.clusterTopics}>
                  {cluster.topics.slice(0, 5).map((topic, index) => (
                    <span key={index} style={styles.topicTag}>
                      {topic}
                    </span>
                  ))}
                </div>

                <div style={styles.clusterNodes}>
                  {cluster.nodes.slice(0, 3).map((clusterNode) => (
                    <div
                      key={clusterNode.id}
                      style={styles.nodeItem}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNodeClick(clusterNode.node)
                      }}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.nodeItemHover)}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.nodeItem)}
                    >
                      <div style={styles.nodeTitle}>
                        {clusterNode.node.title || clusterNode.node.comment.slice(0, 40)}
                      </div>
                      <div style={styles.nodeComment}>
                        スコア: {Math.round(clusterNode.clusterScore * 100)}%
                      </div>
                    </div>
                  ))}
                  {cluster.nodes.length > 3 && (
                    <div style={{ ...styles.nodeComment, textAlign: 'center', fontStyle: 'italic' }}>
                      +{cluster.nodes.length - 3}個のノード
                    </div>
                  )}
                </div>

                <div style={styles.coherenceBar}>
                  <div style={styles.coherenceFill(cluster.coherence, cluster.color)} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  コヒーレンス: {Math.round(cluster.coherence * 100)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 詳細表示モード
          <div style={styles.detailView}>
            <div style={styles.detailPanel}>
              <h3 style={{ color: '#fff', margin: '0 0 1rem 0' }}>クラスター一覧</h3>
              {clusteringResult.clusters.map((cluster) => (
                <div
                  key={cluster.id}
                  style={styles.clusterCard(cluster, selectedCluster?.id === cluster.id)}
                  onClick={() => handleClusterClick(cluster)}
                >
                  <div style={styles.clusterTitle(cluster.color)}>
                    <div style={styles.clusterBadge(cluster.color)} />
                    {cluster.label}
                  </div>
                  <div style={styles.clusterDescription}>
                    {cluster.description}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.detailPanel}>
              {selectedCluster ? (
                <>
                  <h3 style={{ color: selectedCluster.color, margin: '0 0 1rem 0' }}>
                    {selectedCluster.label} の詳細
                  </h3>
                  <div style={styles.clusterNodes}>
                    {selectedCluster.nodes.map((clusterNode) => (
                      <div
                        key={clusterNode.id}
                        style={styles.nodeItem}
                        onClick={() => handleNodeClick(clusterNode.node)}
                      >
                        <div style={styles.nodeTitle}>
                          {clusterNode.node.title || clusterNode.node.comment}
                        </div>
                        <div style={styles.nodeComment}>
                          {clusterNode.node.summary}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                          クラスタースコア: {Math.round(clusterNode.clusterScore * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={styles.emptyState}>
                  クラスターを選択してください
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
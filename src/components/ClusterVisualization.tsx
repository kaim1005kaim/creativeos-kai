import React, { useState, useEffect } from 'react'
import { ThoughtNode } from '../types/ThoughtNode'
import { Cluster, performKMeansClustering, findOptimalClusterCount, getClusterStats } from '../lib/clustering'

interface ClusterVisualizationProps {
  nodes: ThoughtNode[]
  onClusterSelect?: (cluster: Cluster | null) => void
  onNodeSelect?: (nodeId: string) => void
}

const ClusterVisualization: React.FC<ClusterVisualizationProps> = ({
  nodes,
  onClusterSelect,
  onNodeSelect
}) => {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [clusterCount, setClusterCount] = useState<number>(5)
  const [autoClusterCount, setAutoClusterCount] = useState(true)

  useEffect(() => {
    if (nodes.length > 0 && nodes.every(node => node.embedding?.length > 0)) {
      performClustering()
    }
  }, [nodes, clusterCount, autoClusterCount])

  const performClustering = async () => {
    if (nodes.length < 2) return

    setIsProcessing(true)
    
    try {
      const optimalK = autoClusterCount ? findOptimalClusterCount(nodes) : clusterCount
      const result = performKMeansClustering(nodes, optimalK)
      setClusters(result)
    } catch (error) {
      console.error('Clustering failed:', error)
    }
    
    setIsProcessing(false)
  }

  const handleClusterClick = (cluster: Cluster) => {
    const newSelected = selectedCluster?.id === cluster.id ? null : cluster
    setSelectedCluster(newSelected)
    onClusterSelect?.(newSelected)
  }

  const stats = getClusterStats(clusters)

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>
          クラスター分析
        </h3>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={autoClusterCount}
              onChange={(e) => setAutoClusterCount(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            自動決定
          </label>
          
          {!autoClusterCount && (
            <>
              <label style={{ fontSize: '14px' }}>
                クラスター数:
              </label>
              <input
                type="range"
                min="2"
                max="10"
                value={clusterCount}
                onChange={(e) => setClusterCount(Number(e.target.value))}
                style={{
                  width: '80px',
                  margin: '0 5px'
                }}
              />
              <span style={{ fontSize: '14px', minWidth: '20px' }}>
                {clusterCount}
              </span>
            </>
          )}
          
          <button
            onClick={performClustering}
            disabled={isProcessing || nodes.length < 2}
            style={{
              padding: '6px 12px',
              backgroundColor: '#4ecdc4',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.6 : 1
            }}
          >
            {isProcessing ? '処理中...' : '再分析'}
          </button>
        </div>
      </div>

      {/* 統計情報 */}
      {clusters.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#2a2a2a',
          borderRadius: '6px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4ecdc4' }}>
              {stats.totalNodes}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>総ノード数</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff6b6b' }}>
              {stats.clusterCount}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>クラスター数</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#45b7d1' }}>
              {stats.averageClusterSize.toFixed(1)}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>平均サイズ</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#96ceb4' }}>
              {stats.largestCluster}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>最大サイズ</div>
          </div>
        </div>
      )}

      {/* クラスター一覧 */}
      {clusters.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              onClick={() => handleClusterClick(cluster)}
              style={{
                padding: '15px',
                backgroundColor: selectedCluster?.id === cluster.id ? '#3a3a3a' : '#2a2a2a',
                borderRadius: '6px',
                border: `2px solid ${selectedCluster?.id === cluster.id ? cluster.color : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: cluster.color,
                      borderRadius: '50%'
                    }}
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {cluster.label}
                  </span>
                </div>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: cluster.color,
                  color: '#000',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {cluster.nodes.length} nodes
                </span>
              </div>

              {selectedCluster?.id === cluster.id && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '8px',
                  marginTop: '10px'
                }}>
                  {cluster.nodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onNodeSelect?.(node.id)
                      }}
                      style={{
                        padding: '8px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        border: '1px solid #444',
                        transition: 'border-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = cluster.color
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
                        whiteSpace: 'nowrap'
                      }}>
                        {node.url}
                      </div>
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
          {nodes.length < 2 ? (
            '分析には少なくとも2つのノードが必要です'
          ) : nodes.some(node => !node.embedding || node.embedding.length === 0) ? (
            'ノードの埋め込みベクトルを生成中...'
          ) : (
            'クラスター分析の準備中...'
          )}
        </div>
      )}
      </div>
    </div>
  )
}

export default ClusterVisualization
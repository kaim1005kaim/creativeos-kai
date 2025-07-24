import React, { useState, useEffect } from 'react'
import { useNodeStore } from '../store/nodes'
import { analyzeNodeLinks, applyAutoLinks, toggleNodeLink, LinkSuggestion } from '../lib/linkAnalysis'

const LinkManager: React.FC = () => {
  const { nodes, setNodes, saveNodes } = useNodeStore()
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAutoLink, setShowAutoLink] = useState(false)
  const [statistics, setStatistics] = useState({
    averageSimilarity: 0,
    strongLinks: 0,
    mediumLinks: 0,
    weakLinks: 0
  })

  // ノード分析の実行
  const analyzeSimilarities = async () => {
    setIsAnalyzing(true)
    
    try {
      const result = analyzeNodeLinks(nodes)
      setSuggestions(result.suggestions)
      setStatistics(result.statistics)
    } catch (error) {
      console.error('Link analysis failed:', error)
    }
    
    setIsAnalyzing(false)
  }

  // 自動リンクの適用
  const handleAutoLink = async () => {
    const updatedNodes = applyAutoLinks(nodes, suggestions)
    setNodes(updatedNodes)
    await saveNodes()
    
    // 再分析
    analyzeSimilarities()
  }

  // 手動リンクの切り替え
  const handleToggleLink = async (nodeId: string, targetNodeId: string) => {
    const updatedNodes = toggleNodeLink(nodes, nodeId, targetNodeId)
    setNodes(updatedNodes)
    await saveNodes()
    
    // 提案リストを更新
    setSuggestions(prev => prev.filter(
      s => !(s.nodeId === nodeId && s.targetNodeId === targetNodeId)
    ))
  }

  // ノードタイトルの取得
  const getNodeTitle = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId)
    return node?.title || node?.comment || 'Unknown'
  }

  // 強度に応じた色
  const getStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
      case 'strong': return '#ff6b6b'
      case 'medium': return '#4ecdc4'
      case 'weak': return '#96ceb4'
    }
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
            リンク管理
          </h3>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={analyzeSimilarities}
              disabled={isAnalyzing || nodes.length < 2}
              style={{
                padding: '6px 12px',
                backgroundColor: '#4ecdc4',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                opacity: isAnalyzing ? 0.6 : 1
              }}
            >
              {isAnalyzing ? '分析中...' : '類似度分析'}
            </button>
            
            {suggestions.some(s => s.strength === 'strong') && (
              <button
                onClick={() => setShowAutoLink(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                自動リンク ({suggestions.filter(s => s.strength === 'strong').length})
              </button>
            )}
          </div>
        </div>

        {/* 統計情報 */}
        {suggestions.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#2a2a2a',
            borderRadius: '6px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ecdc4' }}>
                {(statistics.averageSimilarity * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>平均類似度</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff6b6b' }}>
                {statistics.strongLinks}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>強い関連</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ecdc4' }}>
                {statistics.mediumLinks}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>中程度の関連</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#96ceb4' }}>
                {statistics.weakLinks}
              </div>
              <div style={{ fontSize: '11px', color: '#aaa' }}>弱い関連</div>
            </div>
          </div>
        )}

        {/* リンク提案リスト */}
        {suggestions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                style={{
                  padding: '15px',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${getStrengthColor(suggestion.strength)}`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}>
                        {getNodeTitle(suggestion.nodeId)}
                      </span>
                      <span style={{ color: '#666' }}>→</span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}>
                        {getNodeTitle(suggestion.targetNodeId)}
                      </span>
                    </div>
                    
                    <div style={{
                      fontSize: '12px',
                      color: '#aaa',
                      marginBottom: '6px'
                    }}>
                      類似度: {(suggestion.similarity * 100).toFixed(1)}%
                    </div>
                    
                    <div style={{
                      fontSize: '12px',
                      color: '#ccc'
                    }}>
                      {suggestion.reason}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggleLink(suggestion.nodeId, suggestion.targetNodeId)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: getStrengthColor(suggestion.strength),
                      color: suggestion.strength === 'weak' ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    リンクを追加
                  </button>
                </div>
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
            ) : (
              '「類似度分析」をクリックしてリンク候補を探索してください'
            )}
          </div>
        )}

        {/* 自動リンク確認モーダル */}
        {showAutoLink && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{ marginBottom: '20px' }}>自動リンクの確認</h3>
              <p style={{ marginBottom: '20px', color: '#ccc' }}>
                {suggestions.filter(s => s.strength === 'strong').length}個の
                強い関連性を持つノードペアを自動的にリンクします。
              </p>
              
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#1a1a1a',
                borderRadius: '4px'
              }}>
                {suggestions
                  .filter(s => s.strength === 'strong')
                  .map((s, i) => (
                    <div key={i} style={{
                      padding: '8px',
                      borderBottom: '1px solid #333',
                      fontSize: '12px'
                    }}>
                      {getNodeTitle(s.nodeId)} ↔ {getNodeTitle(s.targetNodeId)}
                    </div>
                  ))
                }
              </div>
              
              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowAutoLink(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    handleAutoLink()
                    setShowAutoLink(false)
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ff6b6b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  自動リンクを実行
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LinkManager
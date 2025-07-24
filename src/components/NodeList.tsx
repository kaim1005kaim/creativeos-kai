import React, { useState } from 'react'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'
// Note: NodeEditModal and ExportModal removed during cleanup

interface NodeItemProps {
  node: ThoughtNode
  isSelected: boolean
  onClick: (node: ThoughtNode) => void
  onDoubleClick: (node: ThoughtNode) => void
}

function NodeItem({ node, isSelected, onClick, onDoubleClick }: NodeItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Check if this is an X post
  const isXPost = node.type === 'x-post' && node.xPostData

  const styles = {
    nodeItem: {
      padding: '1rem',
      borderBottom: '1px solid #333',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      borderLeft: isSelected ? '3px solid #4f46e5' : '3px solid transparent',
      backgroundColor: isSelected ? '#1a1a2e' : (isHovered ? '#111' : 'transparent'),
    },
    nodeHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '0.5rem',
    },
    ogpImage: {
      width: '40px',
      height: '40px',
      borderRadius: '4px',
      objectFit: 'cover' as const,
      marginRight: '0.75rem',
    },
    nodeMeta: {
      flex: 1,
      fontSize: '0.8rem',
      color: '#888',
    },
    nodeDate: {
      marginBottom: '0.25rem',
    },
    nodeComment: {
      fontSize: '0.9rem',
      marginBottom: '0.5rem',
      fontWeight: 500,
      wordWrap: 'break-word' as const,
      lineHeight: 1.3,
    },
    nodeSummary: {
      fontSize: '0.8rem',
      color: '#ccc',
      marginBottom: '0.5rem',
      lineHeight: 1.4,
    },
    nodeUrl: {
      fontSize: '0.8rem',
    },
    nodeUrlLink: {
      color: '#4f46e5',
      textDecoration: 'none',
    },
    nodeUrlLinkHover: {
      textDecoration: 'underline',
    },
  }

  const [isLinkHovered, setIsLinkHovered] = useState(false)

  return (
    <div 
      style={styles.nodeItem}
      onClick={() => onClick(node)}
      onDoubleClick={() => onDoubleClick(node)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.nodeHeader}>
        {isXPost ? (
          // X post header
          <>
            <img 
              src={node.xPostData!.author.avatarUrl || `https://placehold.co/40x40/1DA1F2/ffffff?text=X`} 
              alt="Avatar"
              style={styles.ogpImage}
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/40x40/1DA1F2/ffffff?text=X`
              }}
            />
            <div style={styles.nodeMeta}>
              <div style={{...styles.nodeDate, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{color: '#1DA1F2', fontWeight: 'bold'}}>𝕏</span>
                <span>{node.xPostData!.author.name}</span>
                <span style={{color: '#888'}}>@{node.xPostData!.author.username}</span>
              </div>
              <div style={{fontSize: '0.75rem', color: '#888'}}>
                {new Date(node.xPostData!.createdAt).toLocaleDateString('ja-JP')} • {node.linkedNodeIds.length} 個の関連
              </div>
            </div>
          </>
        ) : (
          // Regular post header
          <>
            <img 
              src={node.ogpImageUrl || `https://placehold.co/40x40/4f46e5/ffffff?text=${encodeURIComponent((node.url || '').slice(8, 9).toUpperCase() || 'N')}`} 
              alt="OGP"
              style={styles.ogpImage}
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/40x40/4f46e5/ffffff?text=${encodeURIComponent((node.url || '').slice(8, 9).toUpperCase() || 'N')}`
              }}
            />
            <div style={styles.nodeMeta}>
              <div style={styles.nodeDate}>
                {new Date(node.createdAt).toLocaleDateString('ja-JP')}
              </div>
              <div>
                {node.linkedNodeIds.length} 個の関連
              </div>
            </div>
          </>
        )}
      </div>
      
      <div style={styles.nodeComment}>
        {node.title || (isXPost ? node.xPostData!.text : node.comment)}
      </div>
      
      {isXPost && node.comment && (
        <div style={{...styles.nodeSummary, fontStyle: 'italic', borderLeft: '3px solid #1DA1F2', paddingLeft: '8px'}}>
          コメント: {node.comment}
        </div>
      )}
      
      {isXPost && node.xPostData!.images.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {node.xPostData!.images.slice(0, 2).map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Tweet image ${index + 1}`}
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid #333'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ))}
          {node.xPostData!.images.length > 2 && (
            <div style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#333',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#888'
            }}>
              +{node.xPostData!.images.length - 2}
            </div>
          )}
        </div>
      )}
      
      <div style={styles.nodeSummary}>
        {node.summary}
      </div>
      
      <div style={styles.nodeUrl}>
        <a 
          href={node.url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            ...styles.nodeUrlLink,
            ...(isLinkHovered ? styles.nodeUrlLinkHover : {})
          }}
          onMouseEnter={() => setIsLinkHovered(true)}
          onMouseLeave={() => setIsLinkHovered(false)}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            try {
              return node.url ? new URL(node.url).hostname : 'Invalid URL'
            } catch {
              return 'Invalid URL'
            }
          })()}
        </a>
      </div>
    </div>
  )
}

export default function NodeList() {
  const nodes = useNodeStore((state) => state.nodes)
  const filteredNodes = useNodeStore((state) => state.filteredNodes)
  const getDisplayNodes = useNodeStore((state) => state.getDisplayNodes)
  const selectedNode = useNodeStore((state) => state.selectedNode)
  const setSelectedNode = useNodeStore((state) => state.setSelectedNode)
  // Note: editing and export functionality removed during cleanup

  const displayNodes = getDisplayNodes()
  const sortedNodes = [...displayNodes].sort((a, b) => b.createdAt - a.createdAt)

  const isFiltered = filteredNodes !== null
  const title = isFiltered 
    ? `検索結果 (${displayNodes.length}/${nodes.length})` 
    : `ノード一覧 (${nodes.length})`

  const styles = {
    nodeList: {
      marginBottom: '2rem',
    },
    nodeListTitle: {
      padding: '1rem',
      margin: 0,
      fontSize: '1.1rem',
      borderBottom: '1px solid #333',
    },
    nodeListContent: {
      // 高さの制限を取り除いて自然なレイアウトにする
    },
    emptyState: {
      padding: '2rem 1rem',
      textAlign: 'center' as const,
      color: '#888',
      fontSize: '0.9rem',
      lineHeight: 1.6,
    },
  }

  return (
    <div style={styles.nodeList}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 0',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
      </div>
      
      {sortedNodes.map((node) => {
        // Always use the latest node data from the store
        const latestNode = nodes.find(n => n.id === node.id) || node
        return (
          <NodeItem
            key={`${node.id}-${latestNode.title || latestNode.comment}`}
            node={latestNode}
            isSelected={selectedNode?.id === node.id}
            onClick={setSelectedNode}
            onDoubleClick={() => {}} // Editing removed
          />
        )
      })}
      
      {/* Note: editing and export modals removed during cleanup */}
      
      {nodes.length === 0 && (
        <div style={styles.emptyState}>
          まだノードがありません。<br />
          上のフォームからURLとコメントを追加してください。
        </div>
      )}
    </div>
  )
}
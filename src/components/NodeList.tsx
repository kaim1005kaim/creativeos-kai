import React, { useState } from 'react'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'
import NodeEditModal from './NodeEditModal'

interface NodeItemProps {
  node: ThoughtNode
  isSelected: boolean
  onClick: (node: ThoughtNode) => void
  onDoubleClick: (node: ThoughtNode) => void
}

function NodeItem({ node, isSelected, onClick, onDoubleClick }: NodeItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const styles = {
    nodeItem: {
      padding: '1rem',
      borderBottom: '1px solid #333',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      background: isHovered ? '#111' : 'transparent',
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
        <img 
          src={node.ogpImageUrl || `https://placehold.co/40x40/4f46e5/ffffff?text=${encodeURIComponent(node.url.slice(8, 9).toUpperCase())}`} 
          alt="OGP"
          style={styles.ogpImage}
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/40x40/4f46e5/ffffff?text=${encodeURIComponent(node.url.slice(8, 9).toUpperCase())}`
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
      </div>
      
      <div style={styles.nodeComment}>
        {node.comment}
      </div>
      
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
          {new URL(node.url).hostname}
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
  
  const [editingNode, setEditingNode] = useState<ThoughtNode | null>(null)

  const displayNodes = getDisplayNodes()
  const sortedNodes = [...displayNodes].sort((a, b) => b.createdAt - a.createdAt)

  const isFiltered = filteredNodes !== null
  const title = isFiltered 
    ? `検索結果 (${displayNodes.length}/${nodes.length})` 
    : `ノード一覧 (${nodes.length})`

  const styles = {
    nodeList: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    nodeListTitle: {
      padding: '1rem',
      margin: 0,
      fontSize: '1.1rem',
      borderBottom: '1px solid #333',
    },
    nodeListContent: {
      flex: 1,
      overflowY: 'auto' as const,
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
      <h3 style={styles.nodeListTitle}>{title}</h3>
      <div style={styles.nodeListContent}>
        {sortedNodes.map((node) => (
          <NodeItem
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            onClick={setSelectedNode}
            onDoubleClick={setEditingNode}
          />
        ))}
        
        {editingNode && (
          <NodeEditModal
            node={editingNode}
            onClose={() => setEditingNode(null)}
          />
        )}
        {nodes.length === 0 && (
          <div style={styles.emptyState}>
            まだノードがありません。<br />
            上のフォームからURLとコメントを追加してください。
          </div>
        )}
      </div>
    </div>
  )
}
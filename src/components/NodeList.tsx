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
  return (
    <div 
      className={`node-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(node)}
      onDoubleClick={() => onDoubleClick(node)}
    >
      <div className="node-header">
        <img 
          src={node.ogpImageUrl || `https://placehold.co/40x40/4f46e5/ffffff?text=${encodeURIComponent(node.url.slice(8, 9).toUpperCase())}`} 
          alt="OGP"
          className="ogp-image"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/40x40/4f46e5/ffffff?text=${encodeURIComponent(node.url.slice(8, 9).toUpperCase())}`
          }}
        />
        <div className="node-meta">
          <div className="node-date">
            {new Date(node.createdAt).toLocaleDateString('ja-JP')}
          </div>
          <div className="node-connections">
            {node.linkedNodeIds.length} 個の関連
          </div>
        </div>
      </div>
      
      <div className="node-comment">
        {node.comment}
      </div>
      
      <div className="node-summary">
        {node.summary}
      </div>
      
      <div className="node-url">
        <a href={node.url} target="_blank" rel="noopener noreferrer">
          {new URL(node.url).hostname}
        </a>
      </div>
      
      <style jsx>{`
        .node-item {
          padding: 1rem;
          border-bottom: 1px solid #333;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .node-item:hover {
          background: #111;
        }
        
        .node-item.selected {
          background: #1a1a2e;
          border-left: 3px solid #4f46e5;
        }
        
        .node-header {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .ogp-image {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          object-fit: cover;
          margin-right: 0.75rem;
        }
        
        .node-meta {
          flex: 1;
          font-size: 0.8rem;
          color: #888;
        }
        
        .node-date {
          margin-bottom: 0.25rem;
        }
        
        .node-comment {
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .node-summary {
          font-size: 0.8rem;
          color: #ccc;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        
        .node-url {
          font-size: 0.8rem;
        }
        
        .node-url a {
          color: #4f46e5;
          text-decoration: none;
        }
        
        .node-url a:hover {
          text-decoration: underline;
        }
      `}</style>
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

  return (
    <div className="node-list">
      <h3>{title}</h3>
      <div className="node-list-content">
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
          <div className="empty-state">
            まだノードがありません。<br />
            上のフォームからURLとコメントを追加してください。
          </div>
        )}
      </div>
      
      <style jsx>{`
        .node-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .node-list h3 {
          padding: 1rem;
          margin: 0;
          font-size: 1.1rem;
          border-bottom: 1px solid #333;
        }
        
        .node-list-content {
          flex: 1;
          overflow-y: auto;
        }
        
        .empty-state {
          padding: 2rem 1rem;
          text-align: center;
          color: #888;
          font-size: 0.9rem;
          line-height: 1.6;
        }
      `}</style>
    </div>
  )
}
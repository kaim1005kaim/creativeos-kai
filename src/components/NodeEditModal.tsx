import React, { useState, useEffect } from 'react'
import { useNodeStore } from '../store/nodes'
import { useModelStore } from '../store/model'
import { generateSummary } from '../lib/api'
import { ThoughtNode } from '../types/ThoughtNode'

interface NodeEditModalProps {
  node: ThoughtNode
  onClose: () => void
}

export default function NodeEditModal({ node, onClose }: NodeEditModalProps) {
  const [comment, setComment] = useState(node.comment)
  const [url, setUrl] = useState(node.url)
  const [summary, setSummary] = useState(node.summary)
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const { updateNode } = useNodeStore()
  const { selectedModelId } = useModelStore()

  useEffect(() => {
    const changed = comment !== node.comment || url !== node.url || summary !== node.summary
    setHasChanges(changed)
  }, [comment, url, summary, node])

  const handleRegenerateSummary = async () => {
    setIsRegeneratingSummary(true)
    try {
      const newSummary = await generateSummary(url, comment, selectedModelId)
      setSummary(newSummary)
    } catch (error) {
      console.error('Failed to regenerate summary:', error)
    } finally {
      setIsRegeneratingSummary(false)
    }
  }

  const handleSave = async () => {
    if (!hasChanges) {
      onClose()
      return
    }

    const updatedNode: ThoughtNode = {
      ...node,
      comment,
      url,
      summary,
    }

    try {
      await updateNode(updatedNode)
      onClose()
    } catch (error) {
      console.error('Failed to update node:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>ノードの編集</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="edit-url">URL:</label>
            <input
              id="edit-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="edit-comment">コメント:</label>
            <textarea
              id="edit-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="このブックマークについてのコメント..."
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <div className="summary-header">
              <label htmlFor="edit-summary">要約:</label>
              <button
                type="button"
                onClick={handleRegenerateSummary}
                disabled={isRegeneratingSummary}
                className="regenerate-button"
              >
                {isRegeneratingSummary ? '生成中...' : '要約を再生成'}
              </button>
            </div>
            <textarea
              id="edit-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="AIが生成した要約..."
              rows={3}
            />
          </div>
          
          <div className="node-meta">
            <p>作成日: {new Date(node.createdAt).toLocaleString('ja-JP')}</p>
            <p>関連ノード: {node.linkedNodeIds.length}個</p>
            <p>使用モデル: {selectedModelId}</p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="cancel-button">
            キャンセル
          </button>
          <button 
            onClick={handleSave} 
            className={`save-button ${!hasChanges ? 'disabled' : ''}`}
            disabled={!hasChanges}
          >
            保存
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: #1a1a1a;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid #333;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #333;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #fff;
        }
        
        .close-button {
          background: none;
          border: none;
          color: #999;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-button:hover {
          color: #fff;
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #ccc;
          font-size: 0.9rem;
        }
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #555;
          border-radius: 4px;
          background: #222;
          color: #fff;
          font-size: 0.9rem;
          font-family: inherit;
          resize: vertical;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #4f46e5;
        }
        
        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .regenerate-button {
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.25rem 0.75rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .regenerate-button:hover:not(:disabled) {
          background: #3f3ce5;
        }
        
        .regenerate-button:disabled {
          background: #555;
          cursor: not-allowed;
        }
        
        .node-meta {
          padding: 1rem;
          background: #111;
          border-radius: 4px;
          margin-top: 1rem;
        }
        
        .node-meta p {
          margin: 0.25rem 0;
          font-size: 0.8rem;
          color: #888;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1rem;
          border-top: 1px solid #333;
        }
        
        .cancel-button,
        .save-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        
        .cancel-button {
          background: #555;
          color: #fff;
        }
        
        .cancel-button:hover {
          background: #666;
        }
        
        .save-button {
          background: #4f46e5;
          color: white;
        }
        
        .save-button:hover:not(:disabled) {
          background: #3f3ce5;
        }
        
        .save-button.disabled,
        .save-button:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
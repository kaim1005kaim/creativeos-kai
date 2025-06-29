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

  const styles = {
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      background: '#1a1a1a',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      border: '1px solid #333',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      borderBottom: '1px solid #333',
    },
    modalHeaderTitle: {
      margin: 0,
      color: '#fff',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#999',
      fontSize: '1.5rem',
      cursor: 'pointer',
      padding: 0,
      width: '2rem',
      height: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonHover: {
      color: '#fff',
    },
    modalBody: {
      padding: '1.5rem',
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    formLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#ccc',
      fontSize: '0.9rem',
    },
    formInput: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #555',
      borderRadius: '4px',
      background: '#222',
      color: '#fff',
      fontSize: '0.9rem',
      fontFamily: 'inherit',
      resize: 'vertical' as const,
    },
    formInputFocus: {
      outline: 'none',
      borderColor: '#4f46e5',
    },
    summaryHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
    },
    regenerateButton: {
      background: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '0.25rem 0.75rem',
      fontSize: '0.8rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    regenerateButtonHover: {
      background: '#3f3ce5',
    },
    regenerateButtonDisabled: {
      background: '#555',
      cursor: 'not-allowed',
    },
    nodeMeta: {
      padding: '1rem',
      background: '#111',
      borderRadius: '4px',
      marginTop: '1rem',
    },
    nodeMetaText: {
      margin: '0.25rem 0',
      fontSize: '0.8rem',
      color: '#888',
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
      padding: '1rem',
      borderTop: '1px solid #333',
    },
    button: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'all 0.2s',
    },
    cancelButton: {
      background: '#555',
      color: '#fff',
    },
    cancelButtonHover: {
      background: '#666',
    },
    saveButton: {
      background: '#4f46e5',
      color: 'white',
    },
    saveButtonHover: {
      background: '#3f3ce5',
    },
    saveButtonDisabled: {
      background: '#333',
      color: '#666',
      cursor: 'not-allowed',
    },
  }

  const [isCloseHovered, setIsCloseHovered] = useState(false)
  const [isCancelHovered, setIsCancelHovered] = useState(false)
  const [isSaveHovered, setIsSaveHovered] = useState(false)
  const [isRegenerateHovered, setIsRegenerateHovered] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  return (
    <div style={styles.modalOverlay} onClick={onClose} onKeyDown={handleKeyDown}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalHeaderTitle}>ノードの編集</h3>
          <button 
            style={{
              ...styles.closeButton,
              ...(isCloseHovered ? styles.closeButtonHover : {})
            }}
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div style={styles.modalBody}>
          <div style={styles.formGroup}>
            <label htmlFor="edit-url" style={styles.formLabel}>URL:</label>
            <input
              id="edit-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              style={{
                ...styles.formInput,
                ...(focusedInput === 'url' ? styles.formInputFocus : {})
              }}
              onFocus={() => setFocusedInput('url')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="edit-comment" style={styles.formLabel}>コメント:</label>
            <textarea
              id="edit-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="このブックマークについてのコメント..."
              rows={4}
              style={{
                ...styles.formInput,
                ...(focusedInput === 'comment' ? styles.formInputFocus : {})
              }}
              onFocus={() => setFocusedInput('comment')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>
          
          <div style={styles.formGroup}>
            <div style={styles.summaryHeader}>
              <label htmlFor="edit-summary" style={styles.formLabel}>要約:</label>
              <button
                type="button"
                onClick={handleRegenerateSummary}
                disabled={isRegeneratingSummary}
                style={{
                  ...styles.regenerateButton,
                  ...(isRegeneratingSummary ? styles.regenerateButtonDisabled : {}),
                  ...(isRegenerateHovered && !isRegeneratingSummary ? styles.regenerateButtonHover : {})
                }}
                onMouseEnter={() => setIsRegenerateHovered(true)}
                onMouseLeave={() => setIsRegenerateHovered(false)}
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
              style={{
                ...styles.formInput,
                ...(focusedInput === 'summary' ? styles.formInputFocus : {})
              }}
              onFocus={() => setFocusedInput('summary')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>
          
          <div style={styles.nodeMeta}>
            <p style={styles.nodeMetaText}>作成日: {new Date(node.createdAt).toLocaleString('ja-JP')}</p>
            <p style={styles.nodeMetaText}>関連ノード: {node.linkedNodeIds.length}個</p>
            <p style={styles.nodeMetaText}>使用モデル: {selectedModelId}</p>
          </div>
        </div>
        
        <div style={styles.modalFooter}>
          <button 
            onClick={onClose}
            style={{
              ...styles.button,
              ...styles.cancelButton,
              ...(isCancelHovered ? styles.cancelButtonHover : {})
            }}
            onMouseEnter={() => setIsCancelHovered(true)}
            onMouseLeave={() => setIsCancelHovered(false)}
          >
            キャンセル
          </button>
          <button 
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              ...styles.button,
              ...styles.saveButton,
              ...(!hasChanges ? styles.saveButtonDisabled : {}),
              ...(isSaveHovered && hasChanges ? styles.saveButtonHover : {})
            }}
            onMouseEnter={() => setIsSaveHovered(true)}
            onMouseLeave={() => setIsSaveHovered(false)}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
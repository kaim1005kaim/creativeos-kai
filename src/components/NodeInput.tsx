import React, { useState } from 'react'
import { useNodeStore } from '../store/nodes'

export default function NodeInput() {
  const [url, setUrl] = useState('')
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  const addNode = useNodeStore((state) => state.addNode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !comment.trim()) return

    setIsLoading(true)
    try {
      await addNode(url.trim(), comment.trim())
      setUrl('')
      setComment('')
    } catch (error) {
      console.error('Failed to add node:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const styles = {
    nodeInput: {
      padding: '1rem',
      borderBottom: '1px solid #333',
    },
    nodeInputTitle: {
      margin: '0 0 1rem 0',
      fontSize: '1.1rem',
    },
    inputGroup: {
      marginBottom: '1rem',
    },
    inputGroupLabel: {
      display: 'block',
      marginBottom: '0.25rem',
      fontSize: '0.9rem',
      color: '#ccc',
    },
    inputGroupField: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #555',
      borderRadius: '4px',
      background: '#222',
      color: '#fff',
      fontSize: '0.9rem',
      fontFamily: 'inherit',
    },
    inputGroupFieldFocus: {
      outline: 'none',
      borderColor: '#4f46e5',
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      background: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    buttonHover: {
      background: '#3f3ce5',
    },
    buttonDisabled: {
      background: '#555',
      cursor: 'not-allowed',
    },
  }

  return (
    <div style={styles.nodeInput}>
      <h3 style={styles.nodeInputTitle}>新しいノードを追加</h3>
      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label htmlFor="url" style={styles.inputGroupLabel}>URL:</label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            style={{
              ...styles.inputGroupField,
              ...(focusedInput === 'url' ? styles.inputGroupFieldFocus : {})
            }}
            onFocus={() => setFocusedInput('url')}
            onBlur={() => setFocusedInput(null)}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label htmlFor="comment" style={styles.inputGroupLabel}>コメント:</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="このブックマークについてのコメント..."
            rows={3}
            required
            style={{
              ...styles.inputGroupField,
              resize: 'vertical' as const,
              ...(focusedInput === 'comment' ? styles.inputGroupFieldFocus : {})
            }}
            onFocus={() => setFocusedInput('comment')}
            onBlur={() => setFocusedInput(null)}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            ...styles.button,
            ...(isLoading ? styles.buttonDisabled : {}),
            ...(isButtonHovered && !isLoading ? styles.buttonHover : {})
          }}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
        >
          {isLoading ? '処理中...' : 'ノードを追加'}
        </button>
      </form>
    </div>
  )
}
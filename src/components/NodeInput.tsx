import React, { useState } from 'react'
import { useNodeStore } from '../store/nodes'

export default function NodeInput() {
  const [url, setUrl] = useState('')
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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

  return (
    <div className="node-input">
      <h3>新しいノードを追加</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="url">URL:</label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="comment">コメント:</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="このブックマークについてのコメント..."
            rows={3}
            required
          />
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? '処理中...' : 'ノードを追加'}
        </button>
      </form>
      
      <style jsx>{`
        .node-input {
          padding: 1rem;
          border-bottom: 1px solid #333;
        }
        
        .node-input h3 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
        }
        
        .input-group {
          margin-bottom: 1rem;
        }
        
        .input-group label {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
          color: #ccc;
        }
        
        .input-group input,
        .input-group textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #555;
          border-radius: 4px;
          background: #222;
          color: #fff;
          font-size: 0.9rem;
        }
        
        .input-group input:focus,
        .input-group textarea:focus {
          outline: none;
          border-color: #4f46e5;
        }
        
        button {
          width: 100%;
          padding: 0.75rem;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        button:hover:not(:disabled) {
          background: #3f3ce5;
        }
        
        button:disabled {
          background: #555;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
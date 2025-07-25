import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useNodeStore } from '../store/nodes'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const { colors } = useTheme()
  const [url, setUrl] = useState('')
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const addNode = useNodeStore(state => state.addNode)

  // Focus on URL input when modal opens
  useEffect(() => {
    if (isOpen && urlInputRef.current) {
      setTimeout(() => urlInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle paste from clipboard
  useEffect(() => {
    if (isOpen) {
      import('../lib/capacitor').then(({ pasteFromClipboard }) => {
        pasteFromClipboard().then(text => {
          if (text && (text.startsWith('http') || text.includes('.'))) {
            setUrl(text)
          }
        }).catch(() => {
          // Clipboard access failed, ignore
        })
      })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    try {
      await addNode(url.trim(), comment.trim() || 'Quick add from mobile')
      setUrl('')
      setComment('')
      onClose()
    } catch (error) {
      console.error('Failed to add node:', error)
      // TODO: Show error toast
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasteAndAdd = async () => {
    try {
      const { pasteFromClipboard, hapticFeedback } = await import('../lib/capacitor')
      const text = await pasteFromClipboard()
      if (text && (text.startsWith('http') || text.includes('.'))) {
        setUrl(text)
        setComment('Pasted from clipboard')
        await hapticFeedback('light')
        // Auto-submit if it's a URL
        setTimeout(() => {
          handleSubmit({ preventDefault: () => {} } as React.FormEvent)
        }, 100)
      }
    } catch (error) {
      console.error('Clipboard access failed:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10000,
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: colors.surface,
          borderRadius: '16px',
          padding: '24px',
          zIndex: 10001,
          width: '90vw',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: colors.primary
          }}>
            🚀 Quick Add
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.text,
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handlePasteAndAdd}
            style={{
              padding: '8px 12px',
              backgroundColor: colors.primary,
              color: colors.background,
              border: 'none',
              borderRadius: '20px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📋 Paste & Add
          </button>
          <button
            onClick={() => setUrl('https://twitter.com/')}
            style={{
              padding: '8px 12px',
              backgroundColor: colors.surface,
              color: colors.text,
              border: `1px solid ${colors.primary}`,
              borderRadius: '20px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🐦 Twitter
          </button>
          <button
            onClick={() => setUrl('https://github.com/')}
            style={{
              padding: '8px 12px',
              backgroundColor: colors.surface,
              color: colors.text,
              border: `1px solid ${colors.primary}`,
              borderRadius: '20px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🐙 GitHub
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500'
            }}>
              URL
            </label>
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com or paste URL"
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${colors.primary}`,
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: colors.background,
                color: colors.text,
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Your thoughts about this content..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.text}40`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: colors.background,
                color: colors.text,
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: isLoading ? colors.text + '40' : colors.primary,
              color: colors.background,
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Processing...
              </>
            ) : (
              <>
                ✨ Add Node
              </>
            )}
          </button>
        </form>

        {/* Tips */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: colors.background,
          borderRadius: '8px',
          fontSize: '12px',
          opacity: 0.8
        }}>
          💡 <strong>Tips:</strong> Paste URLs from Twitter, YouTube, GitHub, or any website. 
          AI will automatically extract content and generate summaries.
        </div>
      </div>
    </>
  )
}
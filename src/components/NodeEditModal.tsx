import React, { useState, useEffect } from 'react'
import { useNodeStore } from '../store/nodes'
import { useTheme } from '../contexts/ThemeContext'
import { ThoughtNode } from '../types/ThoughtNode'

interface NodeEditModalProps {
  node: ThoughtNode | null
  isOpen: boolean
  onClose: () => void
}

export default function NodeEditModal({ node, isOpen, onClose }: NodeEditModalProps) {
  const { updateNode, deleteNode } = useNodeStore()
  const { colors } = useTheme()
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (node) {
      setComment(node.comment || '')
      setTags(node.tags?.join(', ') || '')
    }
  }, [node])

  if (!isOpen || !node) return null

  const handleSave = () => {
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    const updatedNode = {
      ...node,
      comment,
      tags: tagArray
    }

    updateNode(updatedNode)
    onClose()
  }

  const handleDelete = () => {
    if (confirm('このノードを削除しますか？この操作は取り消せません。')) {
      deleteNode(node.id)
      onClose()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          color: colors.text,
          padding: '24px',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          border: `1px solid ${colors.primary}20`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ 
            margin: '0 0 16px 0',
            color: colors.primary,
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            ノード編集
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              タイトル
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: colors.background,
              borderRadius: '6px',
              fontSize: '14px',
              color: colors.text,
              border: `1px solid ${colors.primary}20`
            }}>
              {node.title}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              URL
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: colors.background,
              borderRadius: '6px',
              fontSize: '12px',
              color: colors.text,
              border: `1px solid ${colors.primary}20`,
              wordBreak: 'break-all'
            }}>
              {node.url}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="comment" style={{ 
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              コメント
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: colors.background,
                color: colors.text,
                border: `1px solid ${colors.primary}40`,
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="このノードについてのコメント..."
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="tags" style={{ 
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              タグ
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: colors.background,
                color: colors.text,
                border: `1px solid ${colors.primary}40`,
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
              placeholder="タグをカンマ区切りで入力 (例: JavaScript, React, フロントエンド)"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              AI要約
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: colors.background,
              borderRadius: '6px',
              fontSize: '13px',
              color: colors.text,
              border: `1px solid ${colors.primary}20`,
              lineHeight: '1.5',
              maxHeight: '120px',
              overflow: 'auto'
            }}>
              {node.summary || 'AI要約が生成されていません'}
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: `1px solid ${colors.primary}20`,
          paddingTop: '20px'
        }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
          >
            削除
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: colors.text,
              border: `1px solid ${colors.text}`,
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 16px',
              backgroundColor: colors.primary,
              color: colors.background,
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
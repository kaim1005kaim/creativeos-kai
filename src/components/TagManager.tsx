import React, { useState, useEffect, useRef } from 'react'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'

interface TagManagerProps {
  node?: ThoughtNode
  onTagsUpdate?: (nodeId: string, tags: string[]) => void
  onTagFilter?: (selectedTags: string[]) => void
  mode?: 'edit' | 'filter'
}

export default function TagManager({ 
  node, 
  onTagsUpdate, 
  onTagFilter, 
  mode = 'edit' 
}: TagManagerProps) {
  const { nodes, updateNode } = useNodeStore()
  const [newTag, setNewTag] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(node?.tags || [])
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get all existing tags from all nodes
  const allTags = Array.from(new Set(
    nodes.flatMap(n => n.tags || [])
  )).sort()

  // Get tag suggestions based on input
  const tagSuggestions = allTags.filter(tag => 
    tag.toLowerCase().includes(newTag.toLowerCase()) && 
    !selectedTags.includes(tag)
  )

  // Update selected tags when node changes
  useEffect(() => {
    if (node) {
      setSelectedTags(node.tags || [])
    }
  }, [node])

  // Handle adding a new tag
  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim()
    if (!trimmedTag || selectedTags.includes(trimmedTag)) return

    const updatedTags = [...selectedTags, trimmedTag]
    setSelectedTags(updatedTags)
    setNewTag('')
    setShowSuggestions(false)

    if (mode === 'edit' && node && onTagsUpdate) {
      onTagsUpdate(node.id, updatedTags)
      updateNode({ ...node, tags: updatedTags })
    }
  }

  // Handle removing a tag
  const removeTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove)
    setSelectedTags(updatedTags)

    if (mode === 'edit' && node && onTagsUpdate) {
      onTagsUpdate(node.id, updatedTags)
      updateNode({ ...node, tags: updatedTags })
    }
  }

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (tagSuggestions.length > 0) {
        addTag(tagSuggestions[0])
      } else {
        addTag(newTag)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setNewTag('')
    }
  }

  // Handle filter mode
  const handleFilterToggle = (tag: string) => {
    if (mode !== 'filter') return

    const updatedFilterTags = filterTags.includes(tag)
      ? filterTags.filter(t => t !== tag)
      : [...filterTags, tag]
    
    setFilterTags(updatedFilterTags)
    if (onTagFilter) {
      onTagFilter(updatedFilterTags)
    }
  }

  // Clear all filter tags
  const clearFilter = () => {
    setFilterTags([])
    if (onTagFilter) {
      onTagFilter([])
    }
  }

  // Get tag color based on frequency
  const getTagColor = (tag: string) => {
    const frequency = nodes.filter(n => n.tags?.includes(tag)).length
    const maxFreq = Math.max(...allTags.map(t => 
      nodes.filter(n => n.tags?.includes(t)).length
    ))
    
    const intensity = frequency / maxFreq
    if (intensity > 0.7) return '#ff6b6b'
    if (intensity > 0.4) return '#4ecdc4'
    return '#96ceb4'
  }

  // Get tag frequency count
  const getTagCount = (tag: string) => {
    return nodes.filter(n => n.tags?.includes(tag)).length
  }

  if (mode === 'filter') {
    return (
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        border: '1px solid #333'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🏷️ タグフィルタ
            {filterTags.length > 0 && (
              <span style={{
                backgroundColor: '#4ecdc4',
                color: '#000',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 'bold'
              }}>
                {filterTags.length}個選択
              </span>
            )}
          </h3>
          
          {filterTags.length > 0 && (
            <button
              onClick={clearFilter}
              style={{
                padding: '4px 8px',
                backgroundColor: '#ff6b6b',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              クリア
            </button>
          )}
        </div>

        {/* All available tags */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleFilterToggle(tag)}
              style={{
                padding: '4px 8px',
                backgroundColor: filterTags.includes(tag) ? getTagColor(tag) : '#333',
                color: filterTags.includes(tag) ? '#000' : '#ccc',
                border: 'none',
                borderRadius: '12px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {tag}
              <span style={{
                fontSize: '9px',
                opacity: 0.7
              }}>
                {getTagCount(tag)}
              </span>
            </button>
          ))}
        </div>

        {allTags.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '12px',
            padding: '20px'
          }}>
            まだタグが作成されていません
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '15px',
      border: '1px solid #333'
    }}>
      <h4 style={{
        margin: '0 0 12px 0',
        fontSize: '14px',
        color: '#fff'
      }}>
        🏷️ タグ
      </h4>

      {/* Current tags */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '12px'
      }}>
        {selectedTags.map(tag => (
          <span
            key={tag}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              backgroundColor: getTagColor(tag),
              color: '#000',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              style={{
                background: 'none',
                border: 'none',
                color: '#000',
                cursor: 'pointer',
                padding: '0',
                fontSize: '12px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add new tag */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={newTag}
          onChange={(e) => {
            setNewTag(e.target.value)
            setShowSuggestions(e.target.value.length > 0)
          }}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(newTag.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="新しいタグを追加..."
          style={{
            width: '100%',
            padding: '6px 8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px'
          }}
        />

        {/* Tag suggestions */}
        {showSuggestions && tagSuggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            zIndex: 100,
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            {tagSuggestions.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ccc',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span>{tag}</span>
                <span style={{
                  fontSize: '10px',
                  color: '#666'
                }}>
                  {getTagCount(tag)}個のノード
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick add buttons for popular tags */}
      {allTags.length > 0 && (
        <div style={{
          marginTop: '8px',
          fontSize: '10px',
          color: '#666'
        }}>
          人気のタグ:{' '}
          {allTags
            .sort((a, b) => getTagCount(b) - getTagCount(a))
            .slice(0, 3)
            .map(tag => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4ecdc4',
                  cursor: 'pointer',
                  fontSize: '10px',
                  textDecoration: 'underline',
                  margin: '0 4px'
                }}
              >
                {tag}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
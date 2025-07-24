import React, { useState, useEffect } from 'react'
import { useNodeStore } from '../store/nodes'
import { searchNodes, getSearchSuggestions } from '../lib/searchNodes'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const { nodes, setFilteredNodes, clearFilter } = useNodeStore()

  useEffect(() => {
    if (query.trim()) {
      const filtered = searchNodes(nodes, query)
      setFilteredNodes(filtered.map(node => node.id))
      
      const newSuggestions = getSearchSuggestions(nodes, query)
      setSuggestions(newSuggestions)
    } else {
      clearFilter()
      setSuggestions([])
    }
  }, [query, nodes])

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setQuery('')
    clearFilter()
    setShowSuggestions(false)
  }

  return (
    <div style={{ padding: '1rem 0', borderBottom: '1px solid #333', position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="ノードを検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          style={{
            width: '100%',
            padding: '0.5rem',
            paddingRight: '2rem',
            border: '1px solid #555',
            borderRadius: '4px',
            background: '#222',
            color: '#fff',
            fontSize: '0.9rem'
          }}
        />
        
        {query && (
          <button 
            onClick={clearSearch}
            style={{
              position: 'absolute',
              right: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#999',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: 0,
              width: '1.5rem',
              height: '1.5rem'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          background: '#333',
          border: '1px solid #555',
          borderRadius: '4px',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: '0.5rem',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #444' : 'none',
                fontSize: '0.8rem',
                color: '#ccc'
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
import React, { useState, useEffect, useRef } from 'react'
import { useNodeStore } from '../store/nodes'
import { ThoughtNode } from '../types/ThoughtNode'

interface SearchResult {
  node: ThoughtNode
  matches: {
    field: 'title' | 'comment' | 'summary' | 'url'
    text: string
    highlights: Array<{ start: number; end: number }>
  }[]
  score: number
}

interface AdvancedSearchProps {
  onSearchResults: (nodeIds: string[]) => void
}

export default function AdvancedSearch({ onSearchResults }: AdvancedSearchProps) {
  const nodes = useNodeStore((state) => state.nodes)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'text' | 'regex' | 'fuzzy'>('text')
  const [searchFields, setSearchFields] = useState({
    title: true,
    comment: true,
    summary: true,
    url: false
  })
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('creativeOS_searchHistory')
    if (saved) {
      setSearchHistory(JSON.parse(saved))
    }
  }, [])

  // Save search history to localStorage
  const saveSearchHistory = (history: string[]) => {
    localStorage.setItem('creativeOS_searchHistory', JSON.stringify(history))
    setSearchHistory(history)
  }

  // Fuzzy search implementation
  const fuzzyMatch = (text: string, query: string): { score: number; highlights: Array<{ start: number; end: number }> } => {
    if (!query) return { score: 0, highlights: [] }
    
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()
    
    if (textLower.includes(queryLower)) {
      const start = textLower.indexOf(queryLower)
      return {
        score: queryLower.length / textLower.length,
        highlights: [{ start, end: start + queryLower.length }]
      }
    }
    
    // Simple fuzzy matching
    let score = 0
    let lastIndex = -1
    const highlights: Array<{ start: number; end: number }> = []
    
    for (const char of queryLower) {
      const index = textLower.indexOf(char, lastIndex + 1)
      if (index === -1) return { score: 0, highlights: [] }
      
      score += 1 / (index - lastIndex)
      lastIndex = index
      highlights.push({ start: index, end: index + 1 })
    }
    
    return { score: score / textLower.length, highlights }
  }

  // Regular expression search
  const regexMatch = (text: string, query: string): { score: number; highlights: Array<{ start: number; end: number }> } => {
    try {
      const regex = new RegExp(query, 'gi')
      const matches = Array.from(text.matchAll(regex))
      
      if (matches.length === 0) return { score: 0, highlights: [] }
      
      const highlights = matches.map(match => ({
        start: match.index!,
        end: match.index! + match[0].length
      }))
      
      return {
        score: matches.reduce((sum, match) => sum + match[0].length, 0) / text.length,
        highlights
      }
    } catch {
      return { score: 0, highlights: [] }
    }
  }

  // Text search
  const textMatch = (text: string, query: string): { score: number; highlights: Array<{ start: number; end: number }> } => {
    if (!query) return { score: 0, highlights: [] }
    
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()
    const highlights: Array<{ start: number; end: number }> = []
    
    let index = textLower.indexOf(queryLower)
    let totalLength = 0
    
    while (index !== -1) {
      highlights.push({ start: index, end: index + queryLower.length })
      totalLength += queryLower.length
      index = textLower.indexOf(queryLower, index + 1)
    }
    
    return {
      score: highlights.length > 0 ? totalLength / textLower.length : 0,
      highlights
    }
  }

  // Perform search
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      onSearchResults([])
      return
    }

    const results: SearchResult[] = []

    for (const node of nodes) {
      const nodeMatches: SearchResult['matches'] = []
      let totalScore = 0

      // Search in selected fields
      const fieldsToSearch: Array<{ field: keyof typeof searchFields; value: string }> = [
        { field: 'title', value: node.title || '' },
        { field: 'comment', value: node.comment },
        { field: 'summary', value: node.summary || '' },
        { field: 'url', value: node.url }
      ]

      for (const { field, value } of fieldsToSearch) {
        if (!searchFields[field] || !value) continue

        let matchResult: { score: number; highlights: Array<{ start: number; end: number }> }

        switch (searchMode) {
          case 'regex':
            matchResult = regexMatch(value, query)
            break
          case 'fuzzy':
            matchResult = fuzzyMatch(value, query)
            break
          default:
            matchResult = textMatch(value, query)
        }

        if (matchResult.score > 0) {
          nodeMatches.push({
            field,
            text: value,
            highlights: matchResult.highlights
          })
          totalScore += matchResult.score
        }
      }

      if (nodeMatches.length > 0) {
        results.push({
          node,
          matches: nodeMatches,
          score: totalScore / nodeMatches.length
        })
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score)
    
    setSearchResults(results)
    setShowResults(true)
    onSearchResults(results.map(r => r.node.id))

    // Add to search history
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory.slice(0, 9)] // Keep last 10
      saveSearchHistory(newHistory)
    }
  }

  // Handle search
  const handleSearch = () => {
    performSearch(searchQuery)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
    onSearchResults([])
  }

  return (
    <div style={{ 
      backgroundColor: '#1a1a1a', 
      borderRadius: '8px', 
      padding: '15px', 
      marginBottom: '15px',
      border: '1px solid #333'
    }}>
      {/* Header */}
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
          🔎 高度な検索
          {searchResults.length > 0 && (
            <span style={{
              backgroundColor: '#4ecdc4',
              color: '#000',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              {searchResults.length}件
            </span>
          )}
        </h3>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '4px 8px',
            backgroundColor: '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Search Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="検索クエリを入力..."
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '14px'
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4ecdc4',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          検索
        </button>
        {searchQuery && (
          <button
            onClick={clearSearch}
            style={{
              padding: '8px 12px',
              backgroundColor: '#ff6b6b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Advanced Options */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Search Mode */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#aaa', 
              marginBottom: '8px' 
            }}>
              検索モード
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'text', label: 'テキスト' },
                { value: 'regex', label: '正規表現' },
                { value: 'fuzzy', label: 'あいまい' }
              ].map(mode => (
                <button
                  key={mode.value}
                  onClick={() => setSearchMode(mode.value as any)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: searchMode === mode.value ? '#4ecdc4' : '#444',
                    color: searchMode === mode.value ? '#000' : '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Fields */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#aaa', 
              marginBottom: '8px' 
            }}>
              検索対象
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {Object.entries(searchFields).map(([field, enabled]) => (
                <label key={field} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  fontSize: '12px',
                  color: '#ccc',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setSearchFields(prev => ({
                      ...prev,
                      [field]: e.target.checked
                    }))}
                    style={{ cursor: 'pointer' }}
                  />
                  {field === 'title' ? 'タイトル' : 
                   field === 'comment' ? 'コメント' :
                   field === 'summary' ? '要約' : 'URL'}
                </label>
              ))}
            </div>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                color: '#aaa', 
                marginBottom: '8px' 
              }}>
                検索履歴
              </label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {searchHistory.slice(0, 5).map((query, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(query)
                      performSearch(query)
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#333',
                      color: '#ccc',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {query.length > 20 ? query.slice(0, 20) + '...' : query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Results Preview */}
      {showResults && searchResults.length > 0 && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#2a2a2a',
          borderRadius: '6px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#aaa',
            marginBottom: '8px'
          }}>
            検索結果: {searchResults.length}件
          </div>
          {searchResults.slice(0, 5).map((result, index) => (
            <div
              key={result.node.id}
              style={{
                padding: '8px',
                backgroundColor: '#1a1a1a',
                borderRadius: '4px',
                marginBottom: '6px',
                border: '1px solid #333'
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#4ecdc4',
                marginBottom: '4px'
              }}>
                {result.node.title || result.node.comment.substring(0, 30)}...
              </div>
              <div style={{
                fontSize: '10px',
                color: '#999'
              }}>
                マッチ: {result.matches.map(m => m.field).join(', ')} | 
                スコア: {(result.score * 100).toFixed(1)}%
              </div>
            </div>
          ))}
          {searchResults.length > 5 && (
            <div style={{
              fontSize: '10px',
              color: '#666',
              textAlign: 'center',
              padding: '4px'
            }}>
              他 {searchResults.length - 5}件...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
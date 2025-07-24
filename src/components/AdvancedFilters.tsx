import React, { useState, useEffect } from 'react'
import { useNodeStore } from '../store/nodes'

interface AdvancedFiltersProps {
  onFiltersChange: (filteredIds: string[]) => void
}

interface FilterState {
  dateRange: {
    start: string
    end: string
  }
  domain: string
  tags: string[]
  searchText: string
}

export default function AdvancedFilters({ onFiltersChange }: AdvancedFiltersProps) {
  const nodes = useNodeStore((state) => state.nodes)
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: '', end: '' },
    domain: '',
    tags: [],
    searchText: ''
  })
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract unique domains from nodes
  const domains = Array.from(new Set(
    nodes.map(node => {
      try {
        return new URL(node.url).hostname.replace('www.', '')
      } catch {
        return 'invalid-url'
      }
    })
  )).filter(domain => domain !== 'invalid-url').sort()

  // Extract unique tags from nodes (when tag feature is implemented)
  const availableTags: string[] = []

  // Apply filters when filter state changes
  useEffect(() => {
    let filteredNodes = nodes

    // Date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start).getTime()
      filteredNodes = filteredNodes.filter(node => node.createdAt >= startDate)
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end).getTime() + 24 * 60 * 60 * 1000 // End of day
      filteredNodes = filteredNodes.filter(node => node.createdAt <= endDate)
    }

    // Domain filter
    if (filters.domain) {
      filteredNodes = filteredNodes.filter(node => {
        try {
          const hostname = new URL(node.url).hostname.replace('www.', '')
          return hostname === filters.domain
        } catch {
          return false
        }
      })
    }

    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filteredNodes = filteredNodes.filter(node => 
        (node.title || '').toLowerCase().includes(searchLower) ||
        node.comment.toLowerCase().includes(searchLower) ||
        (node.summary || '').toLowerCase().includes(searchLower)
      )
    }

    // Tag filter (placeholder for when tag feature is implemented)
    if (filters.tags.length > 0) {
      // filteredNodes = filteredNodes.filter(node => 
      //   filters.tags.some(tag => node.tags?.includes(tag))
      // )
    }

    onFiltersChange(filteredNodes.map(node => node.id))
  }, [filters, nodes])

  const clearFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      domain: '',
      tags: [],
      searchText: ''
    })
    // Also call the callback to clear the filter
    onFiltersChange([])
  }

  const hasActiveFilters = 
    filters.dateRange.start || 
    filters.dateRange.end || 
    filters.domain || 
    filters.searchText ||
    filters.tags.length > 0

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
        marginBottom: isExpanded ? '15px' : '0'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔍 高度なフィルタ
          {hasActiveFilters && (
            <span style={{
              backgroundColor: '#4ecdc4',
              color: '#000',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              アクティブ
            </span>
          )}
        </h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
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
      </div>

      {/* Filter Controls */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search Text */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#aaa', 
              marginBottom: '4px' 
            }}>
              テキスト検索
            </label>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                searchText: e.target.value 
              }))}
              placeholder="タイトル、コメント、要約を検索..."
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
          </div>

          {/* Date Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                color: '#aaa', 
                marginBottom: '4px' 
              }}>
                開始日
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
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
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                color: '#aaa', 
                marginBottom: '4px' 
              }}>
                終了日
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
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
            </div>
          </div>

          {/* Domain Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              color: '#aaa', 
              marginBottom: '4px' 
            }}>
              ドメイン
            </label>
            <select
              value={filters.domain}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                domain: e.target.value 
              }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '12px'
              }}
            >
              <option value="">すべてのドメイン</option>
              {domains.map(domain => (
                <option key={domain} value={domain}>
                  {domain} ({nodes.filter(n => {
                    try {
                      return new URL(n.url).hostname.replace('www.', '') === domain
                    } catch { return false }
                  }).length})
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div style={{
            padding: '8px',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#aaa'
          }}>
            フィルタ結果: {nodes.filter(node => {
              // Apply same filtering logic for count
              let include = true
              
              if (filters.dateRange.start) {
                const startDate = new Date(filters.dateRange.start).getTime()
                include = include && node.createdAt >= startDate
              }
              if (filters.dateRange.end) {
                const endDate = new Date(filters.dateRange.end).getTime() + 24 * 60 * 60 * 1000
                include = include && node.createdAt <= endDate
              }
              if (filters.domain) {
                try {
                  const hostname = new URL(node.url).hostname.replace('www.', '')
                  include = include && hostname === filters.domain
                } catch {
                  include = false
                }
              }
              if (filters.searchText) {
                const searchLower = filters.searchText.toLowerCase()
                include = include && (
                  (node.title || '').toLowerCase().includes(searchLower) ||
                  node.comment.toLowerCase().includes(searchLower) ||
                  (node.summary || '').toLowerCase().includes(searchLower)
                )
              }
              
              return include
            }).length} / {nodes.length} ノード
          </div>
        </div>
      )}
    </div>
  )
}
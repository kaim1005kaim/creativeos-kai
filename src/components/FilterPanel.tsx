import React, { useState } from 'react'
import { useNodeStore } from '../store/nodes'
import { AVAILABLE_MODELS } from '../lib/models'

type FilterType = 'all' | 'model' | 'date' | 'connections'

interface FilterState {
  type: FilterType
  modelId?: string
  dateRange?: 'today' | 'week' | 'month' | 'year'
  minConnections?: number
}

export default function FilterPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterState>({ type: 'all' })
  
  const { nodes, setFilteredNodes, clearFilter } = useNodeStore()

  const applyFilters = (filters: FilterState) => {
    if (filters.type === 'all') {
      clearFilter()
      return
    }

    let filtered = [...nodes]

    // モデル別フィルター
    if (filters.type === 'model' && filters.modelId) {
      filtered = filtered.filter(node => {
        const isDeepSeek = node.summary.includes('DeepSeek') || node.summary.length > 100
        const isHunyuan = !isDeepSeek
        
        if (filters.modelId === 'deepseek') return isDeepSeek
        if (filters.modelId === 'hunyuan') return isHunyuan
        return true
      })
    }

    // 日時別フィルター
    if (filters.type === 'date' && filters.dateRange) {
      const now = Date.now()
      const ranges = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
      }
      
      const threshold = now - ranges[filters.dateRange]
      filtered = filtered.filter(node => node.createdAt >= threshold)
    }

    // 関連度別フィルター
    if (filters.type === 'connections' && filters.minConnections !== undefined) {
      filtered = filtered.filter(node => node.linkedNodeIds.length >= (filters.minConnections || 0))
    }

    setFilteredNodes(filtered.map(node => node.id))
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setActiveFilters(newFilters)
    applyFilters(newFilters)
  }

  const clearAllFilters = () => {
    const resetFilters = { type: 'all' as FilterType }
    setActiveFilters(resetFilters)
    applyFilters(resetFilters)
  }

  const getFilterSummary = () => {
    if (activeFilters.type === 'all') return '全て表示'
    return 'フィルター中'
  }

  return (
    <div style={{ borderBottom: '1px solid #333', background: '#1a1a1a' }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span style={{ fontWeight: 500, color: '#fff' }}>フィルター</span>
        <span style={{ flex: 1, fontSize: '0.8rem', color: '#888' }}>{getFilterSummary()}</span>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>{isExpanded ? '▲' : '▼'}</span>
      </div>
      
      {isExpanded && (
        <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid #333' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc', cursor: 'pointer' }}>
              <input
                type="radio"
                name="filterType"
                checked={activeFilters.type === 'all'}
                onChange={() => handleFilterChange({ type: 'all' })}
                style={{ margin: 0 }}
              />
              全て表示
            </label>
          </div>
          
          <button 
            onClick={clearAllFilters}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#555',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            フィルターをクリア
          </button>
        </div>
      )}
    </div>
  )
}
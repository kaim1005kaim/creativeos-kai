import React, { useState } from 'react'
import { useNodeStore } from '../store/nodes'
import { AVAILABLE_MODELS } from '../lib/models'
// import { ThoughtNode } from '../types/ThoughtNode'

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
      // 現在はモデル情報が保存されていないため、コメントに含まれる情報で判定
      // 今後、ノードにモデル情報を保存する必要がある
      filtered = filtered.filter(node => {
        // 仮実装: summary の特徴でモデルを判定
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

    setFilteredNodes(filtered)
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
    
    const parts = []
    if (activeFilters.type === 'model' && activeFilters.modelId) {
      const model = AVAILABLE_MODELS.find(m => m.id === activeFilters.modelId)
      parts.push(`モデル: ${model?.name}`)
    }
    if (activeFilters.type === 'date' && activeFilters.dateRange) {
      const labels = {
        today: '今日',
        week: '1週間',
        month: '1ヶ月',
        year: '1年'
      }
      parts.push(`期間: ${labels[activeFilters.dateRange]}`)
    }
    if (activeFilters.type === 'connections' && activeFilters.minConnections !== undefined) {
      parts.push(`関連: ${activeFilters.minConnections}個以上`)
    }
    
    return parts.join(', ') || 'フィルター中'
  }

  return (
    <div className="filter-panel">
      <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="filter-title">フィルター</span>
        <span className="filter-summary">{getFilterSummary()}</span>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>
      
      {isExpanded && (
        <div className="filter-content">
          {/* モデル別フィルター */}
          <div className="filter-section">
            <label>
              <input
                type="radio"
                name="filterType"
                checked={activeFilters.type === 'model'}
                onChange={() => handleFilterChange({ type: 'model', modelId: 'deepseek' })}
              />
              モデル別
            </label>
            {activeFilters.type === 'model' && (
              <div className="filter-options">
                <select
                  value={activeFilters.modelId || ''}
                  onChange={(e) => handleFilterChange({ type: 'model', modelId: e.target.value })}
                >
                  {AVAILABLE_MODELS.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 日時別フィルター */}
          <div className="filter-section">
            <label>
              <input
                type="radio"
                name="filterType"
                checked={activeFilters.type === 'date'}
                onChange={() => handleFilterChange({ type: 'date', dateRange: 'week' })}
              />
              作成日時
            </label>
            {activeFilters.type === 'date' && (
              <div className="filter-options">
                <select
                  value={activeFilters.dateRange || ''}
                  onChange={(e) => handleFilterChange({ 
                    type: 'date', 
                    dateRange: e.target.value as 'today' | 'week' | 'month' | 'year'
                  })}
                >
                  <option value="today">今日</option>
                  <option value="week">1週間以内</option>
                  <option value="month">1ヶ月以内</option>
                  <option value="year">1年以内</option>
                </select>
              </div>
            )}
          </div>

          {/* 関連度別フィルター */}
          <div className="filter-section">
            <label>
              <input
                type="radio"
                name="filterType"
                checked={activeFilters.type === 'connections'}
                onChange={() => handleFilterChange({ type: 'connections', minConnections: 1 })}
              />
              関連ノード数
            </label>
            {activeFilters.type === 'connections' && (
              <div className="filter-options">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={activeFilters.minConnections || 0}
                  onChange={(e) => handleFilterChange({ 
                    type: 'connections', 
                    minConnections: parseInt(e.target.value)
                  })}
                />
                <span>{activeFilters.minConnections || 0}個以上</span>
              </div>
            )}
          </div>

          {/* 全て表示 */}
          <div className="filter-section">
            <label>
              <input
                type="radio"
                name="filterType"
                checked={activeFilters.type === 'all'}
                onChange={() => handleFilterChange({ type: 'all' })}
              />
              全て表示
            </label>
          </div>

          <button onClick={clearAllFilters} className="clear-filters-button">
            フィルターをクリア
          </button>
        </div>
      )}
      
      <style jsx>{`
        .filter-panel {
          border-bottom: 1px solid #333;
          background: #1a1a1a;
        }
        
        .filter-header {
          padding: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.2s;
        }
        
        .filter-header:hover {
          background: #222;
        }
        
        .filter-title {
          font-weight: 500;
          color: #fff;
        }
        
        .filter-summary {
          flex: 1;
          font-size: 0.8rem;
          color: #888;
        }
        
        .expand-icon {
          font-size: 0.8rem;
          color: #666;
          transition: transform 0.2s;
        }
        
        .expand-icon.expanded {
          transform: rotate(180deg);
        }
        
        .filter-content {
          padding: 0 1rem 1rem 1rem;
          border-top: 1px solid #333;
        }
        
        .filter-section {
          margin-bottom: 1rem;
        }
        
        .filter-section label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #ccc;
          cursor: pointer;
        }
        
        .filter-section input[type="radio"] {
          margin: 0;
        }
        
        .filter-options {
          margin-top: 0.5rem;
          margin-left: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .filter-options select,
        .filter-options input[type="range"] {
          background: #222;
          color: #fff;
          border: 1px solid #555;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
        }
        
        .filter-options span {
          font-size: 0.8rem;
          color: #888;
        }
        
        .clear-filters-button {
          width: 100%;
          padding: 0.5rem;
          background: #555;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background-color 0.2s;
        }
        
        .clear-filters-button:hover {
          background: #666;
        }
      `}</style>
    </div>
  )
}
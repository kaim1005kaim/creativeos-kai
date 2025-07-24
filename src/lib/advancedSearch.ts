import { ThoughtNode } from '../types/ThoughtNode'

export interface SearchFilters {
  query?: string
  categories?: string[]
  tags?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  domains?: string[]
  nodeTypes?: ('default' | 'x-post')[]
  connectionCount?: {
    min?: number
    max?: number
  }
  sortBy?: 'createdAt' | 'title' | 'connectionCount' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  nodes: ThoughtNode[]
  totalCount: number
  filteredCount: number
  searchTime: number
}

export function performAdvancedSearch(
  nodes: ThoughtNode[], 
  filters: SearchFilters
): SearchResult {
  const startTime = performance.now()
  
  let filteredNodes = [...nodes]
  
  // テキスト検索（クエリ）
  if (filters.query && filters.query.trim()) {
    const query = filters.query.toLowerCase().trim()
    filteredNodes = filteredNodes.filter(node => {
      const searchText = [
        node.title,
        node.comment,
        node.summary,
        ...(node.tags || []),
        node.category,
        node.xPostData?.text,
        node.xPostData?.author.name,
        node.xPostData?.author.username
      ].filter(Boolean).join(' ').toLowerCase()
      
      return searchText.includes(query)
    })
  }
  
  // カテゴリフィルタ
  if (filters.categories && filters.categories.length > 0) {
    filteredNodes = filteredNodes.filter(node => 
      filters.categories!.includes(node.category || 'その他')
    )
  }
  
  // タグフィルタ
  if (filters.tags && filters.tags.length > 0) {
    filteredNodes = filteredNodes.filter(node => 
      node.tags && filters.tags!.some(tag => node.tags!.includes(tag))
    )
  }
  
  // 日付範囲フィルタ
  if (filters.dateRange) {
    const { start, end } = filters.dateRange
    filteredNodes = filteredNodes.filter(node => {
      const nodeDate = new Date(node.createdAt)
      if (start && nodeDate < start) return false
      if (end && nodeDate > end) return false
      return true
    })
  }
  
  // ドメインフィルタ
  if (filters.domains && filters.domains.length > 0) {
    filteredNodes = filteredNodes.filter(node => {
      try {
        const domain = new URL(node.url).hostname.replace('www.', '')
        return filters.domains!.includes(domain)
      } catch {
        return filters.domains!.includes('その他')
      }
    })
  }
  
  // ノードタイプフィルタ
  if (filters.nodeTypes && filters.nodeTypes.length > 0) {
    filteredNodes = filteredNodes.filter(node => 
      filters.nodeTypes!.includes(node.type || 'default')
    )
  }
  
  // 接続数フィルタ
  if (filters.connectionCount) {
    const { min, max } = filters.connectionCount
    filteredNodes = filteredNodes.filter(node => {
      const count = node.linkedNodeIds.length
      if (min !== undefined && count < min) return false
      if (max !== undefined && count > max) return false
      return true
    })
  }
  
  // ソート
  if (filters.sortBy) {
    filteredNodes.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (filters.sortBy) {
        case 'createdAt':
          aValue = a.createdAt
          bValue = b.createdAt
          break
        case 'title':
          aValue = (a.title || a.comment).toLowerCase()
          bValue = (b.title || b.comment).toLowerCase()
          break
        case 'connectionCount':
          aValue = a.linkedNodeIds.length
          bValue = b.linkedNodeIds.length
          break
        case 'relevance':
          // Simple relevance scoring based on query match
          if (filters.query) {
            const query = filters.query.toLowerCase()
            aValue = calculateRelevanceScore(a, query)
            bValue = calculateRelevanceScore(b, query)
          } else {
            aValue = a.createdAt
            bValue = b.createdAt
          }
          break
        default:
          aValue = a.createdAt
          bValue = b.createdAt
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return filters.sortOrder === 'desc' ? -comparison : comparison
    })
  }
  
  const endTime = performance.now()
  
  return {
    nodes: filteredNodes,
    totalCount: nodes.length,
    filteredCount: filteredNodes.length,
    searchTime: endTime - startTime
  }
}

function calculateRelevanceScore(node: ThoughtNode, query: string): number {
  let score = 0
  
  // Title match gets highest score
  if (node.title && node.title.toLowerCase().includes(query)) {
    score += 10
  }
  
  // Comment match gets medium score
  if (node.comment.toLowerCase().includes(query)) {
    score += 5
  }
  
  // Tag match gets medium score
  if (node.tags && node.tags.some(tag => tag.toLowerCase().includes(query))) {
    score += 5
  }
  
  // Category match gets low score
  if (node.category && node.category.toLowerCase().includes(query)) {
    score += 2
  }
  
  // Summary match gets low score
  if (node.summary.toLowerCase().includes(query)) {
    score += 2
  }
  
  // X post specific scoring
  if (node.xPostData) {
    if (node.xPostData.text.toLowerCase().includes(query)) {
      score += 7
    }
    if (node.xPostData.author.name.toLowerCase().includes(query) ||
        node.xPostData.author.username.toLowerCase().includes(query)) {
      score += 3
    }
  }
  
  return score
}

// 検索候補の生成
export function generateSearchSuggestions(nodes: ThoughtNode[]): {
  categories: string[]
  tags: string[]
  domains: string[]
  authors: string[]
} {
  const categories = new Set<string>()
  const tags = new Set<string>()
  const domains = new Set<string>()
  const authors = new Set<string>()
  
  nodes.forEach(node => {
    // Categories
    if (node.category) {
      categories.add(node.category)
    }
    
    // Tags
    if (node.tags) {
      node.tags.forEach(tag => tags.add(tag))
    }
    
    // Domains
    try {
      const domain = new URL(node.url).hostname.replace('www.', '')
      domains.add(domain)
    } catch {
      domains.add('その他')
    }
    
    // Authors (for X posts)
    if (node.xPostData) {
      authors.add(node.xPostData.author.name)
      authors.add(`@${node.xPostData.author.username}`)
    }
  })
  
  return {
    categories: Array.from(categories).sort(),
    tags: Array.from(tags).sort(),
    domains: Array.from(domains).sort(),
    authors: Array.from(authors).sort()
  }
}

// 保存された検索の管理
export interface SavedSearch {
  id: string
  name: string
  filters: SearchFilters
  createdAt: number
  lastUsed: number
}

export function saveFavoriteSearch(name: string, filters: SearchFilters): SavedSearch {
  const savedSearch: SavedSearch = {
    id: crypto.randomUUID(),
    name,
    filters,
    createdAt: Date.now(),
    lastUsed: Date.now()
  }
  
  const existingSaved = getSavedSearches()
  existingSaved.push(savedSearch)
  localStorage.setItem('creativeos-saved-searches', JSON.stringify(existingSaved))
  
  return savedSearch
}

export function getSavedSearches(): SavedSearch[] {
  try {
    const saved = localStorage.getItem('creativeos-saved-searches')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function deleteSavedSearch(id: string): void {
  const saved = getSavedSearches().filter(s => s.id !== id)
  localStorage.setItem('creativeos-saved-searches', JSON.stringify(saved))
}

export function updateLastUsed(id: string): void {
  const saved = getSavedSearches()
  const search = saved.find(s => s.id === id)
  if (search) {
    search.lastUsed = Date.now()
    localStorage.setItem('creativeos-saved-searches', JSON.stringify(saved))
  }
}
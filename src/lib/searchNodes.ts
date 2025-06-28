import Fuse from 'fuse.js'
import { ThoughtNode } from '../types/ThoughtNode'

const fuseOptions = {
  keys: [
    {
      name: 'comment',
      weight: 0.4
    },
    {
      name: 'summary',
      weight: 0.3
    },
    {
      name: 'url',
      weight: 0.2
    }
  ],
  threshold: 0.4, // より緩い一致（0.0 = 完全一致, 1.0 = 何でも一致）
  includeScore: true,
  minMatchCharLength: 2,
  shouldSort: true
}

export function searchNodes(nodes: ThoughtNode[], query: string): ThoughtNode[] {
  if (!query.trim()) {
    return nodes
  }

  const fuse = new Fuse(nodes, fuseOptions)
  const results = fuse.search(query)
  
  return results.map(result => result.item)
}

export function getSearchSuggestions(nodes: ThoughtNode[], query: string): string[] {
  if (!query.trim() || query.length < 2) {
    return []
  }

  const fuse = new Fuse(nodes, {
    ...fuseOptions,
    threshold: 0.6
  })
  
  const results = fuse.search(query).slice(0, 5)
  const suggestions: string[] = []
  
  results.forEach(result => {
    const node = result.item
    // コメントからの候補
    if (node.comment.toLowerCase().includes(query.toLowerCase())) {
      suggestions.push(node.comment.slice(0, 50))
    }
    // URLからの候補
    try {
      const hostname = new URL(node.url).hostname
      if (hostname.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push(hostname)
      }
    } catch {}
  })
  
  return [...new Set(suggestions)].slice(0, 3)
}
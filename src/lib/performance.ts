// パフォーマンス最適化ユーティリティ

import { ThoughtNode } from '../types/ThoughtNode'

// 仮想化リスト用のアイテム
export interface VirtualListItem {
  id: string
  index: number
  height: number
  offset: number
}

// メモ化とキャッシュ
export class MemoCache<T = any> {
  private cache = new Map<string, { value: T; timestamp: number }>()
  private maxSize: number
  private ttl: number
  
  constructor(maxSize = 1000, ttl = 5 * 60 * 1000) { // 5分
    this.maxSize = maxSize
    this.ttl = ttl
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return undefined
    }
    
    return item.value
  }
  
  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
}

// デバウンス機能
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// スロットル機能
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 仮想スクロール実装
export class VirtualScrollManager {
  private containerHeight: number
  private itemHeight: number
  private items: VirtualListItem[]
  private visibleRange: { start: number; end: number }
  private scrollTop: number = 0
  
  constructor(containerHeight: number, itemHeight: number) {
    this.containerHeight = containerHeight
    this.itemHeight = itemHeight
    this.items = []
    this.visibleRange = { start: 0, end: 0 }
  }
  
  setItems(count: number): void {
    this.items = Array.from({ length: count }, (_, index) => ({
      id: `item-${index}`,
      index,
      height: this.itemHeight,
      offset: index * this.itemHeight
    }))
    this.updateVisibleRange()
  }
  
  setScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop
    this.updateVisibleRange()
  }
  
  private updateVisibleRange(): void {
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight)
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight)
    const buffer = 5 // バッファアイテム数
    
    this.visibleRange = {
      start: Math.max(0, visibleStart - buffer),
      end: Math.min(this.items.length, visibleStart + visibleCount + buffer)
    }
  }
  
  getVisibleItems(): VirtualListItem[] {
    return this.items.slice(this.visibleRange.start, this.visibleRange.end)
  }
  
  getTotalHeight(): number {
    return this.items.length * this.itemHeight
  }
  
  getVisibleRange(): { start: number; end: number } {
    return this.visibleRange
  }
}

// ノードデータの最適化
export class NodeDataOptimizer {
  private nodeCache = new MemoCache<ThoughtNode[]>()
  private embeddingCache = new MemoCache<number[]>()
  private connectionCache = new MemoCache<string[]>()
  
  // 大量ノード用のチャンク処理
  processNodesInChunks<T>(
    nodes: ThoughtNode[],
    processor: (chunk: ThoughtNode[]) => T[],
    chunkSize = 100
  ): Promise<T[]> {
    return new Promise((resolve) => {
      const results: T[] = []
      let index = 0
      
      const processChunk = () => {
        const chunk = nodes.slice(index, index + chunkSize)
        if (chunk.length === 0) {
          resolve(results)
          return
        }
        
        const chunkResults = processor(chunk)
        results.push(...chunkResults)
        index += chunkSize
        
        // 次のチャンクを非同期で処理
        setTimeout(processChunk, 0)
      }
      
      processChunk()
    })
  }
  
  // 不要なデータの除去
  stripUnnecessaryData(
    nodes: ThoughtNode[],
    options: {
      removeEmbeddings?: boolean
      removePositions?: boolean
      removeConnections?: boolean
    } = {}
  ): Partial<ThoughtNode>[] {
    const cacheKey = `stripped-${JSON.stringify(options)}-${nodes.length}`
    const cached = this.nodeCache.get(cacheKey)
    if (cached) return cached
    
    const stripped = nodes.map(node => {
      const result: Partial<ThoughtNode> = {
        id: node.id,
        url: node.url,
        comment: node.comment,
        title: node.title,
        summary: node.summary,
        createdAt: node.createdAt,
        tags: node.tags,
        category: node.category,
        type: node.type
      }
      
      if (!options.removeEmbeddings) {
        result.embedding = node.embedding
      }
      
      if (!options.removePositions) {
        result.position = node.position
      }
      
      if (!options.removeConnections) {
        result.linkedNodeIds = node.linkedNodeIds
      }
      
      if (node.xPostData) {
        result.xPostData = node.xPostData
      }
      
      return result
    })
    
    this.nodeCache.set(cacheKey, stripped as ThoughtNode[])
    return stripped
  }
  
  // インデックス作成
  createSearchIndex(nodes: ThoughtNode[]): Map<string, Set<string>> {
    const index = new Map<string, Set<string>>()
    
    nodes.forEach(node => {
      const searchableText = [
        node.title,
        node.comment,
        node.summary,
        ...(node.tags || []),
        node.category,
        node.xPostData?.text,
        node.xPostData?.author.name
      ].filter(Boolean).join(' ').toLowerCase()
      
      // 単語ごとにインデックス化
      const words = searchableText.split(/\s+/)
      words.forEach(word => {
        if (word.length > 2) {
          if (!index.has(word)) {
            index.set(word, new Set())
          }
          index.get(word)!.add(node.id)
        }
      })
    })
    
    return index
  }
}

// レンダリング最適化
export class RenderOptimizer {
  private animationFrameId: number | null = null
  private pendingUpdates = new Set<() => void>()
  
  // バッチ更新
  batchUpdate(update: () => void): void {
    this.pendingUpdates.add(update)
    
    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.pendingUpdates.forEach(update => update())
        this.pendingUpdates.clear()
        this.animationFrameId = null
      })
    }
  }
  
  // 遅延実行
  defer(callback: () => void, delay = 0): void {
    setTimeout(callback, delay)
  }
  
  // アイドル時実行
  runWhenIdle(callback: () => void): void {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback)
    } else {
      setTimeout(callback, 0)
    }
  }
}

// パフォーマンス監視
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  
  startTiming(name: string): () => number {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
      return duration
    }
  }
  
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // 最新100件のみ保持
    if (values.length > 100) {
      values.shift()
    }
  }
  
  getMetrics(name: string): {
    average: number
    min: number
    max: number
    count: number
  } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return null
    
    return {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    }
  }
  
  getAllMetrics(): Record<string, ReturnType<typeof this.getMetrics>> {
    const result: Record<string, any> = {}
    this.metrics.forEach((_, name) => {
      result[name] = this.getMetrics(name)
    })
    return result
  }
  
  clearMetrics(): void {
    this.metrics.clear()
  }
}

// メモリ使用量の監視
export function getMemoryUsage(): {
  used: number
  total: number
  percentage: number
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    }
  }
  return null
}

// 遅延読み込み
export function createLazyLoader<T>(
  loader: () => Promise<T>
): {
  load: () => Promise<T>
  isLoaded: () => boolean
  isLoading: () => boolean
} {
  let promise: Promise<T> | null = null
  let isLoaded = false
  let isLoading = false
  
  return {
    load: () => {
      if (promise) return promise
      
      isLoading = true
      promise = loader().then(result => {
        isLoaded = true
        isLoading = false
        return result
      }).catch(error => {
        isLoading = false
        promise = null
        throw error
      })
      
      return promise
    },
    isLoaded: () => isLoaded,
    isLoading: () => isLoading
  }
}

// グローバルなパフォーマンス最適化設定
export const performanceConfig = {
  maxNodesInView: 1000,
  chunkSize: 100,
  debounceDelay: 300,
  throttleLimit: 16, // 60fps
  cacheSize: 500,
  cacheTTL: 5 * 60 * 1000
}

// 使用例のための統合クラス
export class CreativeOSPerformance {
  private nodeOptimizer = new NodeDataOptimizer()
  private renderOptimizer = new RenderOptimizer()
  private monitor = new PerformanceMonitor()
  
  optimizeNodes(nodes: ThoughtNode[], options?: any): Partial<ThoughtNode>[] {
    const stopTiming = this.monitor.startTiming('nodeOptimization')
    const result = this.nodeOptimizer.stripUnnecessaryData(nodes, options)
    stopTiming()
    return result
  }
  
  batchRender(updates: (() => void)[]): void {
    updates.forEach(update => this.renderOptimizer.batchUpdate(update))
  }
  
  getPerformanceReport(): any {
    return {
      metrics: this.monitor.getAllMetrics(),
      memory: getMemoryUsage(),
      cacheSize: this.nodeOptimizer['nodeCache'].size()
    }
  }
}
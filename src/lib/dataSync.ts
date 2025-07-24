// データ同期とバックアップ機能

import { ThoughtNode } from '../types/ThoughtNode'

export interface SyncConfig {
  enabled: boolean
  autoBackup: boolean
  backupInterval: number // 分
  maxBackups: number
  cloudProvider?: 'browser' | 'custom'
  encryptData: boolean
}

export interface BackupMetadata {
  id: string
  timestamp: number
  nodeCount: number
  size: number
  checksum: string
  version: string
}

export interface SyncStatus {
  isOnline: boolean
  lastSync: number | null
  lastBackup: number | null
  hasUnsavedChanges: boolean
  syncInProgress: boolean
  backupInProgress: boolean
}

// データ同期マネージャー
export class DataSyncManager {
  private config: SyncConfig
  private status: SyncStatus
  private changeQueue: Array<{ type: 'create' | 'update' | 'delete'; node: ThoughtNode; timestamp: number }> = []
  private backupTimer: NodeJS.Timeout | null = null
  private syncTimer: NodeJS.Timeout | null = null
  
  constructor(config: SyncConfig) {
    this.config = config
    this.status = {
      isOnline: navigator.onLine,
      lastSync: this.getLastSyncTime(),
      lastBackup: this.getLastBackupTime(),
      hasUnsavedChanges: false,
      syncInProgress: false,
      backupInProgress: false
    }
    
    this.setupEventListeners()
    this.startAutoBackup()
  }
  
  private setupEventListeners(): void {
    // オンライン/オフライン状態の監視
    window.addEventListener('online', () => {
      this.status.isOnline = true
      this.processPendingChanges()
    })
    
    window.addEventListener('offline', () => {
      this.status.isOnline = false
    })
    
    // ページ離脱時の自動保存
    window.addEventListener('beforeunload', (e) => {
      if (this.status.hasUnsavedChanges) {
        this.performBackup()
        e.preventDefault()
        e.returnValue = ''
      }
    })
    
    // 定期同期
    this.syncTimer = setInterval(() => {
      if (this.config.enabled && this.status.isOnline) {
        this.syncData()
      }
    }, 30000) // 30秒間隔
  }
  
  private startAutoBackup(): void {
    if (!this.config.autoBackup) return
    
    this.backupTimer = setInterval(() => {
      this.performBackup()
    }, this.config.backupInterval * 60 * 1000)
  }
  
  // 変更の記録
  recordChange(type: 'create' | 'update' | 'delete', node: ThoughtNode): void {
    this.changeQueue.push({
      type,
      node: { ...node },
      timestamp: Date.now()
    })
    
    this.status.hasUnsavedChanges = true
    
    if (this.status.isOnline && this.config.enabled) {
      this.debouncedSync()
    }
  }
  
  private debouncedSync = this.debounce(() => {
    this.syncData()
  }, 5000)
  
  // データ同期
  async syncData(): Promise<void> {
    if (this.status.syncInProgress || !this.status.isOnline) return
    
    this.status.syncInProgress = true
    
    try {
      // 未送信の変更を処理
      await this.processPendingChanges()
      
      // サーバーからの更新を取得
      await this.fetchUpdates()
      
      this.status.lastSync = Date.now()
      this.saveLastSyncTime(this.status.lastSync)
      
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    } finally {
      this.status.syncInProgress = false
    }
  }
  
  private async processPendingChanges(): Promise<void> {
    if (this.changeQueue.length === 0) return
    
    try {
      // 変更をサーバーに送信（実装は環境依存）
      await this.sendChangesToServer(this.changeQueue)
      
      this.changeQueue = []
      this.status.hasUnsavedChanges = false
      
    } catch (error) {
      console.error('Failed to send changes:', error)
      throw error
    }
  }
  
  private async fetchUpdates(): Promise<ThoughtNode[]> {
    try {
      const lastSync = this.status.lastSync || 0
      const updates = await this.fetchUpdatesFromServer(lastSync)
      return updates
    } catch (error) {
      console.error('Failed to fetch updates:', error)
      return []
    }
  }
  
  // バックアップ作成
  async performBackup(): Promise<BackupMetadata> {
    if (this.status.backupInProgress) {
      throw new Error('Backup already in progress')
    }
    
    this.status.backupInProgress = true
    
    try {
      const nodes = await this.getAllNodes()
      const backup = this.createBackupData(nodes)
      const metadata = await this.saveBackup(backup)
      
      this.status.lastBackup = Date.now()
      this.saveLastBackupTime(this.status.lastBackup)
      
      // 古いバックアップの削除
      await this.cleanupOldBackups()
      
      return metadata
      
    } catch (error) {
      console.error('Backup failed:', error)
      throw error
    } finally {
      this.status.backupInProgress = false
    }
  }
  
  private createBackupData(nodes: ThoughtNode[]): string {
    const backupData = {
      version: '1.0',
      timestamp: Date.now(),
      nodes,
      metadata: {
        totalNodes: nodes.length,
        createdAt: Date.now()
      }
    }
    
    let data = JSON.stringify(backupData)
    
    if (this.config.encryptData) {
      data = this.encryptData(data)
    }
    
    return data
  }
  
  private async saveBackup(data: string): Promise<BackupMetadata> {
    const id = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const checksum = await this.calculateChecksum(data)
    
    const metadata: BackupMetadata = {
      id,
      timestamp: Date.now(),
      nodeCount: JSON.parse(this.config.encryptData ? this.decryptData(data) : data).nodes.length,
      size: new Blob([data]).size,
      checksum,
      version: '1.0'
    }
    
    // ブラウザストレージに保存
    localStorage.setItem(`creativeos-backup-${id}`, data)
    localStorage.setItem(`creativeos-backup-meta-${id}`, JSON.stringify(metadata))
    
    return metadata
  }
  
  // バックアップ復元
  async restoreFromBackup(backupId: string): Promise<ThoughtNode[]> {
    try {
      const data = localStorage.getItem(`creativeos-backup-${backupId}`)
      if (!data) {
        throw new Error('Backup not found')
      }
      
      let parsedData = data
      if (this.config.encryptData) {
        parsedData = this.decryptData(data)
      }
      
      const backup = JSON.parse(parsedData)
      
      // チェックサムの検証
      const currentChecksum = await this.calculateChecksum(data)
      const metadata = this.getBackupMetadata(backupId)
      
      if (metadata && metadata.checksum !== currentChecksum) {
        throw new Error('Backup data is corrupted')
      }
      
      return backup.nodes
      
    } catch (error) {
      console.error('Restore failed:', error)
      throw error
    }
  }
  
  // バックアップ一覧取得
  getBackupList(): BackupMetadata[] {
    const backups: BackupMetadata[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('creativeos-backup-meta-')) {
        try {
          const metadata = JSON.parse(localStorage.getItem(key)!)
          backups.push(metadata)
        } catch (error) {
          console.error('Failed to parse backup metadata:', error)
        }
      }
    }
    
    return backups.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  private getBackupMetadata(backupId: string): BackupMetadata | null {
    try {
      const data = localStorage.getItem(`creativeos-backup-meta-${backupId}`)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }
  
  private async cleanupOldBackups(): Promise<void> {
    const backups = this.getBackupList()
    
    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups)
      
      toDelete.forEach(backup => {
        localStorage.removeItem(`creativeos-backup-${backup.id}`)
        localStorage.removeItem(`creativeos-backup-meta-${backup.id}`)
      })
    }
  }
  
  // 暗号化・復号化（簡易実装）
  private encryptData(data: string): string {
    // 実際の実装では、より強力な暗号化を使用
    return btoa(data)
  }
  
  private decryptData(encryptedData: string): string {
    return atob(encryptedData)
  }
  
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // 外部APIとの通信（実装は環境依存）
  private async sendChangesToServer(changes: any[]): Promise<void> {
    // 実際の実装では、API endpointにPOST
    console.log('Sending changes to server:', changes)
  }
  
  private async fetchUpdatesFromServer(since: number): Promise<ThoughtNode[]> {
    // 実際の実装では、API endpointからGET
    console.log('Fetching updates since:', since)
    return []
  }
  
  private async getAllNodes(): Promise<ThoughtNode[]> {
    // ノードストアから全ノードを取得
    const nodesJson = localStorage.getItem('creativeos-nodes')
    return nodesJson ? JSON.parse(nodesJson) : []
  }
  
  // ユーティリティ
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }
  
  private getLastSyncTime(): number | null {
    const time = localStorage.getItem('creativeos-last-sync')
    return time ? parseInt(time) : null
  }
  
  private saveLastSyncTime(time: number): void {
    localStorage.setItem('creativeos-last-sync', time.toString())
  }
  
  private getLastBackupTime(): number | null {
    const time = localStorage.getItem('creativeos-last-backup')
    return time ? parseInt(time) : null
  }
  
  private saveLastBackupTime(time: number): void {
    localStorage.setItem('creativeos-last-backup', time.toString())
  }
  
  // 公開メソッド
  getStatus(): SyncStatus {
    return { ...this.status }
  }
  
  getConfig(): SyncConfig {
    return { ...this.config }
  }
  
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (newConfig.autoBackup !== undefined) {
      if (this.backupTimer) {
        clearInterval(this.backupTimer)
        this.backupTimer = null
      }
      
      if (newConfig.autoBackup) {
        this.startAutoBackup()
      }
    }
  }
  
  // 手動同期・バックアップ
  async manualSync(): Promise<void> {
    return this.syncData()
  }
  
  async manualBackup(): Promise<BackupMetadata> {
    return this.performBackup()
  }
  
  // クリーンアップ
  destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer)
    }
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
    
    window.removeEventListener('online', () => {})
    window.removeEventListener('offline', () => {})
    window.removeEventListener('beforeunload', () => {})
  }
}

// 設定のプリセット
export const syncPresets = {
  aggressive: {
    enabled: true,
    autoBackup: true,
    backupInterval: 5, // 5分
    maxBackups: 20,
    encryptData: true
  },
  
  balanced: {
    enabled: true,
    autoBackup: true,
    backupInterval: 15, // 15分
    maxBackups: 10,
    encryptData: true
  },
  
  minimal: {
    enabled: false,
    autoBackup: true,
    backupInterval: 60, // 1時間
    maxBackups: 5,
    encryptData: false
  },
  
  offline: {
    enabled: false,
    autoBackup: true,
    backupInterval: 30, // 30分
    maxBackups: 7,
    encryptData: false
  }
}

// グローバル同期インスタンス
let globalSyncManager: DataSyncManager | null = null

export function initializeSync(config: SyncConfig): DataSyncManager {
  if (globalSyncManager) {
    globalSyncManager.destroy()
  }
  
  globalSyncManager = new DataSyncManager(config)
  return globalSyncManager
}

export function getSyncManager(): DataSyncManager | null {
  return globalSyncManager
}

// 緊急バックアップ機能
export async function emergencyBackup(): Promise<string> {
  try {
    const nodes = JSON.parse(localStorage.getItem('creativeos-nodes') || '[]')
    const backup = {
      emergency: true,
      timestamp: Date.now(),
      nodes,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    const backupString = JSON.stringify(backup, null, 2)
    
    // ダウンロード用のBlob作成
    const blob = new Blob([backupString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `creativeos-emergency-backup-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return backupString
  } catch (error) {
    console.error('Emergency backup failed:', error)
    throw error
  }
}
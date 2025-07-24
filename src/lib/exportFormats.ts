import { ThoughtNode } from '../types/ThoughtNode'
import { calculateNodeStats } from './analytics'
import { buildKnowledgeGraph } from './knowledgeGraph'

export interface ExportOptions {
  format: 'json' | 'csv' | 'markdown' | 'html' | 'opml' | 'graph-json'
  includeMetadata: boolean
  includeEmbeddings: boolean
  includeConnections: boolean
  filterNodes?: string[]
  customFields?: string[]
}

export interface ExportResult {
  data: string | Blob
  filename: string
  mimeType: string
  size: number
}

// JSON エクスポート
export function exportToJSON(nodes: ThoughtNode[], options: ExportOptions): ExportResult {
  let exportData: any = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalNodes: nodes.length
  }
  
  if (options.includeMetadata) {
    const stats = calculateNodeStats(nodes)
    exportData.metadata = {
      stats,
      categories: Object.keys(stats.categoryCounts),
      tags: Object.keys(stats.tagCounts)
    }
  }
  
  if (options.includeConnections) {
    const graph = buildKnowledgeGraph(nodes)
    exportData.graph = {
      connections: graph.connections,
      metrics: graph.metrics
    }
  }
  
  // ノードデータの処理
  const processedNodes = nodes.map(node => {
    const exportNode: any = {
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
    
    if (options.includeEmbeddings) {
      exportNode.embedding = node.embedding
    }
    
    if (options.includeConnections) {
      exportNode.linkedNodeIds = node.linkedNodeIds
      exportNode.position = node.position
    }
    
    if (node.type === 'x-post' && node.xPostData) {
      exportNode.xPostData = node.xPostData
    }
    
    return exportNode
  })
  
  exportData.nodes = processedNodes
  
  const jsonString = JSON.stringify(exportData, null, 2)
  
  return {
    data: jsonString,
    filename: `creativeos-export-${new Date().toISOString().split('T')[0]}.json`,
    mimeType: 'application/json',
    size: new Blob([jsonString]).size
  }
}

// CSV エクスポート
export function exportToCSV(nodes: ThoughtNode[], options: ExportOptions): ExportResult {
  const headers = [
    'ID',
    'URL',
    'Title',
    'Comment',
    'Summary',
    'Category',
    'Tags',
    'Type',
    'Created Date',
    'Connection Count'
  ]
  
  if (options.customFields) {
    headers.push(...options.customFields)
  }
  
  const rows = nodes.map(node => {
    const row = [
      node.id,
      node.url,
      (node.title || '').replace(/,/g, ';'),
      node.comment.replace(/,/g, ';'),
      node.summary.replace(/,/g, ';'),
      node.category || '',
      (node.tags || []).join('; '),
      node.type || 'default',
      new Date(node.createdAt).toISOString(),
      node.linkedNodeIds.length.toString()
    ]
    
    if (options.customFields) {
      // カスタムフィールドの値を追加
      options.customFields.forEach(field => {
        switch (field) {
          case 'Domain':
            try {
              row.push(new URL(node.url).hostname)
            } catch {
              row.push('Unknown')
            }
            break
          case 'Author':
            row.push(node.xPostData?.author.name || '')
            break
          case 'Post Text':
            row.push((node.xPostData?.text || '').replace(/,/g, ';'))
            break
          default:
            row.push('')
        }
      })
    }
    
    return row
  })
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
  
  return {
    data: csvContent,
    filename: `creativeos-export-${new Date().toISOString().split('T')[0]}.csv`,
    mimeType: 'text/csv',
    size: new Blob([csvContent]).size
  }
}

// Markdown エクスポート
export function exportToMarkdown(nodes: ThoughtNode[], options: ExportOptions): ExportResult {
  let markdown = `# CreativeOS ナレッジベース\n\n`
  markdown += `エクスポート日時: ${new Date().toLocaleString('ja-JP')}\n`
  markdown += `総ノード数: ${nodes.length}\n\n`
  
  if (options.includeMetadata) {
    const stats = calculateNodeStats(nodes)
    markdown += `## 📊 統計情報\n\n`
    markdown += `- **カテゴリ数**: ${Object.keys(stats.categoryCounts).length}\n`
    markdown += `- **タグ数**: ${Object.keys(stats.tagCounts).length}\n`
    markdown += `- **平均接続数**: ${stats.averageLinkedNodes.toFixed(1)}\n`
    markdown += `- **X投稿数**: ${stats.xPostCount}\n\n`
    
    // カテゴリ別分布
    markdown += `### カテゴリ別分布\n\n`
    Object.entries(stats.categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        markdown += `- **${category}**: ${count}件\n`
      })
    markdown += '\n'
  }
  
  // カテゴリ別にノードをグループ化
  const nodesByCategory = nodes.reduce((acc, node) => {
    const category = node.category || 'その他'
    if (!acc[category]) acc[category] = []
    acc[category].push(node)
    return acc
  }, {} as Record<string, ThoughtNode[]>)
  
  // カテゴリごとにエクスポート
  Object.entries(nodesByCategory)
    .sort(([,a], [,b]) => b.length - a.length)
    .forEach(([category, categoryNodes]) => {
      markdown += `## 📁 ${category} (${categoryNodes.length}件)\n\n`
      
      categoryNodes
        .sort((a, b) => b.createdAt - a.createdAt)
        .forEach(node => {
          markdown += `### ${node.title || node.comment}\n\n`
          markdown += `- **URL**: [${node.url}](${node.url})\n`
          markdown += `- **作成日**: ${new Date(node.createdAt).toLocaleDateString('ja-JP')}\n`
          
          if (node.tags && node.tags.length > 0) {
            markdown += `- **タグ**: ${node.tags.map(tag => `\`${tag}\``).join(', ')}\n`
          }
          
          if (node.summary) {
            markdown += `- **要約**: ${node.summary}\n`
          }
          
          if (node.type === 'x-post' && node.xPostData) {
            markdown += `- **投稿者**: @${node.xPostData.author.username} (${node.xPostData.author.name})\n`
            markdown += `- **投稿内容**: ${node.xPostData.text}\n`
          }
          
          if (options.includeConnections && node.linkedNodeIds.length > 0) {
            markdown += `- **関連ノード**: ${node.linkedNodeIds.length}件\n`
          }
          
          markdown += `\n`
        })
    })
  
  return {
    data: markdown,
    filename: `creativeos-export-${new Date().toISOString().split('T')[0]}.md`,
    mimeType: 'text/markdown',
    size: new Blob([markdown]).size
  }
}

// HTML エクスポート
export function exportToHTML(nodes: ThoughtNode[], options: ExportOptions): ExportResult {
  const stats = calculateNodeStats(nodes)
  
  let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CreativeOS ナレッジベース</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
        .node { background: white; border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .node-title { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
        .node-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
        .tag { background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; }
        .category { background: #f3e5f5; color: #7b1fa2; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; }
        .date { color: #666; font-size: 0.9em; }
        .x-post { border-left-color: #1da1f2; }
        .summary { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 CreativeOS ナレッジベース</h1>
        <p>エクスポート日時: ${new Date().toLocaleString('ja-JP')}</p>
    </div>`
  
  if (options.includeMetadata) {
    html += `
    <div class="stats">
        <div class="stat-card">
            <h3>📝 総ノード数</h3>
            <p style="font-size: 2em; margin: 0; color: #667eea;">${stats.totalNodes}</p>
        </div>
        <div class="stat-card">
            <h3>📁 カテゴリ数</h3>
            <p style="font-size: 2em; margin: 0; color: #667eea;">${Object.keys(stats.categoryCounts).length}</p>
        </div>
        <div class="stat-card">
            <h3>🏷️ タグ数</h3>
            <p style="font-size: 2em; margin: 0; color: #667eea;">${Object.keys(stats.tagCounts).length}</p>
        </div>
        <div class="stat-card">
            <h3>🔗 平均接続数</h3>
            <p style="font-size: 2em; margin: 0; color: #667eea;">${stats.averageLinkedNodes.toFixed(1)}</p>
        </div>
    </div>`
  }
  
  // ノードをHTML化
  const sortedNodes = nodes.sort((a, b) => b.createdAt - a.createdAt)
  
  sortedNodes.forEach(node => {
    const isXPost = node.type === 'x-post'
    html += `
    <div class="node ${isXPost ? 'x-post' : ''}">
        <div class="node-title">${node.title || node.comment}</div>
        <div class="node-meta">
            ${node.category ? `<span class="category">📁 ${node.category}</span>` : ''}
            ${(node.tags || []).map(tag => `<span class="tag">🏷️ ${tag}</span>`).join('')}
            <span class="date">📅 ${new Date(node.createdAt).toLocaleDateString('ja-JP')}</span>
        </div>
        <div><strong>URL:</strong> <a href="${node.url}" target="_blank">${node.url}</a></div>
        ${node.summary ? `<div class="summary">${node.summary}</div>` : ''}
        ${isXPost && node.xPostData ? `
            <div style="margin-top: 10px; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                <strong>@${node.xPostData.author.username}</strong> (${node.xPostData.author.name})<br>
                ${node.xPostData.text}
            </div>
        ` : ''}
    </div>`
  })
  
  html += `
</body>
</html>`
  
  return {
    data: html,
    filename: `creativeos-export-${new Date().toISOString().split('T')[0]}.html`,
    mimeType: 'text/html',
    size: new Blob([html]).size
  }
}

// OPML エクスポート（アウトライン形式）
export function exportToOPML(nodes: ThoughtNode[], options: ExportOptions): ExportResult {
  let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
    <head>
        <title>CreativeOS ナレッジベース</title>
        <dateCreated>${new Date().toUTCString()}</dateCreated>
        <ownerId>CreativeOS</ownerId>
    </head>
    <body>`
  
  // カテゴリ別にグループ化
  const nodesByCategory = nodes.reduce((acc, node) => {
    const category = node.category || 'その他'
    if (!acc[category]) acc[category] = []
    acc[category].push(node)
    return acc
  }, {} as Record<string, ThoughtNode[]>)
  
  Object.entries(nodesByCategory).forEach(([category, categoryNodes]) => {
    opml += `\n        <outline text="${category}" type="category">`
    
    categoryNodes.forEach(node => {
      const title = node.title || node.comment
      const escapedTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const escapedUrl = node.url.replace(/"/g, '&quot;')
      
      opml += `\n            <outline text="${escapedTitle}" type="link" url="${escapedUrl}"`
      
      if (node.tags && node.tags.length > 0) {
        opml += ` tags="${node.tags.join(', ')}"`
      }
      
      opml += ` created="${new Date(node.createdAt).toISOString()}"`
      opml += ` />`
    })
    
    opml += '\n        </outline>'
  })
  
  opml += `
    </body>
</opml>`
  
  return {
    data: opml,
    filename: `creativeos-export-${new Date().toISOString().split('T')[0]}.opml`,
    mimeType: 'text/x-opml',
    size: new Blob([opml]).size
  }
}

// グラフ構造のJSONエクスポート（ネットワーク分析用）
export function exportGraphJSON(nodes: ThoughtNode[], options: ExportOptions): ExportResult {
  const graph = buildKnowledgeGraph(nodes)
  
  const graphData = {
    nodes: graph.graphNodes.map(gNode => ({
      id: gNode.id,
      label: gNode.node.title || gNode.node.comment,
      category: gNode.node.category,
      tags: gNode.node.tags,
      centralityScore: gNode.centralityScore,
      importance: gNode.importance,
      communityId: gNode.communityId,
      size: Math.max(5, gNode.connections.length * 2),
      color: gNode.node.type === 'x-post' ? '#1da1f2' : '#3b82f6'
    })),
    edges: graph.connections.map(conn => ({
      source: conn.source,
      target: conn.target,
      weight: conn.weight,
      type: conn.type,
      strength: conn.strength,
      color: conn.color
    })),
    communities: graph.metrics.communities,
    metrics: graph.metrics
  }
  
  const jsonString = JSON.stringify(graphData, null, 2)
  
  return {
    data: jsonString,
    filename: `creativeos-graph-${new Date().toISOString().split('T')[0]}.json`,
    mimeType: 'application/json',
    size: new Blob([jsonString]).size
  }
}

// ファイルダウンロード
export function downloadFile(result: ExportResult): void {
  const blob = new Blob([result.data], { type: result.mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = result.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// メイン エクスポート関数
export function exportNodes(
  nodes: ThoughtNode[], 
  options: ExportOptions
): ExportResult {
  const filteredNodes = options.filterNodes 
    ? nodes.filter(node => options.filterNodes!.includes(node.id))
    : nodes
  
  switch (options.format) {
    case 'json':
      return exportToJSON(filteredNodes, options)
    case 'csv':
      return exportToCSV(filteredNodes, options)
    case 'markdown':
      return exportToMarkdown(filteredNodes, options)
    case 'html':
      return exportToHTML(filteredNodes, options)
    case 'opml':
      return exportToOPML(filteredNodes, options)
    case 'graph-json':
      return exportGraphJSON(filteredNodes, options)
    default:
      throw new Error(`サポートされていない形式: ${options.format}`)
  }
}
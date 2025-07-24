import { ThoughtNode } from '../types/ThoughtNode'
import { Cluster } from './clustering'
import { TimelineGroup } from './timeline'

export interface ExportData {
  nodes: ThoughtNode[]
  clusters?: Cluster[]
  timeline?: TimelineGroup[]
  metadata: {
    exportDate: string
    nodeCount: number
    version: string
    format: string
  }
}

// JSON形式でエクスポート
export function exportToJSON(
  nodes: ThoughtNode[],
  clusters?: Cluster[],
  timeline?: TimelineGroup[]
): string {
  const exportData: ExportData = {
    nodes,
    clusters,
    timeline,
    metadata: {
      exportDate: new Date().toISOString(),
      nodeCount: nodes.length,
      version: '1.0.0',
      format: 'json'
    }
  }

  return JSON.stringify(exportData, null, 2)
}

// CSV形式でエクスポート（ノードデータのみ）
export function exportToCSV(nodes: ThoughtNode[]): string {
  const headers = [
    'ID',
    'URL',
    'Comment',
    'Summary',
    'Created Date',
    'Position X',
    'Position Y',
    'Position Z',
    'Linked Nodes'
  ]

  const rows = nodes.map(node => [
    node.id,
    node.url,
    `"${node.comment.replace(/"/g, '""')}"`, // CSVエスケープ
    `"${node.summary.replace(/"/g, '""')}"`,
    new Date(node.createdAt).toISOString(),
    node.position[0].toString(),
    node.position[1].toString(),
    node.position[2].toString(),
    node.linkedNodeIds.join(';')
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

// Markdown形式でエクスポート
export function exportToMarkdown(
  nodes: ThoughtNode[],
  clusters?: Cluster[],
  timeline?: TimelineGroup[]
): string {
  let markdown = '# CreativeOS Export\n\n'
  
  // メタデータ
  markdown += `**Export Date:** ${new Date().toISOString()}\n`
  markdown += `**Total Nodes:** ${nodes.length}\n\n`

  // ノード一覧
  markdown += '## Nodes\n\n'
  
  const sortedNodes = [...nodes].sort((a, b) => b.createdAt - a.createdAt)
  
  sortedNodes.forEach((node, index) => {
    markdown += `### ${index + 1}. ${node.comment}\n\n`
    markdown += `**URL:** [${node.url}](${node.url})\n\n`
    markdown += `**Summary:** ${node.summary}\n\n`
    markdown += `**Created:** ${new Date(node.createdAt).toLocaleString('ja-JP')}\n\n`
    
    if (node.linkedNodeIds.length > 0) {
      markdown += `**Linked Nodes:** ${node.linkedNodeIds.join(', ')}\n\n`
    }
    
    markdown += '---\n\n'
  })

  // クラスター情報
  if (clusters && clusters.length > 0) {
    markdown += '## Clusters\n\n'
    
    clusters.forEach((cluster, index) => {
      markdown += `### Cluster ${index + 1}: ${cluster.label}\n\n`
      markdown += `**Nodes:** ${cluster.nodes.length}\n\n`
      
      cluster.nodes.forEach(node => {
        markdown += `- [${node.comment}](${node.url})\n`
      })
      
      markdown += '\n'
    })
  }

  // タイムライン情報
  if (timeline && timeline.length > 0) {
    markdown += '## Timeline\n\n'
    
    timeline.forEach(group => {
      markdown += `### ${group.period}\n\n`
      markdown += `**Total Nodes:** ${group.nodeCount}\n\n`
      
      group.entries.forEach(entry => {
        markdown += `#### ${entry.label}\n\n`
        entry.nodes.forEach(node => {
          markdown += `- [${node.comment}](${node.url})\n`
        })
        markdown += '\n'
      })
    })
  }

  return markdown
}

// HTML形式でエクスポート
export function exportToHTML(
  nodes: ThoughtNode[],
  clusters?: Cluster[],
  timeline?: TimelineGroup[]
): string {
  const sortedNodes = [...nodes].sort((a, b) => b.createdAt - a.createdAt)
  
  let html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CreativeOS Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .section {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .node {
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 20px;
            background: #f8f9fa;
            border-radius: 0 8px 8px 0;
        }
        .node-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        .node-url {
            color: #667eea;
            text-decoration: none;
            margin-bottom: 10px;
            display: block;
        }
        .node-url:hover {
            text-decoration: underline;
        }
        .node-summary {
            color: #666;
            margin-bottom: 10px;
        }
        .node-meta {
            font-size: 0.9em;
            color: #888;
        }
        .cluster {
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .cluster-header {
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 15px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
        }
        .timeline-group {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .timeline-header {
            background: #667eea;
            color: white;
            padding: 15px;
            font-weight: bold;
        }
        .timeline-content {
            padding: 20px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>CreativeOS Export</h1>
        <p>エクスポート日時: ${new Date().toLocaleString('ja-JP')}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${nodes.length}</div>
            <div class="stat-label">総ノード数</div>
        </div>
        ${clusters ? `
        <div class="stat-card">
            <div class="stat-number">${clusters.length}</div>
            <div class="stat-label">クラスター数</div>
        </div>
        ` : ''}
        ${timeline ? `
        <div class="stat-card">
            <div class="stat-number">${timeline.length}</div>
            <div class="stat-label">期間グループ数</div>
        </div>
        ` : ''}
    </div>

    <div class="section">
        <h2>ノード一覧</h2>
        ${sortedNodes.map(node => `
        <div class="node">
            <div class="node-title">${escapeHtml(node.comment)}</div>
            <a href="${node.url}" class="node-url" target="_blank">${node.url}</a>
            <div class="node-summary">${escapeHtml(node.summary)}</div>
            <div class="node-meta">
                作成日時: ${new Date(node.createdAt).toLocaleString('ja-JP')}
                ${node.linkedNodeIds.length > 0 ? ` | リンク: ${node.linkedNodeIds.join(', ')}` : ''}
            </div>
        </div>
        `).join('')}
    </div>
  `

  // クラスター情報
  if (clusters && clusters.length > 0) {
    html += `
    <div class="section">
        <h2>クラスター分析</h2>
        ${clusters.map((cluster, index) => `
        <div class="cluster">
            <div class="cluster-header">
                クラスター ${index + 1}: ${escapeHtml(cluster.label)}
                <span style="float: right;">${cluster.nodes.length} ノード</span>
            </div>
            ${cluster.nodes.map(node => `
            <div style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">
                <a href="${node.url}" target="_blank">${escapeHtml(node.comment)}</a>
            </div>
            `).join('')}
        </div>
        `).join('')}
    </div>
    `
  }

  // タイムライン情報
  if (timeline && timeline.length > 0) {
    html += `
    <div class="section">
        <h2>タイムライン</h2>
        ${timeline.map(group => `
        <div class="timeline-group">
            <div class="timeline-header">
                ${escapeHtml(group.period)} (${group.nodeCount} ノード)
            </div>
            <div class="timeline-content">
                ${group.entries.map(entry => `
                <div style="margin-bottom: 20px;">
                    <h4>${escapeHtml(entry.label)}</h4>
                    ${entry.nodes.map(node => `
                    <div style="margin: 5px 0; padding: 8px; background: #f0f0f0; border-radius: 4px;">
                        <a href="${node.url}" target="_blank">${escapeHtml(node.comment)}</a>
                        <span style="float: right; color: #666; font-size: 0.9em;">
                            ${new Date(node.createdAt).toLocaleString('ja-JP')}
                        </span>
                    </div>
                    `).join('')}
                </div>
                `).join('')}
            </div>
        </div>
        `).join('')}
    </div>
    `
  }

  html += `
</body>
</html>
  `

  return html
}

// HTMLエスケープ関数
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ファイルダウンロード関数
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}

// エクスポート形式の定義
export const EXPORT_FORMATS = {
  JSON: {
    label: 'JSON',
    extension: 'json',
    mimeType: 'application/json',
    description: '完全なデータ構造（推奨）'
  },
  CSV: {
    label: 'CSV',
    extension: 'csv',
    mimeType: 'text/csv',
    description: 'ノードデータのみ（表計算ソフト用）'
  },
  MARKDOWN: {
    label: 'Markdown',
    extension: 'md',
    mimeType: 'text/markdown',
    description: '人間が読みやすい形式'
  },
  HTML: {
    label: 'HTML',
    extension: 'html',
    mimeType: 'text/html',
    description: 'ブラウザで表示可能'
  }
} as const

export type ExportFormat = keyof typeof EXPORT_FORMATS
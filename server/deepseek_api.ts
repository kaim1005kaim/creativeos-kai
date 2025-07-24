import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { processUrlMetadata } from './ogp_scraper.js'
import { scrapeXPost, scrapeXPostSimple } from './x_scraper.js'
import { isXPostUrl, extractTweetId } from './x_api.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import mcpManager from './mcp_chrome_embedded.js'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
interface ThoughtNode {
  id: string
  url: string
  ogpImageUrl: string
  comment: string
  summary: string
  embedding: number[]
  createdAt: number
  position: [number, number, number]
  linkedNodeIds: string[]
  tags?: string[]
  category?: string
  type?: 'default' | 'x-post'
}

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))  // 大量データ対応
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const DATA_PATH = join(__dirname, '../data/nodes.json')

function loadNodes(): ThoughtNode[] {
  if (!existsSync(DATA_PATH)) {
    return []
  }
  try {
    const data = readFileSync(DATA_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to load nodes:', error)
    return []
  }
}

function saveNodes(nodes: ThoughtNode[]): void {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(nodes, null, 2))
  } catch (error) {
    console.error('Failed to save nodes:', error)
  }
}

app.get('/api/nodes', (req, res) => {
  const nodes = loadNodes()
  res.json(nodes)
})

app.post('/api/nodes', (req, res) => {
  const nodes = req.body
  saveNodes(nodes)
  res.json({ success: true })
})

app.post('/api/summary', async (req, res) => {
  const { url, comment, modelId = 'deepseek' } = req.body

  try {
    // Determine API URL and headers based on model
    let apiUrl = 'https://api.deepseek.com/v1/chat/completions'
    let headers: any = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-7a36628f15fc4f0b883071fbedaae7e0'
    }
    
    if (modelId === 'hunyuan') {
      apiUrl = 'http://localhost:1234/v1/chat/completions'
      headers = { 'Content-Type': 'application/json' }
    }
    
    const response = await axios.post(apiUrl, {
      model: modelId === 'hunyuan' ? 'hunyuan-a13b' : 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'あなたは有用なアシスタントです。簡潔で情報豊富な要約を日本語で生成してください。'
        },
        {
          role: 'user',
          content: `このブックマークの要約を作成してください:
URL: ${url}
コメント: ${comment}

このブックマークが何についてのものか本質を捉えた、簡潔な要約（3-4文）を生成してください。技術的な内容の場合は、具体的な技術名やキーワードを含めてください。`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, { headers })

    let summary = response.data.choices[0]?.message?.content || `要約: ${comment}に関するブックマーク`
    
    // Remove <think> tags and their content
    summary = summary.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    
    res.json({ summary })
  } catch (error) {
    console.error('DeepSeek API error:', error)
    res.json({ summary: `要約: ${comment}に関するブックマーク` })
  }
})

app.post('/api/title', async (req, res) => {
  const { url, comment, modelId = 'deepseek' } = req.body

  try {
    // Determine API URL and headers based on model
    let apiUrl = 'https://api.deepseek.com/v1/chat/completions'
    let headers: any = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-7a36628f15fc4f0b883071fbedaae7e0'
    }
    
    if (modelId === 'hunyuan') {
      apiUrl = 'http://localhost:1234/v1/chat/completions'
      headers = { 'Content-Type': 'application/json' }
    }
    
    const response = await axios.post(apiUrl, {
      model: modelId === 'hunyuan' ? 'hunyuan-a13b' : 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '簡潔なタイトルのみ回答。説明不要。'
        },
        {
          role: 'user',
          content: `${comment}`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    }, { headers })

    let title = response.data.choices[0]?.message?.content?.trim() || comment.slice(0, 25)
    
    // Aggressively remove <think> tags and any remaining artifacts
    title = title.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    title = title.replace(/<think>[\s\S]*/g, '').trim() // Handle unclosed think tags
    title = title.replace(/^[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u0041-\u005A\u0061-\u007A\u0030-\u0039]+/, '').trim() // Remove leading non-Japanese/alphanumeric chars
    
    // If title is empty, contains only symbols, or starts with think-related text, use comment
    if (!title || title.length === 0 || title.toLowerCase().includes('think') || title.match(/^[^a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/)) {
      title = comment.slice(0, 25)
    }
    
    // Ensure title is not too long
    if (title.length > 25) {
      title = title.slice(0, 25)
    }
    
    res.json({ title })
  } catch (error) {
    console.error('Title generation API error:', error)
    res.json({ title: comment.slice(0, 25) })
  }
})

// タグとカテゴリ抽出エンドポイント
app.post('/api/extract-tags', async (req, res) => {
  const { text, url, modelId = 'deepseek-r1' } = req.body

  try {
    const prompt = `以下のコンテンツを分析して、適切なタグとカテゴリを抽出してください。

コンテンツ:
"${text}"

URL: ${url}

以下の形式でJSONを返してください：
{
  "category": "主要カテゴリ（技術、ビジネス、学習、エンタメ、ライフスタイル、ニュース、その他から選択）",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "keywords": ["キーワード1", "キーワード2", "キーワード3"]
}

注意：
- タグは3-5個、簡潔で検索しやすいものを選択
- カテゴリは必ず指定した中から選択
- キーワードは重要な概念や用語を抽出
- 日本語と英語を混在させても構いません
- JSONフォーマット以外は出力しないでください`

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-7a36628f15fc4f0b883071fbedaae7e0'
      }
    })
    
    const content = response.data.choices[0].message.content.trim()
    
    try {
      // JSONを抽出してパース
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      const result = JSON.parse(jsonStr)
      
      res.json(result)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // フォールバック結果
      res.json({
        category: "その他",
        tags: ["情報", "参考"],
        keywords: ["コンテンツ"]
      })
    }
  } catch (error) {
    console.error('Tag extraction error:', error)
    res.json({
      category: "その他", 
      tags: ["情報"],
      keywords: ["コンテンツ"]
    })
  }
})

app.post('/api/embedding', async (req, res) => {
  const { text } = req.body

  try {
    const response = await axios.post('http://localhost:8001/embedding', {
      text
    })

    res.json({ embedding: response.data.embedding })
  } catch (error) {
    console.error('Embedding API error:', error)
    const dummyEmbedding = new Array(384).fill(0).map(() => Math.random() - 0.5)
    res.json({ embedding: dummyEmbedding })
  }
})

app.post('/api/ogp', async (req, res) => {
  const { url, nodeId } = req.body

  try {
    const metadata = await processUrlMetadata(url, nodeId)
    res.json(metadata)
  } catch (error) {
    console.error('OGP scraping error:', error)
    res.json({ title: '', description: '', imageUrl: '' })
  }
})

// MCP経由でX投稿取得
app.post('/api/x-post-mcp', async (req, res) => {
  const { url } = req.body

  try {
    if (!isXPostUrl(url)) {
      return res.status(400).json({ error: 'Invalid X/Twitter post URL' })
    }

    console.log(`Fetching X post via MCP: ${url}`)
    
    // MCP for Chrome経由で取得
    const mcpResponse = await axios.post('http://127.0.0.1:12306/mcp', {
      tool: 'navigate',
      args: { url }
    })

    // 投稿内容を抽出
    const contentResponse = await axios.post('http://127.0.0.1:12306/mcp', {
      tool: 'execute_script',
      args: {
        script: `
          (function() {
            const article = document.querySelector('article[data-testid="tweet"]');
            if (!article) return null;
            
            const authorElement = article.querySelector('[data-testid="User-Name"]');
            const usernameElement = article.querySelector('[data-testid="User-Name"] a');
            const avatarElement = article.querySelector('[data-testid="Tweet-User-Avatar"] img');
            const textElement = article.querySelector('[data-testid="tweetText"]');
            const timeElement = article.querySelector('time');
            const imageElements = article.querySelectorAll('[data-testid="tweetPhoto"] img');
            const videoElement = article.querySelector('video');
            const tweetId = window.location.pathname.split('/status/')[1]?.split('?')[0];
            
            return {
              id: tweetId || '',
              url: window.location.href,
              author: {
                name: authorElement?.textContent?.split('@')[0]?.trim() || '',
                username: usernameElement?.getAttribute('href')?.replace('/', '') || '',
                avatarUrl: avatarElement?.src || ''
              },
              text: textElement?.textContent || '',
              images: Array.from(imageElements).map(img => img.src).slice(0, 4),
              videoUrl: videoElement?.src || undefined,
              createdAt: timeElement?.getAttribute('datetime') || new Date().toISOString()
            };
          })();
        `
      }
    })

    const xPostData = contentResponse.data.result || contentResponse.data
    
    if (!xPostData || !xPostData.id) {
      throw new Error('Failed to extract tweet data via MCP')
    }

    console.log('Successfully fetched X post via MCP')
    res.json(xPostData)
  } catch (error) {
    console.error('MCP X post scraping error:', error)
    res.status(500).json({ 
      error: 'Failed to scrape X post via MCP',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// X投稿スクレイピングエンドポイント
app.post('/api/x-post', async (req, res) => {
  const { url, useMCP = false } = req.body

  try {
    if (!isXPostUrl(url)) {
      return res.status(400).json({ error: 'Invalid X/Twitter post URL' })
    }

    console.log(`Scraping X post: ${url} (MCP: ${useMCP})`)
    
    // MCPを優先的に使用
    if (useMCP) {
      try {
        const mcpResponse = await axios.post('http://localhost:3001/api/x-post-mcp', { url })
        return res.json(mcpResponse.data)
      } catch (mcpError) {
        console.warn('MCP scraping failed, falling back to Puppeteer:', mcpError)
      }
    }

    const tweetId = extractTweetId(url)
    if (!tweetId) {
      return res.status(400).json({ error: 'Could not extract tweet ID from URL' })
    }
    
    // Puppeteerでのスクレイピング
    let xPostData
    try {
      xPostData = await scrapeXPost(url)
      console.log('Successfully scraped X post with Puppeteer')
    } catch (puppeteerError) {
      console.warn('Puppeteer scraping failed, using simple fallback:', puppeteerError)
      xPostData = await scrapeXPostSimple(url)
    }

    res.json(xPostData)
  } catch (error) {
    console.error('X post scraping error:', error)
    res.status(500).json({ 
      error: 'Failed to scrape X post',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// コマンド実行エンドポイント（MCPセットアップ用）
app.post('/api/execute-command', async (req, res) => {
  const { command, description } = req.body

  // セキュリティ: 許可されたコマンドのみ実行
  const allowedCommands = [
    /^cd ~\/Downloads && git clone https:\/\/github\.com\/hangwin\/mcp-chrome/,
    /^cd ~\/Downloads\/mcp-chrome && npm install$/,
    /^cd \/tmp\/mcp-chrome-setup && npm install$/,
    /^cd \/tmp\/mcp-chrome-setup && npm run build$/,
    /^cd \/tmp\/mcp-chrome-setup && npm run dev$/
  ]

  const isAllowed = allowedCommands.some(pattern => pattern.test(command))
  
  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      error: 'このコマンドは実行が許可されていません'
    })
  }

  try {
    console.log(`Executing command: ${command}`)
    
    // タイムアウトを設定（5分）
    const { stdout, stderr } = await execAsync(command, {
      timeout: 300000,
      maxBuffer: 1024 * 1024 * 10 // 10MB
    })

    const output = stdout + (stderr ? `\nSTDERR: ${stderr}` : '')
    
    res.json({
      success: true,
      output,
      description
    })
  } catch (error) {
    console.error(`Command execution failed: ${command}`, error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    res.json({
      success: false,
      error: errorMessage,
      description
    })
  }
})

// MCPプロキシエンドポイント
app.post('/api/mcp-proxy', async (req, res) => {
  try {
    const { tool, args } = req.body;
    
    if (!tool || !args) {
      return res.status(400).json({ error: 'Missing tool or args' });
    }

    const mcpResponse = await axios.post('http://127.0.0.1:12306/mcp', {
      tool,
      args
    });
    
    res.json(mcpResponse.data);
  } catch (error) {
    console.error('MCP proxy error:', error);
    res.status(500).json({ 
      error: 'MCP request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// MCP管理エンドポイント
app.get('/api/mcp/status', (req, res) => {
  const status = mcpManager.getStatus();
  res.json(status);
});

app.post('/api/mcp/start', async (req, res) => {
  try {
    const success = await mcpManager.startMCPServer();
    res.json({ success, status: mcpManager.getStatus() });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/mcp/stop', async (req, res) => {
  try {
    await mcpManager.stopMCPServer();
    res.json({ success: true, status: mcpManager.getStatus() });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.post('/api/mcp/restart', async (req, res) => {
  try {
    const success = await mcpManager.restartMCPServer();
    res.json({ success, status: mcpManager.getStatus() });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CreativeOS API server running on http://0.0.0.0:${PORT}`)
  console.log(`🔄 MCP for Chrome will auto-start in 5 seconds...`)
})
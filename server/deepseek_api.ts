import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
// import { processUrlMetadata } from './ogp_scraper.js'

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
}

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

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
    // Determine API URL based on model
    let apiUrl = 'http://localhost:11434/v1/chat/completions'
    if (modelId === 'hunyuan') {
      apiUrl = 'http://localhost:1234/v1/chat/completions'
    }
    
    const response = await axios.post(apiUrl, {
      model: modelId === 'hunyuan' ? 'hunyuan-a13b' : 'deepseek-r1',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise summaries. Generate a brief, informative summary in Japanese.'
        },
        {
          role: 'user',
          content: `Please create a summary for this bookmark:
URL: ${url}
Comment: ${comment}

Generate a concise summary (2-3 sentences) that captures the essence of what this bookmark is about.`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    })

    const summary = response.data.choices[0]?.message?.content || `Summary for: ${comment}`
    res.json({ summary })
  } catch (error) {
    console.error('DeepSeek API error:', error)
    res.json({ summary: `要約: ${comment}に関するブックマーク` })
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
    // const metadata = await processUrlMetadata(url, nodeId)
    // Temporary fallback for testing
    const metadata = { title: '', description: '', imageUrl: '' }
    res.json(metadata)
  } catch (error) {
    console.error('OGP scraping error:', error)
    res.json({ title: '', description: '', imageUrl: '' })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CreativeOS API server running on http://0.0.0.0:${PORT}`)
})
// 高度な要約生成システム
export interface SummaryOptions {
  maxLength?: number
  style?: 'concise' | 'detailed' | 'technical' | 'casual'
  language?: 'ja' | 'en'
  includeKeywords?: boolean
  contextAware?: boolean
}

export interface SummaryResult {
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  topics: string[]
  readingTime: number
  confidence: number
}

// 多段階要約プロセス
export async function generateAdvancedSummary(
  url: string,
  content: string,
  modelId: string,
  options: SummaryOptions = {}
): Promise<SummaryResult> {
  const {
    maxLength = 200,
    style = 'concise',
    language = 'ja',
    includeKeywords = true,
    contextAware = true
  } = options

  try {
    // ステップ1: コンテンツの前処理と構造化
    const structuredContent = await preprocessContent(content, url)
    
    // ステップ2: 多層要約の生成
    const multiLayerSummary = await generateMultiLayerSummary(
      structuredContent,
      modelId,
      style,
      language
    )
    
    // ステップ3: キーポイント抽出
    const keyPoints = await extractKeyPoints(structuredContent, modelId, language)
    
    // ステップ4: センチメント分析
    const sentiment = await analyzeSentiment(structuredContent, modelId)
    
    // ステップ5: トピック抽出
    const topics = await extractTopics(structuredContent, modelId, language)
    
    // ステップ6: 読書時間推定
    const readingTime = estimateReadingTime(content)
    
    // ステップ7: 信頼度計算
    const confidence = calculateConfidence(multiLayerSummary, structuredContent)
    
    return {
      summary: multiLayerSummary.slice(0, maxLength),
      keyPoints,
      sentiment,
      topics,
      readingTime,
      confidence
    }
  } catch (error) {
    console.error('Advanced summary generation failed:', error)
    
    // フォールバック: 基本的な要約
    const fallbackSummary = await generateFallbackSummary(content, modelId)
    
    return {
      summary: fallbackSummary,
      keyPoints: [],
      sentiment: 'neutral',
      topics: [],
      readingTime: estimateReadingTime(content),
      confidence: 0.5
    }
  }
}

// コンテンツの前処理と構造化
async function preprocessContent(content: string, url: string): Promise<string> {
  // HTMLタグの除去
  let cleaned = content.replace(/<[^>]*>/g, ' ')
  
  // 不要な空白の正規化
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  // URLの種類に基づく最適化
  if (url.includes('github.com')) {
    // GitHub: READMEやコードの構造を保持
    cleaned = optimizeForGitHub(cleaned)
  } else if (url.includes('wikipedia.org')) {
    // Wikipedia: セクション構造を保持
    cleaned = optimizeForWikipedia(cleaned)
  } else if (url.includes('arxiv.org')) {
    // 論文: アブストラクトと結論を重視
    cleaned = optimizeForPaper(cleaned)
  }
  
  return cleaned
}

// 多層要約の生成
async function generateMultiLayerSummary(
  content: string,
  modelId: string,
  style: string,
  language: string
): Promise<string> {
  const prompts = {
    ja: {
      concise: `以下のコンテンツを簡潔に要約してください。重要なポイントを3つ以内で：\n\n${content}`,
      detailed: `以下のコンテンツを詳細に要約してください。主要な論点と根拠を含めて：\n\n${content}`,
      technical: `以下のコンテンツを技術的観点から要約してください。手法、結果、応用について：\n\n${content}`,
      casual: `以下のコンテンツをわかりやすく要約してください。初心者にも理解できるように：\n\n${content}`
    },
    en: {
      concise: `Please provide a concise summary of the following content in 3 key points:\n\n${content}`,
      detailed: `Please provide a detailed summary including main arguments and evidence:\n\n${content}`,
      technical: `Please provide a technical summary focusing on methods, results, and applications:\n\n${content}`,
      casual: `Please provide an easy-to-understand summary for beginners:\n\n${content}`
    }
  }

  const prompt = prompts[language][style]
  
  const response = await fetch('/api/ollama-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300
    })
  })

  if (!response.ok) throw new Error('Summary generation failed')
  
  const data = await response.json()
  return data.message?.content || ''
}

// キーポイント抽出
async function extractKeyPoints(
  content: string,
  modelId: string,
  language: string
): Promise<string[]> {
  const prompts = {
    ja: `以下のコンテンツから最も重要な5つのポイントを箇条書きで抽出してください：\n\n${content}`,
    en: `Extract the 5 most important points from the following content as bullet points:\n\n${content}`
  }

  const response = await fetch('/api/ollama-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompts[language] }],
      temperature: 0.2
    })
  })

  if (!response.ok) return []
  
  const data = await response.json()
  const result = data.message?.content || ''
  
  // 箇条書きから配列に変換
  return result
    .split('\n')
    .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
    .map(line => line.replace(/^[•\-\s]+/, '').trim())
    .filter(point => point.length > 0)
    .slice(0, 5)
}

// センチメント分析
async function analyzeSentiment(
  content: string,
  modelId: string
): Promise<'positive' | 'negative' | 'neutral'> {
  const prompt = `以下のテキストの感情を「positive」「negative」「neutral」のいずれかで分類してください。理由は不要で、単語のみ回答してください：\n\n${content.slice(0, 500)}`

  try {
    const response = await fetch('/api/ollama-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })
    })

    if (!response.ok) return 'neutral'
    
    const data = await response.json()
    const result = data.message?.content?.toLowerCase().trim() || 'neutral'
    
    if (result.includes('positive')) return 'positive'
    if (result.includes('negative')) return 'negative'
    return 'neutral'
  } catch {
    return 'neutral'
  }
}

// トピック抽出
async function extractTopics(
  content: string,
  modelId: string,
  language: string
): Promise<string[]> {
  const prompts = {
    ja: `以下のコンテンツから主要なトピックを3〜5個のキーワードで抽出してください。カンマ区切りで：\n\n${content.slice(0, 1000)}`,
    en: `Extract 3-5 main topics from the following content as keywords, separated by commas:\n\n${content.slice(0, 1000)}`
  }

  try {
    const response = await fetch('/api/ollama-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompts[language] }],
        temperature: 0.2
      })
    })

    if (!response.ok) return []
    
    const data = await response.json()
    const result = data.message?.content || ''
    
    return result
      .split(/[,、]/)
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0 && topic.length < 50)
      .slice(0, 5)
  } catch {
    return []
  }
}

// 読書時間推定（日本語対応）
function estimateReadingTime(content: string): number {
  // 日本語: 400-600文字/分、英語: 200-250語/分
  const japaneseChars = (content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length
  const englishWords = content.replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '').split(/\s+/).length
  
  const japaneseTime = japaneseChars / 500 // 500文字/分
  const englishTime = englishWords / 225   // 225語/分
  
  return Math.ceil(japaneseTime + englishTime)
}

// 信頼度計算
function calculateConfidence(summary: string, originalContent: string): number {
  if (!summary || !originalContent) return 0
  
  // 要約の長さ比率（適切な圧縮率かチェック）
  const compressionRatio = summary.length / originalContent.length
  const optimalRatio = compressionRatio > 0.05 && compressionRatio < 0.3 ? 1 : 0.7
  
  // キーワードの保持率
  const originalWords = new Set(originalContent.toLowerCase().split(/\s+/))
  const summaryWords = new Set(summary.toLowerCase().split(/\s+/))
  const intersection = new Set([...summaryWords].filter(x => originalWords.has(x)))
  const keywordRetention = intersection.size / Math.min(originalWords.size, 50)
  
  return Math.min(0.9, (optimalRatio * 0.4 + keywordRetention * 0.6))
}

// フォールバック要約
async function generateFallbackSummary(content: string, modelId: string): Promise<string> {
  try {
    const response = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: content.slice(0, 2000),
        modelId
      })
    })

    if (!response.ok) throw new Error('Fallback failed')
    
    const data = await response.json()
    return data.summary || content.slice(0, 200) + '...'
  } catch {
    return content.slice(0, 200) + '...'
  }
}

// URL別最適化関数
function optimizeForGitHub(content: string): string {
  // README.mdの構造を保持
  const sections = content.split(/#{1,6}\s/)
  return sections.slice(0, 5).join('\n').slice(0, 3000)
}

function optimizeForWikipedia(content: string): string {
  // イントロダクションと主要セクションを保持
  const intro = content.split('\n')[0]
  return intro + '\n' + content.slice(0, 2000)
}

function optimizeForPaper(content: string): string {
  // アブストラクトと結論を重視
  const abstract = content.match(/abstract[:\s]+(.*?)(?=introduction|keywords)/is)?.[1] || ''
  const conclusion = content.match(/conclusion[:\s]+(.*?)(?=references|acknowledgment)/is)?.[1] || ''
  return (abstract + ' ' + conclusion).slice(0, 2000)
}
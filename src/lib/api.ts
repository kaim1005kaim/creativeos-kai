export async function generateSummary(url: string, comment: string, modelId?: string): Promise<string> {
  try {
    const response = await fetch('/api/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, comment, modelId }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate summary')
    }

    const { summary } = await response.json()
    return summary
  } catch (error) {
    console.error('Error generating summary:', error)
    return `Summary for: ${comment}`
  }
}

export async function generateTitle(url: string, comment: string, modelId?: string): Promise<string> {
  try {
    const response = await fetch('/api/title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, comment, modelId }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate title')
    }

    const { title } = await response.json()
    return title
  } catch (error) {
    console.error('Error generating title:', error)
    return comment.slice(0, 15)
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('/api/embedding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate embedding')
    }

    const { embedding } = await response.json()
    return embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    return new Array(384).fill(0)
  }
}

export async function getOGPMetadata(url: string, nodeId: string): Promise<{ title: string; description: string; imageUrl: string }> {
  try {
    const response = await fetch('/api/ogp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, nodeId }),
    })

    if (!response.ok) {
      throw new Error('Failed to get OGP metadata')
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting OGP metadata:', error)
    return { title: '', description: '', imageUrl: '' }
  }
}

// X投稿データ取得
export async function getXPostData(url: string) {
  try {
    const response = await fetch('/api/x-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error('Failed to get X post data')
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting X post data:', error)
    throw error
  }
}

// MCP経由でX投稿データ取得
export async function getXPostDataViaMCP(url: string) {
  try {
    const { fetchXPostDataViaMCPRobust } = await import('./x_from_mcp')
    return await fetchXPostDataViaMCPRobust(url)
  } catch (error) {
    console.error('Error getting X post data via MCP:', error)
    // フォールバックとして従来の方法を使用
    return await getXPostData(url)
  }
}

// タグ・カテゴリ抽出
export async function extractTags(text: string, url: string, modelId?: string): Promise<{
  category: string
  tags: string[]
  keywords: string[]
}> {
  try {
    const response = await fetch('/api/extract-tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, url, modelId }),
    })

    if (!response.ok) {
      throw new Error('Failed to extract tags')
    }

    return await response.json()
  } catch (error) {
    console.error('Error extracting tags:', error)
    return {
      category: 'その他',
      tags: ['情報'],
      keywords: ['コンテンツ']
    }
  }
}

// URL種別判定
export function isXPostUrl(url: string): boolean {
  return /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url)
}
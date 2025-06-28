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
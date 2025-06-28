import axios from 'axios'
import * as cheerio from 'cheerio'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

interface OGPData {
  title?: string
  description?: string
  image?: string
  url?: string
  siteName?: string
}

export async function scrapeOGP(url: string): Promise<OGPData> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    })

    const $ = cheerio.load(response.data)
    
    const ogp: OGPData = {
      title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
      description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      url: $('meta[property="og:url"]').attr('content') || url,
      siteName: $('meta[property="og:site_name"]').attr('content') || ''
    }

    return ogp
  } catch (error) {
    console.error('Failed to scrape OGP:', error)
    return { url }
  }
}

export async function downloadOGPImage(imageUrl: string, nodeId: string): Promise<string> {
  if (!imageUrl) return ''
  
  try {
    const cacheDir = join(__dirname, '../public/ogp_cache')
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true })
    }

    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    })

    const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
    const filename = `${nodeId}.${extension}`
    const filepath = join(cacheDir, filename)
    
    writeFileSync(filepath, response.data)
    
    return `/ogp_cache/${filename}`
  } catch (error) {
    console.error('Failed to download OGP image:', error)
    return ''
  }
}

export async function processUrlMetadata(url: string, nodeId: string): Promise<{ title: string; description: string; imageUrl: string }> {
  const ogp = await scrapeOGP(url)
  const imageUrl = ogp.image ? await downloadOGPImage(ogp.image, nodeId) : ''
  
  return {
    title: ogp.title || '',
    description: ogp.description || '',
    imageUrl
  }
}
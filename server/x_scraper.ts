import puppeteer from 'puppeteer'
import { XPostData } from '../src/types/XPostData.js'

export async function scrapeXPost(url: string): Promise<XPostData> {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ],
    timeout: 30000
  })

  try {
    const page = await browser.newPage()
    
    // User-Agent偽装でブロック回避
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    // Extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8'
    })

    // Navigate with improved error handling
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      })
      
      // Wait for content to load
      await page.waitForTimeout(2000)
    } catch (navigationError) {
      console.warn('Navigation failed, attempting alternative approach:', navigationError.message)
      // Try a simpler approach
      await page.goto(url, { 
        waitUntil: 'load',
        timeout: 10000 
      })
    }

    const postData = await page.evaluate((postUrl) => {
      // Extract post ID from URL
      const urlMatch = postUrl.match(/status\/(\d+)/)
      const postId = urlMatch ? urlMatch[1] : ''

      // Try to find the main tweet article
      const tweetArticle = document.querySelector('[data-testid="tweet"]') || 
                           document.querySelector('article[data-testid="tweet"]') ||
                           document.querySelector('div[data-testid="tweetText"]')?.closest('article')

      if (!tweetArticle) {
        throw new Error('Tweet content not found')
      }

      // Extract text content
      const textElement = tweetArticle.querySelector('[data-testid="tweetText"]')
      const text = textElement?.textContent?.trim() || ''

      // Extract author information
      const authorElement = tweetArticle.querySelector('[data-testid="User-Name"]') ||
                           tweetArticle.querySelector('div[data-testid="User-Names"]')
      
      let authorName = ''
      let authorUsername = ''
      
      if (authorElement) {
        const nameElements = authorElement.querySelectorAll('span')
        if (nameElements.length >= 2) {
          authorName = nameElements[0]?.textContent?.trim() || ''
          authorUsername = nameElements[1]?.textContent?.trim().replace('@', '') || ''
        }
      }

      // Extract author avatar
      const avatarElement = tweetArticle.querySelector('img[alt*="avatar" i]') ||
                           tweetArticle.querySelector('div[data-testid="Tweet-User-Avatar"] img') ||
                           tweetArticle.querySelector('img[src*="profile_images"]')
      const avatarUrl = avatarElement?.getAttribute('src') || ''

      // Extract images
      const imageElements = tweetArticle.querySelectorAll('img[src*="media"]')
      const images: string[] = []
      imageElements.forEach((img) => {
        const src = img.getAttribute('src')
        if (src && src.includes('media') && !src.includes('profile_images')) {
          images.push(src)
        }
      })

      // Extract video URL if present
      const videoElement = tweetArticle.querySelector('video')
      const videoUrl = videoElement?.getAttribute('src') || 
                      videoElement?.querySelector('source')?.getAttribute('src') || 
                      undefined

      // Extract timestamp
      const timeElement = tweetArticle.querySelector('time') ||
                         tweetArticle.querySelector('[data-testid="Time"]')
      const createdAt = timeElement?.getAttribute('datetime') || new Date().toISOString()

      return {
        id: postId,
        url: postUrl,
        author: {
          name: authorName,
          username: authorUsername,
          avatarUrl: avatarUrl
        },
        text: text,
        images: images.slice(0, 4), // 最大4枚
        videoUrl: videoUrl,
        createdAt: createdAt
      }
    }, url)

    return postData as XPostData
  } catch (error) {
    console.error('Error scraping X post:', error)
    throw new Error(`Failed to scrape X post: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    await browser.close()
  }
}

// Fallback function using a simpler approach
export async function scrapeXPostSimple(url: string): Promise<XPostData> {
  try {
    // Extract post ID from URL for basic fallback
    const urlMatch = url.match(/status\/(\d+)/)
    const postId = urlMatch ? urlMatch[1] : crypto.randomUUID()
    
    return {
      id: postId,
      url: url,
      author: {
        name: 'X User',
        username: 'unknown',
        avatarUrl: ''
      },
      text: 'X投稿の内容を取得できませんでした。手動でコメントを追加してください。',
      images: [],
      videoUrl: undefined,
      createdAt: new Date().toISOString()
    }
  } catch (error) {
    throw new Error('Failed to process X post URL')
  }
}
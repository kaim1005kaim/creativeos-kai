import { XPostData } from '../src/types/XPostData.js'

// Twitter API v2 configuration (placeholder for future implementation)
interface TwitterAPIConfig {
  apiKey: string
  apiSecret: string
  bearerToken: string
}

class TwitterAPI {
  private config: TwitterAPIConfig

  constructor(config: TwitterAPIConfig) {
    this.config = config
  }

  // Future implementation: Get tweet by ID using Twitter API v2
  async getTweetById(tweetId: string): Promise<XPostData> {
    // Placeholder implementation
    // In the future, this would make actual API calls to Twitter API v2
    throw new Error('Twitter API v2 integration not yet implemented. Please use the scraper method.')
  }

  // Future implementation: Get user information
  async getUserById(userId: string) {
    throw new Error('Twitter API v2 integration not yet implemented.')
  }

  // Future implementation: Search tweets
  async searchTweets(query: string) {
    throw new Error('Twitter API v2 integration not yet implemented.')
  }
}

// Factory function for creating Twitter API instance
export function createTwitterAPI(): TwitterAPI | null {
  const apiKey = process.env.X_API_KEY
  const apiSecret = process.env.X_API_SECRET
  const bearerToken = process.env.X_BEARER_TOKEN

  if (!apiKey || !apiSecret || !bearerToken) {
    console.warn('Twitter API credentials not found. Using scraper fallback.')
    return null
  }

  return new TwitterAPI({
    apiKey,
    apiSecret,
    bearerToken
  })
}

// Helper function to extract tweet ID from URL
export function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
  return match ? match[1] : null
}

// Check if URL is a Twitter/X post
export function isXPostUrl(url: string): boolean {
  return /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url)
}
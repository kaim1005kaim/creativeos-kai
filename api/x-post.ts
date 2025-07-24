import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';

// X/Twitter post URL patterns
const X_POST_PATTERN = /(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/;

// Nitter instances (multiple for redundancy)
const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.cz',
  'https://nitter.poast.org'
];

interface XPostData {
  id: string;
  url: string;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
  };
  text: string;
  images: string[];
  videoUrl?: string;
  createdAt: string;
}

async function fetchFromNitter(username: string, tweetId: string): Promise<XPostData | null> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const nitterUrl = `${instance}/${username}/status/${tweetId}`;
      console.log(`Trying Nitter instance: ${nitterUrl}`);
      
      const response = await axios.get(nitterUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract tweet content using cheerio
      const tweetContent = $('.tweet-content').first().text().trim();
      const authorUsername = $('.username').first().text().replace('@', '').trim();
      const authorName = $('.fullname').first().text().trim();
      const tweetDate = $('.tweet-date a').first().attr('title') || '';
      
      // Extract images
      const images: string[] = [];
      $('.still-image').each((i, elem) => {
        const imgUrl = $(elem).attr('href');
        if (imgUrl && images.length < 4) {
          images.push(imgUrl.startsWith('http') ? imgUrl : `${instance}${imgUrl}`);
        }
      });
      
      // Extract video if present
      let videoUrl: string | undefined;
      const videoElem = $('video source').first();
      if (videoElem.length) {
        const vidUrl = videoElem.attr('src');
        if (vidUrl) {
          videoUrl = vidUrl.startsWith('http') ? vidUrl : `${instance}${vidUrl}`;
        }
      }
      
      if (tweetContent && authorUsername) {
        return {
          id: tweetId,
          url: `https://x.com/${username}/status/${tweetId}`,
          author: {
            name: authorName || authorUsername,
            username: authorUsername,
            avatarUrl: ''
          },
          text: tweetContent,
          images,
          videoUrl,
          createdAt: tweetDate ? new Date(tweetDate).toISOString() : new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Failed to fetch from ${instance}:`, error);
      continue;
    }
  }
  
  return null;
}

// Fallback: Use Twitter oEmbed API (limited but official)
async function fetchFromOEmbed(url: string): Promise<XPostData | null> {
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const response = await axios.get(oembedUrl, {
      timeout: 5000
    });

    const data = response.data;
    const match = url.match(X_POST_PATTERN);
    
    if (data && match) {
      const [, username, tweetId] = match;
      
      // Parse HTML from oEmbed using cheerio
      const $ = cheerio.load(data.html);
      const text = $('p').first().text().trim();
      
      return {
        id: tweetId,
        url,
        author: {
          name: data.author_name || username,
          username: username,
          avatarUrl: ''
        },
        text: text || '',
        images: [],
        createdAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('oEmbed fetch failed:', error);
  }
  
  return null;
}

// Alternative: Use FixTweet API (returns JSON)
async function fetchFromFixTweet(url: string): Promise<XPostData | null> {
  try {
    // Convert URL to fxtwitter.com format
    const fxtwitterUrl = url.replace(/(?:twitter\.com|x\.com)/, 'api.fxtwitter.com');
    console.log(`Trying FixTweet API: ${fxtwitterUrl}`);
    
    const response = await axios.get(fxtwitterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bot)'
      },
      timeout: 5000
    });

    const data = response.data;
    
    if (data && data.tweet) {
      const tweet = data.tweet;
      
      return {
        id: tweet.id,
        url: tweet.url || url,
        author: {
          name: tweet.author?.name || '',
          username: tweet.author?.screen_name || '',
          avatarUrl: tweet.author?.avatar_url || ''
        },
        text: tweet.text || '',
        images: tweet.media?.photos?.map((p: any) => p.url) || [],
        videoUrl: tweet.media?.videos?.[0]?.url,
        createdAt: tweet.created_at || new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('FixTweet fetch failed:', error);
  }
  
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  try {
    const match = url.match(X_POST_PATTERN);
    if (!match) {
      return res.status(400).json({ error: 'Invalid X/Twitter post URL' });
    }

    const [, username, tweetId] = match;
    console.log(`Fetching X post: ${username}/status/${tweetId}`);

    // Try multiple methods in order of preference
    let postData = await fetchFromFixTweet(url);
    
    if (!postData) {
      console.log('FixTweet failed, trying Nitter...');
      postData = await fetchFromNitter(username, tweetId);
    }
    
    if (!postData) {
      console.log('Nitter failed, trying oEmbed...');
      postData = await fetchFromOEmbed(url);
    }

    if (!postData) {
      // Final fallback: return basic structure
      postData = {
        id: tweetId,
        url,
        author: {
          name: username,
          username: username,
          avatarUrl: ''
        },
        text: 'X post content could not be fetched',
        images: [],
        createdAt: new Date().toISOString()
      };
    }

    res.status(200).json(postData);
  } catch (error) {
    console.error('X post fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch X post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
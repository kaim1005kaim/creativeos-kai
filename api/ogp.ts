import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchOGPData(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    
    const ogpData = {
      title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
      description: $('meta[property="og:description"]').attr('content') || 
                   $('meta[name="description"]').attr('content') || '',
      imageUrl: $('meta[property="og:image"]').attr('content') || ''
    };

    // 相対URLを絶対URLに変換
    if (ogpData.imageUrl && !ogpData.imageUrl.startsWith('http')) {
      const urlObj = new URL(url);
      ogpData.imageUrl = new URL(ogpData.imageUrl, urlObj.origin).href;
    }

    return ogpData;
  } catch (error) {
    console.error('OGP fetch error:', error);
    return { title: '', description: '', imageUrl: '' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, nodeId } = req.body;

  try {
    const metadata = await fetchOGPData(url);
    res.status(200).json(metadata);
  } catch (error) {
    console.error('OGP scraping error:', error);
    res.status(200).json({ title: '', description: '', imageUrl: '' });
  }
}
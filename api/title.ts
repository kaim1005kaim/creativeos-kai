import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-7a36628f15fc4f0b883071fbedaae7e0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, comment, modelId = 'deepseek' } = req.body;

  try {
    // Determine API URL and headers based on model
    let apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    let headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    };
    
    if (modelId === 'hunyuan') {
      return res.status(400).json({ error: 'Hunyuan model not supported in Vercel deployment' });
    }
    
    const response = await axios.post(apiUrl, {
      model: 'deepseek-chat',
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
    }, { headers });

    let title = response.data.choices[0]?.message?.content?.trim() || comment.slice(0, 25);
    
    // Aggressively remove <think> tags and any remaining artifacts
    title = title.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    title = title.replace(/<think>[\s\S]*/g, '').trim(); // Handle unclosed think tags
    title = title.replace(/^[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u0041-\u005A\u0061-\u007A\u0030-\u0039]+/, '').trim(); // Remove leading non-Japanese/alphanumeric chars
    
    // If title is empty, contains only symbols, or starts with think-related text, use comment
    if (!title || title.length === 0 || title.toLowerCase().includes('think') || title.match(/^[^a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/)) {
      title = comment.slice(0, 25);
    }
    
    // Ensure title is not too long
    if (title.length > 25) {
      title = title.slice(0, 25);
    }
    
    res.status(200).json({ title });
  } catch (error) {
    console.error('Title generation API error:', error);
    res.status(500).json({ title: comment.slice(0, 25) });
  }
}
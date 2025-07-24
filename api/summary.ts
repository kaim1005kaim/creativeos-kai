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
          content: 'あなたは有用なアシスタントです。簡潔で情報豊富な要約を日本語で生成してください。'
        },
        {
          role: 'user',
          content: `このブックマークの要約を作成してください:
URL: ${url}
コメント: ${comment}

このブックマークが何についてのものか本質を捉えた、簡潔な要約（3-4文）を生成してください。技術的な内容の場合は、具体的な技術名やキーワードを含めてください。`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, { headers });

    let summary = response.data.choices[0]?.message?.content || `要約: ${comment}に関するブックマーク`;
    
    // Remove <think> tags and their content
    summary = summary.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    res.status(200).json({ summary });
  } catch (error) {
    console.error('DeepSeek API error:', error);
    res.status(500).json({ summary: `要約: ${comment}に関するブックマーク` });
  }
}
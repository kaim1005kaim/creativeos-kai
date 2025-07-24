import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-7a36628f15fc4f0b883071fbedaae7e0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, url, modelId = 'deepseek-r1' } = req.body;

  try {
    const prompt = `以下のコンテンツを分析して、適切なタグとカテゴリを抽出してください。

コンテンツ:
"${text}"

URL: ${url}

以下の形式でJSONを返してください：
{
  "category": "主要カテゴリ（技術、ビジネス、学習、エンタメ、ライフスタイル、ニュース、その他から選択）",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "keywords": ["キーワード1", "キーワード2", "キーワード3"]
}

注意：
- タグは3-5個、簡潔で検索しやすいものを選択
- カテゴリは必ず指定した中から選択
- キーワードは重要な概念や用語を抽出
- 日本語と英語を混在させても構いません
- JSONフォーマット以外は出力しないでください`;

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      }
    });
    
    const content = response.data.choices[0].message.content.trim();
    
    try {
      // JSONを抽出してパース
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const result = JSON.parse(jsonStr);
      
      res.status(200).json(result);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // フォールバック結果
      res.status(200).json({
        category: "その他",
        tags: ["情報", "参考"],
        keywords: ["コンテンツ"]
      });
    }
  } catch (error) {
    console.error('Tag extraction error:', error);
    res.status(500).json({
      category: "その他", 
      tags: ["情報"],
      keywords: ["コンテンツ"]
    });
  }
}
import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-7a36628f15fc4f0b883071fbedaae7e0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, url, modelId = 'deepseek-r1' } = req.body;

  try {
    const prompt = `以下のコンテンツを分析して、階層的で統合的なタグとカテゴリを抽出してください。

コンテンツ:
"${text}"

URL: ${url}

以下の形式でJSONを返してください：
{
  "category": "主要カテゴリ（AI/機械学習、フロントエンド、バックエンド、デザイン、映像制作、ゲーム開発、データサイエンス、インフラ、モバイル、その他から選択）",
  "tags": ["統合タグ1", "統合タグ2", "統合タグ3"],
  "keywords": ["具体的キーワード1", "具体的キーワード2"]
}

タグ抽出ルール：
1. 具体的なツール名は避け、技術分野で統合する
   例: "After Effects, Premiere" → "映像編集"
   例: "React, Vue, Angular" → "フロントエンド"
   例: "TensorFlow, PyTorch" → "機械学習"

2. 階層を意識して上位概念を使用
   例: "VFX, モーション, 3DCG" → "映像制作"
   例: "UI, UX, デザインシステム" → "デザイン"

3. タグは2-3個に絞り、関連性の高いノード同士が繋がるように
4. 同じ技術領域は必ず共通タグを持つようにする
5. JSONフォーマット以外は出力しないでください`;

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
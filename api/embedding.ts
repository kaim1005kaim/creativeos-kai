import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  try {
    // Vercelデプロイでは、簡単なダミーembeddingを返す
    // 実際のembeddingサービスを使用する場合は、外部APIを呼び出す必要があります
    const dummyEmbedding = new Array(384).fill(0).map(() => Math.random() - 0.5);
    
    res.status(200).json({ embedding: dummyEmbedding });
  } catch (error) {
    console.error('Embedding API error:', error);
    const dummyEmbedding = new Array(384).fill(0).map(() => Math.random() - 0.5);
    res.status(200).json({ embedding: dummyEmbedding });
  }
}
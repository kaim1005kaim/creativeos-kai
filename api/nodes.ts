import { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_PATH = path.join(DATA_DIR, 'nodes.json');

interface ThoughtNode {
  id: string;
  url: string;
  ogpImageUrl: string;
  comment: string;
  summary: string;
  embedding: number[];
  createdAt: number;
  position: [number, number, number];
  linkedNodeIds: string[];
  tags?: string[];
  category?: string;
  type?: 'default' | 'x-post';
}

async function loadNodes(): Promise<ThoughtNode[]> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // ファイルが存在しない場合は空配列を返す
    return [];
  }
}

async function saveNodes(nodes: ThoughtNode[]): Promise<void> {
  try {
    // データディレクトリが存在しない場合は作成
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(nodes, null, 2));
  } catch (error) {
    console.error('Failed to save nodes:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const nodes = await loadNodes();
      res.status(200).json(nodes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load nodes' });
    }
  } else if (req.method === 'POST') {
    try {
      const nodes = req.body;
      await saveNodes(nodes);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save nodes' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
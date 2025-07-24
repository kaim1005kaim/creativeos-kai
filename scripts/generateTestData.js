// パフォーマンステスト用大量データ生成スクリプト
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testUrls = [
  'https://github.com/microsoft/vscode',
  'https://github.com/facebook/react',
  'https://github.com/vercel/next.js',
  'https://github.com/nodejs/node',
  'https://github.com/microsoft/TypeScript',
  'https://github.com/vuejs/vue',
  'https://github.com/angular/angular',
  'https://github.com/sveltejs/svelte',
  'https://www.npmjs.com/package/express',
  'https://www.npmjs.com/package/lodash',
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  'https://developer.mozilla.org/en-US/docs/Web/API',
  'https://docs.python.org/3/',
  'https://pytorch.org/',
  'https://tensorflow.org/',
  'https://scikit-learn.org/',
  'https://pandas.pydata.org/',
  'https://numpy.org/',
  'https://matplotlib.org/',
  'https://jupyter.org/'
];

const testComments = [
  'JavaScriptフレームワークの学習',
  'パフォーマンス最適化のリサーチ',
  'APIドキュメントの確認',
  'ライブラリの比較検討',
  'ベストプラクティスの調査',
  'コードサンプルの収集',
  'チュートリアルの完了',
  'バグ修正のリファレンス',
  '新機能の実装参考',
  'アーキテクチャ設計の参考'
];

function generateRandomEmbedding() {
  return Array.from({ length: 384 }, () => Math.random() - 0.5);
}

function generateRandomPosition() {
  const radius = 10;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  ];
}

function generateTestNodes(count = 100) {
  const nodes = [];
  const baseTime = Date.now() - (count * 24 * 60 * 60 * 1000); // 過去count日分
  
  for (let i = 0; i < count; i++) {
    const url = testUrls[Math.floor(Math.random() * testUrls.length)];
    const comment = testComments[Math.floor(Math.random() * testComments.length)];
    
    const node = {
      id: `test-node-${i + 1}`,
      url: `${url}?ref=test-${i}`, // URLを一意にする
      ogpImageUrl: '',
      comment: `${comment} #${i + 1}`,
      summary: `これは${comment}に関するブックマークです。テストデータとして生成されました（${i + 1}/${count}）。`,
      embedding: generateRandomEmbedding(),
      createdAt: baseTime + (i * 24 * 60 * 60 * 1000) + Math.random() * 24 * 60 * 60 * 1000,
      position: generateRandomPosition(),
      linkedNodeIds: []
    };
    
    nodes.push(node);
  }
  
  // ランダムに関連付けを追加
  for (let i = 0; i < nodes.length; i++) {
    const linkCount = Math.floor(Math.random() * 5); // 0-4個の関連
    for (let j = 0; j < linkCount; j++) {
      const targetIndex = Math.floor(Math.random() * nodes.length);
      if (targetIndex !== i && !nodes[i].linkedNodeIds.includes(nodes[targetIndex].id)) {
        nodes[i].linkedNodeIds.push(nodes[targetIndex].id);
      }
    }
  }
  
  return nodes;
}

// テストデータを生成
const testData = {
  small: generateTestNodes(50),
  medium: generateTestNodes(200),
  large: generateTestNodes(500),
  xlarge: generateTestNodes(1000)
};

// データフォルダが存在しない場合は作成
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// テストデータファイルを保存
Object.entries(testData).forEach(([size, data]) => {
  const filename = path.join(dataDir, `test-nodes-${size}.json`);
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`Generated ${data.length} test nodes: ${filename}`);
});

console.log('Test data generation completed!');
console.log('Use these files to test performance:');
console.log('- test-nodes-small.json (50 nodes)');
console.log('- test-nodes-medium.json (200 nodes)');
console.log('- test-nodes-large.json (500 nodes)');
console.log('- test-nodes-xlarge.json (1000 nodes)');
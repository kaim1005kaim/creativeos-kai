import { ThoughtNode } from '../types/ThoughtNode'

// Generate realistic embedding vectors for tech categories
function generateTechEmbedding(category: 'ai' | 'frontend' | 'backend' | 'build' | 'design' | 'cloud', baseVector?: number[]): number[] {
  const embedding = new Array(384).fill(0)
  
  // Base patterns for different tech categories
  const patterns = {
    ai: { start: 0, strength: 0.8, secondary: [100, 200] },
    frontend: { start: 50, strength: 0.7, secondary: [150, 250] },
    backend: { start: 100, strength: 0.8, secondary: [200, 300] },
    build: { start: 150, strength: 0.6, secondary: [50, 350] },
    design: { start: 200, strength: 0.7, secondary: [250, 50] },
    cloud: { start: 300, strength: 0.8, secondary: [100, 150] }
  }
  
  const pattern = patterns[category]
  
  // Primary cluster
  for (let i = pattern.start; i < pattern.start + 50 && i < 384; i++) {
    embedding[i] = (Math.random() - 0.3) * pattern.strength
  }
  
  // Secondary clusters for similarity
  pattern.secondary.forEach(start => {
    for (let i = start; i < start + 20 && i < 384; i++) {
      embedding[i] = (Math.random() - 0.4) * (pattern.strength * 0.6)
    }
  })
  
  // Add some noise
  for (let i = 0; i < 384; i++) {
    embedding[i] += (Math.random() - 0.5) * 0.1
  }
  
  return embedding
}

// Mock data for demo purposes
const MOCK_NODES: ThoughtNode[] = [
  {
    id: "sample-01",
    url: "https://github.com/anthropics/claude-code",
    ogpImageUrl: "",
    comment: "Claude Code - AI-powered coding assistant",
    title: "Claude Code",
    summary: "GitHubで公開されているClaude Codeは、AI支援によるコーディングツールです。開発者の生産性向上を目的として設計されています。",
    embedding: generateTechEmbedding('ai'),
    createdAt: Date.now() - 86400000,
    position: [2, 0, 3],
    linkedNodeIds: ["sample-05"]
  },
  {
    id: "sample-05", 
    url: "https://react.dev",
    ogpImageUrl: "",
    comment: "React - ユーザーインターフェース構築のためのライブラリ",
    title: "React",
    summary: "Reactは、Facebookが開発したJavaScriptライブラリで、ユーザーインターフェースの構築に特化しています。コンポーネントベースの設計により、再利用可能で保守しやすいコードを書くことができます。",
    embedding: generateTechEmbedding('frontend'),
    createdAt: Date.now() - 43200000,
    position: [-2, 1, -1],
    linkedNodeIds: ["sample-01"]
  },
  {
    id: "sample-09",
    url: "https://vitejs.dev",
    ogpImageUrl: "",
    comment: "Vite - 高速なフロントエンドビルドツール",
    title: "Vite",
    summary: "Viteは、現代的なフロントエンド開発のための高速なビルドツールです。ESモジュールを活用し、開発時の高速なHMRと本番環境での最適化を実現しています。",
    embedding: generateTechEmbedding('build'),
    createdAt: Date.now() - 21600000,
    position: [0, -2, 2],
    linkedNodeIds: ["sample-05"]
  },
  {
    id: "sample-02", 
    url: "https://nextjs.org",
    ogpImageUrl: "",
    comment: "Next.js - React フレームワーク",
    title: "Next.js",
    summary: "Next.jsは、本番環境対応のReactフレームワークで、SSR、SSG、APIルートなどの機能を提供します。",
    embedding: generateTechEmbedding('frontend'),
    createdAt: Date.now() - 75600000,
    position: [3, 2, -2],
    linkedNodeIds: ["sample-01", "sample-05"]
  },
  {
    id: "sample-06",
    url: "https://tailwindcss.com",
    ogpImageUrl: "",
    comment: "Tailwind CSS - ユーティリティファーストCSSフレームワーク",
    title: "Tailwind CSS",
    summary: "Tailwind CSSは、高度にカスタマイズ可能な低レベルCSSフレームワークです。",
    embedding: generateTechEmbedding('frontend'),
    createdAt: Date.now() - 54000000,
    position: [-3, -1, 1],
    linkedNodeIds: ["sample-02"]
  },
  {
    id: "sample-0a",
    url: "https://threejs.org",
    ogpImageUrl: "",
    comment: "Three.js - JavaScript 3Dライブラリ",
    title: "Three.js",
    summary: "Three.jsは、WebGLを使用してブラウザで3Dグラフィックスを作成するためのJavaScriptライブラリです。",
    embedding: generateTechEmbedding('frontend'),
    createdAt: Date.now() - 32400000,
    position: [1, 3, 0],
    linkedNodeIds: ["sample-09"]
  },
  {
    id: "sample-03",
    url: "https://www.typescriptlang.org",
    ogpImageUrl: "",
    comment: "TypeScript - 型安全なJavaScript",
    title: "TypeScript",
    summary: "TypeScriptは、Microsoftが開発したJavaScriptに静的型定義を追加したプログラミング言語です。",
    embedding: generateTechEmbedding('frontend'),
    createdAt: Date.now() - 64800000,
    position: [-1, -3, -1],
    linkedNodeIds: ["sample-05", "sample-02"]
  },
  {
    id: "sample-07",
    url: "https://nodejs.org",
    ogpImageUrl: "",
    comment: "Node.js - JavaScript実行環境",
    title: "Node.js",
    summary: "Node.jsは、Chrome V8 JavaScriptエンジンで動作するJavaScript実行環境です。",
    embedding: generateTechEmbedding('backend'),
    createdAt: Date.now() - 46800000,
    position: [2, -1, -3],
    linkedNodeIds: ["sample-03", "sample-02"]
  },
  {
    id: "sample-0b",
    url: "https://vercel.com",
    ogpImageUrl: "",
    comment: "Vercel - フロントエンドデプロイプラットフォーム",
    title: "Vercel",
    summary: "Vercelは、静的サイトやサーバーレス関数のホスティングに特化したクラウドプラットフォームです。",
    embedding: generateTechEmbedding('cloud'),
    createdAt: Date.now() - 25200000,
    position: [-2, 2, 3],
    linkedNodeIds: ["sample-02", "sample-07"]
  },
  {
    id: "sample-04",
    url: "https://www.figma.com",
    ogpImageUrl: "",
    comment: "Figma - デザインコラボレーションツール",
    title: "Figma",
    summary: "Figmaは、ブラウザベースのUIデザインツールで、リアルタイムコラボレーション機能を提供します。",
    embedding: generateTechEmbedding('design'),
    createdAt: Date.now() - 57600000,
    position: [0, 1, -2],
    linkedNodeIds: ["sample-06", "sample-0b"]
  }
]

export function useMockData(): ThoughtNode[] {
  return MOCK_NODES
}
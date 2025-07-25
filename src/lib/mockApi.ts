import { ThoughtNode } from '../types/ThoughtNode'

// Generate realistic embedding vectors for tech categories with better similarity control
function generateTechEmbedding(category: 'ai' | 'frontend' | 'backend' | 'build' | 'design' | 'cloud', subCategory?: string): number[] {
  const embedding = new Array(384).fill(0)
  
  // Define category relationships and similarities
  const patterns = {
    ai: { 
      start: 0, 
      strength: 0.9, 
      secondary: [100, 200],
      related: [] // AI is unique
    },
    frontend: { 
      start: 50, 
      strength: 0.8, 
      secondary: [150, 250],
      related: ['build', 'design'] // Frontend relates to build tools and design
    },
    backend: { 
      start: 100, 
      strength: 0.9, 
      secondary: [200, 300],
      related: ['cloud'] // Backend relates to cloud/deployment
    },
    build: { 
      start: 150, 
      strength: 0.7, 
      secondary: [50, 350],
      related: ['frontend'] // Build tools relate to frontend
    },
    design: { 
      start: 200, 
      strength: 0.8, 
      secondary: [250, 50],
      related: ['frontend'] // Design relates to frontend
    },
    cloud: { 
      start: 300, 
      strength: 0.9, 
      secondary: [100, 150],
      related: ['backend'] // Cloud relates to backend
    }
  }
  
  const pattern = patterns[category]
  
  // Primary cluster - stronger signal for category
  for (let i = pattern.start; i < pattern.start + 60 && i < 384; i++) {
    embedding[i] = (Math.random() - 0.2) * pattern.strength
  }
  
  // Secondary clusters for similarity
  pattern.secondary.forEach(start => {
    for (let i = start; i < start + 30 && i < 384; i++) {
      embedding[i] = (Math.random() - 0.3) * (pattern.strength * 0.7)
    }
  })
  
  // Add cross-category similarity for related technologies
  pattern.related.forEach(relatedCat => {
    const relatedPattern = patterns[relatedCat as keyof typeof patterns]
    const crossStart = relatedPattern.start + 20
    for (let i = crossStart; i < crossStart + 15 && i < 384; i++) {
      embedding[i] = (Math.random() - 0.4) * (pattern.strength * 0.4)
    }
  })
  
  // Sub-category specialization for frontend technologies
  if (category === 'frontend' && subCategory) {
    const subPatterns: Record<string, number> = {
      'react': 60,
      'styling': 70, 
      '3d': 80,
      'types': 90,
      'framework': 65
    }
    
    const subStart = subPatterns[subCategory] || 60
    for (let i = subStart; i < subStart + 10 && i < 384; i++) {
      embedding[i] = (Math.random() - 0.2) * 0.6
    }
  }
  
  // Reduce noise for more consistent similarity
  for (let i = 0; i < 384; i++) {
    embedding[i] += (Math.random() - 0.5) * 0.05
  }
  
  return embedding
}

// Generate more natural 3D positions using spherical coordinates
function generateNaturalPosition(index: number, total: number): [number, number, number] {
  const phi = Math.acos(1 - 2 * (index + 0.5) / total) // Latitude
  const theta = Math.PI * (1 + Math.sqrt(5)) * index // Longitude (golden angle)
  const radius = 4 + Math.random() * 2 // Varying radius
  
  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi) * Math.sin(theta) 
  const z = radius * Math.cos(phi)
  
  return [x, y, z]
}

// Create nodes with natural positions and unified tags for better connectivity
const nodeData = [
  { id: "sample-01", url: "https://github.com/anthropics/claude-code", comment: "Claude Code - AI-powered coding assistant", title: "Claude Code", summary: "GitHubで公開されているClaude Codeは、AI支援によるコーディングツールです。開発者の生産性向上を目的として設計されています。", category: 'AI/機械学習' as const, tags: ['AI', '開発支援'], subCategory: undefined, links: ["sample-05"] },
  { id: "sample-05", url: "https://react.dev", comment: "React - ユーザーインターフェース構築のためのライブラリ", title: "React", summary: "Reactは、Facebookが開発したJavaScriptライブラリで、ユーザーインターフェースの構築に特化しています。コンポーネントベースの設計により、再利用可能で保守しやすいコードを書くことができます。", category: 'フロントエンド' as const, tags: ['フロントエンド', 'JavaScript'], subCategory: 'react', links: ["sample-01"] },
  { id: "sample-02", url: "https://nextjs.org", comment: "Next.js - React フレームワーク", title: "Next.js", summary: "Next.jsは、本番環境対応のReactフレームワークで、SSR、SSG、APIルートなどの機能を提供します。", category: 'フロントエンド' as const, tags: ['フロントエンド', 'JavaScript'], subCategory: 'framework', links: ["sample-01", "sample-05"] },
  { id: "sample-03", url: "https://www.typescriptlang.org", comment: "TypeScript - 型安全なJavaScript", title: "TypeScript", summary: "TypeScriptは、Microsoftが開発したJavaScriptに静的型定義を追加したプログラミング言語です。", category: 'フロントエンド' as const, tags: ['フロントエンド', 'JavaScript'], subCategory: 'types', links: ["sample-05", "sample-02"] },
  { id: "sample-06", url: "https://tailwindcss.com", comment: "Tailwind CSS - ユーティリティファーストCSSフレームワーク", title: "Tailwind CSS", summary: "Tailwind CSSは、高度にカスタマイズ可能な低レベルCSSフレームワークです。", category: 'デザイン' as const, tags: ['デザイン', 'CSS'], subCategory: 'styling', links: ["sample-02"] },
  { id: "sample-0a", url: "https://threejs.org", comment: "Three.js - JavaScript 3Dライブラリ", title: "Three.js", summary: "Three.jsは、WebGLを使用してブラウザで3Dグラフィックスを作成するためのJavaScriptライブラリです。", category: 'フロントエンド' as const, tags: ['フロントエンド', '3DCG'], subCategory: '3d', links: ["sample-09"] },
  { id: "sample-09", url: "https://vitejs.dev", comment: "Vite - 高速なフロントエンドビルドツール", title: "Vite", summary: "Viteは、現代的なフロントエンド開発のための高速なビルドツールです。ESモジュールを活用し、開発時の高速なHMRと本番環境での最適化を実現しています。", category: 'インフラ' as const, tags: ['ビルドツール', 'フロントエンド'], subCategory: undefined, links: ["sample-05"] },
  { id: "sample-07", url: "https://nodejs.org", comment: "Node.js - JavaScript実行環境", title: "Node.js", summary: "Node.jsは、Chrome V8 JavaScriptエンジンで動作するJavaScript実行環境です。", category: 'バックエンド' as const, tags: ['バックエンド', 'JavaScript'], subCategory: undefined, links: ["sample-03", "sample-02"] },
  { id: "sample-0b", url: "https://vercel.com", comment: "Vercel - フロントエンドデプロイプラットフォーム", title: "Vercel", summary: "Vercelは、静的サイトやサーバーレス関数のホスティングに特化したクラウドプラットフォームです。", category: 'インフラ' as const, tags: ['クラウド', 'デプロイ'], subCategory: undefined, links: ["sample-02", "sample-07"] },
  { id: "sample-04", url: "https://www.figma.com", comment: "Figma - デザインコラボレーションツール", title: "Figma", summary: "Figmaは、ブラウザベースのUIデザインツールで、リアルタイムコラボレーション機能を提供します。", category: 'デザイン' as const, tags: ['デザイン', 'UI/UX'], subCategory: undefined, links: ["sample-06", "sample-0b"] }
]

// Mock data for demo purposes
const MOCK_NODES: ThoughtNode[] = nodeData.map((data, index) => ({
  id: data.id,
  url: data.url,
  ogpImageUrl: "",
  comment: data.comment,
  title: data.title,
  summary: data.summary,
  embedding: generateTechEmbedding(data.category === 'AI/機械学習' ? 'ai' : 
                                  data.category === 'フロントエンド' ? 'frontend' :
                                  data.category === 'バックエンド' ? 'backend' :
                                  data.category === 'デザイン' ? 'design' :
                                  data.category === 'インフラ' ? 'cloud' : 'frontend', 
                                  data.subCategory),
  createdAt: Date.now() - (86400000 - index * 7200000),
  position: generateNaturalPosition(index, nodeData.length),
  linkedNodeIds: data.links,
  tags: data.tags,
  category: data.category
}))

export function useMockData(): ThoughtNode[] {
  return MOCK_NODES
}
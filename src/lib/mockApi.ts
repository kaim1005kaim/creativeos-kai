import { ThoughtNode } from '../types/ThoughtNode'

// Mock data for demo purposes
const MOCK_NODES: ThoughtNode[] = [
  {
    id: "sample-01",
    url: "https://github.com/anthropics/claude-code",
    ogpImageUrl: "",
    comment: "Claude Code - AI-powered coding assistant",
    title: "Claude Code",
    summary: "GitHubで公開されているClaude Codeは、AI支援によるコーディングツールです。開発者の生産性向上を目的として設計されています。",
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
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
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
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
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
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
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
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
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
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
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
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
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
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
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
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
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
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
    embedding: Array.from({length: 384}, () => Math.random() - 0.5),
    createdAt: Date.now() - 57600000,
    position: [0, 1, -2],
    linkedNodeIds: ["sample-06", "sample-0b"]
  }
]

export function useMockData(): ThoughtNode[] {
  return MOCK_NODES
}
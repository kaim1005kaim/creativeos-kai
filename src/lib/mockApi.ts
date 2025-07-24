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
  }
]

export function useMockData(): ThoughtNode[] {
  return MOCK_NODES
}
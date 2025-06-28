export type ThoughtNode = {
  id: string
  url: string
  ogpImageUrl: string
  comment: string
  summary: string
  embedding: number[]
  createdAt: number
  position: [number, number, number]
  linkedNodeIds: string[]
}
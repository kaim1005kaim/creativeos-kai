export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length')
  }

  const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0)
  
  const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0))
  const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0))
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0
  }
  
  return dotProduct / (magnitude1 * magnitude2)
}

export function findSimilarNodes(
  targetEmbedding: number[],
  nodes: Array<{ id: string; embedding: number[] }>,
  threshold: number = 0.7
): string[] {
  return nodes
    .map((node) => ({
      id: node.id,
      similarity: calculateSimilarity(targetEmbedding, node.embedding),
    }))
    .filter((result) => result.similarity > threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .map((result) => result.id)
}
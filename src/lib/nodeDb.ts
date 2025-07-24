import { supabase, DatabaseNode } from './supabase'
import { ThoughtNode } from '../types/ThoughtNode'

// Convert ThoughtNode to DatabaseNode
function toDbNode(node: ThoughtNode, userId: string): Partial<DatabaseNode> {
  return {
    user_id: userId,
    url: node.url,
    ogp_image_url: node.ogpImageUrl,
    comment: node.comment,
    title: node.title,
    summary: node.summary,
    embedding: node.embedding,
    position: node.position,
    linked_node_ids: node.linkedNodeIds,
    tags: node.tags,
    category: node.category,
    type: node.type,
    x_post_data: node.xPostData
  }
}

// Convert DatabaseNode to ThoughtNode
function fromDbNode(dbNode: DatabaseNode): ThoughtNode {
  return {
    id: dbNode.id,
    url: dbNode.url,
    ogpImageUrl: dbNode.ogp_image_url || '',
    comment: dbNode.comment,
    title: dbNode.title,
    summary: dbNode.summary || '',
    embedding: dbNode.embedding || [],
    createdAt: new Date(dbNode.created_at).getTime(),
    position: dbNode.position as [number, number, number],
    linkedNodeIds: dbNode.linked_node_ids || [],
    tags: dbNode.tags,
    category: dbNode.category,
    type: (dbNode.type as 'default' | 'x-post') || 'default',
    xPostData: dbNode.x_post_data
  }
}

export const nodeDb = {
  // Get all nodes for a user
  async getNodes(userId: string): Promise<ThoughtNode[]> {
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching nodes:', error)
      return []
    }

    return data.map(fromDbNode)
  },

  // Create a new node
  async createNode(node: ThoughtNode, userId: string): Promise<ThoughtNode | null> {
    const dbNode = toDbNode(node, userId)
    
    const { data, error } = await supabase
      .from('nodes')
      .insert([dbNode])
      .select()
      .single()

    if (error) {
      console.error('Error creating node:', error)
      return null
    }

    return fromDbNode(data)
  },

  // Update an existing node
  async updateNode(nodeId: string, updates: Partial<ThoughtNode>, userId: string): Promise<ThoughtNode | null> {
    const dbUpdates = toDbNode(updates as ThoughtNode, userId)
    delete dbUpdates.user_id // Don't update user_id
    
    const { data, error } = await supabase
      .from('nodes')
      .update(dbUpdates)
      .eq('id', nodeId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating node:', error)
      return null
    }

    return fromDbNode(data)
  },

  // Delete a node
  async deleteNode(nodeId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('nodes')
      .delete()
      .eq('id', nodeId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting node:', error)
      return false
    }

    return true
  },

  // Batch create nodes
  async createNodes(nodes: ThoughtNode[], userId: string): Promise<ThoughtNode[]> {
    const dbNodes = nodes.map(node => toDbNode(node, userId))
    
    const { data, error } = await supabase
      .from('nodes')
      .insert(dbNodes)
      .select()

    if (error) {
      console.error('Error creating nodes:', error)
      return []
    }

    return data.map(fromDbNode)
  }
}
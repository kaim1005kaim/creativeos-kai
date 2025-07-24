import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kftltxdzlfculgctvypz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdGx0eGR6bGZjdWxnY3R2eXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTkzMjUsImV4cCI6MjA2ODk3NTMyNX0.Lfd4WsJmErIvMWGytlb2G-EOAZNTkdE9YGBI1cb0YFo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DatabaseNode {
  id: string
  user_id: string
  url: string
  ogp_image_url?: string
  comment: string
  title?: string
  summary?: string
  embedding?: number[]
  position: number[]
  linked_node_ids: string[]
  tags?: string[]
  category?: string
  type?: string
  x_post_data?: any
  created_at: string
  updated_at: string
}

export interface DatabaseUser {
  id: string
  email: string
  name: string
  picture?: string
  provider: string
  created_at: string
}
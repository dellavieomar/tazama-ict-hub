import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our tables
export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'staff' | 'supervisor' | 'manager' | 'admin'
  department: string
  avatar_url: string
  is_active: boolean
  created_at: string
}

export interface Activity {
  id: number
  user_id: string
  type: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
}

export interface Incident {
  id: number
  user_id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: string
  resolved_at: string | null
  created_at: string
}

export interface Report {
  id: number
  user_id: string
  report_type: string
  title: string
  summary: string
  status: string
  generated_at: string
  published_at: string | null
}

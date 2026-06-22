import { supabase } from './supabase'

export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return false
    }

    console.log('Database connected! Roles:', data)
    return true
  } catch (error) {
    console.error('Connection test failed:', error)
    return false
  }
}

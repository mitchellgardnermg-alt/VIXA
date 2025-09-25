import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yzgvmnicbcltyqaorpua.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Z3ZtbmljYmNsdHlxYW9ycHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjA0MzQsImV4cCI6MjA3NDM5NjQzNH0.WTsOYYlgfDNZJaFyU9zJSg6xjwiNmCTL4esRlUU2qJM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gojpvtermnfsdvklcrzp.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvanB2dGVybW5mc2R2a2xjcnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDI5ODgsImV4cCI6MjA2OTYxODk4OH0.-zz9f9gBCdUTdOT7rkBcyiNLJLYUX1SA4xDleOuWfvo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

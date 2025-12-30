import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ongdfwxtpajtnemwocdh.supabase.co'
const supabaseAnonKey = 'sb_publishable_Q933oVS43cO5GJPlatSN_A_MMot0WJ3'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

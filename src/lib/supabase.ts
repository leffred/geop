import { createClient } from '@supabase/supabase-js'

// On récupère les variables sans forcer l'existence avec "!" pour le build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Le client est créé avec des placeholders si les variables manquent au build
// En production sur Cloud Run, les vraies valeurs seront injectées
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
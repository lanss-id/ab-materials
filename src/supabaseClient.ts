import { createClient } from '@supabase/supabase-js';

// Ganti dengan URL dan anon key project kamu
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser-safe values only: the project URL and the publishable key (Supabase API keys guide).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** Null when the build has no Supabase settings (local runs without .env, unit tests). */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

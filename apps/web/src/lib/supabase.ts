'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'product-images';

let client: SupabaseClient | null = null;

/** Lazy Supabase client (faqat brauzerda, rasm yuklash uchun). */
export function getSupabase(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  if (!client) client = createClient(URL, ANON);
  return client;
}

export const isSupabaseConfigured = Boolean(URL && ANON);

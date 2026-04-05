import { createClient } from '@supabase/supabase-js';
import { env } from '../config';

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. Image uploads will fail.');
}

export const supabase = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_ANON_KEY || 'placeholder'
);

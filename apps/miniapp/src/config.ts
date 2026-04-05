export const env = {
  API_URL: import.meta.env.VITE_API_URL || '/api',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  SUPABASE_BUCKET: 'product-images',
};

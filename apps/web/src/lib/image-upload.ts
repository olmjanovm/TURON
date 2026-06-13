'use client';

import { getSupabase, SUPABASE_BUCKET } from './supabase';

/** Rasmni Supabase Storage'ga yuklab, public URL qaytaradi (eski app kabi). */
export async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Faqat rasm fayllarini yuklang');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Rasm hajmi 5MB dan oshmasin');
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Rasm yuklash sozlanmagan (Supabase env yo\'q)');
  }

  const ext = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).slice(2, 15)}_${Date.now()}.${ext}`;
  const filePath = `products/${fileName}`;

  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`Rasm yuklashda xatolik: ${error.message}`);

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

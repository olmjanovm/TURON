'use client';

import { apiFetch } from './api-client';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Faylni o\'qib bo\'lmadi'));
    reader.readAsDataURL(file);
  });
}

/**
 * Rasmni SERVER orqali yuklaydi (base64 -> /admin/restaurant/logo -> Supabase).
 * Client-side Supabase env TALAB QILINMAYDI — backend StorageService ishlatadi.
 * Public URL qaytaradi (mahsulot/kategoriya/logo uchun universal).
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Faqat rasm fayllarini yuklang');
  if (file.size > 5 * 1024 * 1024) throw new Error('Rasm hajmi 5MB dan oshmasin');

  const dataUrl = await fileToDataUrl(file);
  const res = await apiFetch<{ url: string }>('/api/admin/restaurant/logo', {
    method: 'POST',
    body: JSON.stringify({ imageBase64: dataUrl }),
  });
  if (!res?.url) throw new Error('Rasm yuklab bo\'lmadi');
  return res.url;
}

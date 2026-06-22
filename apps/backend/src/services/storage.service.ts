import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

/**
 * Thin Supabase Storage wrapper using native fetch — no SDK dependency needed.
 * Uploads a base64-encoded image and returns its public URL, or null on failure.
 */
export class StorageService {
  /** Supabase storage sozlanganmi (URL + kalit bor)? Controller aniq xato beradi. */
  static isConfigured(): boolean {
    return Boolean(SUPABASE_URL && SUPABASE_KEY);
  }

  /**
   * Public URL bo'yicha bitta faylni o'chiradi (eski rasm yangisiga almashtirilsa
   * darhol chaqiriladi — xotira tejash). Faqat o'zimizning Supabase URL'larini
   * tegadi; tashqi/relyativ URL'larga teginmaydi. Fire-and-forget (xato yutiladi).
   */
  static async deleteByUrl(publicUrl: string | null | undefined): Promise<void> {
    if (!publicUrl || !SUPABASE_URL || !SUPABASE_KEY) return;
    try {
      const marker = '/storage/v1/object/public/';
      const idx = publicUrl.indexOf(marker);
      if (idx === -1 || !publicUrl.startsWith(SUPABASE_URL)) return; // bizniki emas
      const path = publicUrl.slice(idx + marker.length); // "{bucket}/{filename}"
      if (!path || path.includes('..')) return;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${path}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.warn(`[StorageService] deleteByUrl ${res.status}:`, body.slice(0, 200));
      }
    } catch (err) {
      console.error('[StorageService] deleteByUrl error:', err);
    }
  }

  /**
   * Frontend to'g'ridan-to'g'ri rasm yuklashi uchun Pre-signed URL yaratish.
   * Buni API orqali frontendga beramiz, frontend o'zi Supabase-ga PUT qiladi.
   */
  static async createSignedUploadUrl(bucket: 'receipts' | 'deliveries' | 'menu', ext: 'jpg' | 'png' = 'jpg'): Promise<{ uploadUrl: string, publicUrl: string } | null> {
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;

    try {
      const filename = `${Date.now()}-${randomUUID()}.${ext}`;
      const url = `${SUPABASE_URL}/storage/v1/object/upload/sign/${bucket}/${filename}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[StorageService] Presigned URL failed (${res.status}):`, body);
        return null;
      }

      const data = await res.json();
      return {
        uploadUrl: `${SUPABASE_URL}${data.url}`,
        publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`
      };
    } catch (err) {
      console.error(`[StorageService] Presigned URL error:`, err);
      return null;
    }
  }

  /**
   * Upload a base64 image to Supabase Storage.
   * @param base64Str  Raw or data-URL base64 string
   * @param bucket     'receipts' | 'deliveries' | 'menu'
   */
  static async uploadBase64(
    base64Str: string,
    bucket: 'receipts' | 'deliveries' | 'menu',
  ): Promise<string | null> {
    if (!base64Str || !SUPABASE_URL || !SUPABASE_KEY) return null;

    try {
      // Strip optional data-URL prefix
      const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const isPng = base64Str.includes('image/png');
      const ext = isPng ? 'png' : 'jpg';
      const filename = `${Date.now()}-${randomUUID()}.${ext}`;
      const contentType = `image/${ext}`;

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          'Content-Type': contentType,
          'Cache-Control': '3600',
          'x-upsert': 'true',
        },
        body: buffer,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[StorageService] Upload failed (${res.status}):`, body);
        return null;
      }

      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
    } catch (err) {
      console.error(`[StorageService] ${bucket} upload error:`, err);
      return null;
    }
  }

  /**
   * Bucket'da faqat oxirgi `keep` ta (eng yangi) fayl qoladi — qolganlari o'chiriladi.
   * Xotira to'lib, ortiqcha xarajat bo'lmasligi uchun. Default IMG_LIMIT=30 (env'dan
   * o'zgartirsa bo'ladi). Fayllar `Date.now()-uuid` nomli → created_at desc = yangi avval.
   * Fire-and-forget chaqiriladi (asosiy oqimni bloklamaydi).
   */
  static async pruneOldest(
    bucket: 'receipts' | 'deliveries' | 'menu',
    keep: number = Number(process.env.IMG_LIMIT) || 30,
  ): Promise<void> {
    if (!SUPABASE_URL || !SUPABASE_KEY || keep <= 0) return;
    try {
      const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prefix: '',
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' },
        }),
      });
      if (!listRes.ok) return;

      const files = (await listRes.json()) as Array<{ name?: string }>;
      if (!Array.isArray(files) || files.length <= keep) return;

      const toDelete = files
        .slice(keep)
        .map((f) => f.name)
        .filter((n): n is string => Boolean(n));
      if (toDelete.length === 0) return;

      await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: toDelete }),
      });
      console.log(`[StorageService] pruned ${toDelete.length} old file(s) from ${bucket} (keep=${keep})`);
    } catch (err) {
      console.error(`[StorageService] prune ${bucket} error:`, err);
    }
  }
}

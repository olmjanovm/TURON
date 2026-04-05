import { supabase } from '../../../lib/supabase';
import { env } from '../../../config';

export interface ImageUploadResult {
  url: string;
  filename: string;
}

export interface IImageUploadService {
  upload(file: File): Promise<ImageUploadResult>;
  remove(url: string): Promise<void>;
}

class SupabaseImageUploadService implements IImageUploadService {
  private bucket = env.SUPABASE_BUCKET;

  async upload(file: File): Promise<ImageUploadResult> {
    // 1. Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // 2. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(this.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Rasm yuklashda xatolik: ${uploadError.message}`);
    }

    // 3. Get public URL
    const { data } = supabase.storage.from(this.bucket).getPublicUrl(filePath);

    return { 
      url: data.publicUrl, 
      filename: fileName 
    };
  }

  async remove(url: string): Promise<void> {
    try {
      // Extract path from URL (assuming standard Supabase public URL structure)
      // https://xxx.supabase.co/storage/v1/object/public/bucket/products/file.jpg
      const pathParts = url.split(`${this.bucket}/`);
      if (pathParts.length < 2) return;
      
      const filePath = pathParts[1];
      await supabase.storage.from(this.bucket).remove([filePath]);
    } catch (error) {
      console.error('Rasm o\'chirishda xatolik:', error);
    }
  }
}

export const imageUploadService: IImageUploadService = new SupabaseImageUploadService();

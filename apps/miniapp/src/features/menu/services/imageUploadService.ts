export interface ImageUploadResult {
  url: string;
  filename: string;
}

export interface IImageUploadService {
  upload(file: File): Promise<ImageUploadResult>;
  remove(url: string): Promise<void>;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Rasm o\'qib bo\'lmadi'));
    };

    reader.onerror = () => reject(new Error('Rasm o\'qib bo\'lmadi'));
    reader.readAsDataURL(file);
  });
}

class InlineImageUploadService implements IImageUploadService {
  async upload(file: File): Promise<ImageUploadResult> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const url = await readFileAsDataUrl(file);
    return { url, filename: file.name };
  }

  async remove(_url: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export const imageUploadService: IImageUploadService = new InlineImageUploadService();

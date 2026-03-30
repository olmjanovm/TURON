export interface ImageUploadResult {
  url: string;
  filename: string;
}

export interface IImageUploadService {
  upload(file: File): Promise<ImageUploadResult>;
  remove(url: string): Promise<void>;
}

class MockImageUploadService implements IImageUploadService {
  async upload(file: File): Promise<ImageUploadResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const url = URL.createObjectURL(file);
    return { url, filename: file.name };
  }

  async remove(_url: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export const imageUploadService: IImageUploadService = new MockImageUploadService();

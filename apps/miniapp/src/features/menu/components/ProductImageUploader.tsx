import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { imageUploadService } from '../services/imageUploadService';

interface Props {
  currentImageUrl: string;
  onImageChange: (url: string) => void;
  onImageRemove: () => void;
}

const ProductImageUploader: React.FC<Props> = ({ currentImageUrl, onImageChange, onImageRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Faqat rasm fayllarini yuklang');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Rasm hajmi 5MB dan oshmasin');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const result = await imageUploadService.upload(file);
      onImageChange(result.url);
    } catch {
      setError('Rasm yuklanmadi');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Rasm</label>

      {currentImageUrl ? (
        <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50">
          <img
            src={currentImageUrl}
            alt="Mahsulot rasmi"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-slate-600 shadow-sm active:scale-95 transition-transform"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={onImageRemove}
              className="w-9 h-9 bg-red-500/90 backdrop-blur rounded-xl flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 active:border-blue-400 active:text-blue-500 transition-colors"
        >
          {uploading ? (
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ImageIcon size={32} />
              <span className="text-sm font-bold">Rasm yuklash</span>
              <span className="text-xs">PNG, JPG · max 5MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default ProductImageUploader;

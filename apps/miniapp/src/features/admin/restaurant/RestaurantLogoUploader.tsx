import React from 'react';
import { ImagePlus, Loader2, UploadCloud } from 'lucide-react';
import { useUploadRestaurantLogo } from './useRestaurantSettings';

interface Props {
  logoUrl?: string | null;
  onChange: (url: string) => void;
}

export function RestaurantLogoUploader({ logoUrl, onChange }: Props) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const uploadLogo = useUploadRestaurantLogo();
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = typeof reader.result === 'string' ? reader.result : '';
      if (!base64) return;
      const result = await uploadLogo.mutateAsync(base64);
      onChange(result.url);
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="adminx-restaurant-logo flex min-h-[148px] w-full flex-col items-center justify-center gap-2.5 rounded-[20px] border border-dashed border-[rgba(245,166,35,0.32)] bg-[linear-gradient(180deg,rgba(255,248,230,0.96)_0%,rgba(255,241,205,0.92)_100%)] px-4 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_14px_32px_rgba(245,166,35,0.14)]"
    >
      <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[20px] border border-white/50 bg-white/88 shadow-[0_12px_24px_rgba(28,18,7,0.08)]">
        {previewUrl || logoUrl ? (
          <img src={previewUrl || logoUrl || ''} alt="Logo" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus size={26} className="text-[var(--adminx-color-primary-dark)]" />
        )}
      </div>
      <div>
        <p className="text-[15px] font-black text-[var(--adminx-color-ink)]">Logo yuklash</p>
        <p className="mt-1.5 text-xs font-semibold text-[var(--adminx-color-muted)]">PNG yoki JPG, bir bosishda yangilanadi</p>
      </div>
      <span className="adminx-chip min-h-8 border-[rgba(245,166,35,0.22)] bg-white/76 px-3 text-[10px] text-[var(--adminx-color-primary-dark)]">
        {uploadLogo.isPending ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
        {uploadLogo.isPending ? 'Yuklanmoqda' : 'Fayl tanlash'}
      </span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = '';
        }}
      />
    </button>
  );
}

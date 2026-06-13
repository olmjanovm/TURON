'use client';

import Image from 'next/image';
import { useRestaurantIdentity } from '@/hooks/use-restaurant-identity';

interface BrandProps {
  /** Square size in px. Default 56. */
  size?: number;
  /** Round corners. Default 'lg' = 24px (3xl). */
  rounded?: 'lg' | 'md' | 'sm' | 'full';
  /** Optional className for the wrapper. */
  className?: string;
  /** Show shadow/glow. Default true. */
  glow?: boolean;
}

const ROUND_CLASS: Record<NonNullable<BrandProps['rounded']>, string> = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  full: 'rounded-full',
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'T';
  // Birinchi so'zning birinchi harfi (multi-byte safe)
  const first = [...trimmed][0];
  return first.toUpperCase();
}

/**
 * Restoran logosi yoki bosh harfi (gradient avatar).
 * - logoUrl bor bo'lsa: next/image bilan (priority — splash uchun)
 * - aks holda: ember gradient + bosh harf
 * - Dark/light mode: ranglari mos (gradient yorug', shadow tekshirilgan)
 */
export function RestaurantBrand({ size = 56, rounded = 'lg', className = '', glow = true }: BrandProps) {
  const { name, logoUrl } = useRestaurantIdentity();
  const roundCls = ROUND_CLASS[rounded];
  const shadowCls = glow ? 'shadow-[0_12px_28px_-8px_rgba(198,32,32,0.55)]' : '';

  if (logoUrl) {
    return (
      <div
        className={`relative overflow-hidden bg-white dark:bg-slate-900 ${roundCls} ${shadowCls} ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={logoUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          priority
          className="object-cover"
        />
      </div>
    );
  }

  // Fallback — gradient + bosh harf
  const initial = getInitial(name);
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-[#c62020] to-[#f97316] text-white ${roundCls} ${shadowCls} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.45),
        fontWeight: 900,
        lineHeight: 1,
      }}
      aria-label={name}
    >
      {initial}
    </div>
  );
}

/**
 * Restoran nomi — matn (bold, hozirgi rang).
 * Yuklash paytida ham default ('TURON') ko'rsatadi, layout shift yo'q.
 */
export function RestaurantName({ className = '' }: { className?: string }) {
  const { name } = useRestaurantIdentity();
  return <span className={className}>{name}</span>;
}

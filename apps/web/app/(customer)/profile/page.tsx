'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight, Globe, HelpCircle, Info, Loader2, MapPin, Moon, Save, Sun } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateMyProfile } from '@/hooks/use-customer';
import { useLocale } from '@/lib/i18n/locale-context';
import { LOCALES, LOCALE_META, type Locale } from '@/lib/i18n/translations';
import { useT } from '@/lib/i18n/locale-context';
import { useRestaurantIdentity } from '@/hooks/use-restaurant-identity';

type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'turon-theme';

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (window.localStorage.getItem(THEME_KEY) as Theme | null) ?? 'light';
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
  window.localStorage.setItem(THEME_KEY, theme);
}

export default function ProfilePage() {
  const t = useT();
  const { user } = useAuth();
  const { locale, setLocale } = useLocale();
  const update = useUpdateMyProfile();
  const [name, setName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [saved, setSaved] = useState(false);

  const dirty =
    (user?.fullName && name.trim() !== user.fullName) ||
    (phone.trim() !== (user?.phoneNumber ?? ''));

  const handleSave = () => {
    update.mutate(
      { fullName: name.trim(), phoneNumber: phone.trim() || undefined },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 1800);
        },
      },
    );
  };

  const handleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const initials = (user?.fullName ?? 'U').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
        {t('profile.title')}
      </h1>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #c62020, transparent 70%)' }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-xl font-black shadow-[0_10px_24px_-8px_rgba(198,32,32,0.7)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black">{user?.fullName ?? '—'}</p>
            <p className="text-xs text-white/60">{user?.telegramUsername ? `@${user.telegramUsername}` : ''}</p>
          </div>
        </div>
      </div>

      <Section title={t('profile.edit')}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t('profile.fullname')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#c62020] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">
              {t('profile.phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#c62020] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          {saved && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
              ✓ {t('common.save')}
            </p>
          )}
          <button
            type="button"
            disabled={!dirty || update.isPending}
            onClick={handleSave}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.5)] active:scale-[0.98] disabled:opacity-40"
          >
            {update.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> {t('common.save')}</>}
          </button>
        </div>
      </Section>

      <Section title={t('profile.language')}>
        <div className="grid grid-cols-3 gap-2">
          {LOCALES.map((l) => {
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l as Locale)}
                className={`rounded-2xl border px-3 py-3 text-center transition ${
                  active
                    ? 'border-[#c62020] bg-[#c62020]/5 dark:bg-[#c62020]/15'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <p className="text-lg">{LOCALE_META[l].flag}</p>
                <p className={`mt-1 text-[11px] font-black ${active ? 'text-[#c62020]' : 'text-slate-600 dark:text-slate-300'}`}>
                  {LOCALE_META[l].label}
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t('profile.theme')}>
        <div className="grid grid-cols-3 gap-2">
          <ThemeBtn current={theme} value="light" onSelect={handleTheme} icon={Sun} label={t('profile.theme.light')} />
          <ThemeBtn current={theme} value="dark" onSelect={handleTheme} icon={Moon} label={t('profile.theme.dark')} />
          <ThemeBtn current={theme} value="system" onSelect={handleTheme} icon={Globe} label={t('profile.theme.system')} />
        </div>
      </Section>

      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <ProfileLink href="/addresses" icon={MapPin} label={t('profile.addresses')} />
        <Divider />
        <ProfileLink href="/notifications" icon={Bell} label={t('profile.notifications')} />
        <Divider />
        <ProfileLink href="/support" icon={HelpCircle} label={t('profile.support')} />
        <Divider />
        <ProfileLink href="#" icon={Info} label={t('profile.about')} />
      </div>

      <BrandFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function ThemeBtn({
  current, value, onSelect, icon: Icon, label,
}: {
  current: Theme; value: Theme; onSelect: (t: Theme) => void; icon: typeof Sun; label: string;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 transition ${
        active ? 'border-[#c62020] bg-[#c62020]/5 dark:bg-[#c62020]/15' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      <Icon size={18} className={active ? 'text-[#c62020]' : 'text-slate-500'} />
      <p className={`text-[11px] font-black ${active ? 'text-[#c62020]' : 'text-slate-600 dark:text-slate-300'}`}>
        {label}
      </p>
    </button>
  );
}

function ProfileLink({ href, icon: Icon, label }: { href: string; icon: typeof Bell; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition active:scale-[0.99]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={16} />
      </div>
      <span className="flex-1 text-sm font-bold text-slate-900 dark:text-slate-100">{label}</span>
      <ChevronRight size={16} className="text-slate-300" />
    </Link>
  );
}

function Divider() {
  return <div className="ml-16 h-px bg-slate-100 dark:bg-slate-800" />;
}

function BrandFooter() {
  const { name } = useRestaurantIdentity();
  return (
    <p className="pb-4 pt-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {name} · v1.0
    </p>
  );
}

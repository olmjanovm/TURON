import React from 'react';
import { ChevronRight, Globe2, MapPinned, HelpCircle, Info, Heart, Clock, CreditCard, Bell, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { useAddresses } from '../../hooks/queries/useAddresses';
import { useAuthStore } from '../../store/useAuthStore';
import { customerLanguageOptions, useCustomerLanguage } from '../../features/i18n/customerLocale';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tg } = useTelegram();
  const { data: addresses = [] } = useAddresses();
  const { language, setLanguage, tr } = useCustomerLanguage();

  // Get initials from user name
  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MM';

  // Language label
  const languageLabel = language === 'ru' ? 'Русский' : language === 'uz-cyrl' ? 'Ўзбекча' : "O'zbekcha";

  // Saved addresses count
  const addressCount = addresses.length;

  // Main menu sections
  const mainMenuItems = [
    {
      icon: MapPinned,
      label: tr('profile.addresses') || 'Manzillarim',
      value: `${addressCount} ta`,
      onClick: () => navigate('/customer/addresses'),
    },
    {
      icon: Clock,
      label: 'Buyurtmalar tarixi',
      onClick: () => navigate('/customer/orders'),
    },
    {
      icon: Heart,
      label: 'Sevimlilar',
      onClick: () => navigate('/customer/favorites'),
    },
  ];

  const settingsItems = [
    {
      icon: CreditCard,
      label: 'To\'lov usulari',
      onClick: () => navigate('/customer/payment-methods'),
    },
    {
      icon: Bell,
      label: 'Bildirishnomalar',
      onClick: () => navigate('/customer/notifications-settings'),
    },
    {
      icon: Globe2,
      label: tr('profile.language') || 'Tilni o\'zgartirish',
      value: languageLabel,
      onClick: () => {
        const allLanguages: Array<'uz-latn' | 'uz-cyrl' | 'ru'> = ['uz-latn', 'uz-cyrl', 'ru'];
        const currentIndex = allLanguages.indexOf(language as any);
        const nextIndex = (currentIndex + 1) % allLanguages.length;
        setLanguage(allLanguages[nextIndex]);
      },
    },
    {
      icon: Shield,
      label: 'Xavfsizlik',
      onClick: () => navigate('/customer/security'),
    },
  ];

  const helpItems = [
    {
      icon: HelpCircle,
      label: tr('profile.support') || 'Yordam markazi',
      onClick: () => navigate('/customer/support'),
    },
    {
      icon: Info,
      label: 'Ilova haqida',
      onClick: () => navigate('/customer/about'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <h1 className="text-center text-lg font-black text-slate-900">Profil</h1>
      </div>

      {/* Profile Card */}
      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 shadow-sm">
            <span className="text-2xl font-black text-amber-700">{initials}</span>
          </div>

          {/* Name */}
          <h2 className="text-lg font-black tracking-tight text-slate-900">
            {user?.fullName || 'Turon mijozi'}
          </h2>

          {/* Phone */}
          <p className="mt-1 text-sm text-slate-500">{user?.phoneNumber || '+998 90 000 00 00'}</p>
        </div>
      </div>

      {/* MAIN MENU SECTION */}
      <div className="mt-6 px-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Asosiy</p>
        <div className="space-y-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 transition-all hover:bg-gray-50 hover:shadow-md active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Icon size={20} className="text-amber-700" />
                  </div>
                  <span className="font-semibold text-slate-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{item.value}</span>}
                  <ChevronRight size={18} className="text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SETTINGS SECTION */}
      <div className="mt-6 px-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Sozlamalar</p>
        <div className="space-y-2">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 transition-all hover:bg-gray-50 hover:shadow-md active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Icon size={20} className="text-blue-700" />
                  </div>
                  <span className="font-semibold text-slate-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && <span className="text-xs font-semibold text-slate-500">{item.value}</span>}
                  <ChevronRight size={18} className="text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* HELP SECTION */}
      <div className="mt-6 px-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Yordam</p>
        <div className="space-y-2">
          {helpItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 transition-all hover:bg-gray-50 hover:shadow-md active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <Icon size={20} className="text-green-700" />
                  </div>
                  <span className="font-semibold text-slate-900">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;

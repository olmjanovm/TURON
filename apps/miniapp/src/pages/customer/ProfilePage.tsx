import React, { useState, useEffect } from 'react';
import { ChevronRight, Globe2, Moon, Bell, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';

const RED = '#C62020';

/* ── Reusable toggle switch ──────────────────────────────────────────────── */
const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    style={{
      width: 48,
      height: 26,
      borderRadius: 13,
      background: on ? RED : '#D1D5DB',
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.25s',
      flexShrink: 0,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 3,
        left: on ? 25 : 3,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.25s',
      }}
    />
  </button>
);

/* ── Row: clickable item ─────────────────────────────────────────────────── */
const RowItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  last?: boolean;
}> = ({ icon, label, value, onClick, right, last }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      background: 'white',
      border: 'none',
      borderBottom: last ? 'none' : '1px solid #F3F4F6',
      padding: '14px 16px',
      cursor: onClick ? 'pointer' : 'default',
      textAlign: 'left',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {value && (
        <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{value}</span>
      )}
      {right ?? (onClick ? <ChevronRight size={18} color="#D1D5DB" /> : null)}
    </div>
  </button>
);

/* ── Section card wrapper ────────────────────────────────────────────────── */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginTop: 24, paddingInline: 16 }}>
    <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, paddingLeft: 4 }}>
      {title}
    </p>
    <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      {children}
    </div>
  </div>
);

/* ── Main page ───────────────────────────────────────────────────────────── */
const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { language, setLanguage } = useCustomerLanguage();

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('turon-dark') === '1');
  const [notifOn, setNotifOn] = useState(() => localStorage.getItem('turon-notif') !== '0');

  // Apply dark mode to body
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('turon-dark', darkMode ? '1' : '0');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('turon-notif', notifOn ? '1' : '0');
  }, [notifOn]);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'TK';

  const langLabel = language === 'ru' ? 'Русский' : language === 'uz-cyrl' ? 'Ўзбекча' : "O'zbekcha";

  const cycleLanguage = () => {
    const langs: Array<'uz-latn' | 'uz-cyrl' | 'ru'> = ['uz-latn', 'uz-cyrl', 'ru'];
    const next = (langs.indexOf(language as any) + 1) % langs.length;
    setLanguage(langs[next]);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', paddingBottom: 100 }}>

      {/* ── Red gradient header ── */}
      <div style={{
        background: `linear-gradient(160deg, ${RED} 0%, #9B0000 100%)`,
        paddingTop: 'env(safe-area-inset-top, 16px)',
        paddingBottom: 72,
        textAlign: 'center',
        position: 'relative',
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '16px 0 0' }}>
          Profil
        </h1>
      </div>

      {/* ── Avatar card (overlaps header) ── */}
      <div style={{
        marginTop: -60,
        marginInline: 20,
        background: 'white',
        borderRadius: 20,
        padding: '24px 20px 20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `linear-gradient(135deg, ${RED}, #9B0000)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px rgba(198,32,32,0.35)`,
          border: '3px solid white',
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: 'white' }}>{initials}</span>
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>
          {user?.fullName || 'Turon Mijozi'}
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
          {user?.phoneNumber || ''}
        </p>
      </div>

      {/* ── Section 1: Asosiy ── */}
      <Section title="Asosiy">
        <RowItem
          icon={<ClipboardList size={19} color={RED} />}
          label="Buyurtmalar tarixi"
          onClick={() => navigate('/customer/orders')}
        />
        <RowItem
          icon={<Globe2 size={19} color={RED} />}
          label="Tilni o'zgartirish"
          value={langLabel}
          onClick={cycleLanguage}
          last
        />
      </Section>

      {/* ── Section 2: Sozlamalar ── */}
      <Section title="Sozlamalar">
        <RowItem
          icon={<Moon size={19} color={RED} />}
          label="Dark Mode"
          right={<Toggle on={darkMode} onChange={() => setDarkMode((v) => !v)} />}
        />
        <RowItem
          icon={<Bell size={19} color={RED} />}
          label="Bildirishnomalar"
          right={<Toggle on={notifOn} onChange={() => setNotifOn((v) => !v)} />}
          last
        />
      </Section>

    </div>
  );
};

export default ProfilePage;

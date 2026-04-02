import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTelegram } from '../../hooks/useTelegram';
import { useAuthStore } from '../../store/useAuthStore';
import { normalizeRole, resolveRoleEntryRedirect } from '../../features/auth/roleRouting';
import { ErrorStateCard, LoadingScreen } from '../ui/FeedbackStates';

export const AppBootstrapGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initData, ready, expand } = useTelegram();
  const { setAuth, user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    let retries = 4;

    setLoading(true);
    setError(null);

    const bootstrap = async (): Promise<void> => {
      const currentInitData = initData;

      if (!currentInitData) {
        if (retries > 0) {
          retries -= 1;
          window.setTimeout(() => {
            if (!cancelled) {
              void bootstrap();
            }
          }, 500);
          return;
        }

        if (!cancelled) {
          setError('Telegram muhiti topilmadi. Iltimos, faqat bot orqali kiring.');
          setLoading(false);
        }

        return;
      }

      try {
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.post(`${apiUrl}/auth/telegram`, { initData: currentInitData });

        if (cancelled) {
          return;
        }

        const { user: authUser, token } = response.data;
        const normalizedRole = normalizeRole(authUser?.role);

        if (!normalizedRole) {
          throw new Error("Foydalanuvchi roli qo'llab-quvvatlanmaydi");
        }

        setAuth({ ...authUser, role: normalizedRole }, token);
        ready();
        expand();
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err.response?.data?.error ||
              err.message ||
              "Tizimga ulanishda xato yuz berdi.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [expand, initData, ready, setAuth]);

  useEffect(() => {
    if (loading || error || !isAuthenticated || !user) {
      return;
    }

    const normalizedRole = normalizeRole(user.role);

    if (!normalizedRole) {
      setError("Foydalanuvchi roli noto'g'ri yoki qo'llab-quvvatlanmaydi.");
      return;
    }

    const redirectPath = resolveRoleEntryRedirect(normalizedRole, location.pathname);

    if (redirectPath && redirectPath !== location.pathname) {
      navigate(redirectPath, { replace: true });
    }
  }, [error, isAuthenticated, loading, location.pathname, navigate, user]);

  if (loading) {
    return <LoadingScreen message="Ishga tushirilmoqda..." />;
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <ErrorStateCard title="Xato" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return <>{children}</>;
};

export const PHONE_CALL_REQUEST_EVENT = 'turon:phone-call-request';

export interface PhoneCallRequestDetail {
  phoneNumber: string;
  displayName?: string;
}

/**
 * Telefon qo'ng'irog'i uchun yagona utility.
 *
 * initiateCall() qo'ng'iroqni darhol boshlamaydi. Avval global
 * CallConfirmProvider tasdiqlash oynasini ko'rsatadi, foydalanuvchi "Call"
 * bosgandan keyingina tel: link ochiladi va SIM/operator orqali qo'ng'iroq ketadi.
 */
export function initiateCall(
  phoneNumber: string | null | undefined,
  displayName?: string,
): void {
  const cleaned = normalizeCallablePhone(phoneNumber);
  if (!cleaned || typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<PhoneCallRequestDetail>(PHONE_CALL_REQUEST_EVENT, {
      detail: { phoneNumber: cleaned, displayName },
    }),
  );
}

export function normalizeCallablePhone(phoneNumber: string | null | undefined): string | null {
  if (!phoneNumber) return null;

  let cleaned = phoneNumber.replace(/[^\d+*#]/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('00')) {
    cleaned = `+${cleaned.slice(2)}`;
  }

  if (!cleaned.startsWith('+') && cleaned.length === 9) {
    cleaned = `+998${cleaned}`;
  }

  if (!cleaned.startsWith('+') && cleaned.length === 12 && cleaned.startsWith('998')) {
    cleaned = `+${cleaned}`;
  }

  return cleaned;
}

export function formatPhoneForCallButton(phoneNumber: string): string {
  const cleaned = normalizeCallablePhone(phoneNumber) ?? phoneNumber;
  const digits = cleaned.replace(/\D/g, '');

  if (cleaned.startsWith('+998') && digits.length === 12) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }

  if (cleaned.startsWith('+') && digits.length > 7) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`.trim();
  }

  return cleaned;
}

export function dialPhoneNumber(phoneNumber: string): void {
  const cleaned = normalizeCallablePhone(phoneNumber);
  if (!cleaned || typeof window === 'undefined') return;

  const link = document.createElement('a');
  link.href = `tel:${cleaned}`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Telegram username bo'lsa t.me deep link ochadi */
export function openTelegramProfile(username: string | null | undefined): void {
  if (!username) return;
  const clean = username.startsWith('@') ? username.slice(1) : username;
  const url = `https://t.me/${clean}`;
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

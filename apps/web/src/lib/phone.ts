/**
 * O'zbek telefon raqami yordamchilari.
 *
 * Foydalanuvchi `907917699` kiritsa → `+998907917699` (avtomatik +998).
 * `+998…` yoki `998…` bilan boshlasa — takror qo'shmaydi. Faqat raqamlar.
 * BARCHA telefon inputlarда ishlatiladi (customer + admin).
 */
export function formatUzPhone(raw: string): string {
  let d = (raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  return d ? `+998${d}` : '';
}

/** To'liq +998XXXXXXXXX formatidami? */
export function isValidUzPhone(phone: string): boolean {
  return /^\+998\d{9}$/.test(phone);
}

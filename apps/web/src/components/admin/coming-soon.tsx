/** Vaqtinchalik — bu admin bo'lim hali Next.js'ga ko'chirilmoqda. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
      <span className="text-3xl">🛠️</span>
      <h1 className="text-base font-semibold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-400">Bu bo'lim Next.js'ga ko'chirilmoqda</p>
    </div>
  );
}

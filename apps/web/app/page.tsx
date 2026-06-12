import { UserRoleEnum } from '@turon/shared';

// FAZA A1 — Next.js skelet sog'lik tekshiruvi.
// @turon/shared import qilinishi workspace ulanishi ishlayotganini tasdiqlaydi.
const ROLES = Object.values(UserRoleEnum);

export default function Page() {
  return (
    <main className="min-h-dvh bg-tandir text-white flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-center gap-3">
        <span className="text-5xl">🔥</span>
        <h1 className="text-4xl font-black tracking-tight text-ember">TURON</h1>
      </div>

      <p className="text-white/70 max-w-md leading-relaxed">
        Next.js 15 skelet ishga tushdi. Bu <span className="text-spark font-semibold">apps/web</span> —
        migratsiyaning yangi poydevori. FAZA A1 ✅
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {ROLES.map((role) => (
          <span
            key={role}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80"
          >
            {role}
          </span>
        ))}
      </div>

      <code className="mt-4 rounded-card bg-white/5 px-4 py-2 text-xs text-white/50">
        @turon/shared · TanStack Query · Tailwind v4
      </code>
    </main>
  );
}

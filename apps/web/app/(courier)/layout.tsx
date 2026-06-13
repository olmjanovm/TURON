export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <main
        className="mx-auto w-full max-w-[480px]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {children}
      </main>
    </div>
  );
}

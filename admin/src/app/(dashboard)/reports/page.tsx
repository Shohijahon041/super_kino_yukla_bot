"use client";

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 gradient-mesh">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-brand-text">Hisobotlar</span>
          </h1>
          <p className="text-gray-400 mt-1.5">Foydalanuvchilar tomonidan yuborilgan hisobotlar</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 card-glow">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Hisobotlar hali yo&apos;q</h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Foydalanuvchilar hisobot yuborganida bu yerda ko&apos;rinadi
          </p>
        </div>
      </div>
    </div>
  );
}

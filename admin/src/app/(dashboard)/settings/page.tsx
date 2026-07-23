"use client";

const apiEndpoints = [
  { label: "Backend", value: "http://localhost:3002" },
  { label: "Admin Panel", value: "http://localhost:3001" },
  { label: "API Docs", value: "http://localhost:3002/docs" },
];

const services = [
  { name: "Backend", status: "running" as const },
  { name: "PostgreSQL", status: "running" as const },
  { name: "Redis", status: "running" as const },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 gradient-mesh">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-brand-text">Sozlamalar</span>
          </h1>
          <p className="text-gray-400 mt-1.5">Admin panel konfiguratsiyasi</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
        <h3 className="text-base font-semibold text-white mb-5">Platforma Ma&apos;lumotlari</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-gray-500">Nomi</span>
            <span className="text-sm font-medium text-white">CinemaHub AI Ultimate</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-gray-500">Versiya</span>
            <span className="text-sm font-medium text-white">1.0.0</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-gray-500">Muhit</span>
            <span className="text-sm font-medium text-white">Development</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
        <h3 className="text-base font-semibold text-white mb-5">API Endpoints</h3>
        <div className="space-y-3">
          {apiEndpoints.map((ep) => (
            <div key={ep.label} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-sm text-gray-500">{ep.label}</span>
              <code className="text-sm font-mono text-brand-400 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.04]">
                {ep.value}
              </code>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
        <h3 className="text-base font-semibold text-white mb-5">Xizmatlar Holati</h3>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-sm text-gray-500">{service.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-emerald-400">Ishlayapti</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

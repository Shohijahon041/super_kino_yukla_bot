"use client";

import * as React from "react";
import { health } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

interface HealthData {
  status: "healthy" | "degraded" | "down";
  uptime: number;
  memory: { used: number; total: number };
  database: "connected" | "disconnected";
  api: "operational" | "degraded" | "down";
  version: string;
}

export default function HealthPage() {
  const [data, setData] = React.useState<HealthData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const fetchHealth = React.useCallback(async () => {
    try {
      const res = await health.getHealth();
      const d = res.data as any;
      setData({
        status: d.status ?? "healthy",
        uptime: d.uptime ?? 0,
        memory: d.memory ?? { used: 0, total: 0 },
        database: d.database ?? "connected",
        api: d.api ?? "operational",
        version: d.version ?? "1.0.0",
      });
      setLastUpdated(new Date());
    } catch {
      setData({
        status: "down",
        uptime: 0,
        memory: { used: 0, total: 0 },
        database: "disconnected",
        api: "down",
        version: "1.0.0",
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 gradient-mesh h-28 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 h-64 animate-pulse card-glow" />
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 h-64 animate-pulse card-glow" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    healthy: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Sog'lom" },
    degraded: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Yomonlashgan" },
    down: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "O'chirilgan" },
  };

  const status = statusConfig[data.status] || statusConfig.down;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days} kun ${hrs} soat ${mins} daqiqa`;
    if (hrs > 0) return `${hrs} soat ${mins} daqiqa`;
    return `${mins} daqiqa`;
  };

  const formatMemory = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  const memoryPercent = data.memory.total > 0
    ? Math.round((data.memory.used / data.memory.total) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 gradient-mesh">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-brand-text">Tizim Holati</span>
          </h1>
          <p className="text-gray-400 mt-1.5">Server va xizmatlarning holati</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className={`rounded-2xl border p-6 ${status.bg} flex items-center gap-5`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${data.status === "healthy" ? "bg-emerald-500/20" : data.status === "degraded" ? "bg-amber-500/20" : "bg-red-500/20"}`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={status.color}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Umumiy Holat</p>
          <p className={`text-2xl font-bold ${status.color}`}>{status.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 card-glow">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime</span>
          <p className="text-xl font-bold text-white mt-2">{formatUptime(data.uptime)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 card-glow">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Xotira</span>
          <p className="text-xl font-bold text-white mt-2">{formatMemory(data.memory.used)}</p>
          <p className="text-xs text-gray-500 mt-1">{memoryPercent}% / {formatMemory(data.memory.total)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 card-glow">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Database</span>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2.5 h-2.5 rounded-full ${data.database === "connected" ? "bg-emerald-500" : "bg-red-500"}`} />
            <p className="text-xl font-bold text-white">{data.database === "connected" ? "Ulangan" : "Ulanmagan"}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 card-glow">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">API</span>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2.5 h-2.5 rounded-full ${data.api === "operational" ? "bg-emerald-500" : data.api === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
            <p className="text-xl font-bold text-white">{data.api === "operational" ? "Ishlayapti" : data.api === "degraded" ? "Yomonlashgan" : "O'chirilgan"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
        <h3 className="text-base font-semibold text-white mb-5">Tizim Ma&apos;lumotlari</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-gray-500">Versiya</span>
            <span className="text-sm font-mono font-medium text-white bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.04]">{data.version}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-gray-500">Server Holati</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${data.status === "healthy" ? "bg-emerald-500" : data.status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
              <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-gray-500">Xotira Ishlatilishi</span>
            <span className="text-sm font-medium text-white">{formatMemory(data.memory.used)} / {formatMemory(data.memory.total)} ({memoryPercent}%)</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-gray-500">Uptime</span>
            <span className="text-sm font-medium text-white">{formatUptime(data.uptime)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-sm text-gray-500">Yangilangan</span>
            <span className="text-sm font-medium text-white">{lastUpdated ? formatDateTime(lastUpdated) : "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { stats } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

interface DashboardData {
  totalMovies: number;
  totalSeries: number;
  totalUsers: number;
  activeToday: number;
  newUsersToday: number;
  totalViews: number;
  activeSubscriptions: number;
  pendingReports: number;
  totalBroadcasts: number;
  topGenres: { genre: string; count: number }[];
  topCountries: { country: string; count: number }[];
}

const genreColors = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-sky-500",
  "from-fuchsia-500 to-pink-500",
  "from-lime-500 to-green-500",
];

const countryColors = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
];

const statCards = (data: DashboardData) => [
  {
    title: "Filmlar",
    value: formatNumber(data.totalMovies),
    type: "movies",
    gradient: "from-violet-500/10 to-purple-500/5",
    iconColor: "text-violet-400",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    title: "Seryarlar",
    value: formatNumber(data.totalSeries),
    type: "series",
    gradient: "from-blue-500/10 to-cyan-500/5",
    iconColor: "text-blue-400",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 8h20" />
      </svg>
    ),
  },
  {
    title: "Foydalanuvchilar",
    value: formatNumber(data.totalUsers),
    type: "users",
    gradient: "from-emerald-500/10 to-teal-500/5",
    iconColor: "text-emerald-400",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Bugun faol",
    value: formatNumber(data.activeToday),
    type: "active",
    gradient: "from-amber-500/10 to-orange-500/5",
    iconColor: "text-amber-400",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: "Ko'rishlar",
    value: formatNumber(data.totalViews),
    type: "views",
    gradient: "from-pink-500/10 to-rose-500/5",
    iconColor: "text-pink-400",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: "Yangi a'zolar",
    value: formatNumber(data.newUsersToday),
    type: "newUsers",
    gradient: "from-cyan-500/10 to-sky-500/5",
    iconColor: "text-cyan-400",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData>({
    totalMovies: 0,
    totalSeries: 0,
    totalUsers: 0,
    activeToday: 0,
    newUsersToday: 0,
    totalViews: 0,
    activeSubscriptions: 0,
    pendingReports: 0,
    totalBroadcasts: 0,
    topGenres: [],
    topCountries: [],
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await stats.getDashboardStats();
        const d = res.data as any;
        setData({
          totalMovies: d.totalMovies ?? 0,
          totalSeries: d.totalSeries ?? 0,
          totalUsers: d.totalUsers ?? 0,
          activeToday: d.activeToday ?? 0,
          newUsersToday: d.newUsersToday ?? 0,
          totalViews: d.totalViews ?? 0,
          activeSubscriptions: (d as any).activeSubscriptions ?? 0,
          pendingReports: (d as any).pendingReports ?? 0,
          totalBroadcasts: (d as any).totalBroadcasts ?? 0,
          topGenres: (d as any).topGenres ?? [],
          topCountries: (d as any).topCountries ?? [],
        });
      } catch {
        setData({
          totalMovies: 0,
          totalSeries: 0,
          totalUsers: 0,
          activeToday: 0,
          newUsersToday: 0,
          totalViews: 0,
          activeSubscriptions: 0,
          pendingReports: 0,
          totalBroadcasts: 0,
          topGenres: [],
          topCountries: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 gradient-mesh h-28 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card bg-white/[0.02] animate-pulse h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 h-64 animate-pulse card-glow" />
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 h-64 animate-pulse card-glow" />
        </div>
      </div>
    );
  }

  const maxGenreCount = Math.max(...data.topGenres.map((g) => g.count), 1);
  const maxCountryCount = Math.max(...data.topCountries.map((c) => c.count), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 gradient-mesh">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Xush kelibsiz, <span className="gradient-brand-text">Admin</span>
          </h1>
          <p className="text-gray-400 mt-1.5">Bugungi statistika va faoliyat haqida umumiy ma&apos;lumot.</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards(data).map((card) => (
          <div key={card.title} className={`stat-card bg-gradient-to-br ${card.gradient}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</span>
              <div className={`w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.04] ${card.iconColor}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
          <h3 className="text-base font-semibold text-white mb-5">Top Janrlar</h3>
          {data.topGenres.length === 0 ? (
            <p className="text-sm text-gray-500">Ma&apos;lumot yo&apos;q</p>
          ) : (
            <div className="space-y-3">
              {data.topGenres.map((g, i) => (
                <div key={g.genre} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-28 truncate shrink-0">{g.genre}</span>
                  <div className="flex-1 h-6 rounded-lg bg-white/[0.03] overflow-hidden relative">
                    <div
                      className={`h-full rounded-lg bg-gradient-to-r ${genreColors[i % genreColors.length]} transition-all duration-700`}
                      style={{ width: `${(g.count / maxGenreCount) * 100}%`, minWidth: g.count > 0 ? "2rem" : "0" }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white w-12 text-right">{formatNumber(g.count)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
          <h3 className="text-base font-semibold text-white mb-5">Top Davlatlar</h3>
          {data.topCountries.length === 0 ? (
            <p className="text-sm text-gray-500">Ma&apos;lumot yo&apos;q</p>
          ) : (
            <div className="space-y-3">
              {data.topCountries.map((c, i) => (
                <div key={c.country} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${countryColors[i % countryColors.length]}`} />
                  <span className="text-sm text-gray-300 flex-1">{c.country}</span>
                  <span className="text-sm font-semibold text-white">{formatNumber(c.count)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
          <h3 className="text-base font-semibold text-white mb-4">Tezkor Statistika</h3>
          <div className="space-y-3">
            {[
              { label: "Faol obunalar", value: formatNumber(data.activeSubscriptions), color: "text-white" },
              { label: "Kutilayotgan hisobotlar", value: formatNumber(data.pendingReports), color: "text-white" },
              { label: "Umumiy efir soni", value: formatNumber(data.totalBroadcasts), color: "text-white" },
              { label: "Filmlar + Seryarlar", value: formatNumber(data.totalMovies + data.totalSeries), color: "text-white" },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <span className={`text-sm font-semibold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
          <h3 className="text-base font-semibold text-white mb-5">Barcha Davlatlar</h3>
          {data.topCountries.length === 0 ? (
            <p className="text-sm text-gray-500">Ma&apos;lumot yo&apos;q</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.topCountries.map((c, i) => (
                <div key={c.country} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${countryColors[i % countryColors.length]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.country}</p>
                    <p className="text-xs text-gray-500">{formatNumber(c.count)} kontent</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

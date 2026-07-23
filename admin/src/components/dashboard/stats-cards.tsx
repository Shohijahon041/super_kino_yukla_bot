"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

interface StatsCardsProps {
  totalMovies: number;
  totalSeries: number;
  totalUsers: number;
  activeToday: number;
  totalViews?: number;
  newUsersToday?: number;
}

function StatIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    movies: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
    series: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 8h20" />
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    active: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    views: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    newUsers: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  };
  return icons[type] || icons.movies;
}

export function StatsCards({
  totalMovies,
  totalSeries,
  totalUsers,
  activeToday,
  totalViews = 0,
  newUsersToday = 0,
}: StatsCardsProps) {
  const cards: { title: string; value: string; type: string; change: string; changeType: string; gradient: string; iconColor: string }[] = [
    {
      title: "Filmlar",
      value: formatNumber(totalMovies),
      type: "movies",
      change: "+12%",
      changeType: "positive",
      gradient: "from-violet-500/10 to-purple-500/5",
      iconColor: "text-violet-400",
    },
    {
      title: "Seryarlar",
      value: formatNumber(totalSeries),
      type: "series",
      change: "+8%",
      changeType: "positive",
      gradient: "from-blue-500/10 to-cyan-500/5",
      iconColor: "text-blue-400",
    },
    {
      title: "Foydalanuvchilar",
      value: formatNumber(totalUsers),
      type: "users",
      change: `+${formatNumber(newUsersToday)} today`,
      changeType: "positive",
      gradient: "from-emerald-500/10 to-teal-500/5",
      iconColor: "text-emerald-400",
    },
    {
      title: "Bugun faol",
      value: formatNumber(activeToday),
      type: "active",
      change: "+23%",
      changeType: "positive",
      gradient: "from-amber-500/10 to-orange-500/5",
      iconColor: "text-amber-400",
    },
    {
      title: "Ko'rishlar",
      value: formatNumber(totalViews),
      type: "views",
      change: "+18%",
      changeType: "positive",
      gradient: "from-pink-500/10 to-rose-500/5",
      iconColor: "text-pink-400",
    },
    {
      title: "Yangi a'zolar",
      value: formatNumber(newUsersToday),
      type: "newUsers",
      change: "today",
      changeType: "neutral",
      gradient: "from-cyan-500/10 to-sky-500/5",
      iconColor: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div key={card.title} className={`stat-card bg-gradient-to-br ${card.gradient}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</span>
            <div className={cn("w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.04]", card.iconColor)}>
              <StatIcon type={card.type} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
          <p
            className={cn(
              "text-xs mt-1.5 font-medium",
              card.changeType === "positive" && "text-emerald-400",
              card.changeType === "negative" && "text-red-400",
              card.changeType === "neutral" && "text-gray-500"
            )}
          >
            {card.change}
          </p>
        </div>
      ))}
    </div>
  );
}

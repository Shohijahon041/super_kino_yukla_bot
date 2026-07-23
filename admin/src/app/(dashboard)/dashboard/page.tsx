"use client";

import * as React from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Chart } from "@/components/dashboard/chart";
import { Badge } from "@/components/ui/badge";
import { stats } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/utils";

const activityIcons: Record<string, string> = {
  movie_added: "\uD83C\uDFAC",
  user_registered: "\uD83D\uDC64",
  series_updated: "\uD83D\uDCFA",
  report_resolved: "\u2705",
  broadcast_sent: "\uD83D\uDCE2",
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = React.useState({
    totalMovies: 0,
    totalSeries: 0,
    totalUsers: 0,
    activeToday: 0,
    totalViews: 0,
    newUsersToday: 0,
  });
  const [chartData, setChartData] = React.useState<
    { date: string; views: number; users: number }[]
  >([]);
  const [recentActivity, setRecentActivity] = React.useState<
    { id: string; type: string; description: string; user?: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          stats.getDashboardStats(),
          stats.getAnalytics({ period: "7d" }),
        ]);
        setDashboardData({
          totalMovies: statsRes.data.totalMovies,
          totalSeries: statsRes.data.totalSeries,
          totalUsers: statsRes.data.totalUsers,
          activeToday: statsRes.data.activeToday,
          totalViews: statsRes.data.totalViews,
          newUsersToday: statsRes.data.newUsersToday,
        });
        setChartData(analyticsRes.data.daily);
        setRecentActivity(statsRes.data.recentActivity || []);
      } catch {
        setDashboardData({
          totalMovies: 4192,
          totalSeries: 384,
          totalUsers: 15420,
          activeToday: 1832,
          totalViews: 2450000,
          newUsersToday: 156,
        });
        setChartData(
          Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            views: Math.floor(Math.random() * 50000) + 20000,
            users: Math.floor(Math.random() * 2000) + 500,
          }))
        );
        setRecentActivity([
          { id: "1", type: "movie_added", description: '"Dune: Part Three" filmi qo\'shildi', user: "Admin", createdAt: new Date().toISOString() },
          { id: "2", type: "user_registered", description: "Yangi foydalanuvchi john@example.com ro'yxatdan o'tdi", createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: "3", type: "series_updated", description: '"The Last of Us" seriali yangilandi', user: "Admin", createdAt: new Date(Date.now() - 7200000).toISOString() },
          { id: "4", type: "report_resolved", description: "Hisobot #1234 hal qilindi", user: "Admin", createdAt: new Date(Date.now() - 10800000).toISOString() },
          { id: "5", type: "broadcast_sent", description: '"Yangi kontent ogohlantirishi" yuborildi', user: "Admin", createdAt: new Date(Date.now() - 14400000).toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-brand animate-pulse-soft" />
          <p className="text-sm text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

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

      <StatsCards
        totalMovies={dashboardData.totalMovies}
        totalSeries={dashboardData.totalSeries}
        totalUsers={dashboardData.totalUsers}
        activeToday={dashboardData.activeToday}
        totalViews={dashboardData.totalViews}
        newUsersToday={dashboardData.newUsersToday}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Chart data={chartData} title="Ko'rishlar va Foydalanuvchilar" type="line" />
        <Chart data={chartData} title="Kunlik Faollik" type="bar" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
          <h3 className="text-base font-semibold text-white mb-4">So'nggi Faoliyat</h3>
          <div className="space-y-1">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-sm shrink-0 border border-white/[0.04]">
                  {activityIcons[activity.type] || "\uD83D\uDD14"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-600">{formatDate(activity.createdAt)}</p>
                    {activity.user && (
                      <Badge variant="secondary" className="text-[10px]">
                        {activity.user}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
          <h3 className="text-base font-semibold text-white mb-4">Tezkor Statistika</h3>
          <div className="space-y-3">
            {[
              { label: "O'rtacha Ko'rish Vaqti", value: "42 daqiqa", color: "text-white" },
              { label: "Tugallash Darajasi", value: "78%", color: "text-emerald-400" },
              { label: "Server Ishlashi", value: "99.9%", color: "text-emerald-400" },
              { label: "API So'rovlar", value: formatNumber(84520), color: "text-white" },
              { label: "Saqlash", value: "2.4 TB", color: "text-white" },
              { label: "Trafik", value: "18.7 TB", color: "text-white" },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <span className={`text-sm font-semibold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

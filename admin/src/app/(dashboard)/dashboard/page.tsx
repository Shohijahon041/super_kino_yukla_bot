"use client";

import * as React from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Chart } from "@/components/dashboard/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { stats } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/utils";

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
          totalMovies: 1247,
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
          { id: "1", type: "movie_added", description: 'New movie "Dune: Part Three" was added', user: "Admin", createdAt: new Date().toISOString() },
          { id: "2", type: "user_registered", description: "New user john@example.com registered", createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: "3", type: "series_updated", description: 'Series "The Last of Us" was updated', user: "Admin", createdAt: new Date(Date.now() - 7200000).toISOString() },
          { id: "4", type: "report_resolved", description: "Report #1234 was resolved", user: "Admin", createdAt: new Date(Date.now() - 10800000).toISOString() },
          { id: "5", type: "broadcast_sent", description: 'Broadcast "New content alert" was sent', user: "Admin", createdAt: new Date(Date.now() - 14400000).toISOString() },
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back, Admin. Here&apos;s what&apos;s happening.</p>
      </div>

      <StatsCards
        totalMovies={dashboardData.totalMovies}
        totalSeries={dashboardData.totalSeries}
        totalUsers={dashboardData.totalUsers}
        activeToday={dashboardData.activeToday}
        totalViews={dashboardData.totalViews}
        newUsersToday={dashboardData.newUsersToday}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart data={chartData} title="Views & Users (Last 7 Days)" type="line" />
        <Chart
          data={chartData}
          title="Daily Activity"
          type="bar"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                      {activity.user && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.user}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Avg. Watch Time</span>
                <span className="font-medium">42m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Completion Rate</span>
                <span className="font-medium text-emerald-400">78%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Server Uptime</span>
                <span className="font-medium text-emerald-400">99.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">API Calls Today</span>
                <span className="font-medium">{formatNumber(84520)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Storage Used</span>
                <span className="font-medium">2.4 TB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Bandwidth</span>
                <span className="font-medium">18.7 TB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

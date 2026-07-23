"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

interface StatsCardsProps {
  totalMovies: number;
  totalSeries: number;
  totalUsers: number;
  activeToday: number;
  totalViews?: number;
  newUsersToday?: number;
}

export function StatsCards({
  totalMovies,
  totalSeries,
  totalUsers,
  activeToday,
  totalViews = 0,
  newUsersToday = 0,
}: StatsCardsProps) {
  const cards = [
    {
      title: "Total Movies",
      value: formatNumber(totalMovies),
      icon: "🎬",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Total Series",
      value: formatNumber(totalSeries),
      icon: "📺",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Total Users",
      value: formatNumber(totalUsers),
      icon: "👥",
      change: `+${formatNumber(newUsersToday)} today`,
      changeType: "positive",
    },
    {
      title: "Active Today",
      value: formatNumber(activeToday),
      icon: "🔥",
      change: "+23%",
      changeType: "positive",
    },
    {
      title: "Total Views",
      value: formatNumber(totalViews),
      icon: "👁️",
      change: "+18%",
      changeType: "positive",
    },
    {
      title: "New Users Today",
      value: formatNumber(newUsersToday),
      icon: "🆕",
      change: "today",
      changeType: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">{card.title}</CardTitle>
            <span className="text-2xl">{card.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p
              className={`text-xs mt-1 ${
                card.changeType === "positive"
                  ? "text-emerald-400"
                  : card.changeType === "negative"
                  ? "text-red-400"
                  : "text-gray-400"
              }`}
            >
              {card.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

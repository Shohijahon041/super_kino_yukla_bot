"use client";

import * as React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartDataPoint {
  date: string;
  views: number;
  users: number;
}

interface ChartProps {
  data: ChartDataPoint[];
  title: string;
  type?: "line" | "bar";
}

export function Chart({ data, title, type = "line" }: ChartProps) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Views",
        data: data.map((d) => d.views),
        borderColor: "rgb(147, 197, 253)",
        backgroundColor: type === "line" ? "rgba(147, 197, 253, 0.1)" : "rgba(147, 197, 253, 0.5)",
        fill: type === "line",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: type === "line" ? 3 : 0,
      },
      {
        label: "Users",
        data: data.map((d) => d.users),
        borderColor: "rgb(134, 239, 172)",
        backgroundColor: type === "line" ? "rgba(134, 239, 172, 0.1)" : "rgba(134, 239, 172, 0.5)",
        fill: type === "line",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: type === "line" ? 3 : 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "rgb(156, 163, 175)",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "rgb(17, 24, 39)",
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(156, 163, 175)",
        borderColor: "rgb(55, 65, 81)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(55, 65, 81, 0.5)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
      },
      y: {
        grid: {
          color: "rgba(55, 65, 81, 0.5)",
        },
        ticks: {
          color: "rgb(156, 163, 175)",
        },
      },
    },
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {type === "line" ? (
            <Line data={chartData} options={options} />
          ) : (
            <Bar data={chartData} options={options} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

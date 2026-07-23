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
        label: "Ko'rishlar",
        data: data.map((d) => d.views),
        borderColor: "rgb(139, 92, 246)",
        backgroundColor:
          type === "line"
            ? "rgba(139, 92, 246, 0.08)"
            : "rgba(139, 92, 246, 0.4)",
        fill: type === "line",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: type === "line" ? 3 : 0,
        pointBackgroundColor: "rgb(139, 92, 246)",
        pointBorderColor: "rgb(139, 92, 246)",
        pointHoverRadius: type === "line" ? 5 : 0,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: "#fff",
        borderRadius: type === "bar" ? 8 : 0,
      },
      {
        label: "Foydalanuvchilar",
        data: data.map((d) => d.users),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor:
          type === "line"
            ? "rgba(16, 185, 129, 0.08)"
            : "rgba(16, 185, 129, 0.4)",
        fill: type === "line",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: type === "line" ? 3 : 0,
        pointBackgroundColor: "rgb(16, 185, 129)",
        pointBorderColor: "rgb(16, 185, 129)",
        pointHoverRadius: type === "line" ? 5 : 0,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: "#fff",
        borderRadius: type === "bar" ? 8 : 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: "rgb(148, 163, 184)",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(12, 20, 41, 0.95)",
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(156, 163, 175)",
        borderColor: "rgba(139, 92, 246, 0.2)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.03)",
        },
        ticks: {
          color: "rgb(100, 116, 139)",
          font: { size: 11 },
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.03)",
        },
        ticks: {
          color: "rgb(100, 116, 139)",
          font: { size: 11 },
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 card-glow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <div className="h-[300px]">
        {type === "line" ? (
          <Line data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}

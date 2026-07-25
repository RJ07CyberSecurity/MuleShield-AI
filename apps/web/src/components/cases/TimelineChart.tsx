"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface TimelineChartProps {
  data: {
    date: string;
    amount: number;
    risk: "low" | "medium" | "high" | "critical";
  }[];
}

export default function TimelineChart({ data }: TimelineChartProps) {
  // Custom Bar Cell to color based on risk
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "#DC2626"; // risk-critical
      case "high":
        return "#ffb596"; // tertiary/high-risk looking for the screenshot
      case "medium":
        return "#F59E0B"; // risk-medium
      default:
        return "#434655"; // neutral/outline-variant
    }
  };

  return (
    <div className="w-full h-full min-h-[150px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 0,
            left: -20,
            bottom: 0,
          }}
          barSize={24}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(67, 70, 85, 0.2)" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: "#8d90a0", fontSize: 10, fontWeight: 700 }} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            hide={true} // Hide Y axis like in screenshot
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#1d1f27', borderColor: '#434655', fontSize: '12px', color: '#e1e2ed', borderRadius: '8px' }}
            itemStyle={{ color: '#e1e2ed' }}
          />
          <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
            {
              data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} />
              ))
            }
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

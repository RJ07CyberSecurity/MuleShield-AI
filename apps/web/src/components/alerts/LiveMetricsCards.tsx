"use client";

import React, { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// Mock data generator for sparklines
const generateSparklineData = (points: number, min: number, max: number) => {
  return Array.from({ length: points }).map((_, i) => ({
    time: i,
    value: Math.floor(Math.random() * (max - min + 1)) + min,
  }));
};

export default function LiveMetricsCards() {
  const metrics = useMemo(() => [
    {
      label: "Critical Alerts",
      value: "14",
      trend: "+2",
      change: "since last hour",
      isPositive: false,
      color: "text-risk-critical",
      sparklineColor: "#DC2626", // red
      data: generateSparklineData(20, 5, 20),
      extraInfo: "Avg Response: 4.2m",
    },
    {
      label: "High Risk Accounts",
      value: "89",
      trend: "+12",
      change: "new today",
      isPositive: false,
      color: "text-risk-high",
      sparklineColor: "#F97316", // orange
      data: generateSparklineData(20, 60, 100),
      extraInfo: "Open Investigations: 42",
    },
    {
      label: "Money Protected Today",
      value: "$4.2M",
      trend: "+$800k",
      change: "vs yesterday",
      isPositive: true,
      color: "text-risk-low",
      sparklineColor: "#10B981", // green
      data: generateSparklineData(20, 1000, 5000),
      extraInfo: "Est. Fraud Prevented: $1.1M",
    },
    {
      label: "AI Confidence Avg",
      value: "96.4%",
      trend: "+0.2%",
      change: "this week",
      isPositive: true,
      color: "text-primary",
      sparklineColor: "#3B82F6", // blue
      data: generateSparklineData(20, 90, 99),
      extraInfo: "Avg Investigate Time: 12m",
    }
  ], []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="relative p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/80 hover:bg-surface-container-low transition-all group overflow-hidden"
        >
          {/* Live Animation Ping */}
          <div className="absolute top-4 right-4 flex items-center justify-center w-2 h-2">
             <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping`} style={{ backgroundColor: metric.sparklineColor }}></span>
             <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: metric.sparklineColor }}></span>
          </div>

          <div className="text-[10px] font-label-mono text-on-surface-variant uppercase font-bold tracking-wider mb-2 z-10 relative">
            {metric.label}
          </div>
          
          <div className="flex items-end gap-3 z-10 relative">
            <div className={`text-3xl font-extrabold font-display-kpi leading-none ${metric.color}`}>
              {metric.value}
            </div>
            <div className={`text-xs font-semibold flex items-center gap-0.5 pb-0.5 ${metric.isPositive ? 'text-risk-low' : 'text-risk-critical'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {metric.trend.startsWith('+') ? (metric.isPositive ? 'trending_up' : 'trending_up') : 'trending_down'}
              </span>
              {metric.trend} {metric.change}
            </div>
          </div>

          {/* Sparkline */}
          <div className="h-12 w-full mt-2 -ml-2 -mb-2 z-0 opacity-40 group-hover:opacity-80 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metric.data}>
                <defs>
                  <linearGradient id={`colorUv-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.sparklineColor} stopOpacity={0.5}/>
                    <stop offset="95%" stopColor={metric.sparklineColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={metric.sparklineColor} 
                  fillOpacity={1} 
                  fill={`url(#colorUv-${idx})`} 
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Footer Info */}
          <div className="pt-3 mt-1 border-t border-outline-variant/10 flex justify-between items-center text-[9px] font-label-mono text-on-surface-variant z-10 relative">
            <span>{metric.extraInfo}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

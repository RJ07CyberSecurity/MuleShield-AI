"use client";

import React, { useState, useEffect } from "react";

export default function AlertsHeader() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 pb-4 border-b border-outline-variant/10">
      {/* Top Nav Replacements within Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] font-label-mono uppercase tracking-wider text-on-surface-variant">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 hover:text-on-surface cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-xs">notifications_active</span>
            Global Notification Centre
          </div>
          <div className="w-px h-3 bg-outline-variant/30"></div>
          <div className="flex items-center gap-1.5 hover:text-on-surface cursor-pointer transition-colors text-risk-low">
            <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse"></span>
            System Health Indicator
          </div>
          <div className="w-px h-3 bg-outline-variant/30"></div>
          <div className="flex items-center gap-1.5 hover:text-on-surface cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-xs">psychology</span>
            Live AI Engine: ON
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs">folder_open</span>
            Active Investigations: 142
          </div>
          <div className="w-px h-3 bg-outline-variant/30"></div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs">database</span>
            Data Sources: 12 Connected
          </div>
        </div>
      </div>

      {/* Main Title and Stats */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h1 className="font-display-kpi text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
            Real-Time Fraud Alert Operations Centre
            <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-label-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              Live Stream Active
            </span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1.5">
            Real-time transaction surveillance and suspicious financial activity auditing dashboard.
          </p>
        </div>
        
        <div className="flex gap-4 text-xs text-on-surface-variant font-label-mono bg-surface-container-low border border-outline-variant/20 rounded-xl p-3 shadow-lg flex-wrap">
          <div className="flex flex-col gap-1 pr-4 lg:pr-6 border-r border-outline-variant/20">
            <span className="text-[9px] uppercase tracking-wider">Processing Rate</span>
            <span className="text-on-surface font-semibold text-sm">4,821 tx/sec</span>
          </div>
          <div className="flex flex-col gap-1 pr-4 lg:pr-6 border-r border-outline-variant/20">
            <span className="text-[9px] uppercase tracking-wider">AI Model</span>
            <span className="text-primary font-semibold text-sm">v4.2.1-XGB</span>
          </div>
          <div className="flex flex-col gap-1 pr-4 lg:pr-6 border-r border-outline-variant/20">
            <span className="text-[9px] uppercase tracking-wider">Inference</span>
            <span className="text-risk-low font-semibold text-sm">18.4ms</span>
          </div>
          <div className="flex flex-col gap-1 pr-4 lg:pr-6 border-r border-outline-variant/20">
            <span className="text-[9px] uppercase tracking-wider">Today's Alerts</span>
            <span className="text-risk-high font-semibold text-sm">14,208</span>
          </div>
          <div className="flex flex-col gap-1 pr-4 lg:pr-6 border-r border-outline-variant/20">
            <span className="text-[9px] uppercase tracking-wider">Cases</span>
            <span className="text-on-surface font-semibold text-sm">124</span>
          </div>
          <div className="flex flex-col gap-1 pr-4 lg:pr-6 border-r border-outline-variant/20">
            <span className="text-[9px] uppercase tracking-wider">False Positives</span>
            <span className="text-risk-medium font-semibold text-sm">1.2%</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider">Accuracy</span>
            <span className="text-on-surface font-semibold text-sm">99.98%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

const data = [
  { day: "Mon", transactions: 124000, alerts: 42 },
  { day: "Tue", transactions: 135000, alerts: 55 },
  { day: "Wed", transactions: 118000, alerts: 38 },
  { day: "Thu", transactions: 142000, alerts: 72 },
  { day: "Fri", transactions: 156000, alerts: 94 },
  { day: "Sat", transactions: 95000, alerts: 28 },
  { day: "Sun", transactions: 88000, alerts: 19 },
];

export default function MetricsChart() {
  const [isMounted, setIsMounted] = useState(false);

  // Avoid Hydration mismatch in Next.js Server Components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-96 w-full flex items-center justify-center bg-surface-container-low border border-outline-variant/30 rounded-2xl animate-pulse">
        <span className="text-on-surface-variant font-label-mono text-body-sm">Loading Chart Data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-1">
            System Ingestion & Threat Velocity
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            Cross-referencing total API ingress transactions with ML-flagged anomalies.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-primary-container"></span>
            <span className="text-caption text-on-surface-variant">API Ingress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-risk-high"></span>
            <span className="text-caption text-on-surface-variant">Mule Anomalies</span>
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(67, 70, 85, 0.2)" />
            <XAxis
              dataKey="day"
              stroke="#8d90a0"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "11px", fontFamily: "JetBrains Mono" }}
            />
            <YAxis
              yAxisId="left"
              stroke="#8d90a0"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "11px", fontFamily: "JetBrains Mono" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#8d90a0"
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "11px", fontFamily: "JetBrains Mono" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1d1f27",
                borderColor: "#434655",
                borderRadius: "12px",
                color: "#e1e2ed",
                fontFamily: "Inter",
                fontSize: "12px",
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="transactions"
              name="Transactions"
              stroke="#2563eb"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTransactions)"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="alerts"
              name="Threat Alerts"
              stroke="#F97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAlerts)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

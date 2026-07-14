"use client";

interface StatItem {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: string;
  colorClass: string;
}

export default function RiskStatsCard() {
  const stats: StatItem[] = [
    {
      title: "Active Alerts",
      value: 128,
      change: "+12.4% vs yesterday",
      isPositive: false, // More alerts is bad
      icon: "warning",
      colorClass: "text-risk-high bg-risk-high/10 border-risk-high/20",
    },
    {
      title: "Mule Clusters Detected",
      value: 14,
      change: "-5% vs last week",
      isPositive: true, // Less clusters is good
      icon: "hub",
      colorClass: "text-primary bg-primary/10 border-primary/20",
    },
    {
      title: "Avg Resolution Time",
      value: "4.2 hrs",
      change: "-1.8 hrs improvement",
      isPositive: true, // Less time is good
      icon: "schedule",
      colorClass: "text-risk-low bg-risk-low/10 border-risk-low/20",
    },
    {
      title: "Engine Throughput",
      value: "42.8k/s",
      change: "+8.3% increase",
      isPositive: true, // More throughput is good
      icon: "bolt",
      colorClass: "text-risk-medium bg-risk-medium/10 border-risk-medium/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low hover:border-outline-variant/60 transition-all duration-300 group hover:translate-y-[-2px] shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-body-sm font-semibold text-on-surface-variant">
              {stat.title}
            </span>
            <span
              className={`material-symbols-outlined w-10 h-10 rounded-xl flex items-center justify-center border font-semibold ${stat.colorClass} group-hover:scale-110 transition-transform`}
            >
              {stat.icon}
            </span>
          </div>

          <div>
            <div className="font-display-kpi text-display-kpi text-on-surface mb-2 font-bold">
              {stat.value}
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`material-symbols-outlined text-sm font-bold ${
                  stat.isPositive ? "text-risk-low" : "text-risk-critical"
                }`}
              >
                {stat.isPositive ? "arrow_downward" : "arrow_upward"}
              </span>
              <span
                className={`font-label-mono text-xs ${
                  stat.isPositive ? "text-risk-low" : "text-risk-critical"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

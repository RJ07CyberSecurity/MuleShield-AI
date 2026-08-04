"use client";
import { CURRENCY_SYMBOL } from "@/utils/currency";

import { useMemo } from "react";
import { Case } from "../../types/cases";
import { motion } from "framer-motion";
import { Activity, AlertOctagon, Briefcase, Clock, DollarSign, ShieldCheck, TrendingDown, TrendingUp, Users } from "lucide-react";

interface KPIStatsProps {
  cases: Case[];
}

export default function KPIStats({ cases }: KPIStatsProps) {
  const stats = useMemo(() => {
    const totalOpen = cases.filter(c => c.status !== "CLOSED").length;
    const critical = cases.filter(c => c.priority === "CRITICAL").length;
    const escalated = cases.filter(c => c.status === "INVESTIGATING").length; // Mock
    const funds = cases.reduce((acc, c) => acc + (c.totalAmount || Math.floor(Math.random() * 500000)), 0);
    const currencyCode = cases.length > 0 && cases[0].currency ? cases[0].currency : "USD";
    const dynamicSymbol = (() => {
      try {
        const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(0);
        return parts.find(p => p.type === 'currency')?.value || '$';
      } catch {
        return '$';
      }
    })();

    return [
      { 
        label: "Open Cases", 
        value: totalOpen.toString(), 
        trend: "+12%", 
        trendUp: true,
        icon: <Briefcase size={20} className="text-primary" />,
        color: "border-primary/30"
      },
      { 
        label: "Critical Cases", 
        value: critical.toString(), 
        trend: "+3%", 
        trendUp: true,
        icon: <AlertOctagon size={20} className="text-risk-critical" />,
        color: "border-risk-critical/30"
      },
      { 
        label: "Breached SLA", 
        value: "0", 
        trend: "-100%", 
        trendUp: false,
        icon: <Clock size={20} className="text-risk-low" />,
        color: "border-risk-low/30"
      },
      { 
        label: "Avg Resolution Time", 
        value: "4h 12m", 
        trend: "-15m", 
        trendUp: false,
        icon: <Activity size={20} className="text-primary" />,
        color: "border-primary/30"
      },
      { 
        label: "Funds Under Investigation", 
        value: `${dynamicSymbol}${(funds / 1000000).toFixed(2)}M`, 
        trend: `+${dynamicSymbol}1.2M`, 
        trendUp: true,
        icon: <DollarSign size={20} className="text-risk-high" />,
        color: "border-risk-high/30"
      },
      { 
        label: "Recovered Funds", 
        value: `${dynamicSymbol}8.4M`, 
        trend: `+${dynamicSymbol}400K`, 
        trendUp: true,
        icon: <ShieldCheck size={20} className="text-risk-low" />,
        color: "border-risk-low/30"
      },
      { 
        label: "Escalated Cases", 
        value: escalated.toString(), 
        trend: "-2", 
        trendUp: false,
        icon: <TrendingUp size={20} className="text-risk-medium" />,
        color: "border-risk-medium/30"
      },
      { 
        label: "Investigator Utilisation", 
        value: "92%", 
        trend: "+4%", 
        trendUp: true,
        icon: <Users size={20} className="text-primary" />,
        color: "border-primary/30"
      }
    ];
  }, [cases]);

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 select-none">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`p-4 rounded-xl border ${stat.color} bg-surface-container-low/60 hover:bg-surface-container-low transition-colors group flex flex-col justify-between h-full relative overflow-hidden`}
        >
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-current opacity-[0.03] rounded-full blur-xl group-hover:opacity-[0.06] transition-opacity" />
          
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider font-bold leading-tight">
              {stat.label}
            </h3>
            <div className="opacity-70 group-hover:opacity-100 transition-opacity">
              {stat.icon}
            </div>
          </div>
          
          <div className="mt-auto">
            <div className="text-2xl font-black text-on-surface font-display-kpi mb-1">
              {stat.value}
            </div>
            
            <div className="flex items-center gap-1">
              {stat.trendUp ? (
                <TrendingUp size={10} className="text-risk-high" />
              ) : (
                <TrendingDown size={10} className="text-risk-low" />
              )}
              <span className={`text-[10px] font-bold ${stat.trendUp && stat.trend !== "0" && !stat.trend.startsWith("-") && stat.label !== "Investigator Utilisation" && stat.label !== "Recovered Funds" ? "text-risk-high" : "text-risk-low"}`}>
                {stat.trend}
              </span>
              <span className="text-[9px] text-on-surface-variant ml-1">vs last wk</span>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}

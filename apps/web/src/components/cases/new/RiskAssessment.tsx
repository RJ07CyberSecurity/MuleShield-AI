"use client";

import { useNewCaseStore } from "../../../store/useNewCaseStore";
import { CheckSquare, Square } from "lucide-react";
import { useState } from "react";

export default function RiskAssessment() {
  const { updateField } = useNewCaseStore();
  
  // Local state for checkboxes
  const [indicators, setIndicators] = useState({
    "Rapid Fund Transfers": true,
    "Multiple Incoming Transfers": false,
    "Immediate Cash Withdrawal": true,
    "High Velocity Transactions": false,
    "Dormant Account Activated": false,
    "Multiple Device Logins": false,
    "Shared Mobile Number": true,
    "Shared Address": false,
    "Multiple Linked Accounts": false,
    "Circular Transactions": false
  });

  const toggleIndicator = (key: keyof typeof indicators) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCount = Object.values(indicators).filter(Boolean).length;
  const score = Math.min(100, activeCount * 15 + 40);

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant/30 pb-3">7. Risk Assessment</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
            <h4 className="text-sm font-semibold text-on-surface-variant mb-2">Money Mule Score</h4>
            <div className="text-5xl font-black text-risk-critical mb-2 drop-shadow-[0_0_15px_rgba(255,82,82,0.3)]">{score}</div>
            <p className="text-sm font-bold text-risk-critical px-3 py-1 bg-risk-critical/10 rounded-full border border-risk-critical/20">CRITICAL RISK</p>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold text-on-surface mb-4">Risk Indicators Checklist</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(indicators).map(([key, value]) => (
              <div 
                key={key} 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => toggleIndicator(key as keyof typeof indicators)}
              >
                {value ? (
                  <CheckSquare size={20} className="text-primary" />
                ) : (
                  <Square size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                )}
                <span className={`text-sm ${value ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

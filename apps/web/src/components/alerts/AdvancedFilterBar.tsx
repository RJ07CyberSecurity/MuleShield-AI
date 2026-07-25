"use client";

import React, { useState } from "react";

export default function AdvancedFilterBar() {
  const [riskRange, setRiskRange] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <section className="flex flex-col gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 shadow-md">
      {/* Primary Filters Row */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-on-surface font-semibold mr-2">
          <span className="material-symbols-outlined text-base">filter_alt</span>
          Filters
        </div>

        <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary/50">
          <option>Severity: All</option>
          <option>Critical (&gt;= 90)</option>
          <option>High (70-89)</option>
          <option>Medium (40-69)</option>
        </select>

        <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary/50">
          <option>Status: All Active</option>
          <option>Unassigned</option>
          <option>Escalated</option>
          <option>Under Investigation</option>
          <option>Pending KYC</option>
        </select>

        <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary/50">
          <option>Bank: All Connected</option>
          <option>Bank of Geneva</option>
          <option>Swiss Credit Union</option>
          <option>Global Standard</option>
        </select>
        
        <select className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary/50">
          <option>Type: All</option>
          <option>SWIFT Transfer</option>
          <option>Cash Withdrawal</option>
          <option>Crypto Exchange</option>
        </select>

        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-1.5">
          <span className="text-on-surface-variant font-label-mono text-[9px] uppercase">Risk Score:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={riskRange}
            onChange={(e) => setRiskRange(Number(e.target.value))}
            className="w-20 h-1 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="font-label-mono text-primary font-bold w-12">{riskRange}+</span>
        </div>

        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-auto px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          {showAdvanced ? "Hide Advanced" : "Advanced"}
        </button>
      </div>

      {/* Advanced Filters Row */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 pt-3 mt-1 border-t border-outline-variant/10 text-xs">
          {/* Quick Typology Toggles */}
          <div className="flex items-center gap-2 pr-4 border-r border-outline-variant/20">
            <span className="text-[10px] font-label-mono text-on-surface-variant uppercase">Typologies:</span>
            {["Layering", "Structuring", "Rapid Transit", "Geo Risk", "Cross Border"].map(typ => (
              <button key={typ} className="px-2 py-1 rounded bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/50 text-on-surface-variant hover:text-primary transition-colors text-[10px]">
                {typ}
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 px-4 border-r border-outline-variant/20">
            <label className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant hover:text-on-surface">
              <input type="checkbox" className="rounded border-outline-variant/30 text-primary focus:ring-primary/30 bg-surface-container-lowest" />
              Shared Device / IP
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant hover:text-on-surface">
              <input type="checkbox" className="rounded border-outline-variant/30 text-primary focus:ring-primary/30 bg-surface-container-lowest" />
              Only Unassigned
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant hover:text-on-surface">
              <input type="checkbox" className="rounded border-outline-variant/30 text-primary focus:ring-primary/30 bg-surface-container-lowest" />
              Show False Positives
            </label>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-3">
            <button className="text-on-surface-variant hover:text-on-surface transition-colors font-semibold">
              Clear All
            </button>
            <button className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-lg font-semibold transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">save</span>
              Save Filter
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

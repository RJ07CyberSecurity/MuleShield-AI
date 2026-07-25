"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../../../components/layout/Sidebar";
import { apiClient } from "../../../services/api-client";

export default function TransactionDeepInvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const transactionId = unwrappedParams.id;
  
  const [isLoading, setIsLoading] = useState(true);

  // Mocked state to hold transaction history details
  const [txDetails, setTxDetails] = useState<any>(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<any>(`/api/v1/transactions/${transactionId}`);
        if (response.success && response.data && Object.keys(response.data).length > 0) {
          setTxDetails(response.data);
        } else {
          setTxDetails(null);
        }
      } catch (err) {
        console.error("Failed to fetch transaction details", err);
        setTxDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transactionId]);

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 animate-fade-in relative">
        {/* Header section */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/explorer" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-sm font-semibold">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Explorer
              </Link>
            </div>
            <h1 className="text-display-sm font-bold text-on-surface flex items-center gap-3">
              Transaction Review
              <span className="text-title-md font-label-mono text-on-surface-variant/60 font-normal mt-1">TXN-{transactionId}</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-2 max-w-2xl">
              Deep investigation profile for this specific transfer. Review routing patterns, detection flags, and structural history.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface font-bold text-sm hover:bg-white/5 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              Halt Settlement
            </button>
            <button className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">flag</span>
              File SAR
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-on-surface-variant text-sm font-label-mono uppercase tracking-widest">Loading Ledger Data...</p>
          </div>
        ) : txDetails ? (
          <div className="max-w-5xl space-y-6">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-center">
                <span className="text-xs font-label-mono text-on-surface-variant uppercase tracking-wider mb-1">Transfer Amount</span>
                <span className="text-display-sm font-bold text-risk-critical">{txDetails.amount}</span>
              </div>
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-center">
                <span className="text-xs font-label-mono text-on-surface-variant uppercase tracking-wider mb-1">Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-risk-high animate-pulse"></span>
                  <span className="text-title-md font-bold text-on-surface">{txDetails.status}</span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-center">
                <span className="text-xs font-label-mono text-on-surface-variant uppercase tracking-wider mb-1">Timestamp (UTC)</span>
                <span className="text-title-md font-bold text-on-surface">{txDetails.date}</span>
              </div>
            </div>

            {/* Entity Flow Graphic */}
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/15 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              
              <h2 className="text-title-md font-bold text-on-surface mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_tree</span>
                Entity Flow
              </h2>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
                {/* Flow Line Background */}
                <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-0.5 bg-outline-variant/30 -translate-y-1/2 z-0"></div>

                {/* Sender */}
                <div className="w-full md:w-1/3 bg-surface-container-low border border-outline-variant/20 p-5 rounded-2xl z-10 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/30 font-bold text-xs">
                    {txDetails.sender.riskScore}
                  </div>
                  <span className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider block mb-2">Sender Account</span>
                  <h3 className="text-title-sm font-bold text-on-surface truncate">{txDetails.sender.name}</h3>
                  <p className="text-xs text-on-surface-variant font-label-mono mt-1 truncate">{txDetails.sender.id}</p>
                  <p className="text-xs text-primary/80 mt-3">{txDetails.sender.bank}</p>
                </div>

                {/* Arrow */}
                <div className="z-10 flex flex-col items-center justify-center bg-surface-container-lowest p-2 rounded-full border border-outline-variant/10 shadow-lg">
                  <span className="material-symbols-outlined text-3xl text-risk-high">arrow_forward</span>
                  <span className="text-[10px] font-label-mono text-on-surface-variant mt-1">WIRE</span>
                </div>

                {/* Receiver */}
                <div className="w-full md:w-1/3 bg-risk-critical/5 border border-risk-critical/20 p-5 rounded-2xl z-10 relative shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-risk-critical text-on-primary flex items-center justify-center font-bold text-xs shadow-lg">
                    {txDetails.receiver.riskScore}
                  </div>
                  <span className="text-[10px] font-label-mono text-risk-critical uppercase tracking-wider block mb-2 font-bold">Receiver Account (FLAGGED)</span>
                  <h3 className="text-title-sm font-bold text-on-surface truncate">{txDetails.receiver.name}</h3>
                  <p className="text-xs text-on-surface-variant font-label-mono mt-1 truncate">{txDetails.receiver.id}</p>
                  <p className="text-xs text-primary/80 mt-3">{txDetails.receiver.bank}</p>
                </div>
              </div>
            </div>

            {/* Bottom Grid for Flags and History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Risk Assessment */}
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col h-full">
                <h3 className="text-title-md font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-risk-high">warning</span>
                  Detection Flags
                </h3>
                <div className="space-y-3 flex-1">
                  {txDetails.flags.map((flag: string, i: number) => (
                    <div key={i} className="flex gap-3 items-start p-3 bg-risk-high/10 border border-risk-high/20 rounded-xl">
                      <span className="material-symbols-outlined text-risk-high text-[18px] mt-0.5">policy</span>
                      <p className="text-sm text-on-surface leading-relaxed">{flag}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction History */}
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col h-full">
                <h3 className="text-title-md font-bold text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Processing Timeline
                </h3>
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
                  {txDetails.history.map((hist: any, i: number) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-6 last:pb-0">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary bg-surface-container-highest z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-label-mono text-primary font-bold">{hist.time}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{hist.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="text-center text-on-surface-variant p-10">No transaction data found.</div>
        )}
      </main>
    </div>
  );
}

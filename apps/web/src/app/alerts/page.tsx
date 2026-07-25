"use client";

import { useEffect, useState, useMemo } from "react";
import { useAlertStore } from "../../store/useAlertStore";
import { useUIStore } from "../../store/useUIStore";
import AlertsHeader from "../../components/alerts/AlertsHeader";
import LiveMetricsCards from "../../components/alerts/LiveMetricsCards";
import AdvancedFilterBar from "../../components/alerts/AdvancedFilterBar";
import EnterpriseAlertTable from "../../components/alerts/EnterpriseAlertTable";
import InvestigationPanel from "../../components/alerts/InvestigationPanel";
import LiveActivitySidebar from "../../components/alerts/LiveActivitySidebar";

export default function AlertsPage() {
  const { alerts, selectedAlertId, setSelectedAlertId, resolveAlert, fetchAlerts } = useAlertStore();
  const { addToast } = useUIStore();
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const selectedAlert = useMemo(() => {
    return alerts.find((a) => a.id === selectedAlertId) || null;
  }, [alerts, selectedAlertId]);

  const handleAction = async (action: "DISMISSED" | "ESCALATED") => {
    if (!selectedAlert) return;
    await resolveAlert(selectedAlert.id, action);
    addToast(`Triage action completed successfully: marked as ${action}`, "success");
    setSelectedAlertId(null);
  };

  // For demonstration, sorted alerts
  const sortedAlerts = useMemo(() => {
    const sorted = [...alerts];
    sorted.sort((a, b) => {
      return sortAsc ? a.riskScore - b.riskScore : b.riskScore - a.riskScore;
    });
    return sorted;
  }, [alerts, sortAsc]);

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Dynamic Enterprise Header */}
      <AlertsHeader />

      {/* Real-time KPI / Metrics Row */}
      <LiveMetricsCards />

      {/* Advanced Enterprise Filter Bar */}
      <AdvancedFilterBar />

      {/* Main Operations Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start h-full pb-8">
        {/* Left/Main Column: Alert Table */}
        <div className="flex-1 w-full overflow-hidden min-w-0">
          <EnterpriseAlertTable 
            alerts={sortedAlerts} 
            selectedAlertId={selectedAlertId}
            onSelectAlert={setSelectedAlertId}
            sortAsc={sortAsc}
            onToggleSort={() => setSortAsc(!sortAsc)}
          />
        </div>

        {/* Dynamic Investigation Panel (only shown when alert selected) */}
        {selectedAlert && (
          <InvestigationPanel 
            alert={selectedAlert}
            onClose={() => setSelectedAlertId(null)}
            onAction={handleAction}
          />
        )}

        {/* Live Activity Stream (Hidden on smaller screens, always visible on 2xl) */}
        {!selectedAlert && (
          <LiveActivitySidebar />
        )}
      </div>
    </div>
  );
}

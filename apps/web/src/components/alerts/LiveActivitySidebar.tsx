"use client";

import React, { useState, useEffect } from "react";

const mockActivities = [
  { id: 1, type: "ALERT", text: "Critical Alert generated for ACC-9921", time: "Just now", icon: "warning", color: "text-risk-critical" },
  { id: 2, type: "SYSTEM", text: "MuleNet v4.2.1 sync completed", time: "2m ago", icon: "sync", color: "text-primary" },
  { id: 3, type: "USER", text: "Inv_Sarah assigned Case-912", time: "5m ago", icon: "person_check", color: "text-risk-low" },
  { id: 4, type: "ACTION", text: "Evidence PDF exported", time: "12m ago", icon: "file_download", color: "text-on-surface-variant" },
  { id: 5, type: "ALERT", text: "New High Risk cluster detected", time: "15m ago", icon: "hub", color: "text-risk-high" },
  { id: 6, type: "SYSTEM", text: "Swiss Credit Union node online", time: "18m ago", icon: "account_balance", color: "text-risk-low" },
];

export default function LiveActivitySidebar() {
  const [activities, setActivities] = useState(mockActivities);

  // Connect to the actual backend WebSocket for real-time live events
  useEffect(() => {
    // Using standard localhost on port 8000 for the Gateway
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/live-events";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to Live Stream WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const newActivity = JSON.parse(event.data);
        setActivities((prev) => [newActivity, ...prev].slice(0, 15)); // Keep max 15 events
      } catch (err) {
        console.error("Error parsing live event:", err);
      }
    };

    ws.onerror = (err) => {
      console.warn("WebSocket connection error. Make sure the backend is running on port 8000.");
    };

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="hidden 2xl:flex w-64 flex-shrink-0 flex-col bg-surface-container-low border-l border-outline-variant/20 h-[800px] overflow-hidden">
      <div className="p-4 border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest/95 backdrop-blur z-10">
        <h4 className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">dynamic_feed</span>
          Live Stream
        </h4>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activities.map((activity, idx) => (
          <div key={activity.id} className="flex gap-3 text-xs animate-in fade-in slide-in-from-left-2 duration-300">
            <div className={`mt-0.5 ${activity.color}`}>
              <span className="material-symbols-outlined text-[14px]">{activity.icon}</span>
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="text-on-surface leading-snug">{activity.text}</div>
              <div className="text-[9px] font-label-mono text-on-surface-variant uppercase">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { CaseTimelineEvent } from "../../types/cases";
import { motion } from "framer-motion";
import { Check, Clock, FileText, Folder, Network, PersonStanding, ShieldAlert, AlertTriangle } from "lucide-react";

interface InvestigationTimelineProps {
  events: CaseTimelineEvent[];
}

export default function InvestigationTimeline({ events }: InvestigationTimelineProps) {
  
  const getIcon = (iconName: string, isCompleted: boolean) => {
    const props = { size: 14, className: isCompleted ? "text-primary" : "text-on-surface-variant" };
    switch(iconName) {
      case "warning": return <AlertTriangle {...props} />;
      case "folder": return <Folder {...props} />;
      case "person": return <PersonStanding {...props} />;
      case "attach_file": return <FileText {...props} />;
      case "hub": return <Network {...props} />;
      case "check_circle": return <Check {...props} />;
      default: return <Clock {...props} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm font-bold text-on-surface border-b border-outline-variant/30 pb-2">
        Investigation Progression
      </div>
      
      <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-3.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/30 before:to-transparent">
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}
          >
            {/* Icon */}
            <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 absolute left-0 md:left-1/2 -translate-x-1/2 shrink-0 bg-surface-container-lowest transition-colors ${
              event.isCompleted ? "border-primary shadow-[0_0_10px_rgba(var(--color-primary),0.3)]" : "border-outline-variant/40"
            }`}>
              {getIcon(event.icon, event.isCompleted)}
            </div>
            
            {/* Content */}
            <div className={`w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border transition-colors ${
              event.isCompleted 
                ? "bg-primary/5 border-primary/20 hover:border-primary/40" 
                : "bg-surface-container-low border-outline-variant/20 opacity-60"
            }`}>
              <div className="flex flex-col gap-1">
                <span className={`font-bold text-xs ${event.isCompleted ? "text-on-surface" : "text-on-surface-variant"}`}>
                  {event.stage}
                </span>
                <span className="text-[10px] text-on-surface-variant leading-relaxed">
                  {event.description}
                </span>
                {event.timestamp && (
                  <span className="text-[9px] font-label-mono text-on-surface-variant/70 mt-1">
                    {new Date(event.timestamp).toLocaleString(undefined, { 
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                    })}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useUIStore } from "../../store/useUIStore";
import { AnimatePresence, motion } from "framer-motion";

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <span className="material-symbols-outlined text-risk-low text-lg">check_circle</span>;
      case "error":
        return <span className="material-symbols-outlined text-risk-critical text-lg">error</span>;
      case "warning":
        return <span className="material-symbols-outlined text-risk-high text-lg">warning</span>;
      default:
        return <span className="material-symbols-outlined text-primary text-lg">info</span>;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-risk-low/30 bg-[#121c18]/95";
      case "error":
        return "border-risk-critical/30 bg-[#1d0e12]/95";
      case "warning":
        return "border-risk-high/30 bg-[#1c140e]/95";
      default:
        return "border-outline-variant/35 bg-surface-container-low/95";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl ${getBorderColor(
              toast.type
            )}`}
          >
            <div className="flex gap-3 text-left">
              <div className="mt-0.5">{getIcon(toast.type)}</div>
              <div>
                <p className="text-body-sm font-medium text-on-surface leading-normal">
                  {toast.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none flex-shrink-0"
            >
              <span className="material-symbols-outlined text-sm font-semibold">close</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

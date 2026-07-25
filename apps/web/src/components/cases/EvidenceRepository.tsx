"use client";

import { Case } from "../../types/cases";
import { Download, FileText, Image as ImageIcon, MapPin, UploadCloud, Video } from "lucide-react";
import { motion } from "framer-motion";
import { useUIStore } from "../../store/useUIStore";

interface EvidenceRepositoryProps {
  caseData: Case;
}

export default function EvidenceRepository({ caseData }: EvidenceRepositoryProps) {
  const { addToast } = useUIStore();
  const evidence = caseData.evidence || [
    { id: "e1", filename: "Bank_Statement_May.pdf", type: "Bank Statement", size: "2.4 MB", uploadedBy: "System", uploadDate: "2026-06-12" },
    { id: "e2", filename: "KYC_Selfie.jpg", type: "Image", size: "1.1 MB", uploadedBy: "System", uploadDate: "2026-06-12" },
    { id: "e3", filename: "IP_Logs.csv", type: "Geo Location", size: "450 KB", uploadedBy: "Investigator JD", uploadDate: "2026-06-14" },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "Bank Statement": return <FileText size={16} className="text-primary" />;
      case "Image": return <ImageIcon size={16} className="text-risk-medium" />;
      case "Geo Location": return <MapPin size={16} className="text-risk-high" />;
      case "Video": return <Video size={16} className="text-risk-critical" />;
      default: return <FileText size={16} className="text-on-surface-variant" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div 
        onClick={() => addToast("Evidence upload simulator triggered", "info")}
        className="border-2 border-dashed border-outline-variant/40 hover:border-primary/50 bg-surface-container-low/50 hover:bg-surface-container-low rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center text-primary">
          <UploadCloud size={20} />
        </div>
        <div className="text-center">
          <h4 className="text-xs font-bold text-on-surface">Upload Evidence</h4>
          <p className="text-[10px] text-on-surface-variant mt-1">Drag and drop files here or click to browse (Max 50MB)</p>
        </div>
      </div>

      {/* Evidence List */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-label-mono text-on-surface-variant font-bold uppercase tracking-wider pl-1 mb-2">
          Attached Documents ({evidence.length})
        </h4>
        
        {evidence.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-container-highest transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-container-highest">
                {getIcon(item.type)}
              </div>
              <div>
                <h5 className="text-xs font-bold text-on-surface">{item.filename}</h5>
                <p className="text-[9px] font-label-mono text-on-surface-variant mt-0.5">
                  {item.size} • Uploaded by {item.uploadedBy} • {item.uploadDate}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => addToast(`Downloading ${item.filename}`, "success")}
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
            >
              <Download size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, DragEvent, useEffect } from "react";
import { Case } from "../../types/cases";
import { Download, FileText, Image as ImageIcon, MapPin, UploadCloud, Video, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useUIStore } from "../../store/useUIStore";
import { apiClient } from "../../services/api-client";

interface EvidenceRepositoryProps {
  caseData: Case;
}

export default function EvidenceRepository({ caseData }: EvidenceRepositoryProps) {
  const { addToast } = useUIStore();
  
  // evidence starts as the passed props or empty
  const [evidence, setEvidence] = useState<any[]>(caseData.evidence || []);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync evidence if caseData updates from parent
  useEffect(() => {
    if (caseData.evidence) {
      setEvidence(caseData.evidence);
    }
  }, [caseData.evidence]);

  const getIcon = (type: string) => {
    switch (type) {
      case "Bank Statement": return <FileText size={16} className="text-primary" />;
      case "Image": return <ImageIcon size={16} className="text-risk-medium" />;
      case "Geo Location": return <MapPin size={16} className="text-risk-high" />;
      case "Video": return <Video size={16} className="text-risk-critical" />;
      default: return <FileText size={16} className="text-on-surface-variant" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (const file of fileArray) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await apiClient.post<any>(`/api/v1/cases/${caseData.id}/evidence`, formData);
        
        if (response.success && response.data?.evidence) {
          successCount++;
          // Immediately update local evidence list with the new evidence from backend
          setEvidence(response.data.evidence);
        }
      } catch (err: any) {
        addToast(`Failed to upload ${file.name}: ${err.message}`, "error");
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      addToast(`Successfully uploaded ${successCount} file(s)`, "success");
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const triggerDownload = (evidenceId: string, filename: string) => {
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const downloadUrl = `${BASE_URL}/api/v1/cases/${caseData.id}/evidence/${evidenceId}/download`;
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast(`Downloading ${filename}...`, "success");
    } catch (err) {
      addToast("Failed to initiate download.", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
          isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${
          isDragging ? "border-primary bg-primary/10" : "border-outline-variant/40 hover:border-primary/50 bg-surface-container-low/50 hover:bg-surface-container-low"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center text-primary">
          {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
        </div>
        <div className="text-center">
          <h4 className="text-xs font-bold text-on-surface">
            {isUploading ? "Uploading..." : "Upload Evidence"}
          </h4>
          <p className="text-[10px] text-on-surface-variant mt-1">
            {isUploading ? "Please wait while files transfer" : "Drag and drop files here or click to browse (Max 50MB)"}
          </p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,video/*,audio/*" 
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = ''; // Reset input
          }} 
          disabled={isUploading}
        />
      </div>

      {/* Evidence List */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-label-mono text-on-surface-variant font-bold uppercase tracking-wider pl-1 mb-2">
          Attached Documents ({evidence.length})
        </h4>
        
        {evidence.length === 0 && (
          <div className="text-center p-4 border border-outline-variant/20 rounded-xl bg-surface-container-lowest text-xs text-on-surface-variant">
            No evidence files attached to this case yet.
          </div>
        )}

        {evidence.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-container-highest transition-colors group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-lg bg-surface-container-highest flex-shrink-0">
                {getIcon(item.type || item.content_type || "Document")}
              </div>
              <div className="overflow-hidden">
                <h5 className="text-xs font-bold text-on-surface truncate pr-2" title={item.filename || item.file_name}>
                  {item.filename || item.file_name}
                </h5>
                <p className="text-[9px] font-label-mono text-on-surface-variant mt-0.5 truncate">
                  {typeof item.size === 'number' ? formatFileSize(item.size) : item.size} • 
                  Uploaded by {item.uploadedBy || item.uploaded_by} • 
                  {item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerDownload(item.id, item.filename || item.file_name); 
              }}
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Download File"
            >
              <Download size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

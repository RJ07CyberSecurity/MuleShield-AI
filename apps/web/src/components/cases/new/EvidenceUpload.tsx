"use client";

import { useState } from "react";
import { UploadCloud, File as FileIcon, X, CheckCircle } from "lucide-react";
import { useNewCaseStore } from "../../../store/useNewCaseStore";

export default function EvidenceUpload() {
  const { evidenceFiles, addEvidenceFile, removeEvidenceFile } = useNewCaseStore();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach(file => addEvidenceFile(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      Array.from(e.target.files).forEach(file => addEvidenceFile(file));
    }
  };

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant/30 pb-3">5. Evidence Upload</h3>
      
      <div 
        className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-outline-variant/50 bg-surface-container-lowest hover:border-primary/50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadCloud size={48} className={`mb-4 ${dragActive ? 'text-primary' : 'text-on-surface-variant'}`} />
        <p className="text-on-surface font-semibold mb-2">Drag and drop evidence files here</p>
        <p className="text-on-surface-variant text-sm mb-6 text-center max-w-sm">Support for JPG, PNG, PDF, XLSX, CSV, MP4, and ZIP files. Maximum file size 50MB.</p>
        
        <label className="px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-semibold cursor-pointer transition-colors border border-primary/20">
          Browse Files
          <input type="file" multiple className="hidden" onChange={handleChange} />
        </label>
      </div>

      {evidenceFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-on-surface mb-3">Uploaded Evidence ({evidenceFiles.length})</h4>
          {evidenceFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-surface-container border border-outline-variant/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary border border-outline-variant/30">
                  <FileIcon size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{file.name}</p>
                  <p className="text-xs text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(2)} MB • SHA-256 Verified <CheckCircle size={10} className="inline text-success" /></p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <select className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none">
                  <option>Document Category</option>
                  <option>Bank Statement</option>
                  <option>FIR</option>
                  <option>Customer KYC</option>
                  <option>Transaction Report</option>
                  <option>Call Recording</option>
                  <option>Screenshot</option>
                  <option>CCTV Footage</option>
                  <option>Email Evidence</option>
                  <option>Other</option>
                </select>
                <button onClick={() => removeEvidenceFile(idx)} className="text-on-surface-variant hover:text-risk-critical p-2 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

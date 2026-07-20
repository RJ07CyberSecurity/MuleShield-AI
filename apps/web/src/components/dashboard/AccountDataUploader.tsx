"use client";

import { useState, useRef, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, CheckCircle2, AlertOctagon, RefreshCw, Eye } from "lucide-react";
import { apiClient } from "../../services/api-client";
import { useUIStore } from "../../store/useUIStore";

interface PreviewRow {
  sender_account: string;
  receiver_account: string;
  amount: number;
  currency: string;
  timestamp: string;
  transaction_type: string;
  payment_channel: string;
  beneficiary: string;
}

interface UploadError {
  row: number;
  data: any;
  reason: string;
}

interface IngestionData {
  ingestion_id: string;
  valid_count: number;
  invalid_count: number;
  preview: PreviewRow[];
  errors: UploadError[];
}

interface AccountDataUploaderProps {
  onClose: () => void;
  onSuccess: (ingestionId: string) => void;
}

export default function AccountDataUploader({ onClose, onSuccess }: AccountDataUploaderProps) {
  const { addToast } = useUIStore();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "parsing" | "validating" | "preview" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [ingestionResult, setIngestionResult] = useState<IngestionData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const isCsv = selectedFile.name.endsWith(".csv");
    const isPdf = selectedFile.name.endsWith(".pdf");
    if (!isCsv && !isPdf) {
      addToast("Invalid file type. Only bank statements in CSV and PDF formats are accepted.", "error");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      addToast("File exceeds 25MB size limit.", "error");
      return;
    }
    setFile(selectedFile);
    setUploadStatus("idle");
    setIngestionResult(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const startUpload = async () => {
    if (!file) return;

    setUploadStatus("uploading");
    setProgress(15);
    
    // Simulate upload stages nicely
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return prev;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      setProgress(90);
      setUploadStatus("parsing");

      const response = await apiClient.post<any>("/api/v1/ingestion/upload", formData);

      clearInterval(interval);
      setProgress(100);
      setUploadStatus("validating");

      setTimeout(() => {
        if (response.success && response.data.ingestion_id) {
          setIngestionResult(response.data);
          setUploadStatus("preview");
          addToast("Forensic Statement parsed and validated successfully.", "success");
        } else {
          setErrorMessage(response.message || "Failed parsing bank statement logs.");
          setUploadStatus("error");
          addToast(response.message || "Statement ingestion validation issues detected.", "error");
        }
      }, 500);

    } catch (error: any) {
      clearInterval(interval);
      setErrorMessage(error.message || "Network request connection failure.");
      setUploadStatus("error");
      addToast(error.message || "Ingestion connection failed.", "error");
    }
  };

  const confirmImport = async () => {
    if (!ingestionResult) return;
    setUploadStatus("parsing"); // show spinner on import
    try {
      const response = await apiClient.post<any>(
        `/api/v1/ingestion/${ingestionResult.ingestion_id}/confirm`,
        {}
      );
      if (response.success) {
        addToast("Statement confirmed! Detection scorer pipeline executed.", "success");
        onSuccess(ingestionResult.ingestion_id);
      } else {
        addToast(response.message || "Confirmation failed.", "error");
        setUploadStatus("preview");
      }
    } catch (err: any) {
      addToast(err.message || "Confirmation connection error.", "error");
      setUploadStatus("preview");
    }
  };

  return (
    <div className="w-full max-w-4xl bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden select-none">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors"
      >
        <X size={20} />
      </button>

      <div className="text-left mb-6">
        <h2 className="text-2xl font-black text-on-surface flex items-center gap-2.5">
          <Upload className="text-primary" />
          Ingest Transaction Statement
        </h2>
        <p className="text-xs text-on-surface-variant mt-1.5">
          Accepts standard bank ledger tables in CSV or PDF statements. Max file limit is 25MB.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {uploadStatus === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-outline-variant/40 hover:border-primary/50 hover:bg-surface-container-high/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.pdf"
                onChange={handleChange}
              />
              <div className="w-16 h-16 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center text-primary shadow-inner">
                <Upload size={32} />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-bold text-on-surface">
                  Drag and drop statement file here, or click to browse
                </p>
                <p className="text-[10px] font-label-mono text-on-surface-variant">
                  SUPPORTED TYPES: CSV, PDF | LIMIT: 25MB
                </p>
              </div>
            </div>

            {file && (
              <div className="mt-5 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-highest flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <FileText className="text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-on-surface truncate max-w-[300px]">{file.name}</p>
                    <p className="text-[10px] font-label-mono text-on-surface-variant">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={startUpload}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-fixed hover:scale-102 text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  Parse Statement
                  <Eye size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {(uploadStatus === "uploading" || uploadStatus === "parsing" || uploadStatus === "validating") && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-10 flex flex-col items-center justify-center gap-6"
          >
            <div className="relative flex items-center justify-center">
              <RefreshCw className="text-primary animate-spin" size={48} />
              <span className="absolute text-[10px] font-bold font-label-mono text-primary">
                {progress}%
              </span>
            </div>

            <div className="space-y-1.5 text-center">
              <h4 className="text-sm font-bold text-on-surface capitalize">
                {uploadStatus} Statement...
              </h4>
              <p className="text-xs text-on-surface-variant">
                {uploadStatus === "uploading" && "Uploading raw data packets to servers"}
                {uploadStatus === "parsing" && "Extracting tables and converting rows"}
                {uploadStatus === "validating" && "Running structural sanity check and deduplication filters"}
              </p>
            </div>

            <div className="w-full max-w-md h-1.5 bg-surface-container-highest border border-outline-variant/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        )}

        {uploadStatus === "preview" && ingestionResult && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Stats report cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-surface-container-highest border border-outline-variant/20 rounded-xl text-left">
                <span className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider block">Valid Rows</span>
                <span className="text-2xl font-black text-risk-low">{ingestionResult.valid_count}</span>
              </div>
              <div className="p-4 bg-surface-container-highest border border-outline-variant/20 rounded-xl text-left">
                <span className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider block">Invalid / Duplicate</span>
                <span className="text-2xl font-black text-risk-high">{ingestionResult.invalid_count}</span>
              </div>
              <div className="p-4 bg-surface-container-highest border border-outline-variant/20 rounded-xl text-left">
                <span className="text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider block">Ingestion Code</span>
                <span className="text-xs font-bold text-on-surface font-label-mono truncate block mt-2">
                  {ingestionResult.ingestion_id.substring(0, 8)}...
                </span>
              </div>
            </div>

            {/* Error notifications */}
            {ingestionResult.errors && ingestionResult.errors.length > 0 && (
              <div className="p-4 rounded-xl border border-risk-high/30 bg-risk-high/5 flex gap-3 text-left">
                <AlertOctagon className="text-risk-high flex-shrink-0" size={18} />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-risk-high">Quarantined Rows ({ingestionResult.errors.length})</h5>
                  <div className="max-h-20 overflow-y-auto pr-2 scrollbar-thin">
                    {ingestionResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-[10px] text-on-surface-variant">
                        • Row {err.row}: {err.reason} (Sample: {JSON.stringify(err.data)})
                      </p>
                    ))}
                    {ingestionResult.errors.length > 5 && (
                      <p className="text-[9px] font-bold text-on-surface-variant/75">
                        and {ingestionResult.errors.length - 5} more error entries...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Table Preview */}
            <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-highest">
              <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 text-left">
                <h5 className="text-[10px] font-label-mono text-on-surface-variant uppercase tracking-wider font-bold">
                  Ingestion Preview Table (First 10 Staged Rows)
                </h5>
              </div>
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low text-[9px] font-label-mono text-on-surface-variant uppercase tracking-wider">
                      <th className="p-2.5 text-left">Timestamp</th>
                      <th className="p-2.5 text-left">Sender</th>
                      <th className="p-2.5 text-left">Receiver</th>
                      <th className="p-2.5 text-left">Amount</th>
                      <th className="p-2.5 text-left">Channel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingestionResult.preview.map((row, i) => (
                      <tr key={i} className="border-b border-outline-variant/10 text-xs text-on-surface text-left hover:bg-surface-container-low/40">
                        <td className="p-2.5 font-label-mono">{row.timestamp.replace("T", " ").substring(0, 19)}</td>
                        <td className="p-2.5 font-label-mono">{row.sender_account}</td>
                        <td className="p-2.5 font-label-mono">{row.receiver_account}</td>
                        <td className="p-2.5 font-bold font-label-mono text-primary">
                          ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/20 text-[9px] font-semibold">{row.payment_channel}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setUploadStatus("idle");
                  setIngestionResult(null);
                }}
                className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface transition-colors"
              >
                Clear Statement
              </button>
              <button
                onClick={confirmImport}
                className="px-6 py-2.5 bg-primary hover:bg-primary-fixed text-on-primary text-xs font-black rounded-xl shadow-lg hover:shadow-primary/10 hover:scale-102 transition-all flex items-center gap-2"
              >
                Confirm & Import Statement
                <CheckCircle2 size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {uploadStatus === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-10 flex flex-col items-center justify-center gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-risk-high/10 border border-risk-high/30 flex items-center justify-center text-risk-high shadow-lg animate-bounce">
              <AlertOctagon size={32} />
            </div>

            <div className="space-y-1.5 text-center max-w-md">
              <h4 className="text-sm font-bold text-on-surface">Ingestion Failure</h4>
              <p className="text-xs text-on-surface-variant">{errorMessage}</p>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setUploadStatus("idle");
                setIngestionResult(null);
              }}
              className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary-fixed shadow-md transition-colors"
            >
              Try Another File
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

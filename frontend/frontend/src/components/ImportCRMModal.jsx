import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { importDeals } from "../api/deals";

const ACCEPTED = ".csv,.xlsx,.xls,.json,.xml,.pdf";

const FORMAT_INFO = [
  { ext: "CSV", label: "HubSpot, Pipedrive, Zoho" },
  { ext: "Excel", label: "Salesforce, Monday.com" },
  { ext: "JSON", label: "Custom CRM exports" },
  { ext: "XML",  label: "SAP, Microsoft Dynamics" },
  { ext: "PDF",  label: "Manual reports" },
];

export default function ImportCRMModal({ isOpen, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await importDeals(file);
      if (data.error) throw new Error(data.error);
      setResult(data);
      if (onImported) onImported(data.deals);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative glass-strong rounded-2xl p-6 w-full max-w-lg gradient-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Import from CRM</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Upload your CRM export — we'll create deals automatically</p>
            </div>
            <button onClick={handleClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Supported formats */}
          <div className="flex flex-wrap gap-2 mb-5">
            {FORMAT_INFO.map(({ ext, label }) => (
              <div key={ext} className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-100 rounded-lg border border-border-subtle">
                <span className="text-[10px] font-bold text-primary-400">{ext}</span>
                <span className="text-[10px] text-zinc-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging
                  ? "border-primary-500 bg-primary-600/10"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border-subtle hover:border-primary-600/50 hover:bg-surface-100"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-emerald-400" />
                  <p className="text-sm font-medium text-zinc-200">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-zinc-500" />
                  <p className="text-sm text-zinc-400">Drop your CRM export here</p>
                  <p className="text-xs text-zinc-600">or click to browse — CSV, Excel, JSON, XML, PDF</p>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Import complete</span>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-2xl font-bold text-white">{result.imported}</p>
                  <p className="text-xs text-zinc-500">deals imported</p>
                </div>
                {result.skipped > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-amber-400">{result.skipped}</p>
                    <p className="text-xs text-zinc-500">skipped (duplicates)</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.deals.map((d) => (
                  <span key={d.id} className="px-2 py-0.5 bg-surface-200 rounded-full text-[11px] text-zinc-300">
                    {d.company}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mt-3 text-xs text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            {result ? (
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white text-sm font-medium rounded-xl transition-all"
              >
                View Deals
              </button>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 bg-surface-100 hover:bg-surface-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Import Deals</>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

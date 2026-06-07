import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { ingestInteraction } from "../api/deals";

const TYPES = ["email", "call", "meeting", "note"];

const CATEGORY_COLORS = {
  pricing: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  roi: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  timing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  competitor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  champion: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  technical: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  procurement: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

export default function InteractionInput({ dealId, onIngested }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("email");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await ingestInteraction(dealId, type, content);
      setResult(data);
      setContent("");
      if (onIngested) onIngested(data);
    } catch (err) {
      console.error("Ingestion failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-1 p-1 bg-white/5 border border-border-default rounded-xl w-fit">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
              type === t
                ? "bg-primary-600 text-white shadow-sm"
                : "text-text-muted hover:text-text-primary hover:bg-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste email, call transcript, or meeting notes..."
          rows={4}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 resize-none transition-all shadow-sm backdrop-blur-sm"
          id="interaction-input"
        />
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        id="ingest-button"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Ingest & Analyse
          </>
        )}
      </button>

      {/* Extraction result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-emerald-500/10 rounded-xl p-4 border-l-4 border-l-emerald-500 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-400">
                Analysis Complete
              </span>
            </div>

            <p className="text-sm text-text-primary mb-3">
              {result.extracted?.summary}
            </p>

            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Found {result.extracted?.objections?.length || 0} objection
                {(result.extracted?.objections?.length || 0) !== 1 ? "s" : ""}
              </span>
              <span className="text-text-secondary">
                {result.extracted?.stakeholders?.length || 0} stakeholder
                {(result.extracted?.stakeholders?.length || 0) !== 1
                  ? "s"
                  : ""}{" "}
                mentioned
              </span>
            </div>

            {result.extracted?.objections?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-emerald-500/20">
                {result.extracted.objections.map((obj, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${
                      CATEGORY_COLORS[obj.category] ||
                      CATEGORY_COLORS.technical
                    }`}
                  >
                    {obj.category}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

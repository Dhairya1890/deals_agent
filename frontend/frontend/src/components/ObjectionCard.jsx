import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

const CATEGORY_COLORS = {
  pricing: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  roi: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  timing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  competitor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  champion: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  technical: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  procurement: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

export default function ObjectionCard({
  text,
  category,
  was_resolved,
  response_used,
  index = 0,
}) {
  const categoryClass =
    CATEGORY_COLORS[category] || CATEGORY_COLORS.technical;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {was_resolved ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 leading-relaxed mb-2">
            {text}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${categoryClass}`}
            >
              {category}
            </span>
            <span
              className={`text-[10px] font-medium ${
                was_resolved ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {was_resolved ? "Resolved" : "Open"}
            </span>
          </div>
          {was_resolved && response_used && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">
                Response used
              </p>
              <p className="text-xs text-zinc-400 italic">
                "{response_used}"
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

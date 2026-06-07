import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

const CATEGORY_COLORS = {
  pricing: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  roi: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  timing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  competitor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  champion: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  technical: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  procurement: "bg-pink-500/10 text-pink-400 border-pink-500/20",
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
      className="glass shadow-sm rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {was_resolved ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary leading-relaxed mb-2">
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
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-xs text-text-muted mb-1 uppercase tracking-wider">
                Response used
              </p>
              <p className="text-xs text-text-secondary italic">
                "{response_used}"
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

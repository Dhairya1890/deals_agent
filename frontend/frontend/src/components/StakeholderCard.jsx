import { motion } from "framer-motion";
import { getInitials } from "./DealHealthBadge";

const SENTIMENT_CONFIG = {
  positive: {
    bg: "bg-emerald-500/5",
    border: "border-l-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-300",
    avatarBg: "bg-emerald-500/20 text-emerald-300",
  },
  neutral: {
    bg: "bg-white/5",
    border: "border-l-gray-400",
    badge: "bg-gray-500/20 text-gray-300",
    avatarBg: "bg-gray-500/20 text-gray-300",
  },
  skeptical: {
    bg: "bg-amber-500/5",
    border: "border-l-amber-500",
    badge: "bg-amber-500/20 text-amber-300",
    avatarBg: "bg-amber-500/20 text-amber-300",
  },
  blocking: {
    bg: "bg-red-500/5",
    border: "border-l-red-500",
    badge: "bg-red-500/20 text-red-300",
    avatarBg: "bg-red-500/20 text-red-300",
  },
};

export default function StakeholderCard({
  name,
  role,
  seniority,
  sentiment,
  influence_score,
  primary_concern,
  index = 0,
}) {
  const config = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral;
  const influencePercent = Math.round((influence_score || 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`glass rounded-xl p-4 border-l-4 ${config.border} border-y border-r border-border-default shadow-sm min-w-[220px] flex-shrink-0`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${config.avatarBg}`}
        >
          {getInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{name}</p>
          <p className="text-xs text-text-secondary">{role}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${config.badge}`}
        >
          {sentiment}
        </span>
        {seniority && (
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            {seniority.replace("_", " ")}
          </span>
        )}
      </div>

      {/* Influence bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            Influence
          </span>
          <span className="text-[10px] text-text-secondary font-mono">
            {influencePercent}%
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${influencePercent}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"
          />
        </div>
      </div>

      {primary_concern && (
        <p className="text-xs text-text-secondary italic leading-relaxed">
          "{primary_concern}"
        </p>
      )}
    </motion.div>
  );
}

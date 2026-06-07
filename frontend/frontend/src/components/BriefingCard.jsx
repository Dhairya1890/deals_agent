import { motion } from "framer-motion";
import {
  Target,
  AlertTriangle,
  Eye,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { StageBadge, formatCurrency } from "./DealHealthBadge";

const CATEGORY_COLORS = {
  pricing: "bg-rose-500/20 text-rose-300",
  roi: "bg-purple-500/20 text-purple-300",
  timing: "bg-blue-500/20 text-blue-300",
  competitor: "bg-amber-500/20 text-amber-300",
  champion: "bg-teal-500/20 text-teal-300",
  technical: "bg-zinc-500/20 text-zinc-300",
  procurement: "bg-pink-500/20 text-pink-300",
};

const SENTIMENT_DOT = {
  skeptical: "bg-amber-400",
  blocking: "bg-red-400",
};

export default function BriefingCard({ briefing, onClose }) {
  if (!briefing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-strong rounded-2xl p-5 gradient-border space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            Pre-Call Briefing
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Snapshot */}
      {briefing.snapshot && (
        <div className="flex gap-3">
          <div className="flex-1 bg-surface-100 rounded-lg p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Stage
            </p>
            <StageBadge stage={briefing.snapshot.stage} />
          </div>
          <div className="flex-1 bg-surface-100 rounded-lg p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Value
            </p>
            <p className="text-sm font-semibold text-white">
              {formatCurrency(briefing.snapshot.value_usd)}
            </p>
          </div>
          <div className="flex-1 bg-surface-100 rounded-lg p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Days in Stage
            </p>
            <p className="text-sm font-semibold text-white">
              {briefing.snapshot.days_in_stage}
            </p>
          </div>
        </div>
      )}

      {/* Open Objections */}
      {briefing.open_objections?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-xs font-medium text-zinc-300">
              Open Objections
            </p>
          </div>
          <div className="space-y-1.5">
            {briefing.open_objections.map((obj) => (
              <div
                key={obj.id}
                className="flex items-start gap-2 text-xs text-zinc-400"
              >
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${
                    CATEGORY_COLORS[obj.category] || CATEGORY_COLORS.technical
                  }`}
                >
                  {obj.category}
                </span>
                <span className="leading-relaxed">{obj.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watch Stakeholders */}
      {briefing.watch_stakeholders?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="w-3.5 h-3.5 text-red-400" />
            <p className="text-xs font-medium text-zinc-300">
              Stakeholder Watch List
            </p>
          </div>
          <div className="space-y-1.5">
            {briefing.watch_stakeholders.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    SENTIMENT_DOT[s.sentiment] || "bg-zinc-400"
                  }`}
                />
                <span className="text-zinc-200 font-medium">{s.name}</span>
                <span className="text-zinc-500">{s.role}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400 italic">
                  {s.primary_concern}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Talking Points */}
      {briefing.talking_points?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
            <p className="text-xs font-medium text-zinc-300">
              Recommended Talking Points
            </p>
          </div>
          <ul className="space-y-1.5">
            {briefing.talking_points.map((tp, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-zinc-400"
              >
                <span className="text-primary-400 mt-0.5 flex-shrink-0">
                  {i + 1}.
                </span>
                <span className="leading-relaxed">{tp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Step */}
      {briefing.next_step && (
        <div className="bg-primary-600/10 border border-primary-600/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowRight className="w-3.5 h-3.5 text-primary-400" />
            <p className="text-xs font-medium text-primary-300">
              Suggested Next Step
            </p>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {briefing.next_step}
          </p>
        </div>
      )}
    </motion.div>
  );
}

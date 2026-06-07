import { motion } from "framer-motion";
import { Phone, Mail, Handshake, StickyNote } from "lucide-react";
import { formatDate } from "./DealHealthBadge";

const TYPE_CONFIG = {
  call: { icon: Phone, color: "text-blue-400", bg: "bg-blue-500/20" },
  email: { icon: Mail, color: "text-purple-400", bg: "bg-purple-500/20" },
  meeting: {
    icon: Handshake,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
  note: {
    icon: StickyNote,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
  },
};

export default function InteractionFeed({ interactions }) {
  if (!interactions || interactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-text-muted text-sm">
        No interactions logged yet
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border-default" />

      <div className="space-y-1">
        {interactions.map((interaction, i) => {
          const config =
            TYPE_CONFIG[interaction.type] || TYPE_CONFIG.note;
          const Icon = config.icon;

          return (
            <motion.div
              key={interaction.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="relative flex gap-4 py-3 group"
            >
              {/* Timeline dot */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} ring-2 ring-[#030712]`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 glass shadow-sm rounded-xl p-3.5 group-hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-xs font-medium capitalize ${config.color}`}
                  >
                    {interaction.type}
                  </span>
                  <span className="text-[10px] text-text-muted">·</span>
                  <span className="text-xs text-text-muted">
                    {formatDate(interaction.occurred_at)}
                  </span>
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  {interaction.summary}
                </p>
                {interaction.participants?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {interaction.participants.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-text-secondary border border-border-default"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

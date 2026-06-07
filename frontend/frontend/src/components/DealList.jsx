import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Calendar, TrendingUp } from "lucide-react";
import DealHealthBadge, {
  StageBadge,
  formatCurrency,
  formatDate,
} from "./DealHealthBadge";

function DealCard({ deal, index }) {
  const navigate = useNavigate();

  const lastInteractionDate = deal.interactions?.length
    ? deal.interactions[deal.interactions.length - 1].occurred_at
    : deal.created_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      onClick={() => navigate(`/deals/${deal.id}`)}
      className="glass glass-hover gradient-border rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-600/10 group"
      id={`deal-card-${deal.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-primary-300 transition-colors">
            {deal.company}
          </h3>
          <p className="text-sm text-zinc-400 mt-0.5">{deal.title}</p>
        </div>
        <DealHealthBadge deal={deal} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <StageBadge stage={deal.stage} />
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-200 text-zinc-300 border border-border-subtle">
          {deal.industry}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
        <div className="flex items-center gap-1.5 text-white">
          <TrendingUp className="w-4 h-4 text-primary-400" />
          <span className="font-semibold text-sm">
            {formatCurrency(deal.value_usd)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">{formatDate(lastInteractionDate)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
        <Building2 className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs text-zinc-500">
          {deal.stakeholders?.length || 0} stakeholders ·{" "}
          {deal.objections?.filter((o) => !o.was_resolved).length || 0} open
          objections
        </span>
      </div>
    </motion.div>
  );
}

export default function DealList({ deals }) {
  if (!deals || deals.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        <p>No deals yet. Create your first deal to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {deals.map((deal, i) => (
        <DealCard key={deal.id} deal={deal} index={i} />
      ))}
    </div>
  );
}

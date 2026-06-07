import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
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

  const isWon = deal.stage === "closed-won" || deal.stage === "won";
  
  const daysSince = Math.floor((new Date() - new Date(lastInteractionDate)) / (1000 * 60 * 60 * 24));
  const hasRisk = !isWon && (daysSince > 10 || deal.stage === "ghosted");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      onClick={() => navigate(`/deals/${deal.id}`)}
      className={`glass card-glow-${index % 3} rounded-2xl p-6 cursor-pointer flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-lg shadow-sm group`}
      id={`deal-card-${deal.id}`}
    >
      <div className="flex items-start justify-between mb-5">
        <StageBadge stage={deal.stage} />
        <DealHealthBadge deal={deal} />
      </div>

      <div className="mb-4 flex-1">
        <h3 className="text-xl font-bold text-text-primary truncate group-hover:text-primary-600 transition-colors mb-1.5">
          {deal.company}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-1">{deal.title}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-white/[0.08] text-xs font-medium bg-white/[0.04] text-text-secondary backdrop-blur-sm">
          {deal.industry}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-white/[0.08] text-xs font-medium bg-white/[0.04] text-text-secondary backdrop-blur-sm">
          B2B SaaS
        </span>
      </div>

      {hasRisk && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 leading-relaxed font-medium">
            No interaction in {daysSince} days. Review required.
          </p>
        </div>
      )}

      <div className="flex justify-between items-end border-t border-white/[0.06] pt-5 mb-6">
        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-1.5">
            Deal Value
          </div>
          <div className="text-xl font-bold text-text-primary">
            {formatCurrency(deal.value_usd)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-1.5">
            {isWon ? "Duration" : "Last Interaction"}
          </div>
          <div className="text-sm font-medium text-text-secondary">
            {isWon ? "3 Years" : formatDate(lastInteractionDate)}
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {isWon ? (
          <div className="grid grid-cols-2 gap-3">
            <button className="w-full py-2.5 bg-primary-600/80 hover:bg-primary-600 backdrop-blur-sm text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-primary-600/20 border border-primary-500/30">
              Generate Contract
            </button>
            <button className="w-full py-2.5 glass glass-hover text-text-primary text-xs font-semibold rounded-lg transition-all">
              Project Handoff
            </button>
          </div>
        ) : (
          <button className="w-full py-2.5 bg-primary-600/80 hover:bg-primary-600 backdrop-blur-sm text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-primary-600/20 border border-primary-500/30">
            {deal.stage === 'proposal' ? 'Send Follow-up' : 'View Intelligence Report'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function DealList({ deals }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
      {deals.map((deal, i) => (
        <DealCard key={deal.id} deal={deal} index={i} />
      ))}
    </div>
  );
}

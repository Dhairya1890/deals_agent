import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Plus } from "lucide-react";
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
      className="glass glass-hover gradient-border rounded-2xl p-6 cursor-pointer flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-600/10 group bg-surface-200/50 backdrop-blur-xl border border-white/5"
      id={`deal-card-${deal.id}`}
    >
      <div className="flex items-start justify-between mb-5">
        <StageBadge stage={deal.stage} />
        <DealHealthBadge deal={deal} />
      </div>

      <div className="mb-4 flex-1">
        <h3 className="text-xl font-bold text-white truncate group-hover:text-primary-300 transition-colors mb-1.5">
          {deal.company}
        </h3>
        <p className="text-sm text-zinc-400 line-clamp-1">{deal.title}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-white/10 text-xs font-medium bg-white/5 text-zinc-300">
          {deal.industry}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-white/10 text-xs font-medium bg-white/5 text-zinc-300">
          B2B SaaS
        </span>
      </div>

      {hasRisk && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-200/80 leading-relaxed">
            No interaction in {daysSince} days. Review required.
          </p>
        </div>
      )}

      <div className="flex justify-between items-end border-t border-white/10 pt-5 mb-6">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">
            Deal Value
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(deal.value_usd)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1.5">
            {isWon ? "Duration" : "Last Interaction"}
          </div>
          <div className="text-sm font-medium text-zinc-300">
            {isWon ? "3 Years" : formatDate(lastInteractionDate)}
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {isWon ? (
          <div className="grid grid-cols-2 gap-3">
            <button className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-lg transition-colors">
              Generate Contract
            </button>
            <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-lg transition-colors">
              Project Handoff
            </button>
          </div>
        ) : (
          <button className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-primary-600/20">
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

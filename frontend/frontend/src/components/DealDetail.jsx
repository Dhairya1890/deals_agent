import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DealHealthBadge, {
  StageBadge,
  formatCurrency,
} from "./DealHealthBadge";

export default function DealDetail({ deal }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass shadow-sm rounded-2xl p-6"
    >
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-4 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to deals
      </button>

      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">{deal.company}</h1>
        <StageBadge stage={deal.stage} />
        <DealHealthBadge deal={deal} />
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3">
        <span className="text-xl font-semibold gradient-text">
          {formatCurrency(deal.value_usd)}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.04] text-text-secondary border border-white/[0.08] backdrop-blur-sm">
          {deal.industry}
        </span>
      </div>
    </motion.div>
  );
}

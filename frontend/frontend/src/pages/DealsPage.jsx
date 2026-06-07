import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2 } from "lucide-react";
import DealList from "../components/DealList";
import { getDeals } from "../api/deals";
import ImportCRMModal from "../components/ImportCRMModal";


export default function DealsPage({ mode = "dashboard" }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStage, setFilterStage] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    loadDeals();
    const handleOpenNewDeal = () => setModalOpen(true);
    document.addEventListener("open-new-deal", handleOpenNewDeal);
    return () => document.removeEventListener("open-new-deal", handleOpenNewDeal);
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await getDeals();
      setDeals(data.deals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImported = (newDeals) => {
    setDeals((prev) => [...prev, ...newDeals]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 min-h-screen"
    >
      {/* Background gradient accent */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="p-8 flex-1 overflow-y-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {mode === "dashboard" ? "Active Deals Dashboard" : "Sales Pipeline"}
            </h3>
            <p className="text-white/50 text-sm">
              {mode === "dashboard" 
                ? `You have ${deals.length} deal${deals.length !== 1 ? "s" : ""} requiring attention today.`
                : `Monitoring ${deals.length} deal${deals.length !== 1 ? "s" : ""} across your pipeline.`}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="appearance-none bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 pl-8 pr-8 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-primary-600"
              >
                <option value="all" className="bg-[#09090b]">All Stages</option>
                <option value="prospecting" className="bg-[#09090b]">Prospecting</option>
                <option value="discovery" className="bg-[#09090b]">Discovery</option>
                <option value="proposal" className="bg-[#09090b]">Proposal</option>
                <option value="negotiation" className="bg-[#09090b]">Negotiation</option>
                <option value="won" className="bg-[#09090b]">Closed-Won</option>
                <option value="lost" className="bg-[#09090b]">Closed-Lost</option>
              </select>
              <span className="material-symbols-outlined text-sm absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/80">filter_list</span>
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 pl-8 pr-8 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-primary-600"
              >
                <option value="date" className="bg-[#09090b]">Sort by Date</option>
                <option value="value" className="bg-[#09090b]">Sort by Value</option>
                <option value="name" className="bg-[#09090b]">Sort by Name</option>
              </select>
              <span className="material-symbols-outlined text-sm absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/80">sort</span>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        {mode === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Total Pipeline</div>
              <div className="text-3xl font-bold text-white mb-3">$2.4M</div>
              <div className="text-xs text-success-500 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                12% vs last month
              </div>
              <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <span className="material-symbols-outlined text-3xl text-primary-400">payments</span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Weighted Forecast</div>
              <div className="text-3xl font-bold text-white mb-3">$1.1M</div>
              <div className="text-xs text-white/40 font-medium">
                Confidence level: 84%
              </div>
              <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <span className="material-symbols-outlined text-3xl text-warning-400">monitoring</span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Average Velocity</div>
              <div className="text-3xl font-bold text-white mb-3">42 Days</div>
              <div className="text-xs text-danger-500 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                3 days slower
              </div>
              <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <span className="material-symbols-outlined text-3xl text-accent-400">speed</span>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Win Rate</div>
              <div className="text-3xl font-bold text-white mb-3">28.5%</div>
              <div className="text-xs text-success-500 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">emoji_events</span>
                Top 5% of reps
              </div>
              <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <span className="material-symbols-outlined text-3xl text-primary-400">military_tech</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
          </div>
        ) : (
          <DealList 
            deals={(mode === "dashboard" 
              ? [...deals].sort((a, b) => a.id > b.id ? -1 : 1).slice(0, 2) 
              : [...deals]
                .filter((d) => filterStage === "all" || d.stage === filterStage)
                .sort((a, b) => {
                  if (sortBy === "value") return b.value_usd - a.value_usd;
                  if (sortBy === "name") return a.company.localeCompare(b.company);
                  return a.id > b.id ? -1 : 1;
                })
            )} 
          />
        )}
      </div>

      <ImportCRMModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onImported={handleImported}
      />
    </motion.div>
  );
}

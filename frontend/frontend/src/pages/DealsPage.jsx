import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2 } from "lucide-react";
import DealList from "../components/DealList";
import { getDeals, createDeal } from "../api/deals";

function NewDealModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    value_usd: "",
    industry: "",
    stage: "prospecting",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company || !form.title) return;
    setSaving(true);
    try {
      const data = await createDeal({
        ...form,
        value_usd: Number(form.value_usd) || 0,
      });
      onCreated(data.deal);
      onClose();
      setForm({
        title: "",
        company: "",
        value_usd: "",
        industry: "",
        stage: "prospecting",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative glass-strong rounded-2xl p-6 w-full max-w-md gradient-border"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">New Deal</h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                Deal Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="e.g. Acme Corp Enterprise"
                className="w-full bg-surface-100 border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-600/50 focus:ring-1 focus:ring-primary-600/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                Company
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) =>
                  setForm({ ...form, company: e.target.value })
                }
                placeholder="e.g. Acme Corp"
                className="w-full bg-surface-100 border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-600/50 focus:ring-1 focus:ring-primary-600/20 transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                  Value (USD)
                </label>
                <input
                  type="number"
                  value={form.value_usd}
                  onChange={(e) =>
                    setForm({ ...form, value_usd: e.target.value })
                  }
                  placeholder="120000"
                  className="w-full bg-surface-100 border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-600/50 focus:ring-1 focus:ring-primary-600/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                  Industry
                </label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) =>
                    setForm({ ...form, industry: e.target.value })
                  }
                  placeholder="SaaS"
                  className="w-full bg-surface-100 border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-600/50 focus:ring-1 focus:ring-primary-600/20 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !form.company || !form.title}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Deal
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadDeals();
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

  const handleDealCreated = (deal) => {
    setDeals((prev) => [...prev, deal]);
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
            <h3 className="text-2xl font-semibold text-white mb-1">
              Active Deals
            </h3>
            <p className="text-white/50 text-sm">
              Monitoring {deals.length} deal{deals.length !== 1 ? "s" : ""} across your pipeline.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filter
            </button>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-sm">sort</span>
              Sort
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
          </div>
        ) : (
          <DealList deals={deals} />
        )}
      </div>

      <NewDealModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleDealCreated}
      />
    </motion.div>
  );
}

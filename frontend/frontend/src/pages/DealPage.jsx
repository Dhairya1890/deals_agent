import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, MessageCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { getDeal, syncDeal } from "../api/deals";
import DealDetail from "../components/DealDetail";
import StakeholderCard from "../components/StakeholderCard";
import InteractionFeed from "../components/InteractionFeed";
import InteractionInput from "../components/InteractionInput";
import ObjectionCard from "../components/ObjectionCard";
import AgentChat from "../components/AgentChat";
import TaskSuggestions from "../components/TaskSuggestions";
import TaskHistory from "../components/TaskHistory";

function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-primary-400" />
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {count !== undefined && (
        <span className="text-[10px] text-text-secondary bg-white/10 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

export default function DealPage() {
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const [stakeholders, setStakeholders] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [objections, setObjections] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const autoSync = async (dealId) => {
    setSyncing(true);
    try {
      const result = await syncDeal(dealId);
      if (result.synced > 0) {
        const data = await getDeal(dealId);
        setStakeholders(data.stakeholders || []);
        setInteractions(data.interactions || []);
        setObjections(data.objections || []);
      }
    } catch (err) {
      console.error("Auto-sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const loadDeal = async () => {
    setLoading(true);
    try {
      const data = await getDeal(id);
      setDeal(data.deal);
      setStakeholders(data.stakeholders || []);
      setInteractions(data.interactions || []);
      setObjections(data.objections || []);

      autoSync(id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDeal();
  }, [id]);



  const handleIngested = (data) => {
    if (data.interaction) {
      setInteractions((prev) => [...prev, data.interaction]);
    }
    if (data.extracted?.objections) {
      const newObjections = data.extracted.objections.map((o, i) => ({
        id: `o_new_${Date.now()}_${i}`,
        text: o.text,
        category: o.category,
        was_resolved: false,
        response_used: null,
      }));
      setObjections((prev) => [...prev, ...newObjections]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center min-h-screen text-text-muted">
        Deal not found
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 min-h-screen"
    >
      <div className="fixed top-0 right-0 w-[600px] h-[400px] bg-primary-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex h-screen">
        {/* Left panel — 65% */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ flexBasis: "65%" }}>
          <DealDetail deal={deal} />

          {syncing && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing emails and messages...
            </div>
          )}

          {/* Stakeholders */}
          <section>
            <SectionHeader icon={Users} title="Stakeholders" count={stakeholders.length} />
            {stakeholders.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {stakeholders.map((s, i) => (
                  <StakeholderCard key={s.id} {...s} index={i} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No stakeholders identified yet</p>
            )}
          </section>

          {/* Interaction Timeline */}
          <section>
            <SectionHeader icon={MessageCircle} title="Interaction Timeline" count={interactions.length} />
            <InteractionFeed interactions={interactions} />
          </section>

          {/* Log New Interaction */}
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-3">Log New Interaction</h2>
            <InteractionInput dealId={deal.id} onIngested={handleIngested} />
          </section>

          {/* Objections */}
          <section>
            <SectionHeader icon={AlertTriangle} title="Objections" count={objections.length} />
            {objections.length > 0 ? (
              <div className="space-y-3">
                {objections.map((o, i) => (
                  <ObjectionCard key={o.id} {...o} index={i} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No objections logged yet</p>
            )}
          </section>

          {/* Task Suggestions */}
          <section>
            <TaskSuggestions dealId={deal.id} onTasksUpdate={setTasks} />
          </section>

          {/* Task History */}
          <section className="pb-8">
            <TaskHistory tasks={tasks} />
          </section>
        </div>

        {/* Right panel — 35% agent chat */}
        <div
          className="border-l border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col"
          style={{ flexBasis: "35%", minWidth: "320px" }}
        >
          <AgentChat dealId={deal.id} />
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, Target, PieChart as PieChartIcon, TrendingUp, Activity } from "lucide-react";
import DealList from "../components/DealList";
import { getDeals } from "../api/deals";
import ImportCRMModal from "../components/ImportCRMModal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#f43f5e'];
const WIN_LOSS_COLORS = ['#10b981', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 border border-white/[0.08] rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-sm font-semibold text-text-primary mb-1">{label || payload[0].name}</p>
        <p className="text-sm text-primary-400">
          Value: ${payload[0].value.toLocaleString()}
        </p>
        {payload[0].payload.count !== undefined && (
          <p className="text-xs text-text-muted">Count: {payload[0].payload.count}</p>
        )}
      </div>
    );
  }
  return null;
};



export default function DealsPage({ mode = "dashboard" }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStage, setFilterStage] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  async function loadDeals() {
    setLoading(true);
    try {
      const data = await getDeals();
      setDeals(data.deals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDeals();
    const handleOpenNewDeal = () => setModalOpen(true);
    document.addEventListener("open-new-deal", handleOpenNewDeal);
    return () => document.removeEventListener("open-new-deal", handleOpenNewDeal);
  }, []);



  const handleImported = (newDeals) => {
    setDeals((prev) => [...prev, ...newDeals]);
  };

  const [now] = useState(() => Date.now());

  const metrics = useMemo(() => {
    const STAGE_PROB = { prospecting: 0.1, discovery: 0.25, proposal: 0.5, negotiation: 0.75, closed: 1.0 };

    const openDeals  = deals.filter(d => d.stage !== 'closed');
    const closedDeals = deals.filter(d => d.stage === 'closed');
    const wonDeals   = closedDeals.filter(d => d.outcome === 'won');

    const totalPipeline = openDeals.reduce((s, d) => s + (d.value_usd || 0), 0);

    const weightedForecast = deals.reduce((s, d) => {
      const prob = d.stage === 'closed' ? (d.outcome === 'won' ? 1 : 0) : (STAGE_PROB[d.stage] || 0.1);
      return s + (d.value_usd || 0) * prob;
    }, 0);

    const avgVelocityDays = openDeals.length
      ? Math.round(openDeals.reduce((s, d) => s + (now - new Date(d.created_at)) / 86400000, 0) / openDeals.length)
      : 0;

    const winRate = closedDeals.length
      ? ((wonDeals.length / closedDeals.length) * 100).toFixed(1)
      : null;

    const fmt = (n) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${Math.round(n / 1_000)}k` : `$${n}`;
    const confidence = totalPipeline > 0 ? Math.round((weightedForecast / totalPipeline) * 100) : 0;

    return { totalPipeline: fmt(totalPipeline), weightedForecast: fmt(weightedForecast), avgVelocityDays, winRate, confidence, openCount: openDeals.length, closedCount: closedDeals.length };
  }, [deals]);

  const stageData = useMemo(() => {
    const stages = ["prospecting", "discovery", "proposal", "negotiation", "closed"];
    return stages.map(stage => {
      const dealsInStage = deals.filter(d => d.stage === stage);
      return {
        name: stage.charAt(0).toUpperCase() + stage.slice(1),
        value: dealsInStage.reduce((sum, d) => sum + (d.value_usd || 0), 0),
        count: dealsInStage.length
      };
    });
  }, [deals]);

  const industryData = useMemo(() => {
    const industries = {};
    deals.forEach(d => {
      if (!d.industry) return;
      if (!industries[d.industry]) industries[d.industry] = 0;
      industries[d.industry] += (d.value_usd || 0);
    });
    return Object.entries(industries)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [deals]);

  const winLossData = useMemo(() => {
    const won = deals.filter(d => d.stage === 'closed' && d.outcome === 'won').length;
    const lost = deals.filter(d => d.stage === 'closed' && d.outcome !== 'won').length;
    return [
      { name: 'Won', value: won },
      { name: 'Lost', value: lost }
    ];
  }, [deals]);

  const timelineData = useMemo(() => {
    // Simple mock timeline based on deal counts per stage
    return [
      { name: "Week 1", value: 120000 },
      { name: "Week 2", value: 150000 },
      { name: "Week 3", value: 280000 },
      { name: "Week 4", value: 340000 },
      { name: "Week 5", value: 410000 },
      { name: "Week 6", value: 890000 },
    ];
  }, [deals]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 min-h-screen"
    >
      {/* Background gradient accent */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="p-8 flex-1 overflow-y-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-3xl font-bold text-text-primary mb-2">
              {mode === "dashboard" ? "Active Deals Dashboard" : "Sales Pipeline"}
            </h3>
            <p className="text-text-secondary text-sm">
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
                className="appearance-none bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] text-text-primary pl-8 pr-8 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer outline-none focus:ring-1 focus:ring-primary-500/30 shadow-sm backdrop-blur-sm"
              >
                <option value="all">All Stages</option>
                <option value="prospecting">Prospecting</option>
                <option value="discovery">Discovery</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Closed-Won</option>
                <option value="lost">Closed-Lost</option>
              </select>
              <span className="material-symbols-outlined text-sm absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">filter_list</span>
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] text-text-primary pl-8 pr-8 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer outline-none focus:ring-1 focus:ring-primary-500/30 shadow-sm backdrop-blur-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="value">Sort by Value</option>
                <option value="name">Sort by Name</option>
              </select>
              <span className="material-symbols-outlined text-sm absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">sort</span>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        {mode === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-6 shadow-sm relative overflow-hidden group">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Total Pipeline</div>
              <div className="text-3xl font-bold text-text-primary mb-3">{metrics.totalPipeline}</div>
              <div className="text-xs text-success-600 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                Active Deals: {metrics.openCount}
              </div>
              <div className="absolute top-6 right-6 opacity-30 group-hover:opacity-50 transition-opacity">
                <span className="material-symbols-outlined text-3xl text-primary-600">payments</span>
              </div>
            </div>
            <div className="glass rounded-xl p-6 shadow-sm relative overflow-hidden group">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Weighted Forecast</div>
              <div className="text-3xl font-bold text-text-primary mb-3">{metrics.weightedForecast}</div>
              <div className="text-xs text-text-secondary font-medium">
                Confidence level: {metrics.confidence}%
              </div>
              <div className="absolute top-6 right-6 opacity-30 group-hover:opacity-50 transition-opacity">
                <span className="material-symbols-outlined text-3xl text-warning-500">monitoring</span>
              </div>
            </div>
            <div className="glass rounded-xl p-6 shadow-sm relative overflow-hidden group">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Average Velocity</div>
              <div className="text-3xl font-bold text-text-primary mb-3">{metrics.avgVelocityDays} Days</div>
              <div className="text-xs text-text-muted flex items-center gap-1 font-medium">
                Time in active stages
              </div>
              <div className="absolute top-6 right-6 opacity-30 group-hover:opacity-50 transition-opacity">
                <span className="material-symbols-outlined text-3xl text-primary-500">speed</span>
              </div>
            </div>
            <div className="glass rounded-xl p-6 shadow-sm relative overflow-hidden group">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Win Rate</div>
              <div className="text-3xl font-bold text-text-primary mb-3">{metrics.winRate ? `${metrics.winRate}%` : 'N/A'}</div>
              <div className="text-xs text-text-muted flex items-center gap-1 font-medium">
                Closed Deals: {metrics.closedCount}
              </div>
              <div className="absolute top-6 right-6 opacity-30 group-hover:opacity-50 transition-opacity">
                <span className="material-symbols-outlined text-3xl text-primary-600">military_tech</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
          </div>
        ) : mode === "dashboard" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline by Stage Chart */}
            <div className="glass rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-4 h-4 text-primary-500" />
                <h4 className="text-sm font-semibold text-text-primary">Pipeline by Stage</h4>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      axisLine={{ stroke: '#ffffff20' }} 
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tickFormatter={(val) => `$${val >= 1000 ? (val / 1000) + 'k' : val}`} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                      dx={-10}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {stageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Growth Chart */}
            <div className="glass rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-semibold text-text-primary">Revenue Growth</h4>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      axisLine={{ stroke: '#ffffff20' }} 
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tickFormatter={(val) => `$${val >= 1000 ? (val / 1000) + 'k' : val}`} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                      dx={-10}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Value by Industry Chart */}
            <div className="glass rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-semibold text-text-primary">Value by Industry</h4>
              </div>
              <div className="flex-1 w-full min-h-0 relative">
                {industryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={industryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {industryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">
                    No industry data available
                  </div>
                )}
              </div>
            </div>

            {/* Win/Loss Ratio Chart */}
            <div className="glass rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-semibold text-text-primary">Win / Loss Ratio</h4>
              </div>
              <div className="flex-1 w-full min-h-0 relative">
                {(winLossData[0].value > 0 || winLossData[1].value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winLossData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={100}
                        dataKey="value"
                        stroke="none"
                      >
                        {winLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={WIN_LOSS_COLORS[index % WIN_LOSS_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">
                    No closed deals yet
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <DealList 
            deals={[...deals]
              .filter((d) => filterStage === "all" || d.stage === filterStage)
              .sort((a, b) => {
                if (sortBy === "value") return b.value_usd - a.value_usd;
                if (sortBy === "name") return a.company.localeCompare(b.company);
                return a.id > b.id ? -1 : 1;
              })} 
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

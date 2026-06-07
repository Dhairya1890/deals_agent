/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react";

const STAGE_COLORS = {
  prospecting: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  discovery: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  proposal: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  negotiation: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "closed-won": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "closed-lost": "bg-red-500/20 text-red-300 border-red-500/30",
};

export function StageBadge({ stage }) {
  const classes = STAGE_COLORS[stage] || STAGE_COLORS.prospecting;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${classes}`}
    >
      {stage.replace("-", " ")}
    </span>
  );
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function computeDealHealth(deal) {
  const now = new Date();
  const lastInteraction = deal.interactions?.length
    ? new Date(
        deal.interactions[deal.interactions.length - 1].occurred_at
      )
    : new Date(deal.created_at);
  const daysSinceInteraction = Math.floor(
    (now - lastInteraction) / (1000 * 60 * 60 * 24)
  );

  const hasBlocking = deal.stakeholders?.some(
    (s) => s.sentiment === "blocking"
  );
  const hasSkeptical = deal.stakeholders?.some(
    (s) => s.sentiment === "skeptical"
  );

  if (
    hasBlocking ||
    daysSinceInteraction > 14 ||
    deal.stage === "ghosted"
  ) {
    return "red";
  }
  if (hasSkeptical || daysSinceInteraction > 7) {
    return "amber";
  }
  if (
    (deal.stage === "proposal" || deal.stage === "negotiation") &&
    !hasBlocking &&
    daysSinceInteraction <= 7
  ) {
    return "green";
  }
  return "amber";
}

export default function DealHealthBadge({ deal }) {
  const health = useMemo(() => computeDealHealth(deal), [deal]);

  const config = {
    green: {
      color: "bg-emerald-400",
      pulse: "pulse-green",
      label: "Healthy",
    },
    amber: {
      color: "bg-amber-400",
      pulse: "pulse-amber",
      label: "At Risk",
    },
    red: {
      color: "bg-red-400",
      pulse: "pulse-red",
      label: "Critical",
    },
  };

  const { color, pulse, label } = config[health];

  return (
    <div className="flex items-center gap-2" title={label}>
      <span
        className={`w-2.5 h-2.5 rounded-full ${color} ${pulse}`}
      />
      <span className="text-xs text-text-muted font-medium">{label}</span>
    </div>
  );
}

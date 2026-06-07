import { motion } from "framer-motion";
import { Mail, Users, Building2, FileText, CheckCircle2, Loader2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const TYPE_CONFIG = {
  email_client:   { icon: Mail,      label: "Email Client",   color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  email_team:     { icon: Users,     label: "Email Team",     color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  email_internal: { icon: Building2, label: "Email Internal", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  draft_document: { icon: FileText,  label: "Draft Document", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
};

const PRIORITY_DOT = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-zinc-500" };

export default function TaskCard({ task, onSelect, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[task.type] || TYPE_CONFIG.email_client;
  const Icon = config.icon;
  const isSelected = task.status === "selected";
  const isExecuting = task.status === "executing";
  const isCompleted = task.status === "completed";
  const isFailed = task.status === "failed";
  const isDone = isCompleted || isFailed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border transition-all duration-200 ${
        isCompleted ? "border-emerald-500/30 bg-emerald-500/5" :
        isFailed    ? "border-red-500/30 bg-red-500/5" :
        isSelected  ? "border-primary-500/60 bg-primary-600/10" :
        "border-border-subtle bg-surface-100 hover:border-zinc-600"
      }`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isDone ? "bg-surface-200" : "bg-surface-200"
          }`}>
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : isFailed ? (
              <XCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Icon className="w-4 h-4 text-zinc-400" />
            )}
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.color}`}>
                {config.label}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} title={`${task.priority} priority`} />
              {task.priority === "high" && (
                <span className="text-[10px] text-red-400 font-medium">High priority</span>
              )}
            </div>
            <p className="text-sm font-medium text-zinc-100">{task.title}</p>
          </div>

          {/* Select button */}
          {!isDone && !isExecuting && (
            <button
              onClick={() => onSelect(task.id, !isSelected)}
              disabled={disabled}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isSelected
                  ? "bg-primary-600 text-white border-primary-500"
                  : "bg-surface-200 text-zinc-400 border-border-subtle hover:text-zinc-200 hover:border-zinc-500"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isSelected ? "Selected ✓" : "Select"}
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 ml-11">
          {task.description}
        </p>

        {/* Payload info */}
        {task.payload?.to_name && !isDone && (
          <div className="ml-11 mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Mail className="w-3 h-3" />
            <span>To: <span className="text-zinc-300">{task.payload.to_name}</span>
              {task.payload.to_role && <span className="text-zinc-500"> · {task.payload.to_role}</span>}
            </span>
          </div>
        )}

        {/* Result (completed/failed) */}
        {isDone && task.result && (
          <div className="ml-11 mt-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {isCompleted ? "View result" : "View error"}
            </button>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2 text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap bg-surface-200 rounded-lg p-2.5 max-h-48 overflow-y-auto"
              >
                {task.result}
              </motion.div>
            )}
          </div>
        )}

        {/* Executing state */}
        {isExecuting && (
          <p className="ml-11 mt-2 text-[11px] text-primary-400 animate-pulse">
            Agent is working on this...
          </p>
        )}
      </div>
    </motion.div>
  );
}

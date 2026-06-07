import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { History, CheckCircle2, XCircle, ChevronDown, ChevronUp, Mail, Users, Building2, FileText } from "lucide-react";

const TYPE_ICON = {
  email_client:   Mail,
  email_team:     Users,
  email_internal: Building2,
  draft_document: FileText,
};

const TYPE_LABEL = {
  email_client:   "Email Client",
  email_team:     "Email Team",
  email_internal: "Email Internal",
  draft_document: "Document",
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function HistoryItem({ task }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TYPE_ICON[task.type] || Mail;
  const isCompleted = task.status === 'completed';

  return (
    <div className="flex gap-3 py-3 border-b border-border-subtle last:border-0">
      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
        isCompleted ? 'bg-emerald-500/15' : 'bg-red-500/15'
      }`}>
        {isCompleted
          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          : <XCircle className="w-3.5 h-3.5 text-red-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-zinc-200">{task.title}</span>
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {TYPE_LABEL[task.type]}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500">{formatDate(task.executed_at)}</p>
        {task.result && (
          <>
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 mt-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide' : 'View'} result
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap bg-surface-200 rounded-lg p-2 max-h-40 overflow-y-auto"
                >
                  {task.result}
                </motion.p>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

export default function TaskHistory({ tasks }) {
  const [collapsed, setCollapsed] = useState(true);
  const doneTasks = tasks.filter(t => ['completed', 'failed'].includes(t.status));

  if (doneTasks.length === 0) return null;

  return (
    <div className="glass-card rounded-xl border border-border-subtle overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-300">Task History</span>
          <span className="text-[10px] bg-surface-200 text-zinc-500 px-1.5 py-0.5 rounded-full">
            {doneTasks.length}
          </span>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronUp className="w-4 h-4 text-zinc-500" />}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-2">
              {doneTasks.map(task => (
                <HistoryItem key={task.id} task={task} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import TaskCard from "./TaskCard";
import { getTasks, suggestTasks, selectTask, executeTask } from "../api/tasks";

export default function TaskSuggestions({ dealId, onTasksUpdate }) {
  const [tasks, setTasksLocal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const setTasks = (value) => {
    const resolved = typeof value === 'function' ? value(tasks) : value;
    setTasksLocal(resolved);
    if (onTasksUpdate) onTasksUpdate(resolved);
  };

  const loadTasks = useCallback(async () => {
    const data = await getTasks(dealId);
    setTasks(data.tasks || []);
  }, [dealId]);

  const handleSuggest = async () => {
    setLoading(true);
    setAllDone(false);
    try {
      const data = await suggestTasks(dealId);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const data = await getTasks(dealId);
      const existing = (data.tasks || []).filter(t => ['suggested','selected'].includes(t.status));
      if (existing.length === 0) {
        handleSuggest();
      } else {
        setTasks(data.tasks || []);
      }
    })();
  }, [dealId]);

  const handleSelect = async (taskId, selected) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: selected ? 'selected' : 'suggested' } : t
    ));
    await selectTask(taskId, selected);
  };

  const selectedTasks = tasks.filter(t => t.status === 'selected');
  const activeTasks = tasks.filter(t => ['suggested','selected','executing'].includes(t.status));
  const completedTasks = tasks.filter(t => ['completed','failed'].includes(t.status));

  const handleApprove = async () => {
    if (selectedTasks.length === 0) return;
    setExecuting(true);

    for (const task of selectedTasks) {
      // Optimistically mark as executing
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'executing' } : t));

      try {
        await executeTask(task.id);
        setTasks(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: 'completed' } : t
        ));
      } catch (err) {
        setTasks(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: 'failed', result: err.message } : t
        ));
      }
    }

    // Reload to get full result text from DB
    await loadTasks();
    setExecuting(false);
    setAllDone(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Suggested Actions</h2>
            <p className="text-[10px] text-zinc-500">Select tasks, then approve for the agent to execute</p>
          </div>
        </div>
        <button
          onClick={handleSuggest}
          disabled={loading || executing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-surface-100 hover:bg-surface-200 rounded-lg transition-all border border-border-subtle disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
          <span className="text-sm text-zinc-400">Agent is analyzing this deal...</span>
        </div>
      )}

      {/* Task cards — active */}
      {!loading && activeTasks.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {activeTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={handleSelect}
                disabled={executing}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!loading && activeTasks.length === 0 && !allDone && (
        <div className="text-center py-8 text-zinc-500 text-sm">
          No suggestions yet.{" "}
          <button onClick={handleSuggest} className="text-primary-400 hover:underline">Generate tasks</button>
        </div>
      )}

      {/* All done banner */}
      <AnimatePresence>
        {allDone && completedTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-emerald-300">
              {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed by the agent.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Completed</p>
          <AnimatePresence>
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} onSelect={() => {}} disabled />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Approve button */}
      <AnimatePresence>
        {selectedTasks.length > 0 && !executing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="sticky bottom-0 pt-2"
          >
            <button
              onClick={handleApprove}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary-600/25"
            >
              <Zap className="w-4 h-4" />
              Approve & Execute {selectedTasks.length} Task{selectedTasks.length !== 1 ? 's' : ''}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Executing overlay */}
      {executing && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-primary-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          Agent is executing tasks...
        </div>
      )}
    </div>
  );
}

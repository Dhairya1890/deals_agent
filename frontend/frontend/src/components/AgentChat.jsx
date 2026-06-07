import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Send,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { sendMessage, generateBriefing } from "../api/agent";
import BriefingCard from "./BriefingCard";

const SUGGESTED_QUESTIONS = [
  "What's the biggest risk to this deal?",
  "How have we handled this objection before?",
  "What should I focus on in the next call?",
];

const OUTCOME_BADGE = {
  "closed-won": "bg-emerald-500/20 text-emerald-300",
  "closed-lost": "bg-red-500/20 text-red-300",
};

export default function AgentChat({ dealId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, briefing]);

  const handleSend = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const response = await sendMessage(dealId, messageText, history);

      const agentMessage = {
        role: "agent",
        content: response.reply,
        retrieved_deals: response.retrieved_deals,
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBriefing = async () => {
    if (briefingLoading) return;
    setBriefingLoading(true);
    try {
      const data = await generateBriefing(dealId);
      setBriefing(data);
    } catch (err) {
      console.error("Briefing failed:", err);
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Agent</h3>
            <p className="text-[10px] text-zinc-500">Deal intelligence</p>
          </div>
        </div>
        <button
          onClick={handleBriefing}
          disabled={briefingLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600/15 text-primary-300 hover:bg-primary-600/25 rounded-lg transition-all border border-primary-600/20"
          id="briefing-button"
        >
          {briefingLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <FileText className="w-3 h-3" />
          )}
          Pre-Call Briefing
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Welcome message if empty */}
        {messages.length === 0 && !briefing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600/20 to-secondary-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-primary-400" />
            </div>
            <p className="text-sm text-zinc-400 mb-1">
              Ask me about this deal
            </p>
            <p className="text-xs text-zinc-600">
              I'll analyze patterns from past deals to give you strategic advice
            </p>
          </motion.div>
        )}

        {/* Briefing */}
        <AnimatePresence>
          {briefing && (
            <BriefingCard
              briefing={briefing}
              onClose={() => setBriefing(null)}
            />
          )}
        </AnimatePresence>

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary-600 text-white rounded-br-md"
                  : "glass rounded-bl-md"
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Retrieved deals */}
              {msg.retrieved_deals?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                    Retrieved from past deals
                  </p>
                  {msg.retrieved_deals.map((deal, j) => (
                    <div
                      key={j}
                      className="bg-surface-100 rounded-lg p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            deal.outcome === "won"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {deal.outcome === "won" ? (
                            <span className="flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Won
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <XCircle className="w-2.5 h-2.5" /> Lost
                            </span>
                          )}
                        </span>
                        {deal.tags?.length > 0 && (
                          <span className="text-zinc-500 capitalize">
                            {deal.tags[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 leading-relaxed line-clamp-3">
                        {deal.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
                <span className="text-xs text-zinc-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1.5 text-[11px] text-zinc-400 bg-surface-100 hover:bg-surface-200 hover:text-zinc-200 rounded-lg transition-all border border-border-subtle truncate"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this deal..."
            className="flex-1 bg-surface-100 border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-600/50 focus:ring-1 focus:ring-primary-600/20 transition-all"
            id="agent-chat-input"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="px-3 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            id="agent-send-button"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

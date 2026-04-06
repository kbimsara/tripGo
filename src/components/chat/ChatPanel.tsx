"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  MapPin,
  Clock,
  Lightbulb,
} from "lucide-react";
import { ChatMessage, Trip } from "@/types";
import { formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface ChatPanelProps {
  tripId: string;
  trip: Partial<Trip>;
  chatHistory: ChatMessage[];
  onTripUpdate: (updatedTrip: Partial<Trip>) => void;
  onChatUpdate: (messages: ChatMessage[]) => void;
}

const QUICK_PROMPTS = [
  { icon: <MapPin className="w-3 h-3" />, text: "Add more viewpoints" },
  { icon: <Clock className="w-3 h-3" />, text: "Add a rest day" },
  { icon: <Lightbulb className="w-3 h-3" />, text: "Budget-friendly options" },
  { icon: <Sparkles className="w-3 h-3" />, text: "Add hidden gems" },
];

export default function ChatPanel({
  tripId,
  trip,
  chatHistory,
  onTripUpdate,
  onChatUpdate,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const sendMessage = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    setInput("");
    setError(null);
    setLoading(true);

    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    onChatUpdate([...chatHistory, userMsg]);

    try {
      const res = await fetch(`/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      onChatUpdate([...chatHistory, userMsg, aiMsg]);
      if (data.updatedTrip) onTripUpdate(data.updatedTrip);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      onChatUpdate([...chatHistory, userMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">TripGo AI</p>
          <p className="text-xs text-slate-500">Customize your trip with chat</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/50">
        {chatHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-slate-800 font-semibold mb-1">Your AI travel assistant</p>
            <p className="text-slate-500 text-sm">
              Ask me to modify your itinerary, add places, or get travel tips!
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                    : "bg-gradient-to-br from-violet-500 to-violet-600"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] flex flex-col gap-1 ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-slate-400">
                  {formatDate(msg.timestamp)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading bubble */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="chat-bubble-ai px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {error && (
          <div className="text-xs text-red-600 text-center py-2 bg-red-50 border border-red-100 rounded-lg px-3">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 py-2 border-t border-slate-100 bg-white">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p.text)}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {p.icon}
              {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 bg-white">
        <div className="flex gap-2 items-end bg-slate-50 border border-slate-200 rounded-xl p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to modify your trip..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none max-h-32 py-1 px-2"
            style={{ minHeight: "36px" }}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            loading={loading}
            size="sm"
            className="shrink-0"
            icon={loading ? undefined : <Send className="w-4 h-4" />}
          >
            {loading ? "" : "Send"}
          </Button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-1.5">
          Powered by Claude AI · Enter to send
        </p>
      </div>
    </div>
  );
}

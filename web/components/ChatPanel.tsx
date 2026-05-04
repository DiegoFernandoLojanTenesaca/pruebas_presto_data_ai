"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Message {
  role: "user" | "assistant";
  content: string;
  meta?: Record<string, unknown>;
  isError?: boolean;
  isTyping?: boolean;
}

interface ChatPanelProps {
  placeholder?: string;
  suggestions?: string[];
  onSend: (mensaje: string) => Promise<{ respuesta: string; meta?: Record<string, unknown> }>;
  renderMeta?: (meta: Record<string, unknown>) => React.ReactNode;
}

// Typewriter hook
function useTypewriter(text: string, speed = 12, enabled = false) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) { setDisplayed(text); setDone(true); return; }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayed, done };
}

// Sound notification
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export default function ChatPanel({ placeholder = "Escribe un mensaje...", suggestions, onSend, renderMeta }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (msg: string) => {
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const result = await onSend(msg);
      playNotificationSound();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.respuesta, meta: result.meta, isTyping: true },
      ]);
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("Failed"))) {
        errorMsg = "No se pudo conectar con el backend. Asegurate de ejecutar: python run.py";
      } else {
        errorMsg = err instanceof Error ? err.message : "Error desconocido";
      }
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input.trim());

  // Typewriter text component for assistant messages
  const TypewriterText = useCallback(({ text, onDone }: { text: string; onDone: () => void }) => {
    const { displayed, done } = useTypewriter(text, 10, true);
    useEffect(() => { if (done) onDone(); }, [done, onDone]);
    return <pre className="whitespace-pre-wrap font-sans">{displayed}<span className={done ? "hidden" : "animate-pulse"}>▌</span></pre>;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-txt-muted mt-16">
            <ChatBubbleLeftRightIcon className="w-10 h-10 mx-auto mb-3 text-accent/40" />
            <p className="text-sm mb-4">{placeholder}</p>
            {suggestions && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface-light border border-app-border rounded-xl text-xs text-txt-secondary hover:border-accent/50 hover:text-accent-light transition-all disabled:opacity-50"
                  >
                    <SparklesIcon className="w-3 h-3 text-accent/60 shrink-0" />
                    {s}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[80%]">
                {msg.isError ? (
                  <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-accent to-accent/80 text-white"
                        : "bg-surface-light border border-app-border text-txt-secondary"
                    }`}
                  >
                    {msg.role === "assistant" && msg.isTyping ? (
                      <TypewriterText text={msg.content} onDone={() => {
                        setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, isTyping: false } : m));
                      }} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    )}
                  </div>
                )}
                {msg.meta && renderMeta && !msg.isTyping && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-2"
                  >
                    {renderMeta(msg.meta)}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {/* Sugerencias después de respuesta (espera a que termine typewriter) */}
        {!loading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && !messages[messages.length - 1].isTyping && !messages[messages.length - 1].isError && suggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-1.5 pl-2"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-light border border-app-border rounded-lg text-[11px] text-txt-secondary hover:border-accent/50 hover:text-accent-light transition-all"
              >
                <SparklesIcon className="w-2.5 h-2.5 text-accent/50 shrink-0" />
                {s}
              </button>
            ))}
          </motion.div>
        )}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-surface-light border border-app-border rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-gray-400 text-xs ml-1">Pensando...</span>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-app-border p-4 bg-surface/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 bg-surface-light border border-app-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 transition-all placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent-light hover:to-accent disabled:opacity-30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 text-white"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

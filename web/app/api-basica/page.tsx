"use client";

import ChatPanel from "@/components/ChatPanel";
import MetaCard from "@/components/MetaCard";
import AnimateIn from "@/components/AnimateIn";
import { useTheme } from "@/components/ThemeProvider";
import { CommandLineIcon, SignalIcon } from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ApiBasicaPage() {
  const { t } = useTheme();

  const handleSend = async (mensaje: string) => {
    const res = await fetch(`${API}/api/01-api-basica`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje }),
    });
    const data = await res.json();
    return {
      respuesta: data.respuesta || data.error,
      meta: {
        modelo: data.modelo,
        tokens_prompt: data.tokens?.prompt,
        tokens_completion: data.tokens?.completion,
        tokens_total: data.tokens?.total,
        tiempo: `${data.tiempo_segundos}s`,
        metodo: data.metodo,
        provider: data.provider,
      },
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 h-[calc(100vh-60px)] flex flex-col">
      <AnimateIn>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <CommandLineIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-txt-muted font-mono">MODULO 01</span>
              <h1 className="text-xl font-bold text-txt-primary">{t("p01_title")}</h1>
            </div>
          </div>
          <p className="text-txt-secondary text-sm ml-12">{t("p01_desc")}</p>
          <div className="ml-12 mt-2 flex items-center gap-2 text-xs text-txt-muted">
            <SignalIcon className="w-3.5 h-3.5" />
            <span>POST /openai/v1/chat/completions → Groq</span>
          </div>
        </div>
      </AnimateIn>

      <div className="flex-1 bg-surface rounded-2xl border border-app-border overflow-hidden">
        <ChatPanel
          placeholder="Escribe cualquier pregunta... (ej: Que es un agente de IA?)"
          suggestions={[
            "Que es un agente de IA?",
            "Diferencia entre LangChain y LangGraph",
            "Como funciona RAG?",
            "Que es Groq y por que es rapido?",
            "Explicame el patron ReAct",
          ]}
          onSend={handleSend}
          renderMeta={(meta) => <MetaCard data={meta} title={t("metricas_llamada")} />}
        />
      </div>
    </div>
  );
}

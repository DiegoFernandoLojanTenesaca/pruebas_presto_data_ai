"use client";

import { useState, useRef } from "react";
import AnimateIn from "@/components/AnimateIn";
import {
  BoltIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Stats = {
  modelo?: string;
  tokens: number;
  tiempo: number;
  tps: number;
  primeraToken?: number;
};

const SUGERENCIAS = [
  "Cuentame los 5 mejores tips para captar leads en una academia de musica",
  "Explica la diferencia entre RAG y fine-tuning en 3 frases",
  "Que es el patron ReAct y por que funciona?",
  "Como diseñar un funnel de conversion para academia de piano?",
];

export default function StreamingPage() {
  const [mensaje, setMensaje] = useState(SUGERENCIAS[0]);
  const [respuesta, setRespuesta] = useState("");
  const [stats, setStats] = useState<Stats>({ tokens: 0, tiempo: 0, tps: 0 });
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inicioRef = useRef<number>(0);
  const primeraTokenRef = useRef<number | null>(null);

  const enviar = async () => {
    if (!mensaje.trim() || streaming) return;
    setRespuesta("");
    setError(null);
    setStats({ tokens: 0, tiempo: 0, tps: 0 });
    setStreaming(true);
    inicioRef.current = performance.now();
    primeraTokenRef.current = null;

    try {
      const r = await fetch(`${API}/api/01-chat-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje }),
      });

      if (!r.body) throw new Error("Sin body en response");

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let tokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lineas = buffer.split("\n\n");
        buffer = lineas.pop() || "";

        for (const linea of lineas) {
          if (!linea.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(linea.slice(6));
            if (ev.tipo === "inicio") {
              setStats((s) => ({ ...s, modelo: ev.modelo }));
            } else if (ev.tipo === "token") {
              if (primeraTokenRef.current === null) {
                primeraTokenRef.current = (performance.now() - inicioRef.current) / 1000;
              }
              tokens += 1;
              setRespuesta((prev) => prev + ev.texto);
              const elapsed = (performance.now() - inicioRef.current) / 1000;
              setStats((s) => ({
                ...s,
                tokens,
                tiempo: Number(elapsed.toFixed(2)),
                tps: Number((tokens / Math.max(elapsed, 0.001)).toFixed(1)),
                primeraToken: primeraTokenRef.current ?? undefined,
              }));
            } else if (ev.tipo === "fin") {
              setStats((s) => ({
                ...s,
                tokens: ev.tokens_emitidos,
                tiempo: ev.tiempo_segundos,
                tps: ev.tokens_por_segundo,
                primeraToken: primeraTokenRef.current ?? undefined,
              }));
            } else if (ev.tipo === "error") {
              setError(ev.mensaje);
            }
          } catch {
            // ignorar lineas sin JSON valido
          }
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <BoltIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-txt-muted font-mono">SERVER-SENT EVENTS</span>
            <h1 className="text-xl font-bold text-txt-primary">Streaming de tokens en vivo</h1>
          </div>
        </div>
        <p className="text-txt-secondary text-sm ml-12 max-w-3xl">
          En lugar de esperar la respuesta completa, recibimos tokens conforme los genera el LLM.
          UX como ChatGPT. Protocolo SSE, sin librerias adicionales en el cliente.
        </p>
      </AnimateIn>

      <div className="mt-8 bg-surface border border-app-border rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-[10px] uppercase text-txt-muted">Tu pregunta</label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={2}
            className="w-full mt-1 bg-surface-light border border-app-border rounded-lg p-3 text-sm text-txt-primary"
            placeholder="Escribe lo que quieras preguntar..."
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {SUGERENCIAS.map((s, i) => (
            <button
              key={i}
              onClick={() => setMensaje(s)}
              className="text-[11px] px-2.5 py-1 bg-surface-light border border-app-border rounded-md text-txt-secondary hover:text-txt-primary"
            >
              {s.slice(0, 50)}...
            </button>
          ))}
        </div>

        <button
          onClick={enviar}
          disabled={streaming || !mensaje.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          {streaming ? "Streaming..." : "Enviar y stream"}
        </button>
      </div>

      <AnimateIn delay={0.05}>
        <div className="mt-5 bg-surface border border-app-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-txt-primary">Respuesta en vivo</h2>
            {streaming && (
              <span className="flex items-center gap-1.5 text-[10px] text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                LLM escribiendo...
              </span>
            )}
          </div>

          <div className="bg-surface-light border border-app-border rounded-lg p-4 min-h-[180px] text-sm text-txt-primary leading-relaxed whitespace-pre-wrap">
            {respuesta || (
              <span className="text-txt-muted italic">
                Los tokens apareceran aqui conforme el LLM los genera...
              </span>
            )}
            {streaming && (
              <span className="inline-block w-2 h-4 bg-yellow-400 ml-0.5 animate-pulse" />
            )}
          </div>

          {error && (
            <div className="mt-3 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
              {error}
            </div>
          )}

          {(stats.tokens > 0 || stats.modelo) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <Stat label="Modelo" value={stats.modelo?.split("-")[0] || "—"} />
              <Stat label="Tokens" value={stats.tokens} />
              <Stat label="TTF (1er token)" value={stats.primeraToken ? `${stats.primeraToken.toFixed(2)}s` : "—"} />
              <Stat label="Tokens/seg" value={stats.tps} highlight />
            </div>
          )}
        </div>
      </AnimateIn>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-surface-light rounded-lg p-2.5">
      <div className="text-[9px] uppercase text-txt-muted">{label}</div>
      <div className={`text-base font-bold tabular-nums ${highlight ? "text-yellow-400" : "text-txt-primary"}`}>
        {value}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import AnimateIn from "@/components/AnimateIn";
import { Donut } from "@/components/Charts";
import {
  TagIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Resultado = {
  texto: string;
  intencion: string;
  sentimiento: string;
  urgencia: string;
  idioma: string;
  confianza: number;
  keywords: string[];
  explicacion?: string;
};

type BatchResult = {
  total_procesados: number;
  resultados: Resultado[];
  agregados: {
    intenciones: Record<string, number>;
    sentimientos: Record<string, number>;
  };
};

const COLOR_INTENCION: Record<string, string> = {
  interes_alto: "#10b981",
  consulta: "#3b82f6",
  objecion: "#f59e0b",
  reclamo: "#ef4444",
  spam: "#6b7280",
  otro: "#a855f7",
};

const COLOR_SENT: Record<string, string> = {
  positivo: "#10b981",
  neutro: "#6b7280",
  negativo: "#ef4444",
};

const EJEMPLOS_BATCH = [
  "Hola quiero saber sobre clases de piano para mi hijo",
  "Esta muy caro, pensare otra opcion",
  "Que es esto? me llego un mensaje raro",
  "Necesito hablar con alguien YA, mi hijo tiene clase manana",
  "Ofrezco mejores precios en mi academia, contactame",
  "Me cancelaron la clase y nadie me aviso, esto es pesimo",
  "Cuanto cuestan las clases de guitarra?",
];

export default function ClasificarPage() {
  const [tab, setTab] = useState<"single" | "batch">("single");

  // Single
  const [texto, setTexto] = useState("Esta muy caro, pensare otra opcion");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);

  // Batch
  const [textos, setTextos] = useState<string[]>(EJEMPLOS_BATCH);
  const [batch, setBatch] = useState<BatchResult | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(false);

  const clasificar = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/clasificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, incluir_explicacion: true }),
      });
      setResultado(await r.json());
    } finally {
      setLoading(false);
    }
  };

  const clasificarBatch = async () => {
    setLoadingBatch(true);
    setBatch(null);
    try {
      const r = await fetch(`${API}/api/clasificar/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textos: textos.filter((t) => t.trim()) }),
      });
      setBatch(await r.json());
    } finally {
      setLoadingBatch(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <TagIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-txt-muted font-mono">CLASIFICACION ZERO-SHOT</span>
            <h1 className="text-xl font-bold text-txt-primary">Sentimiento e intencion sin entrenamiento</h1>
          </div>
        </div>
        <p className="text-txt-secondary text-sm ml-12 max-w-3xl">
          El LLM clasifica mensajes en intenciones (interes_alto, objecion, consulta, spam, reclamo),
          sentimiento, urgencia e idioma. Sin dataset, sin fine-tuning. Mismo patron que Sudial AI.
        </p>
      </AnimateIn>

      <div className="mt-6 flex gap-1 p-1 bg-surface border border-app-border rounded-lg w-fit">
        <button
          onClick={() => setTab("single")}
          className={`px-3 py-1.5 rounded-md text-xs ${tab === "single" ? "bg-surface-light text-txt-primary" : "text-txt-muted"}`}
        >
          Mensaje individual
        </button>
        <button
          onClick={() => setTab("batch")}
          className={`px-3 py-1.5 rounded-md text-xs ${tab === "batch" ? "bg-surface-light text-txt-primary" : "text-txt-muted"}`}
        >
          Batch + analitica
        </button>
      </div>

      {tab === "single" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <AnimateIn>
            <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-txt-primary">Mensaje a clasificar</h2>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={6}
                className="w-full bg-surface-light border border-app-border rounded-lg p-3 text-sm text-txt-primary"
              />
              <button
                onClick={clasificar}
                disabled={loading || !texto.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" />
                {loading ? "Clasificando..." : "Clasificar"}
              </button>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.05}>
            <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-4 min-h-[280px]">
              <h2 className="text-sm font-bold text-txt-primary">Resultado</h2>
              {!resultado && !loading && (
                <p className="text-txt-muted text-xs">Escribe un mensaje y clasifica.</p>
              )}
              {loading && <p className="text-txt-muted text-xs">Procesando...</p>}
              {resultado && !("error" in resultado) && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Intencion" value={resultado.intencion} color={COLOR_INTENCION[resultado.intencion]} />
                    <Stat label="Sentimiento" value={resultado.sentimiento} color={COLOR_SENT[resultado.sentimiento]} />
                    <Stat label="Urgencia" value={resultado.urgencia} />
                    <Stat label="Idioma" value={resultado.idioma} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-txt-muted mb-1">Confianza</div>
                    <div className="h-2 bg-surface-light rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                        style={{ width: `${(resultado.confianza || 0) * 100}%` }}
                      />
                    </div>
                    <div className="text-right text-[10px] text-txt-muted mt-0.5">
                      {Math.round((resultado.confianza || 0) * 100)}%
                    </div>
                  </div>
                  {resultado.keywords?.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase text-txt-muted mb-1">Keywords</div>
                      <div className="flex flex-wrap gap-1.5">
                        {resultado.keywords.map((k, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 bg-surface-light border border-app-border rounded font-mono text-txt-secondary"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resultado.explicacion && (
                    <div className="text-xs text-txt-secondary bg-surface-light rounded-lg p-3">
                      <span className="text-violet-400 font-bold">Por que: </span>
                      {resultado.explicacion}
                    </div>
                  )}
                </div>
              )}
            </div>
          </AnimateIn>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          <AnimateIn>
            <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-3 lg:col-span-2">
              <h2 className="text-sm font-bold text-txt-primary">Lista de mensajes ({textos.length})</h2>
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {textos.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <textarea
                      value={t}
                      onChange={(e) => {
                        const next = [...textos];
                        next[i] = e.target.value;
                        setTextos(next);
                      }}
                      rows={1}
                      className="flex-1 bg-surface-light border border-app-border rounded px-2 py-1.5 text-xs text-txt-primary resize-none"
                    />
                    <button
                      onClick={() => setTextos(textos.filter((_, idx) => idx !== i))}
                      className="text-txt-muted hover:text-rose-400"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setTextos([...textos, ""])}
                  className="flex items-center gap-1 text-[11px] text-txt-muted hover:text-accent-light"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Agregar mensaje
                </button>
              </div>

              <button
                onClick={clasificarBatch}
                disabled={loadingBatch || textos.filter((t) => t.trim()).length === 0}
                className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40"
              >
                {loadingBatch ? "Clasificando batch..." : `Clasificar ${textos.filter((t) => t.trim()).length} mensajes`}
              </button>

              {batch && (
                <div className="space-y-1.5 mt-3">
                  <h3 className="text-xs font-bold text-txt-primary">Resultados detallados</h3>
                  {batch.resultados.map((r, i) => (
                    <div
                      key={i}
                      className="bg-surface-light border border-app-border rounded p-2 text-xs"
                    >
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <span className="text-txt-primary truncate flex-1">{r.texto}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                          style={{
                            color: COLOR_INTENCION[r.intencion] || "#6b7280",
                            background: `${COLOR_INTENCION[r.intencion] || "#6b7280"}15`,
                          }}
                        >
                          {r.intencion}
                        </span>
                      </div>
                      <div className="text-[10px] text-txt-muted flex gap-2">
                        <span style={{ color: COLOR_SENT[r.sentimiento] }}>{r.sentimiento}</span>
                        <span>·</span>
                        <span>urg {r.urgencia}</span>
                        <span>·</span>
                        <span>{Math.round((r.confianza || 0) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AnimateIn>

          <AnimateIn delay={0.05}>
            <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-5">
              <h2 className="text-sm font-bold text-txt-primary">Distribucion</h2>
              {!batch ? (
                <p className="text-txt-muted text-xs">Ejecuta el batch para ver el desglose visual.</p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="text-[10px] uppercase text-txt-muted mb-2">Intenciones</div>
                    <div className="flex justify-center">
                      <Donut
                        data={Object.entries(batch.agregados.intenciones).map(([k, v]) => ({
                          label: k,
                          value: v,
                          color: COLOR_INTENCION[k] || "#6b7280",
                        }))}
                      />
                    </div>
                    <div className="space-y-1 mt-3">
                      {Object.entries(batch.agregados.intenciones).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: COLOR_INTENCION[k] || "#6b7280" }}
                            />
                            <span className="text-txt-secondary">{k}</span>
                          </span>
                          <span className="font-bold text-txt-primary tabular-nums">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AnimateIn>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-light rounded-lg p-3">
      <div className="text-[10px] uppercase text-txt-muted">{label}</div>
      <div
        className="text-sm font-bold mt-0.5 capitalize"
        style={{ color: color || "var(--txt-primary)" }}
      >
        {value?.replace("_", " ")}
      </div>
    </div>
  );
}

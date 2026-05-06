"use client";

import { useState } from "react";
import AnimateIn from "@/components/AnimateIn";
import { GaugeBar } from "@/components/Charts";
import {
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Mensaje = { rol: "lead" | "asistente"; texto: string };
type Resultado = {
  score: number;
  categoria: "frio" | "tibio" | "caliente";
  justificacion: string;
  senales_positivas: string[];
  senales_negativas: string[];
  siguiente_accion: string;
  confianza: number;
};

const COLOR_CAT: Record<string, string> = {
  caliente: "from-rose-500 to-red-500",
  tibio: "from-amber-400 to-orange-500",
  frio: "from-sky-400 to-cyan-500",
};

const EJEMPLOS = [
  {
    nombre: "Caliente",
    conv: [
      { rol: "lead" as const, texto: "Hola quiero clases de piano para mi hijo de 8 anos" },
      { rol: "asistente" as const, texto: "Que bueno! Cuando podriamos hacer una prueba?" },
      { rol: "lead" as const, texto: "Este sabado, soy Maria Perez, tel 0987654321" },
    ],
  },
  {
    nombre: "Tibio",
    conv: [
      { rol: "lead" as const, texto: "Hola, dan clases de guitarra?" },
      { rol: "asistente" as const, texto: "Si! $50/mes. Te interesa una prueba gratis?" },
      { rol: "lead" as const, texto: "Voy a pensarlo. Tienen tambien bateria?" },
    ],
  },
  {
    nombre: "Frio",
    conv: [
      { rol: "lead" as const, texto: "Que es esto?" },
      { rol: "asistente" as const, texto: "Somos una academia de musica. Te interesa alguna clase?" },
      { rol: "lead" as const, texto: "No se, solo vi el anuncio" },
    ],
  },
];

export default function ScoringPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>(EJEMPLOS[0].conv);
  const [academia, setAcademia] = useState("armonia");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [tiempo, setTiempo] = useState<number | null>(null);

  const calificar = async () => {
    setLoading(true);
    setResultado(null);
    const t0 = performance.now();
    try {
      const r = await fetch(`${API}/api/scoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversacion: mensajes, academia_id: academia }),
      });
      const d = await r.json();
      setResultado(d);
      setTiempo(Math.round(performance.now() - t0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-txt-muted font-mono">LEAD SCORING</span>
            <h1 className="text-xl font-bold text-txt-primary">Calificacion de leads con LLM-as-a-judge</h1>
          </div>
        </div>
        <p className="text-txt-secondary text-sm ml-12 max-w-3xl">
          Le pasamos al LLM una conversacion entre lead y asistente. El modelo evalua intencion,
          datos personales y compromiso para devolver un score 0-100, categoria y siguiente accion.
        </p>
      </AnimateIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
        <AnimateIn>
          <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-txt-primary">Conversacion</h2>
              <select
                value={academia}
                onChange={(e) => setAcademia(e.target.value)}
                className="bg-surface-light border border-app-border rounded-md px-2 py-1 text-xs text-txt-secondary"
              >
                <option value="armonia">armonia</option>
                <option value="melodia">melodia</option>
                <option value="ritmo">ritmo</option>
              </select>
            </div>

            <div className="flex gap-2 flex-wrap">
              {EJEMPLOS.map((e) => (
                <button
                  key={e.nombre}
                  onClick={() => {
                    setMensajes(e.conv);
                    setResultado(null);
                  }}
                  className="text-[11px] px-2.5 py-1 bg-surface-light border border-app-border rounded-md text-txt-secondary hover:text-txt-primary"
                >
                  {e.nombre}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {mensajes.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={m.rol}
                    onChange={(e) => {
                      const next = [...mensajes];
                      next[i] = { ...m, rol: e.target.value as "lead" | "asistente" };
                      setMensajes(next);
                    }}
                    className="bg-surface-light border border-app-border rounded-md px-2 py-1.5 text-xs text-txt-secondary"
                  >
                    <option value="lead">lead</option>
                    <option value="asistente">asistente</option>
                  </select>
                  <textarea
                    value={m.texto}
                    onChange={(e) => {
                      const next = [...mensajes];
                      next[i] = { ...m, texto: e.target.value };
                      setMensajes(next);
                    }}
                    rows={1}
                    className="flex-1 bg-surface-light border border-app-border rounded-md px-2 py-1.5 text-xs text-txt-primary resize-none"
                  />
                  <button
                    onClick={() => setMensajes(mensajes.filter((_, idx) => idx !== i))}
                    className="text-txt-muted hover:text-rose-400 px-1"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setMensajes([...mensajes, { rol: "lead", texto: "" }])}
                className="flex items-center gap-1 text-[11px] text-txt-muted hover:text-accent-light"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>

            <button
              onClick={calificar}
              disabled={loading || mensajes.some((m) => !m.texto.trim())}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <SparklesIcon className="w-4 h-4" />
              {loading ? "Calificando..." : "Calificar lead"}
            </button>
          </div>
        </AnimateIn>

        <AnimateIn delay={0.05}>
          <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-4 min-h-[460px]">
            <h2 className="text-sm font-bold text-txt-primary">Resultado del scoring</h2>

            {!resultado && !loading && (
              <p className="text-txt-muted text-xs">Carga una conversacion y dale clic a Calificar.</p>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-txt-muted text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                LLM-as-a-judge evaluando...
              </div>
            )}

            {resultado && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${COLOR_CAT[resultado.categoria]} flex flex-col items-center justify-center text-white`}
                  >
                    <span className="text-3xl font-bold">{resultado.score}</span>
                    <span className="text-[10px] uppercase tracking-wide opacity-80">
                      {resultado.categoria}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase text-txt-muted">Confianza del modelo</div>
                    <GaugeBar
                      value={Math.round((resultado.confianza || 0) * 100)}
                      max={100}
                      thresholds={[60, 80]}
                    />
                    <div className="text-[10px] text-txt-muted mt-2">
                      {tiempo}ms · groq
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase text-txt-muted mb-1">Justificacion</div>
                  <p className="text-xs text-txt-secondary leading-relaxed">
                    {resultado.justificacion}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] uppercase text-emerald-400 mb-1.5 flex items-center gap-1">
                      <CheckCircleIcon className="w-3.5 h-3.5" /> Positivas
                    </div>
                    <ul className="space-y-1">
                      {resultado.senales_positivas.map((s, i) => (
                        <li
                          key={i}
                          className="text-[11px] text-txt-secondary bg-emerald-500/5 border border-emerald-500/20 rounded px-2 py-1"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-rose-400 mb-1.5 flex items-center gap-1">
                      <XCircleIcon className="w-3.5 h-3.5" /> Negativas
                    </div>
                    <ul className="space-y-1">
                      {resultado.senales_negativas.length === 0 ? (
                        <li className="text-[11px] text-txt-muted italic">Ninguna</li>
                      ) : (
                        resultado.senales_negativas.map((s, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-txt-secondary bg-rose-500/5 border border-rose-500/20 rounded px-2 py-1"
                          >
                            {s}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-amber-400 font-bold mb-1">
                    Siguiente accion
                  </div>
                  <p className="text-sm text-txt-primary">{resultado.siguiente_accion}</p>
                </div>
              </div>
            )}
          </div>
        </AnimateIn>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import AnimateIn from "@/components/AnimateIn";
import { GaugeBar } from "@/components/Charts";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Mensaje = { rol: "lead" | "asistente"; texto: string };
type Resultado = {
  probabilidad_abandono: number;
  nivel_riesgo: "bajo" | "medio" | "alto" | "critico";
  senales_detectadas: string[];
  estrategia_recomendada: string;
  razonamiento: string;
  mensaje_propuesto: string;
  momento_optimo: string;
  tags_a_aplicar: string[];
  escalar_a_humano: boolean;
  tiempo_segundos: number;
};

const COLOR_RIESGO: Record<string, string> = {
  bajo: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  medio: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  alto: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  critico: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

const ICON_ESTRATEGIA: Record<string, string> = {
  incentivo: "🎁",
  urgencia: "⏰",
  prueba_social: "👥",
  consulta_personalizada: "🤝",
  ninguna: "✓",
};

const EJEMPLOS_PRECARGADOS = [
  {
    nombre: "Va a pensarlo",
    conv: [
      { rol: "lead" as const, texto: "Hola, dan clases de piano?" },
      { rol: "asistente" as const, texto: "Si! $60/mes con clase de prueba GRATIS. Te interesa?" },
      { rol: "lead" as const, texto: "Mmm, voy a pensarlo y te aviso" },
    ],
  },
  {
    nombre: "Compara precios",
    conv: [
      { rol: "lead" as const, texto: "Cuanto cuesta guitarra?" },
      { rol: "asistente" as const, texto: "$50/mes, 3 dias por semana" },
      { rol: "lead" as const, texto: "Vi una academia que cobra $35, voy a ver alli" },
    ],
  },
  {
    nombre: "Objecion precio",
    conv: [
      { rol: "lead" as const, texto: "Cuanto piano?" },
      { rol: "asistente" as const, texto: "$60 mensuales con prueba gratis" },
      { rol: "lead" as const, texto: "Uy esta carito, no se" },
    ],
  },
  {
    nombre: "Lead caliente (no riesgo)",
    conv: [
      { rol: "lead" as const, texto: "Quiero piano para mi hijo, soy Maria 0987654321" },
      { rol: "asistente" as const, texto: "Genial! Te agendo prueba este sabado?" },
      { rol: "lead" as const, texto: "Si, perfecto" },
    ],
  },
];

export default function AntiAbandonoPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>(EJEMPLOS_PRECARGADOS[0].conv);
  const [academia, setAcademia] = useState("armonia");
  const [nombreLead, setNombreLead] = useState("Maria");
  const [minutos, setMinutos] = useState<number | "">("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analizar = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const r = await fetch(`${API}/api/anti-abandono`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversacion: mensajes,
          academia_id: academia,
          nombre_lead: nombreLead || null,
          minutos_sin_responder: minutos === "" ? null : Number(minutos),
        }),
      });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
      } else {
        setResultado(d);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const agregarMsg = () =>
    setMensajes([...mensajes, { rol: "lead", texto: "" }]);

  const updateMsg = (i: number, patch: Partial<Mensaje>) =>
    setMensajes(mensajes.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const quitarMsg = (i: number) =>
    setMensajes(mensajes.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-txt-muted font-mono">ENGAGEMENT BOOSTER</span>
            <h1 className="text-xl font-bold text-txt-primary">Anti-abandono — Salvavidas para leads</h1>
          </div>
        </div>
        <p className="text-txt-secondary text-sm ml-12 max-w-3xl">
          Detectamos cuando un lead va a irse sin convertir y proponemos un mensaje personalizado
          para reengancharlo. La estrategia depende del contexto: descuento, urgencia, prueba social
          o asesor humano.
        </p>
      </AnimateIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
        {/* Columna izquierda: input */}
        <AnimateIn>
          <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-txt-primary">Conversacion del lead</h2>

            <div className="flex gap-2 flex-wrap">
              {EJEMPLOS_PRECARGADOS.map((e) => (
                <button
                  key={e.nombre}
                  onClick={() => {
                    setMensajes(e.conv);
                    setResultado(null);
                  }}
                  className="text-[11px] px-2.5 py-1 bg-surface-light border border-app-border rounded-md text-txt-secondary hover:text-txt-primary hover:border-border-light"
                >
                  {e.nombre}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {mensajes.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={m.rol}
                    onChange={(e) => updateMsg(i, { rol: e.target.value as "lead" | "asistente" })}
                    className="bg-surface-light border border-app-border rounded-md px-2 py-1.5 text-xs text-txt-secondary"
                  >
                    <option value="lead">lead</option>
                    <option value="asistente">asistente</option>
                  </select>
                  <textarea
                    value={m.texto}
                    onChange={(e) => updateMsg(i, { texto: e.target.value })}
                    rows={1}
                    className="flex-1 bg-surface-light border border-app-border rounded-md px-2 py-1.5 text-xs text-txt-primary resize-none"
                    placeholder="texto..."
                  />
                  <button
                    onClick={() => quitarMsg(i)}
                    className="text-txt-muted hover:text-rose-400 px-1"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={agregarMsg}
                className="flex items-center gap-1 text-[11px] text-txt-muted hover:text-accent-light"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Agregar mensaje
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-txt-muted uppercase">Academia</label>
                <select
                  value={academia}
                  onChange={(e) => setAcademia(e.target.value)}
                  className="w-full mt-1 bg-surface-light border border-app-border rounded-md px-2 py-1.5 text-xs text-txt-secondary"
                >
                  <option value="armonia">armonia (Cuenca)</option>
                  <option value="melodia">melodia (Guayaquil)</option>
                  <option value="ritmo">ritmo (Quito)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-txt-muted uppercase">Nombre lead</label>
                <input
                  value={nombreLead}
                  onChange={(e) => setNombreLead(e.target.value)}
                  className="w-full mt-1 bg-surface-light border border-app-border rounded-md px-2 py-1.5 text-xs text-txt-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-txt-muted uppercase">Min sin resp</label>
                <input
                  type="number"
                  value={minutos}
                  onChange={(e) => setMinutos(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full mt-1 bg-surface-light border border-app-border rounded-md px-2 py-1.5 text-xs text-txt-primary"
                  placeholder="opcional"
                />
              </div>
            </div>

            <button
              onClick={analizar}
              disabled={loading || mensajes.some((m) => !m.texto.trim())}
              className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              <SparklesIcon className="w-4 h-4" />
              {loading ? "Analizando..." : "Analizar riesgo de abandono"}
            </button>
          </div>
        </AnimateIn>

        {/* Columna derecha: resultado */}
        <AnimateIn delay={0.05}>
          <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-4 min-h-[480px]">
            <h2 className="text-sm font-bold text-txt-primary">Diagnostico y mensaje propuesto</h2>

            {error && (
              <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                {error}
              </div>
            )}

            {!resultado && !loading && !error && (
              <p className="text-txt-muted text-xs">
                Configura una conversacion y dale clic a Analizar.
              </p>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-txt-muted text-sm">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                Procesando con LLM...
              </div>
            )}

            {resultado && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] uppercase font-bold border ${COLOR_RIESGO[resultado.nivel_riesgo] || COLOR_RIESGO.medio}`}
                  >
                    Riesgo {resultado.nivel_riesgo}
                  </span>
                  <span className="text-[11px] text-txt-muted">
                    {resultado.tiempo_segundos}s · LLM
                  </span>
                </div>

                <GaugeBar
                  value={resultado.probabilidad_abandono}
                  label="Probabilidad de abandono"
                  thresholds={[40, 70]}
                />

                <div>
                  <div className="text-[10px] uppercase text-txt-muted mb-1">Señales detectadas</div>
                  <div className="flex flex-wrap gap-1.5">
                    {resultado.senales_detectadas.map((s, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-md"
                      >
                        <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-light rounded-lg p-3">
                    <div className="text-[10px] uppercase text-txt-muted">Estrategia</div>
                    <div className="text-sm font-bold text-txt-primary mt-0.5 capitalize">
                      {ICON_ESTRATEGIA[resultado.estrategia_recomendada] || "•"}{" "}
                      {resultado.estrategia_recomendada.replace("_", " ")}
                    </div>
                  </div>
                  <div className="bg-surface-light rounded-lg p-3">
                    <div className="text-[10px] uppercase text-txt-muted">Cuando enviar</div>
                    <div className="text-sm font-bold text-txt-primary mt-0.5 flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {resultado.momento_optimo.replace("_", " ")}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase text-txt-muted mb-1">Razonamiento</div>
                  <p className="text-xs text-txt-secondary leading-relaxed">{resultado.razonamiento}</p>
                </div>

                <div className="bg-gradient-to-br from-rose-500/5 to-orange-500/5 border border-rose-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PaperAirplaneIcon className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] uppercase text-rose-400 font-bold tracking-wide">
                      Mensaje propuesto a enviar
                    </span>
                  </div>
                  <p className="text-sm text-txt-primary leading-relaxed">
                    {resultado.mensaje_propuesto}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] uppercase text-txt-muted">Tags GHL:</span>
                  {resultado.tags_a_aplicar.map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 bg-surface-light border border-app-border text-txt-secondary rounded font-mono"
                    >
                      {t}
                    </span>
                  ))}
                  {resultado.escalar_a_humano && (
                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded">
                      ↗ escalar a humano
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </AnimateIn>
      </div>
    </div>
  );
}

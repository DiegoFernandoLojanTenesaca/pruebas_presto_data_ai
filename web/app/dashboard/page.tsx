"use client";

import { useEffect, useMemo, useState } from "react";
import AnimateIn from "@/components/AnimateIn";
import { Donut, Sparkline, Funnel } from "@/components/Charts";
import {
  ChartBarIcon,
  CpuChipIcon,
  UsersIcon,
  ClockIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Evento = { tipo: string; timestamp: string; [key: string]: unknown };

type Metricas = {
  eventos_total: number;
  por_tipo: Record<string, number>;
  tools_top: [string, number][];
  tiempo_promedio_segundos: Record<string, number>;
  leads_por_academia: Record<string, number>;
  scoring: {
    total: number;
    categorias: Record<string, number>;
    promedio: number;
  };
  ultimos_eventos: Evento[];
};

const COLOR_CATEGORIA: Record<string, string> = {
  caliente: "#f43f5e",
  tibio: "#f59e0b",
  frio: "#0ea5e9",
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  gradient,
}: {
  icon: typeof ChartBarIcon;
  label: string;
  value: string | number;
  hint?: string;
  gradient: string;
}) {
  return (
    <div className="bg-surface border border-app-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-[11px] text-txt-muted uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-txt-primary tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-txt-muted mt-1">{hint}</div>}
    </div>
  );
}

function bucketEventosPorMinuto(eventos: Evento[], buckets = 30): number[] {
  if (eventos.length === 0) return Array(buckets).fill(0);
  const ahora = Date.now();
  const ventanaMs = 60_000 * 5;
  const buckMs = ventanaMs / buckets;
  const arr = Array(buckets).fill(0);
  for (const ev of eventos) {
    const t = new Date(ev.timestamp).getTime();
    const diff = ahora - t;
    if (diff < 0 || diff > ventanaMs) continue;
    const idx = buckets - 1 - Math.floor(diff / buckMs);
    if (idx >= 0 && idx < buckets) arr[idx]++;
  }
  return arr;
}

export default function DashboardPage() {
  const [data, setData] = useState<Metricas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async () => {
    setRefreshing(true);
    try {
      const r = await fetch(`${API}/api/metricas`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: Metricas = await r.json();
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(cargar, 3000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const reset = async () => {
    if (!confirm("Borrar todas las metricas?")) return;
    await fetch(`${API}/api/metricas/reset`, { method: "POST" });
    cargar();
  };

  const sparkValues = useMemo(
    () => (data ? bucketEventosPorMinuto(data.ultimos_eventos, 30) : []),
    [data]
  );

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-400 mb-2">No se pudo conectar al backend</p>
        <p className="text-txt-muted text-sm font-mono">{error}</p>
        <button
          onClick={cargar}
          className="mt-4 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent-light"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-txt-muted">Cargando metricas...</div>
    );
  }

  const totalLeads = Object.values(data.leads_por_academia).reduce((a, b) => a + b, 0);
  const tiemposEntries = Object.entries(data.tiempo_promedio_segundos);
  const maxTiempo = Math.max(0, ...tiemposEntries.map(([, v]) => v));
  const maxTool = Math.max(0, ...data.tools_top.map(([, v]) => v));
  const maxAcademia = Math.max(0, ...Object.values(data.leads_por_academia));

  // Funnel calculado a partir de eventos
  const eventCount = (tipo: string) =>
    data.ultimos_eventos.filter((e) => e.tipo === tipo).length;
  const webhooks = data.por_tipo["webhook_ghl"] || 0;
  const agenteInvocado = data.por_tipo["agente_invocado"] || 0;
  const memoriaActiva = data.por_tipo["memoria_invocada"] || 0;
  const scored = data.scoring.total;
  const calientes = data.scoring.categorias["caliente"] || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-txt-muted font-mono">DASHBOARD</span>
              <h1 className="text-xl font-bold text-txt-primary">Analiticas en tiempo real</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-[11px] text-txt-muted px-2.5 py-1.5 bg-surface border border-app-border rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-accent"
              />
              Auto 3s
            </label>
            <button
              onClick={cargar}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-app-border rounded-lg text-[11px] text-txt-secondary hover:text-txt-primary"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/5 border border-rose-500/20 rounded-lg text-[11px] text-rose-400 hover:bg-rose-500/10"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </AnimateIn>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={ChartBarIcon}
          label="Eventos totales"
          value={data.eventos_total}
          hint="desde inicio de sesion"
          gradient="from-fuchsia-500 to-purple-500"
        />
        <StatCard
          icon={UsersIcon}
          label="Leads procesados"
          value={totalLeads}
          hint={`${Object.keys(data.leads_por_academia).length} academias`}
          gradient="from-emerald-500 to-teal-400"
        />
        <StatCard
          icon={CpuChipIcon}
          label="Score promedio"
          value={data.scoring.promedio || 0}
          hint={`${data.scoring.total} leads calificados`}
          gradient="from-amber-500 to-orange-400"
        />
        <StatCard
          icon={ClockIcon}
          label="Endpoints activos"
          value={tiemposEntries.length}
          hint="con trafico reciente"
          gradient="from-sky-500 to-cyan-400"
        />
      </div>

      {/* Sparkline + Donut + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Sparkline */}
        <AnimateIn>
          <div className="bg-surface border border-app-border rounded-2xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-txt-primary">Eventos en los ultimos 5 min</h2>
              <span className="text-[10px] text-txt-muted">30 buckets · 10s c/u</span>
            </div>
            <Sparkline values={sparkValues} width={620} height={80} color="#a855f7" />
            <div className="text-[10px] text-txt-muted mt-2">
              total ventana: {sparkValues.reduce((a, b) => a + b, 0)} eventos
            </div>
          </div>
        </AnimateIn>

        {/* Donut categorias */}
        <AnimateIn delay={0.05}>
          <div className="bg-surface border border-app-border rounded-2xl p-5">
            <h2 className="text-sm font-bold text-txt-primary mb-3">Scoring</h2>
            <div className="flex justify-center mb-3">
              <Donut
                data={Object.entries(data.scoring.categorias).map(([k, v]) => ({
                  label: k,
                  value: v,
                  color: COLOR_CATEGORIA[k] || "#6b7280",
                }))}
              />
            </div>
            <div className="space-y-1">
              {Object.entries(data.scoring.categorias).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: COLOR_CATEGORIA[k] }}
                    />
                    <span className="capitalize text-txt-secondary">{k}</span>
                  </span>
                  <span className="font-bold text-txt-primary tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>
      </div>

      {/* Funnel + tools + tiempos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Funnel del lead */}
        <AnimateIn>
          <div className="bg-surface border border-app-border rounded-2xl p-5 h-full">
            <h2 className="text-sm font-bold text-txt-primary mb-4">Funnel del lead</h2>
            <Funnel
              steps={[
                { label: "Webhooks recibidos", value: webhooks, color: "linear-gradient(90deg, #a855f7, #ec4899)" },
                { label: "Agente invocado", value: agenteInvocado, color: "linear-gradient(90deg, #ec4899, #f59e0b)" },
                { label: "Conversaciones con memoria", value: memoriaActiva, color: "linear-gradient(90deg, #f59e0b, #10b981)" },
                { label: "Leads scored", value: scored, color: "linear-gradient(90deg, #10b981, #06b6d4)" },
                { label: "Calientes (alta intencion)", value: calientes, color: "linear-gradient(90deg, #f43f5e, #f59e0b)" },
              ]}
            />
          </div>
        </AnimateIn>

        {/* Tools */}
        <AnimateIn delay={0.05}>
          <div className="bg-surface border border-app-border rounded-2xl p-5 h-full">
            <h2 className="text-sm font-bold text-txt-primary mb-4">Tools mas usadas</h2>
            {data.tools_top.length === 0 ? (
              <p className="text-txt-muted text-xs">Aun sin tools invocadas.</p>
            ) : (
              <div className="space-y-3">
                {data.tools_top.map(([name, count]) => (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-mono text-txt-secondary truncate">{name}</span>
                      <span className="text-emerald-400 font-bold tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${maxTool > 0 ? (count / maxTool) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnimateIn>

        {/* Tiempos */}
        <AnimateIn delay={0.1}>
          <div className="bg-surface border border-app-border rounded-2xl p-5 h-full">
            <h2 className="text-sm font-bold text-txt-primary mb-4">Latencia por endpoint</h2>
            {tiemposEntries.length === 0 ? (
              <p className="text-txt-muted text-xs">Sin datos.</p>
            ) : (
              <div className="space-y-3">
                {tiemposEntries
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([endpoint, segundos]) => (
                    <div key={endpoint}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-mono text-txt-secondary truncate text-[11px]">{endpoint}</span>
                        <span className="text-sky-400 font-bold tabular-nums text-[11px]">{segundos}s</span>
                      </div>
                      <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${maxTiempo > 0 ? (segundos / maxTiempo) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </AnimateIn>
      </div>

      {/* Leads por academia */}
      <AnimateIn delay={0.15}>
        <div className="bg-surface border border-app-border rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-bold text-txt-primary mb-4">Leads por academia</h2>
          {Object.keys(data.leads_por_academia).length === 0 ? (
            <p className="text-txt-muted text-xs">Aun no hay leads. Dispara un webhook GHL.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(data.leads_por_academia).map(([id, count]) => (
                <div key={id} className="bg-surface-light rounded-xl p-4">
                  <div className="text-[10px] uppercase text-txt-muted">{id}</div>
                  <div className="text-2xl font-bold text-txt-primary mt-1">{count}</div>
                  <div className="h-1 bg-surface rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                      style={{ width: `${maxAcademia > 0 ? (count / maxAcademia) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AnimateIn>

      {/* Eventos recientes */}
      <AnimateIn delay={0.2}>
        <div className="bg-surface border border-app-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-txt-primary">Eventos recientes</h2>
            <span className="text-[10px] text-txt-muted">{data.ultimos_eventos.length} ultimos</span>
          </div>

          {data.ultimos_eventos.length === 0 ? (
            <p className="text-txt-muted text-xs">Sin actividad. Dispara una llamada al backend.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead className="text-txt-muted text-[10px] uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-2 py-2">Tipo</th>
                    <th className="text-left px-2 py-2">Timestamp</th>
                    <th className="text-left px-2 py-2">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.ultimos_eventos].reverse().slice(0, 30).map((ev, i) => {
                    const detalles = Object.entries(ev)
                      .filter(([k]) => k !== "tipo" && k !== "timestamp")
                      .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
                      .join(" · ");
                    return (
                      <tr key={i} className="border-t border-app-border/50">
                        <td className="px-2 py-2 font-mono text-accent-light">{ev.tipo}</td>
                        <td className="px-2 py-2 text-txt-muted font-mono text-[10px]">
                          {ev.timestamp.split("T")[1]?.split(".")[0]}
                        </td>
                        <td className="px-2 py-2 text-txt-secondary truncate max-w-md">
                          {detalles || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AnimateIn>
    </div>
  );
}

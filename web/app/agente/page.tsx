"use client";

import ChatPanel from "@/components/ChatPanel";
import AnimateIn from "@/components/AnimateIn";
import { useTheme } from "@/components/ThemeProvider";
import {
  CpuChipIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOOL_ICONS: Record<string, React.ElementType> = {
  buscar_info_academia: MagnifyingGlassIcon,
  agendar_clase_prueba: CalendarDaysIcon,
  registrar_lead_crm: UserPlusIcon,
};

export default function AgentePage() {
  const { t } = useTheme();

  const handleSend = async (mensaje: string) => {
    const res = await fetch(`${API}/api/02-agente`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje }),
    });
    const data = await res.json();
    return {
      respuesta: data.respuesta || data.error,
      meta: {
        modelo: data.modelo,
        patron: data.patron,
        tiempo: `${data.tiempo_segundos}s`,
        herramientas_disponibles: data.herramientas_disponibles,
        herramientas_usadas: data.herramientas_usadas,
      },
    };
  };

  const renderMeta = (meta: Record<string, unknown>) => {
    const herramientas = meta.herramientas_usadas as Array<{ nombre: string; args: Record<string, string>; resultado?: string }>;
    const disponibles = meta.herramientas_disponibles as string[];

    return (
      <div className="space-y-2">
        {herramientas && herramientas.length > 0 && (
          <div className="bg-emerald-950/50 border border-emerald-800/50 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 mb-2">
              <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-emerald-400 font-semibold">{t("herramientas_ejecutadas")}</p>
            </div>
            {herramientas.map((h, i) => {
              const Icon = TOOL_ICONS[h.nombre] || WrenchScrewdriverIcon;
              return (
                <div key={i} className="mb-2 last:mb-0 pl-1">
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <Icon className="w-3 h-3" />
                    <span className="font-bold">{h.nombre}</span>
                    <span className="text-emerald-500/70 font-mono">({JSON.stringify(h.args)})</span>
                  </div>
                  {h.resultado && (
                    <p className="text-txt-muted ml-5 mt-0.5">{h.resultado}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="bg-surface border border-app-border rounded-xl p-3 text-xs grid grid-cols-3 gap-2">
          <div>
            <span className="text-txt-muted">Modelo</span>
            <p className="text-txt-primary font-mono text-[11px] truncate">{String(meta.modelo)}</p>
          </div>
          <div>
            <span className="text-txt-muted">Patron</span>
            <p className="text-txt-primary">{String(meta.patron)}</p>
          </div>
          <div>
            <span className="text-txt-muted">Tiempo</span>
            <p className="text-txt-primary">{String(meta.tiempo)}</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {disponibles?.map((tool) => {
            const used = herramientas?.some((h) => h.nombre === tool);
            const Icon = TOOL_ICONS[tool] || WrenchScrewdriverIcon;
            return (
              <span
                key={tool}
                className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  used
                    ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
                    : "bg-surface-light text-txt-muted border border-app-border"
                }`}
              >
                <Icon className="w-3 h-3" />
                {tool}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 h-[calc(100vh-60px)] flex flex-col">
      <AnimateIn>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
              <CpuChipIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-txt-muted font-mono">MODULO 02</span>
              <h1 className="text-xl font-bold text-txt-primary">{t("p02_title")}</h1>
            </div>
          </div>
          <p className="text-txt-secondary text-sm ml-12">{t("p02_desc")}</p>
          <div className="ml-12 mt-3 flex gap-2 flex-wrap">
            {Object.entries(TOOL_ICONS).map(([name, Icon]) => (
              <span key={name} className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-light border border-app-border text-txt-muted rounded-lg text-xs">
                <Icon className="w-3.5 h-3.5" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </AnimateIn>

      <div className="flex-1 bg-surface rounded-2xl border border-app-border overflow-hidden">
        <ChatPanel
          placeholder="Ej: Hola! Me interesa aprender guitarra, que opciones tienen?"
          suggestions={[
            "Quiero aprender guitarra, que opciones tienen?",
            "Cuales son los horarios disponibles?",
            "Quiero agendar una clase de prueba para el sabado",
            "Cuanto cuesta la mensualidad?",
            "Tienen clases para niños de 8 años?",
          ]}
          onSend={handleSend}
          renderMeta={renderMeta}
        />
      </div>
    </div>
  );
}

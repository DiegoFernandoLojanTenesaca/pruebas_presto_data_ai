"use client";

import AnimateIn from "@/components/AnimateIn";
import { useTheme } from "@/components/ThemeProvider";
import {
  BoltIcon,
  FunnelIcon,
  PlayCircleIcon,
  ArrowsRightLeftIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

const CONCEPTOS = [
  { term: "Scenario (Make) / Zap (Zapier)", def: "Un flujo de automatizacion completo", icon: PlayCircleIcon },
  { term: "Trigger", def: "El evento que inicia el flujo (ej: nuevo lead en GoHighLevel)", icon: BoltIcon },
  { term: "Module / Action", def: "La accion que se ejecuta (ej: enviar WhatsApp)", icon: AdjustmentsHorizontalIcon },
  { term: "Filter", def: "Condicion para continuar o no (ej: solo si el lead es de Cuenca)", icon: FunnelIcon },
  { term: "Router", def: "Divide el flujo en multiples caminos segun condiciones", icon: ArrowsRightLeftIcon },
];

export default function AutomatizacionPage() {
  const { t } = useTheme();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-400 flex items-center justify-center">
              <BoltIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-txt-muted font-mono">MODULO 03</span>
              <h1 className="text-xl font-bold text-txt-primary">{t("p03_title")}</h1>
            </div>
          </div>
          <p className="text-txt-secondary text-sm ml-12">
            {t("p03_desc")} <strong className="text-txt-primary">TRIGGER → FILTRO → ACCION</strong>
          </p>
        </div>
      </AnimateIn>

      {/* Conceptos */}
      <AnimateIn delay={0.1}>
        <section className="mb-8">
          <h2 className="text-base font-bold text-txt-primary mb-4">{t("conceptos_clave")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CONCEPTOS.map((c) => (
              <div key={c.term} className="bg-surface border border-app-border rounded-xl p-4 flex items-start gap-3 hover:border-border-light transition-colors">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <c.icon className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-txt-primary font-semibold text-sm">{c.term}</p>
                  <p className="text-txt-muted text-xs mt-0.5">{c.def}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </AnimateIn>

      {/* Ejemplo Presto */}
      <AnimateIn delay={0.2}>
        <section>
          <h2 className="text-base font-bold text-txt-primary mb-4">{t("ejemplo_presto")}</h2>
          <div className="bg-surface border border-app-border rounded-2xl p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-xs font-bold text-yellow-400">TRIGGER</span>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-sm text-yellow-200">
                  Nuevo lead en GoHighLevel
                </div>
              </div>
              <div className="ml-[88px] w-px h-4 bg-app-border" />
              <div className="flex items-center gap-3">
                <span className="w-20 text-right text-xs font-bold text-blue-400">FILTER</span>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-sm text-blue-200">
                  Es una academia activa?
                </div>
              </div>
              <div className="ml-[88px] w-px h-4 bg-app-border" />
              <div className="ml-[92px] space-y-2">
                <p className="text-emerald-400 text-xs font-bold">SI →</p>
                {[
                  "Enviar mensaje de bienvenida por WhatsApp",
                  "Crear tarea de seguimiento en GoHighLevel",
                  "Notificar al equipo por Slack/Email",
                ].map((action, i) => (
                  <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">ACTION {i + 1}:</span>
                    {action}
                  </div>
                ))}
              </div>
              <div className="ml-[88px] w-px h-4 bg-app-border" />
              <div className="ml-[92px] space-y-2">
                <p className="text-red-400 text-xs font-bold">NO →</p>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300 flex items-center gap-2">
                  <span className="text-red-500 font-bold">ACTION:</span>
                  Agregar a lista de espera
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimateIn>
    </div>
  );
}

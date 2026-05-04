"use client";

import AnimateIn from "@/components/AnimateIn";
import { useTheme } from "@/components/ThemeProvider";
import {
  CubeTransparentIcon,
  ServerStackIcon,
  CircleStackIcon,
  GlobeAltIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  PhoneArrowUpRightIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const STEPS = [
  { text: "Lead envia mensaje por WhatsApp", icon: ChatBubbleLeftRightIcon },
  { text: "GoHighLevel recibe mensaje y dispara Webhook", icon: PhoneArrowUpRightIcon },
  { text: "Webhook llega a nuestro endpoint FastAPI", icon: ServerStackIcon },
  { text: "FastAPI identifica la academia (tenant)", icon: CubeTransparentIcon },
  { text: "Se carga el contexto de esa academia (RAG)", icon: CircleStackIcon },
  { text: "LangGraph ejecuta el agente con herramientas", icon: BoltIcon },
  { text: "El agente genera respuesta personalizada", icon: CubeTransparentIcon },
  { text: "Se envia respuesta por WhatsApp via GoHighLevel", icon: ChatBubbleLeftRightIcon },
  { text: "Se registra la interaccion en el CRM", icon: UserPlusIcon },
];

const STACK_ITEMS = [
  { label: "Frontend / CRM", value: "GoHighLevel (leads, funnels, WhatsApp)" },
  { label: "Agente IA", value: "Python + LangChain / LangGraph + Groq" },
  { label: "Backend", value: "FastAPI (microservicios)" },
  { label: "Base de datos", value: "PostgreSQL + pgvector (semantica)" },
  { label: "Integraciones", value: "WhatsApp API, Google Calendar, GoHighLevel" },
  { label: "Automatizacion", value: "Webhooks + Make/Zapier" },
  { label: "Despliegue", value: "Docker + Docker Compose" },
];

const TOOLS = [
  { name: "Buscar Info", desc: "RAG / Base de conocimiento", icon: MagnifyingGlassIcon },
  { name: "Agendar", desc: "Google Calendar API", icon: CalendarDaysIcon },
  { name: "Registrar", desc: "GoHighLevel CRM", icon: UserPlusIcon },
  { name: "Escalar", desc: "Notificar a humano", icon: ExclamationTriangleIcon },
];

const ACADEMIAS = [
  { name: "Academia Armonia", city: "Cuenca" },
  { name: "Escuela Melodia", city: "Guayaquil" },
  { name: "Centro Ritmo", city: "Quito" },
];

export default function ArquitecturaPage() {
  const { t } = useTheme();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <CubeTransparentIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-txt-muted font-mono">MODULO 06</span>
              <h1 className="text-xl font-bold text-txt-primary">{t("p06_title")}</h1>
            </div>
          </div>
          <p className="text-txt-secondary text-sm ml-12">{t("p06_desc")}</p>
        </div>
      </AnimateIn>

      {/* Flujo Principal — Visual */}
      <AnimateIn delay={0.1}>
        <section className="mb-10">
          <h2 className="text-lg font-bold text-txt-primary mb-4 flex items-center gap-2">
            <GlobeAltIcon className="w-5 h-5 text-orange-400" />
            {t("flujo_principal")}
          </h2>
          <div className="bg-surface border border-app-border rounded-2xl p-6">
            <div className="flex flex-col items-center gap-2">
              {/* Source */}
              <div className="flex gap-3 justify-center">
                {["Instagram", "Facebook", "Web"].map((s) => (
                  <span key={s} className="px-3 py-1.5 bg-surface-light border border-app-border rounded-lg text-xs text-txt-secondary">{s}</span>
                ))}
              </div>
              <ArrowDownIcon className="w-4 h-4 text-txt-muted" />

              {/* Lead */}
              <div className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300 font-medium">
                Lead interesado envia WhatsApp
              </div>
              <ArrowDownIcon className="w-4 h-4 text-txt-muted" />

              {/* CRM */}
              <div className="px-5 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-300 font-medium">
                GoHighLevel CRM → Webhook
              </div>
              <ArrowDownIcon className="w-4 h-4 text-txt-muted" />

              {/* Agent */}
              <div className="w-full max-w-md bg-surface-light border border-app-border rounded-2xl p-4 text-center">
                <p className="text-txt-primary font-bold text-sm mb-3">Agente de IA (LangChain / LangGraph)</p>
                <div className="grid grid-cols-2 gap-2">
                  {TOOLS.map((tool) => (
                    <div key={tool.name} className="flex items-center gap-2 bg-surface border border-app-border rounded-lg p-2">
                      <tool.icon className="w-4 h-4 text-accent-light shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-medium text-txt-primary">{tool.name}</p>
                        <p className="text-[10px] text-txt-muted">{tool.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <ArrowDownIcon className="w-4 h-4 text-txt-muted" />

              {/* Response */}
              <div className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-300 font-medium">
                Respuesta por WhatsApp
              </div>
              <ArrowDownIcon className="w-4 h-4 text-txt-muted" />

              {/* Result */}
              <div className="px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-300 font-bold">
                Lead se matricula
              </div>
            </div>
          </div>
        </section>
      </AnimateIn>

      {/* Multi-Tenant */}
      <AnimateIn delay={0.2}>
        <section className="mb-10">
          <h2 className="text-lg font-bold text-txt-primary mb-4 flex items-center gap-2">
            <ServerStackIcon className="w-5 h-5 text-purple-400" />
            {t("arq_multitenant")}
          </h2>
          <p className="text-txt-secondary text-sm mb-4">{t("arq_mt_desc")}</p>

          {/* Academias */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {ACADEMIAS.map((ac) => (
              <div key={ac.name} className="bg-surface border border-app-border rounded-xl p-3 text-center">
                <p className="font-bold text-txt-primary text-sm">{ac.name}</p>
                <p className="text-txt-muted text-xs">{ac.city}</p>
                <p className="text-[10px] text-txt-muted mt-1">datos • config • precios</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <ArrowDownIcon className="w-4 h-4 text-txt-muted" />
          </div>

          {/* Core */}
          <div className="bg-surface border border-app-border rounded-xl p-4 mt-3">
            <p className="text-center text-txt-muted text-xs mb-3">{t("mismo_codigo")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-light border border-app-border rounded-xl p-3 text-center">
                <CubeTransparentIcon className="w-5 h-5 text-accent-light mx-auto mb-1" />
                <p className="text-txt-primary font-semibold text-sm">Agente IA</p>
                <p className="text-txt-muted text-xs">LangChain + LangGraph</p>
              </div>
              <div className="bg-surface-light border border-app-border rounded-xl p-3 text-center">
                <CircleStackIcon className="w-5 h-5 text-accent-light mx-auto mb-1" />
                <p className="text-txt-primary font-semibold text-sm">PostgreSQL</p>
                <p className="text-txt-muted text-xs">Schema por academia</p>
              </div>
            </div>
          </div>
        </section>
      </AnimateIn>

      {/* Stack */}
      <AnimateIn delay={0.3}>
        <section className="mb-10">
          <h2 className="text-lg font-bold text-txt-primary mb-4 flex items-center gap-2">
            <ServerStackIcon className="w-5 h-5 text-emerald-400" />
            {t("stack_tecnologico")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {STACK_ITEMS.map((item) => (
              <div key={item.label} className="bg-surface border border-app-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full bg-accent shrink-0" />
                <div>
                  <p className="text-txt-primary font-semibold text-sm">{item.label}</p>
                  <p className="text-txt-muted text-xs">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </AnimateIn>

      {/* Flujo tecnico */}
      <AnimateIn delay={0.4}>
        <section>
          <h2 className="text-lg font-bold text-txt-primary mb-4 flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-blue-400" />
            {t("flujo_tecnico")}
          </h2>
          <div className="space-y-1.5">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface border border-app-border rounded-xl p-3 hover:border-border-light transition-colors">
                <span className="bg-accent/15 text-accent-light text-[10px] font-bold rounded-lg w-6 h-6 flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <step.icon className="w-4 h-4 text-txt-muted shrink-0" />
                <p className="text-txt-secondary text-sm">{step.text}</p>
              </div>
            ))}
          </div>
        </section>
      </AnimateIn>
    </div>
  );
}

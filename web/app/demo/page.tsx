"use client";

import { useState } from "react";
import AnimateIn from "@/components/AnimateIn";
import { useTheme } from "@/components/ThemeProvider";
import {
  CodeBracketIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  ServerStackIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

const SNIPPETS = [
  {
    id: "tools",
    titleKey: "Herramientas",
    descKey: "Funciones que el agente puede invocar autonomamente",
    icon: WrenchScrewdriverIcon,
    gradient: "from-emerald-500 to-teal-400",
    lang: "python",
    code: `@tool
def buscar_info_academia(consulta: str) -> str:
    """Busca informacion de la academia: horarios, precios, clases, profesores."""
    for nombre, info in AGENTE_INFO_BASE.items():
        if nombre.lower() in consulta.lower():
            return f"{nombre}: \${info['precio']}/mes, Prof. {info['profesor']}"
    return "\\n".join(f"- {k}: \${v['precio']}/mes" for k, v in AGENTE_INFO_BASE.items())

@tool
def agendar_clase_prueba(nombre: str, instrumento: str, dia: str) -> str:
    """Agenda una clase de prueba gratuita para un lead."""
    return f"[CRM] Lead: {nombre} | [Calendar] {instrumento}: {dia} | [WhatsApp] Confirmacion enviada"

@tool
def registrar_lead_crm(nombre: str, telefono: str, interes: str) -> str:
    """Registra un nuevo lead en el sistema CRM (GoHighLevel)."""
    return f"[CRM GoHighLevel] Lead: {nombre} | Tel: {telefono} | Interes: {interes}"`,
  },
  {
    id: "agent",
    titleKey: "Agente ReAct",
    descKey: "Creacion del agente con patron ReAct que decide que herramientas usar",
    icon: CpuChipIcon,
    gradient: "from-blue-500 to-cyan-400",
    lang: "python",
    code: `from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent

llm_agente = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct", temperature=0.4)

agente = create_react_agent(
    llm_agente,
    [buscar_info_academia, agendar_clase_prueba, registrar_lead_crm],
    prompt=(
        "Eres el asistente virtual de la Academia de Musica Armonia en Cuenca. "
        "Responde en espanol. Se calido y profesional. "
        "Usa las herramientas para consultar info real. "
        "Si el lead muestra interes, ofrece clase de prueba GRATIS."
    ),
)

# Invocar
resultado = agente.invoke({"messages": [HumanMessage(content="Quiero aprender guitarra")]})`,
  },
  {
    id: "multitenant",
    titleKey: "Multi-Tenant",
    descKey: "Cada academia tiene su propio agente con datos aislados",
    icon: ServerStackIcon,
    gradient: "from-purple-500 to-violet-400",
    lang: "python",
    code: `ACADEMIAS = {
    "armonia": {
        "nombre": "Academia de Musica Armonia",
        "ciudad": "Cuenca",
        "clases": {
            "Piano": {"precio": 60, "profesor": "Maria Lopez", "dias": "Lun, Mie, Vie"},
            "Guitarra": {"precio": 50, "profesor": "Carlos Ruiz", "dias": "Mar, Jue, Sab"},
        },
    },
    "melodia": { ... },  # Guayaquil
    "ritmo": { ... },     # Quito
}

def crear_agente_academia(academia_id: str):
    ac = ACADEMIAS[academia_id]

    @tool
    def consultar_clases(instrumento: str) -> str:
        """Consulta clases disponibles de ESTA academia."""
        for nombre, info in ac["clases"].items():
            if instrumento.lower() in nombre.lower():
                return f"{nombre}: \${info['precio']}/mes, Prof. {info['profesor']}"
        return f"No ofrecemos {instrumento} en {ac['nombre']}."

    llm = ChatGroq(model=MODELO_AGENTE, temperature=0.4)
    return create_react_agent(llm, [consultar_clases, agendar_prueba, escalar_humano],
        prompt=f"Eres asistente de {ac['nombre']} en {ac['ciudad']}.")`,
  },
  {
    id: "endpoint",
    titleKey: "Endpoint FastAPI",
    descKey: "API REST que recibe mensajes y devuelve respuesta + metadata",
    icon: BoltIcon,
    gradient: "from-orange-500 to-amber-400",
    lang: "python",
    code: `@app.post("/api/05-caso-lead")
def caso_lead(req: LeadRequest):
    inicio = time.time()

    if req.academia_id not in ACADEMIAS:
        return {"error": f"Academia '{req.academia_id}' no encontrada"}

    # Cache de agentes — no se recrea en cada request
    if req.academia_id not in agentes_cache:
        agentes_cache[req.academia_id] = crear_agente_academia(req.academia_id)

    agente = agentes_cache[req.academia_id]
    resultado = agente.invoke({"messages": [HumanMessage(content=req.mensaje)]})

    return {
        "respuesta": resultado["messages"][-1].content,
        "herramientas_usadas": herramientas,
        "acciones_sistema": acciones_sistema,
        "modelo": MODELO_AGENTE,
        "tiempo_segundos": round(time.time() - inicio, 2),
        "tenant": req.academia_id,
    }`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-surface border border-app-border text-txt-muted hover:text-txt-primary transition-colors">
      {copied ? <CheckIcon className="w-3 h-3 text-emerald-400" /> : <ClipboardDocumentIcon className="w-3 h-3" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export default function DemoPage() {
  const { t } = useTheme();
  const [active, setActive] = useState("tools");

  const snippet = SNIPPETS.find(s => s.id === active) || SNIPPETS[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
              <CodeBracketIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-txt-muted font-mono">MODULO 07</span>
              <h1 className="text-xl font-bold text-txt-primary">{t("demo_title")}</h1>
            </div>
          </div>
          <p className="text-txt-secondary text-sm ml-12">{t("demo_desc")}</p>
        </div>
      </AnimateIn>

      {/* Tabs horizontal */}
      <AnimateIn delay={0.1}>
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {SNIPPETS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all shrink-0 ${
                active === s.id
                  ? "bg-accent/15 text-accent-light border border-accent/30 shadow-sm"
                  : "bg-surface border border-app-border text-txt-muted hover:border-border-light hover:text-txt-secondary"
              }`}
            >
              <s.icon className="w-4 h-4 shrink-0" />
              <span className="font-medium">{s.titleKey}</span>
            </button>
          ))}
        </div>
      </AnimateIn>

      {/* Code panel */}
      <AnimateIn delay={0.15}>
        <div className="bg-surface border border-app-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-app-border bg-surface-light">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${snippet.gradient} flex items-center justify-center shrink-0`}>
                <snippet.icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-txt-primary font-bold text-sm">{snippet.titleKey}</p>
                <p className="text-txt-muted text-[11px] truncate">{snippet.descKey}</p>
              </div>
            </div>
            <CopyButton text={snippet.code} />
          </div>

          {/* Code */}
          <div className="p-5 overflow-x-auto bg-[var(--background)]">
            <pre className="text-[13px] leading-relaxed font-mono text-txt-secondary">
              <code>{snippet.code}</code>
            </pre>
          </div>

          {/* How it works */}
          <div className="px-5 py-3.5 border-t border-app-border bg-surface-light">
            <p className="text-xs text-accent-light font-semibold mb-1.5 flex items-center gap-1.5">
              <BoltIcon className="w-3.5 h-3.5" />
              {t("demo_como_funciona")}
            </p>
            {snippet.id === "tools" && (
              <p className="text-xs text-txt-secondary leading-relaxed">Cada funcion decorada con <code className="text-accent-light bg-accent/10 px-1 rounded">@tool</code> expone su docstring como descripcion para el LLM. El agente lee las descripciones y decide cual ejecutar segun el mensaje del usuario.</p>
            )}
            {snippet.id === "agent" && (
              <p className="text-xs text-txt-secondary leading-relaxed">El patron <code className="text-accent-light bg-accent/10 px-1 rounded">ReAct</code> alterna entre razonar (Reason) y actuar (Act). LangGraph orquesta el ciclo: el LLM decide si necesita una herramienta, la ejecuta, observa el resultado, y decide si responder o seguir actuando.</p>
            )}
            {snippet.id === "multitenant" && (
              <p className="text-xs text-txt-secondary leading-relaxed">Cada academia tiene su propio agente con herramientas que acceden a <strong className="text-txt-primary">sus</strong> datos. El tenant se identifica por <code className="text-accent-light bg-accent/10 px-1 rounded">academia_id</code> en el request. Los agentes se cachean en memoria para no recrearlos.</p>
            )}
            {snippet.id === "endpoint" && (
              <p className="text-xs text-txt-secondary leading-relaxed">FastAPI recibe el mensaje + <code className="text-accent-light bg-accent/10 px-1 rounded">academia_id</code>, selecciona el agente correcto del cache, ejecuta la conversacion y devuelve respuesta + metadata (herramientas usadas, acciones del sistema, tiempo).</p>
            )}
          </div>
        </div>
      </AnimateIn>

    </div>
  );
}

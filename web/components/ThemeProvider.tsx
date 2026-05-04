"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";
type Lang = "es" | "en";

interface ThemeContextType {
  theme: Theme;
  lang: Lang;
  toggleTheme: () => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Nav
  inicio: { es: "Inicio", en: "Home" },
  api: { es: "API", en: "API" },
  agente: { es: "Agente", en: "Agent" },
  lead: { es: "Lead", en: "Lead" },
  arquitectura: { es: "Arquitectura", en: "Architecture" },
  portafolio: { es: "Portafolio", en: "Portfolio" },
  automatizacion: { es: "Automatizacion", en: "Automation" },
  demo: { es: "Demo", en: "Demo" },

  // Home
  hero_title_1: { es: "Agentes de IA para", en: "AI Agents for" },
  hero_title_2: { es: "Academias de Musica", en: "Music Academies" },
  hero_desc: {
    es: "Sistema inteligente de captacion y retencion de alumnos. Demos interactivas con LangChain, LangGraph y Groq.",
    en: "Intelligent student acquisition and retention system. Interactive demos with LangChain, LangGraph and Groq.",
  },
  footer_copy: {
    es: "Diego Fernando Lojan Tenesaca. Preparado para Presto.",
    en: "Diego Fernando Lojan Tenesaca. Prepared for Presto.",
  },
  stat_modulos: { es: "Modulos", en: "Modules" },
  stat_academias: { es: "Academias", en: "Academies" },
  stat_herramientas: { es: "Herramientas IA", en: "AI Tools" },
  stat_proyectos: { es: "Proyectos", en: "Projects" },

  // Modules
  "mod_01_title": { es: "API Basica", en: "Basic API" },
  "mod_01_desc": { es: "Llamada directa a Groq API. Chat libre con el LLM, metricas de tokens y tiempo de respuesta.", en: "Direct Groq API call. Free chat with LLM, token metrics and response time." },
  "mod_02_title": { es: "Agente con Herramientas", en: "Agent with Tools" },
  "mod_02_desc": { es: "Agente que decide autonomamente que herramientas usar: buscar info, agendar, CRM.", en: "Agent that autonomously decides which tools to use: search info, schedule, CRM." },
  "mod_05_title": { es: "Caso Presto: Multi-Tenant", en: "Presto Case: Multi-Tenant" },
  "mod_05_desc": { es: "3 academias, mismo sistema. Elige academia y chatea como un lead real interesado.", en: "3 academies, same system. Choose an academy and chat as a real interested lead." },
  "mod_06_title": { es: "Arquitectura del Sistema", en: "System Architecture" },
  "mod_06_desc": { es: "Diagramas: Lead → Webhook → Agente → CRM → WhatsApp. Stack completo.", en: "Diagrams: Lead → Webhook → Agent → CRM → WhatsApp. Full stack." },
  "mod_04_title": { es: "Portafolio de Proyectos", en: "Project Portfolio" },
  "mod_04_desc": { es: "9+ proyectos entre empresariales, propios y consultoria en IA y desarrollo.", en: "9+ projects across enterprise, personal and consulting in AI and development." },
  "mod_03_title": { es: "Automatizacion (Make/Zapier)", en: "Automation (Make/Zapier)" },
  "mod_03_desc": { es: "Conceptos sobre plataformas de automatizacion no-code aplicadas al flujo de Presto.", en: "Concepts about no-code automation platforms applied to the Presto flow." },
  "mod_07_title": { es: "Demo Rapida — Codigo", en: "Quick Demo — Code" },
  "mod_07_desc": { es: "Snippets clave del backend: agente ReAct, herramientas, multi-tenant y endpoints.", en: "Key backend snippets: ReAct agent, tools, multi-tenant and endpoints." },

  // Page headers
  "p01_title": { es: "API Basica — Chat con LLM", en: "Basic API — Chat with LLM" },
  "p01_desc": { es: "Llamada directa a la API de Groq (compatible OpenAI). Cada mensaje muestra modelo, tokens consumidos, tiempo y metodo HTTP.", en: "Direct Groq API call (OpenAI compatible). Each message shows model, tokens consumed, time and HTTP method." },
  "p02_title": { es: "Agente de IA con Herramientas", en: "AI Agent with Tools" },
  "p02_desc": { es: "El agente decide autonomamente que herramientas usar. Escribe como un lead interesado en clases de musica.", en: "The agent autonomously decides which tools to use. Write as a lead interested in music classes." },
  "p05_title": { es: "Caso Presto — Multi-Tenant", en: "Presto Case — Multi-Tenant" },
  "p05_desc": { es: "Mismo sistema, diferentes academias. Cada una con sus datos aislados. Selecciona una academia y chatea como si fueras un lead real.", en: "Same system, different academies. Each with isolated data. Select an academy and chat as if you were a real lead." },
  "p06_title": { es: "Arquitectura del Sistema", en: "System Architecture" },
  "p06_desc": { es: "Flujo completo: Lead → Webhook → Agente IA → CRM → WhatsApp → Matricula", en: "Full flow: Lead → Webhook → AI Agent → CRM → WhatsApp → Enrollment" },
  "p04_title": { es: "Portafolio de Proyectos", en: "Project Portfolio" },
  "p04_desc": { es: "9+ proyectos entre empresariales, propios y consultoria.", en: "9+ projects across enterprise, personal and consulting." },
  "p03_title": { es: "Automatizacion (Make / Zapier)", en: "Automation (Make / Zapier)" },
  "p03_desc": { es: "Plataformas de automatizacion visual (no-code/low-code).", en: "Visual automation platforms (no-code/low-code)." },

  // Chat
  llamadas: { es: "Llamadas", en: "Calls" },
  enviar: { es: "Enviar", en: "Send" },
  pensando: { es: "Pensando...", en: "Thinking..." },
  metricas: { es: "Metricas", en: "Metrics" },
  metricas_llamada: { es: "Metricas de la llamada", en: "Call metrics" },
  herramientas_ejecutadas: { es: "Herramientas ejecutadas", en: "Tools executed" },
  herramientas: { es: "Herramientas", en: "Tools" },
  acciones_sistema: { es: "Acciones del sistema", en: "System actions" },

  // Architecture
  flujo_principal: { es: "Flujo Principal", en: "Main Flow" },
  arq_multitenant: { es: "Arquitectura Multi-Tenant", en: "Multi-Tenant Architecture" },
  arq_mt_desc: { es: "Una instalacion, multiples academias. Datos aislados por tenant.", en: "One installation, multiple academies. Data isolated by tenant." },
  stack_tecnologico: { es: "Stack Tecnologico", en: "Tech Stack" },
  flujo_tecnico: { es: "Flujo Tecnico (9 pasos)", en: "Technical Flow (9 steps)" },
  mismo_codigo: { es: "Mismo codigo, diferente contexto", en: "Same code, different context" },

  // Automation
  conceptos_clave: { es: "Conceptos Clave", en: "Key Concepts" },
  ejemplo_presto: { es: "Ejemplo Aplicado a Presto", en: "Example Applied to Presto" },

  // Portfolio
  empresarial: { es: "Empresarial", en: "Enterprise" },
  proyecto_propio: { es: "Proyecto Propio", en: "Own Project" },
  investigacion: { es: "Investigacion & Consultoria", en: "Research & Consulting" },

  // Backend status
  backend_online: { es: "Backend conectado — python run.py", en: "Backend connected — python run.py" },
  backend_offline: { es: "Backend desconectado — ejecuta: python run.py", en: "Backend offline — run: python run.py" },
  backend_checking: { es: "Verificando backend...", en: "Checking backend..." },

  // Demo
  demo_title: { es: "Demo Rapida — Codigo del Agente", en: "Quick Demo — Agent Code" },
  demo_desc: { es: "Snippets clave del backend: como funciona el agente, las herramientas y el multi-tenant.", en: "Key backend snippets: how the agent, tools and multi-tenant work." },
  demo_como_funciona: { es: "Como funciona", en: "How it works" },
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("presto-theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
    const savedLang = localStorage.getItem("presto-lang") as Lang | null;
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("presto-theme", next);
  }, [theme]);

  const toggleLang = useCallback(() => {
    const next = lang === "es" ? "en" : "es";
    setLang(next);
    localStorage.setItem("presto-lang", next);
  }, [lang]);

  const t = useCallback((key: string) => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  return (
    <ThemeContext.Provider value={{ theme, lang, toggleTheme, toggleLang, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}

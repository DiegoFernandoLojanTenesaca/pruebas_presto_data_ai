"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimateIn from "@/components/AnimateIn";
import { useTheme } from "@/components/ThemeProvider";
import {
  CommandLineIcon,
  CpuChipIcon,
  UserGroupIcon,
  CubeTransparentIcon,
  BriefcaseIcon,
  BoltIcon,
  CodeBracketIcon,
  ArrowRightIcon,
  SignalIcon,
  SignalSlashIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function AnimatedNumber({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <span ref={ref}>{value}</span>;
}

const MODULOS = [
  { id: "01", href: "/api-basica", titleKey: "mod_01_title", descKey: "mod_01_desc", tags: ["REST API", "Groq", "Tokens"], icon: CommandLineIcon, gradient: "from-blue-500 to-cyan-400", live: true },
  { id: "02", href: "/agente", titleKey: "mod_02_title", descKey: "mod_02_desc", tags: ["LangChain", "LangGraph", "Tool Use"], icon: CpuChipIcon, gradient: "from-emerald-500 to-teal-400", live: true },
  { id: "05", href: "/caso-lead", titleKey: "mod_05_title", descKey: "mod_05_desc", tags: ["Multi-tenant", "CRM", "WhatsApp"], icon: UserGroupIcon, gradient: "from-purple-500 to-violet-400", live: true },
  { id: "06", href: "/arquitectura", titleKey: "mod_06_title", descKey: "mod_06_desc", tags: ["Diagramas", "Stack"], icon: CubeTransparentIcon, gradient: "from-orange-500 to-amber-400", live: false },
  { id: "04", href: "/portafolio", titleKey: "mod_04_title", descKey: "mod_04_desc", tags: ["Sudial AI", "Kumbre", "SaaS"], icon: BriefcaseIcon, gradient: "from-cyan-500 to-blue-400", live: false },
  { id: "03", href: "/automatizacion", titleKey: "mod_03_title", descKey: "mod_03_desc", tags: ["Make", "Zapier", "No-code"], icon: BoltIcon, gradient: "from-yellow-500 to-orange-400", live: false },
  { id: "07", href: "/demo", titleKey: "mod_07_title", descKey: "mod_07_desc", tags: ["Python", "LangGraph", "Snippets"], icon: CodeBracketIcon, gradient: "from-pink-500 to-rose-400", live: false },
];

const STACK = [
  "Python + FastAPI",
  "LangChain + LangGraph",
  "Groq API (Llama 3.3 / 4 Scout)",
  "Next.js + Tailwind CSS",
  "Multi-tenant Architecture",
  "Tool Use / ReAct Pattern",
];

export default function Home() {
  const { t } = useTheme();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const check = () => {
      const start = performance.now();
      fetch(`${API}/api/health`, { signal: AbortSignal.timeout(3000) })
        .then(r => {
          if (r.ok) {
            setLatency(Math.round(performance.now() - start));
            setBackendOnline(true);
          } else setBackendOnline(false);
        })
        .catch(() => { setBackendOnline(false); setLatency(null); });
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-20 relative">
        <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-5 tracking-tight text-txt-primary">
            {t("hero_title_1")}{" "}
            <span className="gradient-text">
              {t("hero_title_2")}
            </span>
          </h1>
          <p className="text-txt-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            {t("hero_desc")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex justify-center gap-2 flex-wrap"
        >
          {STACK.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 bg-surface-light border border-app-border rounded-lg text-xs text-txt-secondary"
            >
              {tech}
            </span>
          ))}
        </motion.div>

      </div>

      {/* Backend status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center mb-8"
      >
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs border ${
          backendOnline === null
            ? "border-app-border text-txt-muted"
            : backendOnline
              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
              : "border-red-500/30 text-red-400 bg-red-500/5"
        }`}>
          {backendOnline === null ? (
            <>
              <div className="w-2 h-2 rounded-full bg-txt-muted animate-pulse" />
              {t("backend_checking")}
            </>
          ) : backendOnline ? (
            <>
              <SignalIcon className="w-3.5 h-3.5" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t("backend_online")}
              {latency !== null && <span className="text-emerald-500/70 ml-1">{latency}ms</span>}
            </>
          ) : (
            <>
              <SignalSlashIcon className="w-3.5 h-3.5" />
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {t("backend_offline")}
            </>
          )}
        </div>
      </motion.div>

      {/* Grid de modulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MODULOS.map((mod, i) => (
          <AnimateIn key={mod.id} delay={i * 0.08}>
            <Link
              href={mod.href}
              className="group block bg-surface border border-app-border rounded-2xl p-6 hover:border-border-light transition-all duration-300 hover:shadow-xl h-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center`}>
                  <mod.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-txt-muted font-mono">{mod.id}</span>
                    {mod.live && (
                      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-txt-primary group-hover:text-accent-light transition-colors">
                    {t(mod.titleKey)}
                  </h2>
                </div>
              </div>
              <p className="text-txt-secondary text-sm mb-4 leading-relaxed">{t(mod.descKey)}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {mod.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-surface-light border border-app-border text-txt-muted rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
                <ArrowRightIcon className="w-4 h-4 text-txt-muted group-hover:text-accent-light group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </AnimateIn>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-16 pt-6 border-t border-app-border text-center text-xs text-txt-muted">
        &copy; {new Date().getFullYear()} {t("footer_copy")}
      </div>
    </div>
  );
}

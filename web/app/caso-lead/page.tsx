"use client";

import { useState, useEffect } from "react";
import ChatPanel from "@/components/ChatPanel";
import AnimateIn from "@/components/AnimateIn";
import { useTheme } from "@/components/ThemeProvider";
import {
  UserGroupIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Academia {
  id: string;
  nombre: string;
  ciudad: string;
  horarios: string;
  clases: string[];
  ubicacion: string;
}

export default function CasoLeadPage() {
  const { t } = useTheme();
  const [academias, setAcademias] = useState<Record<string, Academia>>({});
  const [selected, setSelected] = useState("armonia");
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/05-academias`)
      .then((r) => r.json())
      .then(setAcademias)
      .catch(() => {});
  }, []);

  const handleSend = async (mensaje: string) => {
    const res = await fetch(`${API}/api/05-caso-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje, academia_id: selected }),
    });
    const data = await res.json();
    return {
      respuesta: data.respuesta || data.error,
      meta: {
        herramientas: data.herramientas_usadas,
        acciones: data.acciones_sistema,
        tenant: data.tenant,
        tiempo: data.tiempo_segundos,
        modelo: data.modelo,
      },
    };
  };

  const renderMeta = (meta: Record<string, unknown>) => {
    const herramientas = meta.herramientas as Array<{ nombre: string; args: Record<string, string> }>;
    const acciones = meta.acciones as string[];

    return (
      <div className="space-y-2">
        {herramientas && herramientas.length > 0 && (
          <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 mb-2">
              <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-purple-400" />
              <p className="text-purple-400 font-semibold">{t("herramientas")}</p>
            </div>
            {herramientas.map((h, i) => (
              <p key={i} className="text-purple-300 pl-1">
                {h.nombre}
                <span className="text-purple-500/60 font-mono ml-1">({JSON.stringify(h.args)})</span>
              </p>
            ))}
          </div>
        )}
        {acciones && acciones.length > 0 && (
          <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 mb-2">
              <BoltIcon className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-blue-400 font-semibold">{t("acciones_sistema")}</p>
            </div>
            {acciones.map((a, i) => (
              <p key={i} className="text-blue-300 pl-1">{a}</p>
            ))}
          </div>
        )}
        <div className="bg-surface border border-app-border rounded-xl p-2.5 text-xs flex gap-4">
          <span className="text-txt-muted">Tenant: <span className="text-purple-400 font-semibold">{String(meta.tenant)}</span></span>
          <span className="text-txt-muted">Tiempo: <span className="text-txt-primary">{String(meta.tiempo)}s</span></span>
          <span className="text-txt-muted">Modelo: <span className="text-txt-primary font-mono text-[10px]">{String(meta.modelo)}</span></span>
        </div>
      </div>
    );
  };

  const ac = academias[selected];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-60px)] flex flex-col">
      <AnimateIn>
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-400 flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-txt-muted font-mono">MODULO 05</span>
              <h1 className="text-xl font-bold text-txt-primary">{t("p05_title")}</h1>
            </div>
          </div>
          <p className="text-txt-secondary text-sm ml-12">{t("p05_desc")}</p>
        </div>
      </AnimateIn>

      {/* Selector de academia */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {Object.entries(academias).map(([id, ac]) => (
          <button
            key={id}
            onClick={() => { setSelected(id); setChatKey((k) => k + 1); }}
            className={`p-3 rounded-xl border text-left text-sm transition-all duration-200 ${
              selected === id
                ? "bg-purple-950/50 border-purple-500/50 text-txt-primary glow-accent"
                : "bg-surface border-app-border text-txt-muted hover:border-border-light"
            }`}
          >
            <div className="flex items-center gap-2">
              <BuildingStorefrontIcon className="w-4 h-4 shrink-0" />
              <p className="font-bold">{ac.nombre}</p>
            </div>
            <p className="text-xs mt-1 ml-6">{ac.ciudad} | {ac.clases.join(", ")}</p>
          </button>
        ))}
      </div>

      {/* Info de academia activa */}
      {ac && (
        <div className="bg-surface border border-app-border rounded-xl px-4 py-2.5 mb-4 text-xs flex gap-5">
          <span className="flex items-center gap-1.5 text-txt-muted">
            <ClockIcon className="w-3.5 h-3.5" />
            <span className="text-txt-primary">{ac.horarios}</span>
          </span>
          <span className="flex items-center gap-1.5 text-txt-muted">
            <MapPinIcon className="w-3.5 h-3.5" />
            <span className="text-txt-primary">{ac.ubicacion}</span>
          </span>
          <span className="text-txt-muted">Tenant: <span className="text-purple-400 font-semibold">{selected}</span></span>
        </div>
      )}

      <div className="flex-1 bg-surface rounded-2xl border border-app-border overflow-hidden">
        <ChatPanel
          key={chatKey}
          placeholder={`Escribe como lead de ${ac?.nombre || "la academia"}...`}
          suggestions={[
            "Hola! Vi su anuncio en Instagram, que cursos ofrecen?",
            "Me interesa piano, tienen horarios en la tarde?",
            "Cuanto cuesta inscribirse? Hay descuentos?",
            "Puedo agendar una clase de prueba gratis?",
            "Tienen clases grupales o solo individuales?",
            "Quiero hablar con alguien del equipo",
          ]}
          onSend={handleSend}
          renderMeta={renderMeta}
        />
      </div>
    </div>
  );
}

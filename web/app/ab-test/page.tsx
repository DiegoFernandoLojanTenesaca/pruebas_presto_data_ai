"use client";

import { useState } from "react";
import AnimateIn from "@/components/AnimateIn";
import {
  Square2StackIcon,
  TrophyIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Veredicto = {
  ganador: "A" | "B" | "empate";
  puntaje_a: number;
  puntaje_b: number;
  razon: string;
  evaluacion_por_criterio: Array<{
    criterio: string;
    ganador: "A" | "B" | "empate";
    comentario: string;
  }>;
  recomendacion: string;
};

type Resultado = {
  variante_a: { nombre: string; respuesta: string; tiempo_segundos: number; puntaje: number; tokens_aprox: number };
  variante_b: { nombre: string; respuesta: string; tiempo_segundos: number; puntaje: number; tokens_aprox: number };
  veredicto: Veredicto;
  tiempo_total_segundos: number;
};

const PROMPT_A_DEFAULT =
  "Eres asistente de una academia de musica. Responde de manera formal y profesional, en español. Da info clara y precisa.";
const PROMPT_B_DEFAULT =
  "Eres asistente cool de una academia. Responde casual y breve, y SIEMPRE termina invitando a una clase de prueba GRATIS. Genera urgencia.";

export default function ABTestPage() {
  const [promptA, setPromptA] = useState(PROMPT_A_DEFAULT);
  const [promptB, setPromptB] = useState(PROMPT_B_DEFAULT);
  const [nombreA, setNombreA] = useState("Formal");
  const [nombreB, setNombreB] = useState("Casual con CTA");
  const [mensaje, setMensaje] = useState("Hola, queria saber sobre clases de piano");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);

  const ejecutar = async () => {
    setLoading(true);
    setResultado(null);
    try {
      const r = await fetch(`${API}/api/ab-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_a: { nombre: nombreA, system: promptA },
          prompt_b: { nombre: nombreB, system: promptB },
          mensaje_usuario: mensaje,
        }),
      });
      setResultado(await r.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Square2StackIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-txt-muted font-mono">A/B TEST DE PROMPTS</span>
            <h1 className="text-xl font-bold text-txt-primary">Comparador con LLM-as-a-judge</h1>
          </div>
        </div>
        <p className="text-txt-secondary text-sm ml-12 max-w-3xl">
          Ejecuta dos versiones del prompt contra el mismo mensaje. Un LLM imparcial evalua cual
          performa mejor segun criterios de negocio (calidez, conversion, claridad, CTA).
        </p>
      </AnimateIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
        <AnimateIn>
          <PromptEditor
            color="cyan"
            letra="A"
            nombre={nombreA}
            setNombre={setNombreA}
            prompt={promptA}
            setPrompt={setPromptA}
          />
        </AnimateIn>
        <AnimateIn delay={0.05}>
          <PromptEditor
            color="rose"
            letra="B"
            nombre={nombreB}
            setNombre={setNombreB}
            prompt={promptB}
            setPrompt={setPromptB}
          />
        </AnimateIn>
      </div>

      <div className="mt-5 bg-surface border border-app-border rounded-2xl p-5">
        <label className="text-[10px] uppercase text-txt-muted">Mensaje del lead (mismo para A y B)</label>
        <input
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="w-full mt-1.5 bg-surface-light border border-app-border rounded-lg px-3 py-2 text-sm text-txt-primary"
        />
        <button
          onClick={ejecutar}
          disabled={loading || !mensaje.trim()}
          className="mt-3 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" />
          {loading ? "Comparando A vs B..." : "Comparar variantes"}
        </button>
      </div>

      {resultado && (
        <AnimateIn delay={0.1}>
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ResultadoVariante
              data={resultado.variante_a}
              letra="A"
              ganador={resultado.veredicto.ganador === "A"}
              color="cyan"
            />
            <ResultadoVariante
              data={resultado.variante_b}
              letra="B"
              ganador={resultado.veredicto.ganador === "B"}
              color="rose"
            />
          </div>

          <AnimateIn delay={0.15}>
            <div className="mt-5 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrophyIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-txt-primary">Veredicto del juez</h3>
                <span className="ml-auto text-[10px] text-txt-muted">
                  {resultado.tiempo_total_segundos}s · 3 LLM calls
                </span>
              </div>
              <div className="text-2xl font-bold mb-3">
                Ganador:{" "}
                <span
                  className={
                    resultado.veredicto.ganador === "A"
                      ? "text-cyan-400"
                      : resultado.veredicto.ganador === "B"
                        ? "text-rose-400"
                        : "text-txt-primary"
                  }
                >
                  {resultado.veredicto.ganador === "empate" ? "Empate" : `Variante ${resultado.veredicto.ganador}`}
                </span>
              </div>
              <p className="text-sm text-txt-secondary mb-4">{resultado.veredicto.razon}</p>

              <div className="space-y-2">
                {resultado.veredicto.evaluacion_por_criterio.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs bg-surface-light rounded-lg p-2"
                  >
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        e.ganador === "A"
                          ? "bg-cyan-500/15 text-cyan-300"
                          : e.ganador === "B"
                            ? "bg-rose-500/15 text-rose-300"
                            : "bg-surface text-txt-muted"
                      }`}
                    >
                      {e.ganador === "empate" ? "=" : e.ganador}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-txt-primary">{e.criterio}</div>
                      <div className="text-txt-muted">{e.comentario}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-surface-light rounded-lg text-xs">
                <span className="text-amber-400 font-bold">Recomendacion: </span>
                <span className="text-txt-secondary">{resultado.veredicto.recomendacion}</span>
              </div>
            </div>
          </AnimateIn>
        </AnimateIn>
      )}
    </div>
  );
}

function PromptEditor({
  letra,
  color,
  nombre,
  setNombre,
  prompt,
  setPrompt,
}: {
  letra: "A" | "B";
  color: "cyan" | "rose";
  nombre: string;
  setNombre: (s: string) => void;
  prompt: string;
  setPrompt: (s: string) => void;
}) {
  const colorMap = {
    cyan: "from-cyan-500 to-blue-500 border-cyan-500/30",
    rose: "from-rose-500 to-pink-500 border-rose-500/30",
  };
  return (
    <div className={`bg-surface border-2 rounded-2xl p-5 space-y-3 ${colorMap[color].split(" ").pop()}`}>
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorMap[color].split(" ").slice(0, 2).join(" ")} flex items-center justify-center text-white font-bold text-sm`}
        >
          {letra}
        </div>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="flex-1 bg-transparent font-bold text-txt-primary text-sm focus:outline-none border-b border-transparent focus:border-app-border"
        />
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        className="w-full bg-surface-light border border-app-border rounded-lg p-3 text-xs text-txt-primary font-mono"
        placeholder="System prompt..."
      />
    </div>
  );
}

function ResultadoVariante({
  data,
  letra,
  ganador,
  color,
}: {
  data: { nombre: string; respuesta: string; tiempo_segundos: number; puntaje: number; tokens_aprox: number };
  letra: "A" | "B";
  ganador: boolean;
  color: "cyan" | "rose";
}) {
  const colorMap = {
    cyan: "border-cyan-500 from-cyan-500/10 to-cyan-500/0",
    rose: "border-rose-500 from-rose-500/10 to-rose-500/0",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} border-2 rounded-2xl p-5 ${ganador ? "ring-2 ring-amber-500/50" : "border-app-border"}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-txt-primary">{letra}</span>
          <span className="text-sm text-txt-secondary">{data.nombre}</span>
        </div>
        {ganador && (
          <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold uppercase">
            <TrophyIcon className="w-3.5 h-3.5" /> Ganador
          </span>
        )}
      </div>
      <div className="bg-surface-light rounded-lg p-3 text-sm text-txt-primary leading-relaxed mb-3 min-h-[120px]">
        {data.respuesta}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini label="Puntaje" value={`${data.puntaje}/10`} highlight />
        <Mini label="Tiempo" value={`${data.tiempo_segundos}s`} />
        <Mini label="Tokens" value={`~${data.tokens_aprox}`} />
      </div>
    </div>
  );
}

function Mini({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-surface-light rounded p-2">
      <div className="text-[9px] uppercase text-txt-muted">{label}</div>
      <div className={`text-sm font-bold ${highlight ? "text-amber-400" : "text-txt-primary"}`}>{value}</div>
    </div>
  );
}

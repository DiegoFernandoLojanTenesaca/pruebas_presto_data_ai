"use client";

import { useState, useRef } from "react";
import AnimateIn from "@/components/AnimateIn";
import {
  MicrophoneIcon,
  ArrowUpTrayIcon,
  StopIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Resultado = {
  transcripcion: {
    texto: string;
    idioma_detectado: string;
    duracion_audio_segundos: number;
    tiempo_procesamiento_segundos: number;
    size_archivo_kb: number;
  };
  clasificacion: {
    intencion: string;
    sentimiento: string;
    urgencia: string;
    confianza: number;
    keywords: string[];
    explicacion: string;
  };
  tiempo_total_segundos: number;
};

const COLOR_INTENCION: Record<string, string> = {
  interes_alto: "text-emerald-400 bg-emerald-500/10",
  consulta: "text-sky-400 bg-sky-500/10",
  objecion: "text-amber-400 bg-amber-500/10",
  reclamo: "text-rose-400 bg-rose-500/10",
  spam: "text-gray-400 bg-gray-500/10",
  otro: "text-violet-400 bg-violet-500/10",
};

export default function TranscribirPage() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const procesar = async (file: File) => {
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API}/api/transcribir/y-clasificar`, {
        method: "POST",
        body: fd,
      });
      const d = await r.json();
      if (d.detail || d.error) {
        setError(d.detail || d.error);
      } else {
        setResultado(d);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    setAudioPreviewUrl(URL.createObjectURL(f));
  };

  const grabar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "grabacion.webm", { type: "audio/webm" });
        setArchivo(file);
        setAudioPreviewUrl(URL.createObjectURL(file));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setGrabando(true);
    } catch (e) {
      setError("No se pudo acceder al microfono: " + (e as Error).message);
    }
  };

  const detener = () => {
    mediaRef.current?.stop();
    setGrabando(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <MicrophoneIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-txt-muted font-mono">WHISPER + CLASIFICACION</span>
            <h1 className="text-xl font-bold text-txt-primary">Transcripcion de audio con analisis</h1>
          </div>
        </div>
        <p className="text-txt-secondary text-sm ml-12 max-w-3xl">
          Sube un audio (mp3, wav, webm, m4a, ogg) o graba directo. Whisper Large v3 transcribe
          y luego clasificamos intencion + sentimiento. Util para audios de WhatsApp y llamadas.
        </p>
      </AnimateIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
        <AnimateIn>
          <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-txt-primary">Origen del audio</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={grabando ? detener : grabar}
                className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                  grabando
                    ? "border-rose-500 bg-rose-500/10"
                    : "border-app-border hover:border-rose-500/50"
                }`}
              >
                {grabando ? (
                  <>
                    <StopIcon className="w-7 h-7 text-rose-400" />
                    <span className="text-xs font-bold text-rose-400">Detener grabacion</span>
                    <span className="text-[10px] text-txt-muted animate-pulse">grabando...</span>
                  </>
                ) : (
                  <>
                    <MicrophoneIcon className="w-7 h-7 text-txt-secondary" />
                    <span className="text-xs font-bold text-txt-primary">Grabar microfono</span>
                  </>
                )}
              </button>

              <label className="p-4 rounded-xl border-2 border-app-border hover:border-pink-500/50 cursor-pointer flex flex-col items-center gap-2 transition">
                <ArrowUpTrayIcon className="w-7 h-7 text-txt-secondary" />
                <span className="text-xs font-bold text-txt-primary">Subir archivo</span>
                <span className="text-[10px] text-txt-muted">mp3 wav m4a webm ogg</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={onFile}
                  className="hidden"
                />
              </label>
            </div>

            {archivo && (
              <div className="bg-surface-light rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-txt-secondary truncate">{archivo.name}</span>
                  <span className="text-txt-muted">{(archivo.size / 1024).toFixed(1)} KB</span>
                </div>
                {audioPreviewUrl && (
                  <audio src={audioPreviewUrl} controls className="w-full h-8" />
                )}
              </div>
            )}

            <button
              onClick={() => archivo && procesar(archivo)}
              disabled={!archivo || loading}
              className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <PlayIcon className="w-4 h-4" />
              {loading ? "Transcribiendo..." : "Transcribir + Clasificar"}
            </button>

            {error && (
              <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                {error}
              </div>
            )}
          </div>
        </AnimateIn>

        <AnimateIn delay={0.05}>
          <div className="bg-surface border border-app-border rounded-2xl p-5 space-y-4 min-h-[420px]">
            <h2 className="text-sm font-bold text-txt-primary">Resultado</h2>

            {!resultado && !loading && (
              <p className="text-txt-muted text-xs">Carga un audio y procesa.</p>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-txt-muted text-sm">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                Whisper transcribiendo...
              </div>
            )}

            {resultado && (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase text-txt-muted mb-1">Transcripcion</div>
                  <div className="bg-surface-light border border-app-border rounded-lg p-3 text-sm text-txt-primary leading-relaxed">
                    {resultado.transcripcion.texto || <em className="text-txt-muted">vacio</em>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <Stat label="Idioma" value={resultado.transcripcion.idioma_detectado} />
                    <Stat label="Duracion" value={`${resultado.transcripcion.duracion_audio_segundos?.toFixed(1) || 0}s`} />
                    <Stat label="Procesado" value={`${resultado.transcripcion.tiempo_procesamiento_segundos}s`} />
                  </div>
                </div>

                {resultado.clasificacion && (
                  <div className="border-t border-app-border pt-3">
                    <div className="text-[10px] uppercase text-txt-muted mb-2">Clasificacion del contenido</div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className={`rounded-lg p-2 text-center ${COLOR_INTENCION[resultado.clasificacion.intencion] || "bg-surface-light"}`}>
                        <div className="text-[9px] uppercase opacity-70">Intencion</div>
                        <div className="text-xs font-bold">{resultado.clasificacion.intencion}</div>
                      </div>
                      <Stat label="Sentimiento" value={resultado.clasificacion.sentimiento} />
                      <Stat label="Urgencia" value={resultado.clasificacion.urgencia} />
                    </div>
                    {resultado.clasificacion.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {resultado.clasificacion.keywords.map((k, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 bg-surface-light border border-app-border rounded font-mono text-txt-secondary"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-txt-secondary italic">
                      {resultado.clasificacion.explicacion}
                    </p>
                  </div>
                )}

                <div className="text-[10px] text-txt-muted text-right">
                  pipeline total: {resultado.tiempo_total_segundos}s
                </div>
              </div>
            )}
          </div>
        </AnimateIn>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-light rounded-lg p-2">
      <div className="text-[9px] uppercase text-txt-muted">{label}</div>
      <div className="text-xs font-bold text-txt-primary capitalize">{value}</div>
    </div>
  );
}

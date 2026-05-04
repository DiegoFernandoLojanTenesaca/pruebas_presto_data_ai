"use client";

import AnimateIn from "@/components/AnimateIn";
import { useTheme } from "@/components/ThemeProvider";
import {
  BriefcaseIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const PROYECTOS = [
  {
    catKey: "empresarial",
    icon: RocketLaunchIcon,
    items: [
      {
        nombre: "Sudial AI — Dataglov S.A.S.",
        año: "2026",
        desc: "Plataforma de IA para atencion al cliente en produccion.",
        detalles: [
          "Agentes con LangChain/LangGraph en produccion",
          "Busqueda semantica con embeddings BGE-M3 + pgvector",
          "Clasificador zero-shot automatico",
          "Pipelines ETL para miles de conversaciones",
          "Arquitectura multi-tenant con PostgreSQL",
        ],
        stack: ["FastAPI", "LangChain", "LangGraph", "PostgreSQL", "pgvector", "Docker"],
        gradient: "from-emerald-500 to-teal-400",
        link: null,
      },
      {
        nombre: "Plataforma SaaS — Serviestudios",
        año: "2025-2026",
        desc: "Sistema administrativo full stack.",
        detalles: [
          "Interfaces con React y Next.js",
          "APIs REST con Python (Pyramid), JWT, roles",
          "Integracion WhatsApp API, Google Calendar, Stripe",
          "WebSockets con Redis, OCR con IA",
        ],
        stack: ["React", "Next.js", "Python", "PostgreSQL", "Redis"],
        gradient: "from-blue-500 to-cyan-400",
        link: null,
      },
      {
        nombre: "Chatbot Cuentas — OTP Platform",
        año: "2025-2026",
        desc: "Plataforma de gestion de codigos OTP para cuentas de streaming. Monorepo full stack con email scraping en tiempo real.",
        detalles: [
          "Next.js 16 frontend + FastAPI backend (monorepo)",
          "Upstash Redis (REST API) — sin SQL, storage en tiempo real",
          "Cloudflare Email Workers (webhook) + InstAddr scraping (kuku.lu)",
          "CAPTCHA con Cloudflare Turnstile + rate limiting",
          "Panel admin: killswitch, stats, busqueda, metricas por hora",
          "Google Sheets como source of truth para validacion de cuentas",
          "Auto-refresh bandeja cada 15s, extraccion automatica de OTPs",
        ],
        stack: ["Next.js", "FastAPI", "Upstash Redis", "Cloudflare Workers", "Pydantic", "httpx"],
        gradient: "from-violet-500 to-purple-400",
        link: null,
      },
    ],
  },
  {
    catKey: "proyecto_propio",
    icon: BriefcaseIcon,
    items: [
      {
        nombre: "Kumbre",
        año: "2024-Actualidad",
        desc: "MVP: convertir PDFs de presupuestos de construccion a Excel con parsing inteligente.",
        detalles: [
          "Parsing inteligente con fuzzy matching (rapidfuzz)",
          "Catalogo de 12 CSVs para identificacion automatica",
          "Sistema de auth completo, preview de Excel, watermarking",
        ],
        stack: ["Next.js", "FastAPI", "PostgreSQL", "Docker"],
        gradient: "from-cyan-500 to-blue-400",
        link: null,
      },
    ],
  },
  {
    catKey: "investigacion",
    icon: AcademicCapIcon,
    items: [
      {
        nombre: "Ecuador Energy Anomalies",
        año: "2025 — Investigacion",
        desc: "Deteccion multi-tecnica de anomalias en el sector electrico de LATAM. Isolation Forest + STL + CUSUM, validado con la crisis energetica de Ecuador 2024.",
        detalles: [
          "8 paises, 784 meses de datos reales (Ember, OWID, World Bank)",
          "3 tecnicas complementarias + consensus voting",
          "Consensus F1=0.750, MCC=0.765 en Ecuador (crisis oct-dic 2024)",
          "Baseline de 9 modelos comparados (IF, LOF, LSTM-AE, Prophet, etc.)",
          "Dashboard interactivo con Streamlit",
          "Ground Truth: Decreto Ejecutivo No. 229 + CENACE 2024",
        ],
        stack: ["Python", "Scikit-learn", "Pandas", "Plotly", "Streamlit", "Optuna"],
        gradient: "from-red-500 to-orange-400",
        link: "https://github.com/DiegoFernandoLojanTenesaca/ecuador-energy-anomalies",
      },
      {
        nombre: "Portal Siniestros Ecuador",
        año: "Minas / Civiles",
        desc: "Portal de scraping automatizado para datos de siniestros viales en Ecuador. Organizacion y predicciones con ML.",
        detalles: [
          "Web scraping de fuentes oficiales",
          "Organizacion y limpieza automatica de datos",
          "Modelos predictivos de siniestralidad",
          "Dashboard de visualizacion",
        ],
        stack: ["Python", "Selenium", "Scikit-learn", "Pandas", "FastAPI"],
        gradient: "from-yellow-500 to-orange-400",
        link: null,
      },
      {
        nombre: "Geodatos — Mineria Ilegal",
        año: "Maestria en Geomatica",
        desc: "Prediccion de zonas de mineria ilegal y rios contaminados con datos geoespaciales y Machine Learning.",
        detalles: [
          "Procesamiento de datos geoespaciales (rasters, shapefiles)",
          "Modelos predictivos de actividad minera ilegal",
          "Analisis de contaminacion de rios",
          "Visualizacion en mapas interactivos",
        ],
        stack: ["Python", "GIS", "Rasterio", "GeoPandas", "Scikit-learn"],
        gradient: "from-green-500 to-emerald-400",
        link: null,
      },
      {
        nombre: "NS-3 Congestion Dataset v2",
        año: "Tesis — Telecomunicaciones",
        desc: "Generacion de dataset etiquetado para deteccion de congestion en redes IP usando el simulador ns-3, con topologia de cuello de botella y metricas de trafico realistas.",
        detalles: [
          "Topologia P2P con cuello de botella r1↔r2 (10 Mbps, 20ms)",
          "Metricas: throughput, delay, jitter, loss, queue utilization",
          "Etiquetado por reglas: Q≥80% o Util≥95% → congested",
          "Flujos TCP/UDP mixtos con fases de carga creciente",
          "Dataset CSV listo para entrenar modelos de ML",
          "Basado en RFC 6349, RFC 2679, RFC 1889, RFC 2544",
        ],
        stack: ["ns-3", "C++", "Python", "FlowMonitor", "ML"],
        gradient: "from-indigo-500 to-violet-400",
        link: null,
      },
      {
        nombre: "Aisladores Sismicos Elastomericos",
        año: "Soporte de Tesis",
        desc: "Pipeline computacional end-to-end para analisis sismico: modal-espectral + tiempo-historia + diseno NRB + verificaciones de estabilidad.",
        detalles: [
          "Modelo pórtico 2D shear-frame con D-values de Muto",
          "Espectro NEC-2015, combinacion modal CQC, Newmark-β",
          "Diseño geometrico NRB (Kelly 1997), verificacion Haringx",
          "Fase B: 2, 5 y 10 pisos — limite ~8 pisos por volcamiento",
          "Reduccion V_basal: 80.9% (2p), 79.2% (5p), 67.3% (10p)",
          "Riobamba, zona sismica V, Z=0.40, suelo D",
        ],
        stack: ["Python", "NumPy", "SciPy", "MATLAB", "NEC-2015", "ASCE 7-22"],
        gradient: "from-purple-500 to-pink-400",
        link: null,
      },
      {
        nombre: "Leader Gym — Landing Page",
        año: "Freelance",
        desc: "Landing page profesional para gimnasio en Loja, Ecuador. Astro v6 + Tailwind CSS v4, responsive mobile-first.",
        detalles: [
          "Animaciones de scroll (fade-in, parallax, typewriter)",
          "Carrusel tactil, video reels con control de audio",
          "Planes de membresia con comparador + hover 3D",
          "Integracion WhatsApp Business + Google Maps",
          "Contador regresivo de ofertas + feed Instagram",
        ],
        stack: ["Astro", "Tailwind CSS", "JavaScript", "Vercel"],
        gradient: "from-pink-500 to-rose-400",
        link: "https://github.com/DiegoFernandoLojanTenesaca/LeaderGym",
      },
    ],
  },
];

export default function PortafolioPage() {
  const { t } = useTheme();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AnimateIn>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center">
              <BriefcaseIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-txt-muted font-mono">MODULO 04</span>
              <h1 className="text-xl font-bold text-txt-primary">{t("p04_title")}</h1>
            </div>
          </div>
          <p className="text-txt-secondary text-sm ml-12">
            {t("p04_desc")}
          </p>
          <div className="ml-12 mt-3 flex gap-2 text-xs">
            <a href="https://github.com/DiegoFernandoLojanTenesaca" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-surface-light border border-app-border text-txt-secondary rounded-lg hover:border-accent/50 transition">
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              GitHub
            </a>
            <a href="https://linkedin.com/in/diego-fernando-lojan" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-surface-light border border-app-border text-txt-secondary rounded-lg hover:border-accent/50 transition">
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              LinkedIn
            </a>
          </div>
        </div>
      </AnimateIn>

      {/* Resumen */}
      <AnimateIn delay={0.1}>
        <div className="bg-surface border border-accent/20 rounded-2xl p-5 mb-8 gradient-border">
          <p className="text-sm text-txt-secondary leading-relaxed">
            &quot;He participado en mas de 9 proyectos entre empresariales, propios y consultoria.
            Los mas relevantes: <strong className="text-txt-primary">Sudial AI</strong> (agentes de IA en produccion),
            la plataforma SaaS de <strong className="text-txt-primary">Serviestudios</strong> (integraciones WhatsApp, Calendar, Stripe),
            y mi MVP <strong className="text-txt-primary">Kumbre</strong>.
            Tambien hago consultoria en automatizacion para ingenieros y apoyo en tesis.&quot;
          </p>
        </div>
      </AnimateIn>

      {PROYECTOS.map((cat, catIdx) => (
        <AnimateIn key={cat.catKey} delay={0.15 + catIdx * 0.1}>
          <section className="mb-8">
            <h2 className="text-base font-bold text-txt-primary mb-4 flex items-center gap-2">
              <cat.icon className="w-4 h-4 text-accent-light" />
              {t(cat.catKey)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cat.items.map((p) => (
                <div key={p.nombre} className="bg-surface border border-app-border rounded-2xl p-5 hover:border-border-light transition-colors group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${p.gradient}`} />
                      <h3 className="font-bold text-txt-primary text-sm">{p.nombre}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-light hover:text-accent transition-colors"
                          title="Ver en GitHub"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </a>
                      )}
                      <span className="text-[10px] text-txt-muted bg-surface-light px-2 py-0.5 rounded">{p.año}</span>
                    </div>
                  </div>
                  <p className="text-txt-secondary text-sm mb-3 ml-4">{p.desc}</p>
                  {p.detalles.length > 0 && (
                    <ul className="text-xs text-txt-secondary space-y-1 mb-3 ml-4">
                      {p.detalles.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-accent mt-0.5">•</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-1.5 ml-4">
                    {p.stack.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 bg-surface-light border border-app-border text-txt-muted rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </AnimateIn>
      ))}
    </div>
  );
}

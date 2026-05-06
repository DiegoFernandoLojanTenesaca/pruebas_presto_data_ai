"use client";

import { useEffect } from "react";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import {
  HomeIcon,
  CommandLineIcon,
  CpuChipIcon,
  UserGroupIcon,
  CubeTransparentIcon,
  BriefcaseIcon,
  BoltIcon,
  CodeBracketIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
  TagIcon,
  Square2StackIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

// Navbar principal — orden por importancia para Presto
const NAV_PRIMARY = [
  { href: "/", labelKey: "inicio", icon: HomeIcon },
  { href: "/dashboard", labelKey: "dashboard", icon: ChartBarIcon },
  { href: "/anti-abandono", labelKey: "antiabandono", icon: ShieldCheckIcon, hot: true },
  { href: "/scoring", labelKey: "scoring", icon: AdjustmentsHorizontalIcon },
  { href: "/caso-lead", labelKey: "lead", icon: UserGroupIcon },
  { href: "/clasificar", labelKey: "clasificar", icon: TagIcon },
  { href: "/streaming", labelKey: "streaming", icon: BoltIcon },
  { href: "/transcribir", labelKey: "transcribir", icon: MicrophoneIcon },
  { href: "/ab-test", labelKey: "abtest", icon: Square2StackIcon },
];

const NAV_SECONDARY = [
  { href: "/api-basica", labelKey: "api", icon: CommandLineIcon },
  { href: "/agente", labelKey: "agente", icon: CpuChipIcon },
  { href: "/arquitectura", labelKey: "arquitectura", icon: CubeTransparentIcon },
  { href: "/automatizacion", labelKey: "automatizacion", icon: BoltIcon },
  { href: "/portafolio", labelKey: "portafolio", icon: BriefcaseIcon },
  { href: "/demo", labelKey: "demo", icon: CodeBracketIcon },
];

const ALL_NAV = [...NAV_PRIMARY, ...NAV_SECONDARY];

function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, lang, toggleTheme, toggleLang, t } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < NAV_PRIMARY.length) {
        e.preventDefault();
        router.push(NAV_PRIMARY[idx].href);
      }
      if (e.key === "d" || e.key === "D") toggleTheme();
      if (e.key === "l" || e.key === "L") toggleLang();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, toggleTheme, toggleLang]);

  return (
    <nav className="glass border-b border-app-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center text-white font-bold text-xs">
            P
          </div>
          <span className="text-base font-bold text-txt-primary hidden sm:inline">
            Presto <span className="text-accent-light">AI</span>
          </span>
        </Link>

        {/* Nav primaria — items mas importantes con shortcut */}
        <div className="flex gap-0.5 text-xs ml-1 overflow-x-auto scrollbar-thin">
          {NAV_PRIMARY.map((item, i) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition whitespace-nowrap relative ${
                  active
                    ? "bg-accent/15 text-accent-light font-medium"
                    : "text-txt-muted hover:text-txt-primary hover:bg-surface-light"
                }`}
                title={`${t(item.labelKey)} (${i + 1})`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">{t(item.labelKey)}</span>
                {item.hot && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </Link>
            );
          })}

          {/* Separador */}
          <div className="w-px bg-app-border my-1.5 mx-1 shrink-0" />

          {/* Nav secundaria */}
          {NAV_SECONDARY.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition whitespace-nowrap ${
                  active
                    ? "bg-accent/15 text-accent-light font-medium"
                    : "text-txt-muted/70 hover:text-txt-primary hover:bg-surface-light"
                }`}
                title={t(item.labelKey)}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-surface-light transition text-xs"
            title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            <LanguageIcon className="w-4 h-4" />
            <span className="uppercase font-medium hidden sm:inline">{lang}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-surface-light transition"
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable} h-full`} data-theme="dark">
      <head>
        <title>Presto AI — Pruebas Tecnicas</title>
        <meta name="description" content="Agentes de IA para Academias de Musica — Diego Fernando Lojan Tenesaca" />
        <meta property="og:title" content="Presto AI — Agentes de IA para Academias de Musica" />
        <meta property="og:description" content="Sistema inteligente de captacion de alumnos con LangChain, LangGraph y Groq. Multi-tenant, CRM, WhatsApp." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_EC" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Presto AI — Pruebas Tecnicas" />
        <meta name="twitter:description" content="Agentes de IA para Academias de Musica — Diego Fernando Lojan Tenesaca" />
        <meta name="author" content="Diego Fernando Lojan Tenesaca" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

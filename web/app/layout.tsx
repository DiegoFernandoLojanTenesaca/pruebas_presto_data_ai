"use client";

import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import {
  HomeIcon,
  CommandLineIcon,
  CpuChipIcon,
  UserGroupIcon,
  CubeTransparentIcon,
  BriefcaseIcon,
  BoltIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
} from "@heroicons/react/24/outline";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

const NAV_ITEMS = [
  { href: "/", labelKey: "inicio", icon: HomeIcon },
  { href: "/api-basica", labelKey: "api", icon: CommandLineIcon },
  { href: "/agente", labelKey: "agente", icon: CpuChipIcon },
  { href: "/caso-lead", labelKey: "lead", icon: UserGroupIcon },
  { href: "/arquitectura", labelKey: "arquitectura", icon: CubeTransparentIcon },
  { href: "/portafolio", labelKey: "portafolio", icon: BriefcaseIcon },
  { href: "/automatizacion", labelKey: "automatizacion", icon: BoltIcon },
];

function Navbar() {
  const pathname = usePathname();
  const { theme, lang, toggleTheme, toggleLang, t } = useTheme();

  return (
    <nav className="glass border-b border-app-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center text-white font-bold text-xs">
            P
          </div>
          <span className="text-base font-bold text-txt-primary">
            Presto <span className="text-accent-light">AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex gap-0.5 text-xs ml-2 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-accent/15 text-accent-light font-medium"
                    : "text-txt-muted hover:text-txt-primary hover:bg-surface-light"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-1">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-surface-light transition-all text-xs"
            title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            <LanguageIcon className="w-4 h-4" />
            <span className="uppercase font-medium">{lang}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-surface-light transition-all"
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? (
              <SunIcon className="w-4 h-4" />
            ) : (
              <MoonIcon className="w-4 h-4" />
            )}
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
        <meta name="description" content="Agentes de IA para Academias de Musica — Diego Fernando Lojan" />
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

"use client";

import { useMemo } from "react";

/**
 * Charts SVG sin dependencias externas. Lightweight, accesibles,
 * tema oscuro/claro automatico via CSS vars del proyecto.
 */

export function Donut({
  data,
  size = 160,
  thickness = 22,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2 - thickness / 2;
  const circumference = 2 * Math.PI * radius;

  let acumulado = 0;

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-txt-muted text-xs"
        style={{ width: size, height: size }}
      >
        Sin datos
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          if (d.value === 0) return null;
          const fraccion = d.value / total;
          const dash = fraccion * circumference;
          const offset = -acumulado;
          acumulado += dash;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          );
        })}
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold tabular-nums text-txt-primary">{total}</div>
        <div className="text-[10px] uppercase text-txt-muted tracking-wide">Total</div>
      </div>
    </div>
  );
}

export function Sparkline({
  values,
  width = 280,
  height = 60,
  color = "var(--accent)",
  fill = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  const { path, area } = useMemo(() => {
    if (values.length === 0) return { path: "", area: "" };
    const max = Math.max(...values, 1);
    const min = 0;
    const dx = width / Math.max(values.length - 1, 1);
    const points = values.map((v, i) => {
      const x = i * dx;
      const y = height - ((v - min) / (max - min)) * height * 0.9 - height * 0.05;
      return [x, y];
    });
    const path = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
    const area =
      `M ${points[0][0]} ${height} ` +
      points.map((p) => `L ${p[0]} ${p[1]}`).join(" ") +
      ` L ${points[points.length - 1][0]} ${height} Z`;
    return { path, area };
  }, [values, width, height]);

  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center text-txt-muted text-xs" style={{ height }}>
        Sin actividad
      </div>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill="url(#spark-grad)" />}
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Funnel({
  steps,
}: {
  steps: { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        return (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-txt-secondary">{s.label}</span>
              <span className="font-bold text-txt-primary tabular-nums">{s.value}</span>
            </div>
            <div className="h-6 bg-surface-light rounded-md overflow-hidden relative">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  background: s.color || "linear-gradient(90deg, #a855f7, #ec4899)",
                }}
              />
              {i < steps.length - 1 && steps[i + 1] && (
                <div className="absolute right-1 top-0 h-full flex items-center text-[10px] text-txt-muted">
                  {s.value > 0
                    ? `${Math.round((steps[i + 1].value / s.value) * 100)}% ↓`
                    : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function GaugeBar({
  value,
  max = 100,
  thresholds = [40, 70],
  label,
}: {
  value: number;
  max?: number;
  thresholds?: [number, number];
  label?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    value >= thresholds[1]
      ? "from-rose-500 to-red-500"
      : value >= thresholds[0]
        ? "from-amber-400 to-orange-500"
        : "from-sky-400 to-cyan-500";

  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-txt-secondary">{label}</span>
          <span className="font-bold text-txt-primary tabular-nums">{value}/{max}</span>
        </div>
      )}
      <div className="h-2.5 bg-surface-light rounded-full overflow-hidden relative">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-500 rounded-full`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-app-border"
          style={{ left: `${thresholds[0]}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-app-border"
          style={{ left: `${thresholds[1]}%` }}
        />
      </div>
    </div>
  );
}

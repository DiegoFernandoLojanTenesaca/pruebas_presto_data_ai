"use client";

interface MetaCardProps {
  data: Record<string, unknown>;
  title?: string;
}

export default function MetaCard({ data, title = "Metricas" }: MetaCardProps) {
  return (
    <div className="bg-surface border border-app-border rounded-xl p-3 text-xs">
      {title && <p className="text-accent-light font-semibold mb-2">{title}</p>}
      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex justify-between gap-2">
            <span className="text-gray-500">{key}:</span>
            <span className="text-gray-300 truncate font-mono text-[11px]">
              {typeof val === "object" ? JSON.stringify(val) : String(val)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

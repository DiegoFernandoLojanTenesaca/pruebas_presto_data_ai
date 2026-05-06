"""
Store de metricas en memoria. Compartido por todos los endpoints.
En produccion seria Redis o PostgreSQL con TimescaleDB.
"""
from collections import defaultdict, Counter
from datetime import datetime
from threading import Lock
from typing import Any


class MetricasStore:
    def __init__(self):
        self._lock = Lock()
        self.eventos: list[dict[str, Any]] = []
        self.contadores: Counter = Counter()
        self.tools_usadas: Counter = Counter()
        self.tiempos_por_endpoint: dict[str, list[float]] = defaultdict(list)
        self.leads_por_academia: Counter = Counter()
        self.scores: list[dict[str, Any]] = []

    def registrar_evento(self, tipo: str, datos: dict[str, Any]):
        with self._lock:
            self.eventos.append({
                "tipo": tipo,
                "timestamp": datetime.now().isoformat(),
                **datos,
            })
            self.contadores[tipo] += 1
            if len(self.eventos) > 500:
                self.eventos = self.eventos[-500:]

    def registrar_tiempo(self, endpoint: str, segundos: float):
        with self._lock:
            self.tiempos_por_endpoint[endpoint].append(segundos)
            if len(self.tiempos_por_endpoint[endpoint]) > 100:
                self.tiempos_por_endpoint[endpoint] = self.tiempos_por_endpoint[endpoint][-100:]

    def registrar_tool(self, nombre: str):
        with self._lock:
            self.tools_usadas[nombre] += 1

    def registrar_lead(self, academia_id: str):
        with self._lock:
            self.leads_por_academia[academia_id] += 1

    def registrar_score(self, score: int, categoria: str, academia_id: str | None = None):
        with self._lock:
            self.scores.append({
                "score": score,
                "categoria": categoria,
                "academia_id": academia_id,
                "timestamp": datetime.now().isoformat(),
            })
            if len(self.scores) > 200:
                self.scores = self.scores[-200:]

    def resumen(self) -> dict[str, Any]:
        with self._lock:
            tiempos_promedio = {
                ep: round(sum(t) / len(t), 2) if t else 0
                for ep, t in self.tiempos_por_endpoint.items()
            }
            categorias = Counter(s["categoria"] for s in self.scores)
            return {
                "eventos_total": sum(self.contadores.values()),
                "por_tipo": dict(self.contadores),
                "tools_top": self.tools_usadas.most_common(10),
                "tiempo_promedio_segundos": tiempos_promedio,
                "leads_por_academia": dict(self.leads_por_academia),
                "scoring": {
                    "total": len(self.scores),
                    "categorias": dict(categorias),
                    "promedio": round(
                        sum(s["score"] for s in self.scores) / len(self.scores), 1
                    ) if self.scores else 0,
                },
                "ultimos_eventos": self.eventos[-20:],
            }


metricas = MetricasStore()

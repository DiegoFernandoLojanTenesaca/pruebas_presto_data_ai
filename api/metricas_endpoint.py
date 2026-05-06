"""
Feature 5 - Endpoint de metricas para dashboard.

Expone los datos agregados del MetricasStore en formato JSON.
El frontend consume esto y dibuja graficas.
"""
from fastapi import APIRouter
from api.metricas_store import metricas


router = APIRouter(prefix="/api/metricas", tags=["metricas"])


@router.get("")
def obtener_metricas():
    """Resumen completo de metricas en memoria."""
    return metricas.resumen()


@router.get("/eventos")
def listar_eventos(limit: int = 50):
    """Stream de eventos recientes para timeline en vivo."""
    return {
        "eventos": metricas.eventos[-limit:],
        "total": len(metricas.eventos),
    }


@router.post("/reset")
def reset_metricas():
    """Limpia metricas. Util para empezar demo limpio."""
    metricas.eventos.clear()
    metricas.contadores.clear()
    metricas.tools_usadas.clear()
    metricas.tiempos_por_endpoint.clear()
    metricas.leads_por_academia.clear()
    metricas.scores.clear()
    return {"status": "ok", "mensaje": "Metricas reiniciadas"}

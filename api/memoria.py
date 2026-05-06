"""
Feature 9 - Memoria conversacional persistente.

Auto-detecta el backend de almacenamiento:
- Si existe la variable DATABASE_URL  → PostgresSaver (produccion)
- Sino                                → SqliteSaver (local/demo rapido)

Cada conversacion tiene un session_id (thread_id en LangGraph).
El estado se persiste, asi el lead puede regresar dias despues
y el agente recuerda todo el historial.

DATABASE_URL ejemplo (Neon):
  postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
"""
import os
import sqlite3
import time
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

from api.academias import ACADEMIAS
from api.metricas_store import metricas


router = APIRouter(prefix="/api/memoria", tags=["memoria"])


DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
USAR_POSTGRES = bool(DATABASE_URL)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "memoria.db")


def _crear_checkpointer():
    """Construye el checkpointer apropiado segun el entorno."""
    if USAR_POSTGRES:
        from langgraph.checkpoint.postgres import PostgresSaver
        from psycopg_pool import ConnectionPool

        # Neon free tier suspende la DB tras ~5min de inactividad.
        # min_size=0: no mantenemos conexiones idle (que se romperian).
        # check=check_connection: valida cada conexion antes de usarla.
        # max_idle: cierra conexiones idle tras 60s para evitar conexiones zombie.
        pool = ConnectionPool(
            conninfo=DATABASE_URL,
            min_size=0,
            max_size=10,
            max_idle=60,
            kwargs={"autocommit": True, "prepare_threshold": 0},
            check=ConnectionPool.check_connection,
            open=True,
        )
        cp = PostgresSaver(pool)
        cp.setup()
        return cp

    from langgraph.checkpoint.sqlite import SqliteSaver
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    return SqliteSaver(conn)


_checkpointer = _crear_checkpointer()
_agentes_con_memoria: dict[str, Any] = {}


def _agente_para(academia_id: str):
    if academia_id not in _agentes_con_memoria:
        from langchain_groq import ChatGroq
        from langchain_core.tools import tool
        from langgraph.prebuilt import create_react_agent
        from config import MODELO_AGENTE

        ac = ACADEMIAS[academia_id]

        @tool
        def consultar_clases(instrumento: str) -> str:
            """Consulta clases disponibles."""
            metricas.registrar_tool("consultar_clases")
            if instrumento.lower() != "todas":
                for nombre, info in ac["clases"].items():
                    if instrumento.lower() in nombre.lower():
                        return f"{nombre}: ${info['precio']}/mes, Prof. {info['profesor']}, Dias: {info['dias']}."
                return f"No ofrecemos {instrumento}."
            return "\n".join(f"- {n}: ${i['precio']}/mes" for n, i in ac["clases"].items())

        @tool
        def agendar_prueba(nombre: str, instrumento: str, dia: str, telefono: str) -> str:
            """Agenda clase de prueba."""
            metricas.registrar_tool("agendar_prueba")
            return f"[CRM] {nombre} | Tel: {telefono} | {instrumento} el {dia}"

        llm = ChatGroq(model=MODELO_AGENTE, temperature=0.4)
        _agentes_con_memoria[academia_id] = create_react_agent(
            llm,
            [consultar_clases, agendar_prueba],
            prompt=(
                f"Eres asistente de {ac['nombre']} en {ac['ciudad']}. "
                "Responde en español. Recuerdas conversaciones anteriores con este usuario. "
                "Si ya conoces su nombre o info, NO la pidas de nuevo."
            ),
            checkpointer=_checkpointer,
        )
    return _agentes_con_memoria[academia_id]


class ChatMemoriaRequest(BaseModel):
    session_id: str
    mensaje: str
    academia_id: str = "armonia"


@router.post("/chat")
def chat_con_memoria(req: ChatMemoriaRequest):
    inicio = time.time()

    if req.academia_id not in ACADEMIAS:
        return {"error": f"Academia {req.academia_id} no existe"}

    agente = _agente_para(req.academia_id)
    config = {"configurable": {"thread_id": req.session_id}}

    resultado = agente.invoke(
        {"messages": [HumanMessage(content=req.mensaje)]},
        config=config,
    )

    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("memoria_chat", duracion)
    metricas.registrar_evento("memoria_invocada", {
        "session_id": req.session_id,
        "academia_id": req.academia_id,
    })

    historial = []
    for m in resultado["messages"]:
        rol = m.type
        if rol == "human":
            historial.append({"rol": "user", "texto": m.content})
        elif rol == "ai" and m.content:
            historial.append({"rol": "assistant", "texto": m.content})

    return {
        "respuesta": resultado["messages"][-1].content,
        "session_id": req.session_id,
        "academia_id": req.academia_id,
        "tiempo_segundos": duracion,
        "total_mensajes_en_memoria": len(resultado["messages"]),
        "historial_visible": historial,
        "backend": "postgres" if USAR_POSTGRES else "sqlite",
    }


@router.get("/historial/{session_id}")
def obtener_historial(session_id: str, academia_id: str = "armonia"):
    if academia_id not in ACADEMIAS:
        return {"error": f"Academia {academia_id} no existe"}

    agente = _agente_para(academia_id)
    config = {"configurable": {"thread_id": session_id}}

    state = agente.get_state(config)
    if not state or not state.values:
        return {"session_id": session_id, "mensajes": [], "existe": False}

    mensajes = []
    for m in state.values.get("messages", []):
        if m.type == "human":
            mensajes.append({"rol": "user", "texto": m.content})
        elif m.type == "ai" and m.content:
            mensajes.append({"rol": "assistant", "texto": m.content})

    return {
        "session_id": session_id,
        "academia_id": academia_id,
        "existe": True,
        "total_mensajes": len(mensajes),
        "mensajes": mensajes,
        "backend": "postgres" if USAR_POSTGRES else "sqlite",
    }


@router.delete("/sesion/{session_id}")
def borrar_sesion(session_id: str):
    """Borra el historial. SQLite-only por simplicidad."""
    if USAR_POSTGRES:
        return {
            "status": "skipped",
            "razon": "borrado manual no implementado en Postgres backend, usar otro thread_id",
        }

    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM checkpoints WHERE thread_id = ?", (session_id,))
        cur.execute("DELETE FROM writes WHERE thread_id = ?", (session_id,))
        conn.commit()
        return {"status": "ok", "session_id": session_id, "filas_borradas": cur.rowcount}
    finally:
        conn.close()


@router.get("/info")
def info_memoria():
    return {
        "backend": "PostgresSaver" if USAR_POSTGRES else "SqliteSaver",
        "configuracion": "DATABASE_URL detectada" if USAR_POSTGRES else f"SQLite local: {DB_PATH}",
        "endpoints": [
            "POST /api/memoria/chat — chat con memoria",
            "GET  /api/memoria/historial/{session_id} — recuperar historial",
            "DELETE /api/memoria/sesion/{session_id} — borrar sesion (SQLite only)",
        ],
        "produccion": "Configurar DATABASE_URL con Neon/Supabase para Postgres",
    }

"""
Backend FastAPI - Endpoints para todos los modulos de prueba.
Cada endpoint expone un modulo de IA como API REST.
"""
import os
import sys
import time
import warnings
import requests as http_requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

warnings.filterwarnings("ignore")
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import cargar_env, GROQ_API_KEY, GROQ_URL, MODELO_CHAT, MODELO_AGENTE

from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent

from api.metricas_store import metricas
from api.academias import ACADEMIAS, crear_agente_academia, agentes_cache

app = FastAPI(title="Presto Pruebas API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REGISTRO DE ROUTERS DE FEATURES NUEVAS
# ============================================================

from api.webhook_ghl import router as webhook_router
from api.scoring import router as scoring_router
from api.rag import router as rag_router
from api.clasificacion import router as clasificacion_router
from api.metricas_endpoint import router as metricas_router
from api.streaming import router as streaming_router
from api.transcripcion import router as transcripcion_router
from api.ab_test import router as ab_test_router
from api.memoria import router as memoria_router
from api.anti_abandono import router as anti_abandono_router

app.include_router(webhook_router)
app.include_router(scoring_router)
app.include_router(rag_router)
app.include_router(clasificacion_router)
app.include_router(metricas_router)
app.include_router(streaming_router)
app.include_router(transcripcion_router)
app.include_router(ab_test_router)
app.include_router(memoria_router)
app.include_router(anti_abandono_router)


# ============================================================
# MODELOS DE REQUEST/RESPONSE
# ============================================================

class ChatRequest(BaseModel):
    mensaje: str
    system: str = "Eres un asistente util. Responde en español de forma concisa."

class AgentRequest(BaseModel):
    mensaje: str

class LeadRequest(BaseModel):
    mensaje: str
    academia_id: str = "armonia"


# ============================================================
# 01 - API BASICA
# ============================================================

@app.post("/api/01-api-basica")
def api_basica(req: ChatRequest):
    inicio = time.time()

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODELO_CHAT,
        "messages": [
            {"role": "system", "content": req.system},
            {"role": "user", "content": req.mensaje},
        ],
        "temperature": 0.7,
        "max_tokens": 500,
    }

    response = http_requests.post(GROQ_URL, headers=headers, json=payload)
    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("01_api_basica", duracion)
    metricas.registrar_evento("chat_basico", {"tokens": response.json().get("usage", {}).get("total_tokens", 0) if response.status_code == 200 else 0})

    if response.status_code != 200:
        return {"error": response.text, "status": response.status_code}

    data = response.json()
    usage = data.get("usage", {})

    return {
        "respuesta": data["choices"][0]["message"]["content"],
        "modelo": MODELO_CHAT,
        "tokens": {
            "prompt": usage.get("prompt_tokens", 0),
            "completion": usage.get("completion_tokens", 0),
            "total": usage.get("total_tokens", 0),
        },
        "tiempo_segundos": duracion,
        "metodo": "POST /openai/v1/chat/completions",
        "provider": "Groq (API compatible con OpenAI)",
    }


# ============================================================
# 02 - AGENTE SIMPLE (single-tenant, demo de tool use)
# ============================================================

AGENTE_INFO_BASE = {
    "Piano": {"precio": 60, "profesor": "Maria Lopez", "dias": "Lun, Mie, Vie"},
    "Guitarra": {"precio": 50, "profesor": "Carlos Ruiz", "dias": "Mar, Jue, Sab"},
    "Violin": {"precio": 70, "profesor": "Ana Torres", "dias": "Lun, Mie, Vie"},
    "Canto": {"precio": 45, "profesor": "Laura Mendez", "dias": "Mar, Jue"},
    "Bateria": {"precio": 55, "profesor": "Miguel Ortiz", "dias": "Lun, Sab"},
}

@tool
def buscar_info_academia(consulta: str) -> str:
    """Busca informacion de la academia: horarios, precios, clases, profesores."""
    metricas.registrar_tool("buscar_info_academia")
    for nombre, info in AGENTE_INFO_BASE.items():
        if nombre.lower() in consulta.lower():
            return f"{nombre}: ${info['precio']}/mes, Prof. {info['profesor']}, Dias: {info['dias']}. Clase de prueba GRATIS."
    return "\n".join(f"- {k}: ${v['precio']}/mes, {v['profesor']} ({v['dias']})" for k, v in AGENTE_INFO_BASE.items()) + "\nClase de prueba GRATIS."

@tool
def agendar_clase_prueba(nombre: str, instrumento: str, dia: str) -> str:
    """Agenda una clase de prueba gratuita para un lead."""
    metricas.registrar_tool("agendar_clase_prueba")
    return f"[CRM] Lead registrado: {nombre} | [Calendar] Clase de {instrumento} agendada: {dia} | [WhatsApp] Confirmacion enviada"

@tool
def registrar_lead_crm(nombre: str, telefono: str, interes: str) -> str:
    """Registra un nuevo lead en el sistema CRM (GoHighLevel)."""
    metricas.registrar_tool("registrar_lead_crm")
    return f"[CRM GoHighLevel] Lead: {nombre} | Tel: {telefono} | Interes: {interes} | Estado: nuevo"

llm_agente = ChatGroq(model=MODELO_AGENTE, temperature=0.4)
agente_simple = create_react_agent(
    llm_agente,
    [buscar_info_academia, agendar_clase_prueba, registrar_lead_crm],
    prompt=(
        "Eres el asistente virtual de la Academia de Musica Armonia en Cuenca, Ecuador. "
        "Responde en español. Se calido y profesional. "
        "Usa las herramientas para consultar info real. "
        "Si el lead muestra interes, ofrece clase de prueba GRATIS."
    ),
)

@app.post("/api/02-agente")
def agente_endpoint(req: AgentRequest):
    inicio = time.time()
    resultado = agente_simple.invoke({"messages": [HumanMessage(content=req.mensaje)]})
    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("02_agente", duracion)
    metricas.registrar_evento("agente_invocado", {"academia": "armonia"})

    herramientas_usadas = []
    for msg in resultado["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                herramientas_usadas.append({
                    "nombre": tc["name"],
                    "args": tc["args"],
                })
        if msg.type == "tool":
            for h in herramientas_usadas:
                if not h.get("resultado"):
                    h["resultado"] = msg.content
                    break

    return {
        "respuesta": resultado["messages"][-1].content,
        "modelo": MODELO_AGENTE,
        "herramientas_usadas": herramientas_usadas,
        "herramientas_disponibles": ["buscar_info_academia", "agendar_clase_prueba", "registrar_lead_crm"],
        "tiempo_segundos": duracion,
        "patron": "ReAct (Reasoning + Acting)",
    }


# ============================================================
# 05 - CASO LEAD MULTI-TENANT
# ============================================================

@app.get("/api/05-academias")
def listar_academias():
    return {
        aid: {
            "id": aid,
            "nombre": ac["nombre"],
            "ciudad": ac["ciudad"],
            "horarios": ac["horarios"],
            "clases": list(ac["clases"].keys()),
            "ubicacion": ac["ubicacion"],
        }
        for aid, ac in ACADEMIAS.items()
    }

@app.post("/api/05-caso-lead")
def caso_lead(req: LeadRequest):
    inicio = time.time()

    if req.academia_id not in ACADEMIAS:
        return {"error": f"Academia '{req.academia_id}' no encontrada"}

    if req.academia_id not in agentes_cache:
        agentes_cache[req.academia_id] = crear_agente_academia(req.academia_id)

    agente = agentes_cache[req.academia_id]
    resultado = agente.invoke({"messages": [HumanMessage(content=req.mensaje)]})
    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("05_caso_lead", duracion)
    metricas.registrar_evento("agente_invocado", {"academia": req.academia_id})

    herramientas = []
    acciones_sistema = []
    for msg in resultado["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                herramientas.append({"nombre": tc["name"], "args": tc["args"]})
        if msg.type == "tool":
            for parte in msg.content.split(" | "):
                if parte.startswith("["):
                    acciones_sistema.append(parte)

    academia = ACADEMIAS[req.academia_id]

    return {
        "respuesta": resultado["messages"][-1].content,
        "academia": {
            "id": req.academia_id,
            "nombre": academia["nombre"],
            "ciudad": academia["ciudad"],
        },
        "herramientas_usadas": herramientas,
        "acciones_sistema": acciones_sistema,
        "modelo": MODELO_AGENTE,
        "tiempo_segundos": duracion,
        "tenant": req.academia_id,
    }


# ============================================================
# INFO GENERAL
# ============================================================

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/info")
def info():
    return {
        "proyecto": "Presto Pruebas - Agentes de IA para Academias de Musica",
        "autor": "Diego Fernando Lojan Tenesaca",
        "stack": {
            "backend": "FastAPI + Python 3.13",
            "ia": "LangChain + LangGraph",
            "llm_provider": "Groq",
            "modelos": {
                "chat": MODELO_CHAT,
                "agente": MODELO_AGENTE,
            },
        },
        "modulos": [
            {"id": "01", "nombre": "API Basica", "descripcion": "Llamada directa a API de LLM"},
            {"id": "02", "nombre": "Agente Simple", "descripcion": "Agente con herramientas (buscar, agendar, CRM)"},
            {"id": "03", "nombre": "Automatizacion", "descripcion": "Notas sobre Make/Zapier"},
            {"id": "04", "nombre": "Portafolio", "descripcion": "Proyectos y experiencia"},
            {"id": "05", "nombre": "Caso Lead", "descripcion": "Multi-tenant: 3 academias, flujo completo"},
            {"id": "06", "nombre": "Arquitectura", "descripcion": "Diagramas del sistema"},
            {"id": "07", "nombre": "Demo Rapida", "descripcion": "Demo interactiva para entrevista"},
        ],
        "features_avanzadas": [
            "POST /api/webhook/ghl/lead — Webhook simulado de GoHighLevel",
            "POST /api/scoring — Lead scoring con LLM (frio/tibio/caliente)",
            "POST /api/rag/buscar — Busqueda semantica sobre catalogo",
            "POST /api/clasificar — Sentimiento + intencion zero-shot",
            "GET  /api/metricas — Dashboard de metricas",
            "POST /api/01-chat-stream — Streaming SSE de tokens",
            "POST /api/transcribir — Transcripcion audio (Whisper)",
            "POST /api/ab-test — Comparacion A/B de prompts",
            "POST /api/memoria/chat — Conversacion con memoria persistente",
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

"""
Backend FastAPI - Endpoints para todos los modulos de prueba.
Cada endpoint expone un modulo de IA como API REST.
"""
import os
import sys
import time
import json
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

app = FastAPI(title="Presto Pruebas API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
# 02 - AGENTE SIMPLE
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
    for nombre, info in AGENTE_INFO_BASE.items():
        if nombre.lower() in consulta.lower():
            return f"{nombre}: ${info['precio']}/mes, Prof. {info['profesor']}, Dias: {info['dias']}. Clase de prueba GRATIS."
    return "\n".join(f"- {k}: ${v['precio']}/mes, {v['profesor']} ({v['dias']})" for k, v in AGENTE_INFO_BASE.items()) + "\nClase de prueba GRATIS."

@tool
def agendar_clase_prueba(nombre: str, instrumento: str, dia: str) -> str:
    """Agenda una clase de prueba gratuita para un lead."""
    return f"[CRM] Lead registrado: {nombre} | [Calendar] Clase de {instrumento} agendada: {dia} | [WhatsApp] Confirmacion enviada"

@tool
def registrar_lead_crm(nombre: str, telefono: str, interes: str) -> str:
    """Registra un nuevo lead en el sistema CRM (GoHighLevel)."""
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

ACADEMIAS = {
    "armonia": {
        "nombre": "Academia de Musica Armonia",
        "ciudad": "Cuenca",
        "horarios": "Lunes a Viernes 9am-7pm, Sabados 9am-1pm",
        "clases": {
            "Piano": {"precio": 60, "profesor": "Maria Lopez", "dias": "Lun, Mie, Vie"},
            "Guitarra": {"precio": 50, "profesor": "Carlos Ruiz", "dias": "Mar, Jue, Sab"},
            "Violin": {"precio": 70, "profesor": "Ana Torres", "dias": "Lun, Mie, Vie"},
            "Canto": {"precio": 45, "profesor": "Laura Mendez", "dias": "Mar, Jue"},
        },
        "ubicacion": "Av. Principal 123, Cuenca",
    },
    "melodia": {
        "nombre": "Escuela Melodia Musical",
        "ciudad": "Guayaquil",
        "horarios": "Lunes a Sabado 10am-8pm",
        "clases": {
            "Piano": {"precio": 55, "profesor": "Pedro Sanchez", "dias": "Lun a Vie"},
            "Bateria": {"precio": 65, "profesor": "Miguel Ortiz", "dias": "Mar, Jue, Sab"},
            "Canto": {"precio": 40, "profesor": "Sofia Reyes", "dias": "Lun, Mie, Vie"},
        },
        "ubicacion": "Calle 5 de Junio 456, Guayaquil",
    },
    "ritmo": {
        "nombre": "Centro Musical Ritmo Latino",
        "ciudad": "Quito",
        "horarios": "Lunes a Viernes 8am-6pm",
        "clases": {
            "Guitarra": {"precio": 45, "profesor": "Andres Villalba", "dias": "Lun, Mie, Vie"},
            "Saxofon": {"precio": 80, "profesor": "Roberto Diaz", "dias": "Mar, Jue"},
            "Piano": {"precio": 65, "profesor": "Carmen Flores", "dias": "Lun a Sab"},
        },
        "ubicacion": "Av. Amazonas 789, Quito",
    },
}

def crear_agente_academia(academia_id: str):
    ac = ACADEMIAS[academia_id]

    @tool
    def consultar_clases(instrumento: str) -> str:
        """Consulta clases disponibles. Usa 'todas' para ver todo el catalogo."""
        if instrumento.lower() != "todas":
            for nombre, info in ac["clases"].items():
                if instrumento.lower() in nombre.lower():
                    return f"{nombre}: ${info['precio']}/mes, Prof. {info['profesor']}, Dias: {info['dias']}. Clase de prueba GRATIS."
            return f"No ofrecemos {instrumento} en {ac['nombre']}."
        resultado = f"Clases en {ac['nombre']}:\n"
        for nombre, info in ac["clases"].items():
            resultado += f"- {nombre}: ${info['precio']}/mes, Prof. {info['profesor']} ({info['dias']})\n"
        return resultado + "Clase de prueba GRATIS."

    @tool
    def agendar_prueba(nombre_alumno: str, instrumento: str, dia: str, telefono: str) -> str:
        """Agenda clase de prueba gratuita."""
        for nc, info in ac["clases"].items():
            if instrumento.lower() in nc.lower():
                return f"[CRM] Lead: {nombre_alumno} | Tel: {telefono} | [Calendar] {nc} con {info['profesor']} el {dia} | [WhatsApp] Confirmacion enviada | Ubicacion: {ac['ubicacion']}"
        return f"No encontre {instrumento} en {ac['nombre']}."

    @tool
    def escalar_humano(motivo: str) -> str:
        """Escala a un asesor humano."""
        return f"[ESCALAMIENTO] Academia: {ac['nombre']} | Motivo: {motivo} | Notificacion enviada al equipo Presto"

    llm = ChatGroq(model=MODELO_AGENTE, temperature=0.4)
    return create_react_agent(
        llm,
        [consultar_clases, agendar_prueba, escalar_humano],
        prompt=f"Eres asistente de {ac['nombre']} en {ac['ciudad']}. Responde en español, calido y profesional. Usa herramientas para info real. Ofrece clase de prueba GRATIS.",
    )

# Cache de agentes por academia
agentes_cache = {}

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
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

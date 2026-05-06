"""
Feature 8 - Comparador A/B de prompts.

Ejecuta el mismo input contra dos versiones del prompt (A y B),
compara las respuestas y usa un LLM-as-a-judge para determinar
cual version performa mejor segun criterios de negocio.

Util para optimizar prompts antes de meterlos a produccion en GHL.
"""
import json
import time
import asyncio
from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel, Field

from langchain_groq import ChatGroq
from config import MODELO_CHAT, MODELO_AGENTE
from api.metricas_store import metricas


router = APIRouter(prefix="/api/ab-test", tags=["ab-test"])


class PromptVariante(BaseModel):
    nombre: str
    system: str
    descripcion: str | None = None


class ABTestRequest(BaseModel):
    prompt_a: PromptVariante
    prompt_b: PromptVariante
    mensaje_usuario: str
    criterios_evaluacion: list[str] = Field(
        default=[
            "Calidez y profesionalismo",
            "Probabilidad de generar conversion",
            "Claridad de la informacion",
            "Llamado a la accion claro",
        ]
    )


class TestSimpleRequest(BaseModel):
    """Variante simplificada: dos prompts y un mensaje."""
    prompt_a: str
    prompt_b: str
    mensaje: str


PROMPT_JUEZ = """Eres un evaluador imparcial de prompts para asistentes comerciales.
Recibes dos respuestas (A y B) generadas con prompts distintos al mismo mensaje del lead.
Evaluas segun los criterios provistos y eliges un ganador.

Devuelve SOLO un JSON con esta estructura:
{
  "ganador": "A" | "B" | "empate",
  "puntaje_a": <int 0-10>,
  "puntaje_b": <int 0-10>,
  "razon": "<2-3 frases explicando por que>",
  "evaluacion_por_criterio": [
    {"criterio": "<nombre>", "ganador": "A"|"B"|"empate", "comentario": "<corto>"}
  ],
  "recomendacion": "<que prompt usar y por que>"
}

NO uses markdown fences ni texto fuera del JSON.
"""


def _extraer_json(texto: str) -> dict:
    texto = texto.strip()
    if texto.startswith("```"):
        texto = texto.split("```")[1]
        if texto.startswith("json"):
            texto = texto[4:]
    inicio = texto.find("{")
    fin = texto.rfind("}")
    if inicio == -1 or fin == -1:
        raise ValueError("Sin JSON")
    return json.loads(texto[inicio:fin + 1])


def _ejecutar_variante(system: str, mensaje: str) -> tuple[str, float]:
    inicio = time.time()
    llm = ChatGroq(model=MODELO_CHAT, temperature=0.7)
    respuesta = llm.invoke([
        {"role": "system", "content": system},
        {"role": "user", "content": mensaje},
    ])
    return respuesta.content, round(time.time() - inicio, 2)


@router.post("")
def comparar_prompts(req: ABTestRequest):
    inicio = time.time()

    respuesta_a, tiempo_a = _ejecutar_variante(req.prompt_a.system, req.mensaje_usuario)
    respuesta_b, tiempo_b = _ejecutar_variante(req.prompt_b.system, req.mensaje_usuario)

    user_juez = (
        f"MENSAJE DEL LEAD:\n{req.mensaje_usuario}\n\n"
        f"--- RESPUESTA A ({req.prompt_a.nombre}) ---\n{respuesta_a}\n\n"
        f"--- RESPUESTA B ({req.prompt_b.nombre}) ---\n{respuesta_b}\n\n"
        f"CRITERIOS DE EVALUACION:\n" + "\n".join(f"- {c}" for c in req.criterios_evaluacion) +
        "\n\nEvalua y devuelve el JSON."
    )

    juez = ChatGroq(model=MODELO_AGENTE, temperature=0.2)
    veredicto_raw = juez.invoke([
        {"role": "system", "content": PROMPT_JUEZ},
        {"role": "user", "content": user_juez},
    ])

    try:
        veredicto = _extraer_json(veredicto_raw.content)
    except Exception as e:
        return {"error": f"No parseo veredicto: {e}", "raw": veredicto_raw.content[:300]}

    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("ab_test", duracion)
    metricas.registrar_evento("ab_test_ejecutado", {"ganador": veredicto.get("ganador")})

    return {
        "variante_a": {
            "nombre": req.prompt_a.nombre,
            "respuesta": respuesta_a,
            "tiempo_segundos": tiempo_a,
            "puntaje": veredicto.get("puntaje_a"),
            "tokens_aprox": len(respuesta_a.split()),
        },
        "variante_b": {
            "nombre": req.prompt_b.nombre,
            "respuesta": respuesta_b,
            "tiempo_segundos": tiempo_b,
            "puntaje": veredicto.get("puntaje_b"),
            "tokens_aprox": len(respuesta_b.split()),
        },
        "veredicto": veredicto,
        "tiempo_total_segundos": duracion,
        "modelo_juez": MODELO_AGENTE,
    }


@router.post("/simple")
def comparar_simple(req: TestSimpleRequest):
    """Version simplificada con 2 strings de prompt y un mensaje."""
    return comparar_prompts(ABTestRequest(
        prompt_a=PromptVariante(nombre="Variante A", system=req.prompt_a),
        prompt_b=PromptVariante(nombre="Variante B", system=req.prompt_b),
        mensaje_usuario=req.mensaje,
    ))


@router.get("/ejemplo")
def ejemplo_ab():
    return {
        "prompt_a": {
            "nombre": "Formal",
            "system": "Eres asistente de una academia de musica. Responde de manera formal y profesional, en español.",
        },
        "prompt_b": {
            "nombre": "Casual con CTA fuerte",
            "system": "Eres asistente cool de una academia. Responde casual, breve, y SIEMPRE termina invitando a una clase de prueba GRATIS. Usa emojis con moderacion.",
        },
        "mensaje_usuario": "Hola, queria saber sobre las clases de piano",
    }

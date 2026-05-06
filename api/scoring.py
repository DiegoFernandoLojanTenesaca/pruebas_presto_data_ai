"""
Feature 2 - Lead Scoring con LLM (LLM-as-a-judge).

Recibe una conversacion entre lead y asistente, y clasifica:
- Categoria: frio | tibio | caliente
- Score numerico: 0-100
- Justificacion: razonamiento del LLM
- Acciones recomendadas: que hacer con este lead

Util para que el equipo comercial priorice leads automaticamente.
"""
import json
import time
from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel, Field

from langchain_groq import ChatGroq
from config import MODELO_AGENTE
from api.metricas_store import metricas


router = APIRouter(prefix="/api/scoring", tags=["lead-scoring"])


class Mensaje(BaseModel):
    rol: Literal["lead", "asistente"]
    texto: str


class ScoringRequest(BaseModel):
    conversacion: list[Mensaje] = Field(..., min_length=1)
    academia_id: str | None = None
    contexto_extra: str | None = None


class ScoringResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    categoria: Literal["frio", "tibio", "caliente"]
    justificacion: str
    senales_positivas: list[str]
    senales_negativas: list[str]
    siguiente_accion: str
    confianza: float = Field(..., ge=0, le=1)


PROMPT_SCORING = """Eres un experto en ventas y calificacion de leads para academias de musica.
Analiza la conversacion entre un lead y el asistente, y devuelve un JSON con la calificacion del lead.

CRITERIOS:
- caliente (75-100): muestra intencion clara de comprar/agendar, da datos personales (nombre, telefono), pregunta precios concretos, propone fechas
- tibio (40-74): interes evidente pero sin compromiso, pregunta general, comparando opciones
- frio (0-39): solo curiosidad, preguntas vagas, sin datos personales, posible spam

Responde SOLO con un JSON valido en este formato exacto:
{
  "score": <int 0-100>,
  "categoria": "frio" | "tibio" | "caliente",
  "justificacion": "<2-3 frases explicando por que este score>",
  "senales_positivas": ["<senal 1>", "<senal 2>"],
  "senales_negativas": ["<senal 1>"],
  "siguiente_accion": "<accion concreta que debe tomar el equipo>",
  "confianza": <float 0-1, que tan seguro estas del scoring>
}

NO incluyas texto fuera del JSON. NO uses markdown code fences.
"""


def _formatear_conversacion(mensajes: list[Mensaje]) -> str:
    return "\n".join(f"[{m.rol.upper()}] {m.texto}" for m in mensajes)


def _extraer_json(texto: str) -> dict:
    """Extrae JSON de la respuesta del LLM, tolerando markdown fences."""
    texto = texto.strip()
    if texto.startswith("```"):
        texto = texto.split("```")[1]
        if texto.startswith("json"):
            texto = texto[4:]
    inicio = texto.find("{")
    fin = texto.rfind("}")
    if inicio == -1 or fin == -1:
        raise ValueError(f"No hay JSON en la respuesta: {texto[:200]}")
    return json.loads(texto[inicio:fin + 1])


@router.post("", response_model=ScoringResponse)
def evaluar_lead(req: ScoringRequest):
    inicio = time.time()

    contexto = ""
    if req.academia_id:
        contexto += f"Academia: {req.academia_id}\n"
    if req.contexto_extra:
        contexto += f"Contexto: {req.contexto_extra}\n"

    user_prompt = (
        f"{contexto}\n"
        f"CONVERSACION:\n{_formatear_conversacion(req.conversacion)}\n\n"
        "Devuelve el JSON de scoring."
    )

    llm = ChatGroq(model=MODELO_AGENTE, temperature=0.2)
    respuesta = llm.invoke([
        {"role": "system", "content": PROMPT_SCORING},
        {"role": "user", "content": user_prompt},
    ])

    try:
        data = _extraer_json(respuesta.content)
    except Exception as e:
        return {
            "error": f"No se pudo parsear respuesta del LLM: {e}",
            "respuesta_raw": respuesta.content[:500],
        }

    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("lead_scoring", duracion)
    metricas.registrar_score(data["score"], data["categoria"], req.academia_id)
    metricas.registrar_evento("lead_scored", {
        "score": data["score"],
        "categoria": data["categoria"],
        "academia_id": req.academia_id,
    })

    return data


@router.get("/ejemplos")
def ejemplos_scoring():
    """Ejemplos de conversaciones para probar el scoring."""
    return {
        "caliente": {
            "conversacion": [
                {"rol": "lead", "texto": "Hola, quiero clases de piano para mi hijo de 8 anos"},
                {"rol": "asistente", "texto": "Que bueno! Tenemos clases de piano. Cuando podrias venir a una clase de prueba?"},
                {"rol": "lead", "texto": "Este sabado, mi nombre es Maria Perez y mi telefono es 0987654321"},
            ],
        },
        "tibio": {
            "conversacion": [
                {"rol": "lead", "texto": "Hola, dan clases de guitarra?"},
                {"rol": "asistente", "texto": "Si! $50/mes. Te interesa una prueba gratis?"},
                {"rol": "lead", "texto": "Voy a pensarlo. Tienen tambien bateria?"},
            ],
        },
        "frio": {
            "conversacion": [
                {"rol": "lead", "texto": "Que es esto?"},
                {"rol": "asistente", "texto": "Somos una academia de musica. Te interesa alguna clase?"},
                {"rol": "lead", "texto": "No se, solo vi el anuncio"},
            ],
        },
    }

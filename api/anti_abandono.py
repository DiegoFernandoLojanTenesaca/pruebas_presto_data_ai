"""
Feature ANTI-ABANDONO (engagement booster).

Caso de uso real de Presto: el lead muestra interes, pero por cualquier
razon se va a ir sin comprar. Detectamos señales de abandono y proponemos
un mensaje "salvavidas" personalizado para reengancharlo.

Patron: LLM-as-a-judge analiza la conversacion + contexto y devuelve:
- probabilidad de abandono (0-100)
- señales detectadas
- estrategia recomendada (incentivo, urgencia, prueba social, consulta)
- mensaje exacto a enviar (en el tono de la academia)
- momento optimo de envio (ahora / en 30min / en 24h)

Esto se conecta a un workflow de GHL: si prob_abandono > 60, se dispara
automaticamente el mensaje propuesto via WhatsApp.
"""
import json
import time
from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel, Field

from langchain_groq import ChatGroq
from config import MODELO_AGENTE
from api.academias import ACADEMIAS
from api.metricas_store import metricas


router = APIRouter(prefix="/api/anti-abandono", tags=["anti-abandono"])


class Mensaje(BaseModel):
    rol: Literal["lead", "asistente"]
    texto: str


class AntiAbandonoRequest(BaseModel):
    conversacion: list[Mensaje] = Field(..., min_length=1)
    academia_id: str = "armonia"
    minutos_sin_responder: int | None = None
    nombre_lead: str | None = None


ESTRATEGIAS = ["incentivo", "urgencia", "prueba_social", "consulta_personalizada", "ninguna"]
MOMENTOS = ["ahora", "en_30min", "en_2h", "en_24h"]


PROMPT = """Eres un experto en growth marketing y retencion de leads para academias de musica.
Analiza la conversacion entre un lead y el asistente, y detecta si el lead va a abandonar
sin convertir. Si detectas riesgo, propon un mensaje "salvavidas" personalizado.

DETECCION DE ABANDONO (señales tipicas):
- "Lo voy a pensar" / "te aviso" / "luego veo"
- Compara con otros / "vi otra opcion mas barata"
- Objeciones de precio sin contraoferta
- Dejo de responder despues de mostrar interes
- Pregunta y desaparece sin dar datos

ESTRATEGIAS DISPONIBLES:
- incentivo: descuento limitado, beneficio extra
- urgencia: cupos limitados, fecha tope
- prueba_social: testimonios, otros estudiantes felices
- consulta_personalizada: ofrecer charla 1-1 con asesor humano
- ninguna: el lead no requiere intervencion (caliente o realmente perdido)

Devuelve SOLO un JSON con esta estructura EXACTA:
{
  "probabilidad_abandono": <int 0-100>,
  "nivel_riesgo": "bajo" | "medio" | "alto" | "critico",
  "senales_detectadas": ["<senal 1>", "<senal 2>"],
  "estrategia_recomendada": una de [incentivo, urgencia, prueba_social, consulta_personalizada, ninguna],
  "razonamiento": "<2-3 frases explicando por que esta estrategia>",
  "mensaje_propuesto": "<el mensaje exacto a enviar al lead, calido y en español>",
  "momento_optimo": "ahora" | "en_30min" | "en_2h" | "en_24h",
  "tags_a_aplicar": ["<tag 1>", "<tag 2>"],
  "escalar_a_humano": <bool>
}

NO uses markdown fences. Solo el JSON.
"""


def _formato_conv(msgs: list[Mensaje]) -> str:
    return "\n".join(f"[{m.rol.upper()}] {m.texto}" for m in msgs)


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


@router.post("")
def detectar_abandono(req: AntiAbandonoRequest):
    inicio = time.time()

    if req.academia_id not in ACADEMIAS:
        return {"error": f"Academia {req.academia_id} no existe"}

    ac = ACADEMIAS[req.academia_id]
    contexto = (
        f"Academia: {ac['nombre']} en {ac['ciudad']}.\n"
        f"Catalogo: {', '.join(list(ac['clases'].keys()))}.\n"
        f"Precios desde ${min(c['precio'] for c in ac['clases'].values())}/mes.\n"
    )
    if req.nombre_lead:
        contexto += f"Nombre del lead: {req.nombre_lead}.\n"
    if req.minutos_sin_responder is not None:
        contexto += f"Lead lleva {req.minutos_sin_responder} minutos sin responder.\n"

    user_input = (
        f"{contexto}\n"
        f"CONVERSACION:\n{_formato_conv(req.conversacion)}\n\n"
        "Analiza y devuelve el JSON con estrategia anti-abandono."
    )

    llm = ChatGroq(model=MODELO_AGENTE, temperature=0.4)
    respuesta = llm.invoke([
        {"role": "system", "content": PROMPT},
        {"role": "user", "content": user_input},
    ])

    try:
        data = _extraer_json(respuesta.content)
    except Exception as e:
        return {"error": f"No parseo: {e}", "raw": respuesta.content[:300]}

    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("anti_abandono", duracion)
    metricas.registrar_evento("anti_abandono", {
        "probabilidad": data.get("probabilidad_abandono"),
        "nivel": data.get("nivel_riesgo"),
        "estrategia": data.get("estrategia_recomendada"),
        "academia_id": req.academia_id,
    })

    data["academia_id"] = req.academia_id
    data["tiempo_segundos"] = duracion
    return data


@router.get("/ejemplos")
def ejemplos_anti_abandono():
    """Casos comunes para probar el feature."""
    return {
        "caso_1_va_pensarlo": {
            "descripcion": "Lead muestra interes y luego dice 'lo voy a pensar'",
            "conversacion": [
                {"rol": "lead", "texto": "Hola, dan clases de piano?"},
                {"rol": "asistente", "texto": "Si! $60/mes con clase de prueba GRATIS. Te interesa?"},
                {"rol": "lead", "texto": "Mmm, voy a pensarlo y te aviso"},
            ],
        },
        "caso_2_compara_precios": {
            "descripcion": "Lead esta comparando con la competencia",
            "conversacion": [
                {"rol": "lead", "texto": "Cuanto cuesta guitarra?"},
                {"rol": "asistente", "texto": "$50/mes, 3 dias por semana"},
                {"rol": "lead", "texto": "Vi una academia que cobra $35, voy a ver alli"},
            ],
        },
        "caso_3_silencio_largo": {
            "descripcion": "Lead pidio info y desaparecio",
            "conversacion": [
                {"rol": "lead", "texto": "Hola quiero info de canto"},
                {"rol": "asistente", "texto": "Hola! Tenemos clases de canto $45/mes con Laura Mendez. Cual es tu nombre?"},
            ],
            "minutos_sin_responder": 90,
        },
        "caso_4_objecion_precio": {
            "descripcion": "Lead dice que esta caro",
            "conversacion": [
                {"rol": "lead", "texto": "Cuanto piano?"},
                {"rol": "asistente", "texto": "$60 mensuales con prueba gratis"},
                {"rol": "lead", "texto": "Uy esta carito, no se"},
            ],
        },
        "caso_5_lead_caliente": {
            "descripcion": "Lead listo para comprar (no requiere intervencion)",
            "conversacion": [
                {"rol": "lead", "texto": "Quiero piano para mi hijo, soy Maria, 0987654321"},
                {"rol": "asistente", "texto": "Genial Maria! Te agendo prueba este sabado?"},
                {"rol": "lead", "texto": "Si, perfecto"},
            ],
        },
    }


@router.get("/info")
def info():
    return {
        "feature": "Anti-abandono / Engagement booster",
        "estrategias": ESTRATEGIAS,
        "momentos": MOMENTOS,
        "uso": "Detecta riesgo de abandono y propone mensaje salvavidas personalizado",
        "integracion": "Webhook GHL → si prob_abandono > 60 → enviar mensaje_propuesto via WhatsApp",
        "modelo": MODELO_AGENTE,
    }

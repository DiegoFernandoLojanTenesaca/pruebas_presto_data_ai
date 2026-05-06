"""
Feature 4 - Analisis de sentimiento + intencion (zero-shot con LLM).

Clasifica un mensaje de un lead segun:
- Intencion: interes_alto | objecion | consulta | spam | reclamo | otro
- Sentimiento: positivo | neutro | negativo
- Urgencia: alta | media | baja
- Idioma detectado

Sin entrenamiento previo: usamos el LLM como clasificador zero-shot.
Es exactamente lo que hace el clasificador de Sudial AI en produccion.
"""
import json
import time
from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel

from langchain_groq import ChatGroq
from config import MODELO_AGENTE
from api.metricas_store import metricas


router = APIRouter(prefix="/api/clasificar", tags=["clasificacion"])


INTENCIONES = ["interes_alto", "objecion", "consulta", "spam", "reclamo", "otro"]
SENTIMIENTOS = ["positivo", "neutro", "negativo"]
URGENCIAS = ["alta", "media", "baja"]


class ClasificarRequest(BaseModel):
    texto: str
    incluir_explicacion: bool = True


class ClasificarBatchRequest(BaseModel):
    textos: list[str]


class ClasificacionResultado(BaseModel):
    texto: str
    intencion: Literal["interes_alto", "objecion", "consulta", "spam", "reclamo", "otro"]
    sentimiento: Literal["positivo", "neutro", "negativo"]
    urgencia: Literal["alta", "media", "baja"]
    idioma: str
    confianza: float
    explicacion: str | None = None
    keywords: list[str] = []


PROMPT = f"""Eres un clasificador zero-shot de mensajes de leads de academias de musica.
Para CADA mensaje devuelve un JSON con esta estructura EXACTA:

{{
  "intencion": uno de {INTENCIONES},
  "sentimiento": uno de {SENTIMIENTOS},
  "urgencia": uno de {URGENCIAS},
  "idioma": codigo iso ("es", "en", "pt", etc),
  "confianza": float entre 0 y 1,
  "keywords": [hasta 5 palabras clave del mensaje],
  "explicacion": frase corta justificando la clasificacion
}}

DEFINICIONES:
- interes_alto: pregunta concreta sobre precios, fechas, da datos personales, quiere agendar
- objecion: dice que es caro, esta dudando, comparando con otros
- consulta: pregunta general sin compromiso
- spam: irrelevante, automatico, ofertas externas
- reclamo: queja sobre servicio o experiencia previa
- otro: no encaja en las anteriores

Responde SOLO el JSON. NO uses markdown fences ni texto adicional.
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
        raise ValueError("Sin JSON en respuesta")
    return json.loads(texto[inicio:fin + 1])


def _clasificar_uno(texto: str, incluir_explicacion: bool = True) -> dict:
    llm = ChatGroq(model=MODELO_AGENTE, temperature=0.1)
    respuesta = llm.invoke([
        {"role": "system", "content": PROMPT},
        {"role": "user", "content": texto},
    ])
    data = _extraer_json(respuesta.content)
    if not incluir_explicacion:
        data.pop("explicacion", None)
    data["texto"] = texto
    return data


@router.post("")
def clasificar_mensaje(req: ClasificarRequest):
    inicio = time.time()
    try:
        resultado = _clasificar_uno(req.texto, req.incluir_explicacion)
    except Exception as e:
        return {"error": str(e), "texto": req.texto}

    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("clasificar", duracion)
    metricas.registrar_evento("mensaje_clasificado", {
        "intencion": resultado.get("intencion"),
        "sentimiento": resultado.get("sentimiento"),
    })

    resultado["tiempo_segundos"] = duracion
    return resultado


@router.post("/batch")
def clasificar_batch(req: ClasificarBatchRequest):
    """Clasifica varios textos. Util para bulk de leads del dia."""
    inicio = time.time()

    resultados = []
    errores = []
    for t in req.textos[:50]:
        try:
            resultados.append(_clasificar_uno(t, incluir_explicacion=False))
        except Exception as e:
            errores.append({"texto": t, "error": str(e)})

    intenciones = {}
    sentimientos = {}
    for r in resultados:
        intenciones[r["intencion"]] = intenciones.get(r["intencion"], 0) + 1
        sentimientos[r["sentimiento"]] = sentimientos.get(r["sentimiento"], 0) + 1

    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("clasificar_batch", duracion)
    metricas.registrar_evento("batch_clasificado", {"total": len(resultados)})

    return {
        "total_procesados": len(resultados),
        "errores": errores,
        "resultados": resultados,
        "agregados": {
            "intenciones": intenciones,
            "sentimientos": sentimientos,
        },
        "tiempo_segundos": duracion,
    }


@router.get("/categorias")
def listar_categorias():
    return {
        "intenciones": INTENCIONES,
        "sentimientos": SENTIMIENTOS,
        "urgencias": URGENCIAS,
        "metodo": "Zero-shot con LLM (sin entrenamiento previo)",
        "modelo": MODELO_AGENTE,
    }

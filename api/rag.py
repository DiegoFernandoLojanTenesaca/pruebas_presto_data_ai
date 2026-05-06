"""
Feature 3 - RAG (Retrieval-Augmented Generation) sobre catalogo de academias.

Indexamos los datos de las 3 academias y permitimos busqueda semantica.
Stack:
- Retrieval: BM25 (rank_bm25) — algoritmo clasico de IR, lightweight
- Generation: LLM via Groq con contexto recuperado

En produccion esto se reemplaza con pgvector + BGE-M3 embeddings,
pero para el demo BM25 demuestra el patron RAG sin dependencias pesadas
(sentence-transformers o pytorch).
"""
import time
import re
from fastapi import APIRouter
from pydantic import BaseModel
from rank_bm25 import BM25Okapi
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

from config import MODELO_CHAT
from api.academias import ACADEMIAS
from api.metricas_store import metricas


router = APIRouter(prefix="/api/rag", tags=["rag"])


def _tokenizar(texto: str) -> list[str]:
    """Tokenizador simple: minusculas, separar por palabras, filtrar stopwords basicas."""
    stopwords = {"de", "la", "el", "en", "y", "o", "a", "un", "una", "los", "las", "que", "para", "por", "con", "del", "al"}
    tokens = re.findall(r"\b\w+\b", texto.lower())
    return [t for t in tokens if t not in stopwords and len(t) > 1]


def _construir_corpus() -> tuple[list[dict], BM25Okapi]:
    """Genera documentos a partir de las academias y construye el indice BM25."""
    documentos = []
    for academia_id, ac in ACADEMIAS.items():
        documentos.append({
            "id": f"{academia_id}_info",
            "academia_id": academia_id,
            "tipo": "info_general",
            "texto": (
                f"Academia: {ac['nombre']} ubicada en {ac['ciudad']}. "
                f"Direccion: {ac['ubicacion']}. "
                f"Horarios: {ac['horarios']}."
            ),
        })
        for clase, info in ac["clases"].items():
            documentos.append({
                "id": f"{academia_id}_clase_{clase.lower()}",
                "academia_id": academia_id,
                "tipo": "clase",
                "texto": (
                    f"En {ac['nombre']} ({ac['ciudad']}) ofrecemos clases de {clase} "
                    f"con el profesor {info['profesor']}. "
                    f"Precio: ${info['precio']} mensuales. "
                    f"Dias: {info['dias']}. "
                    f"Incluye clase de prueba GRATIS."
                ),
            })

    corpus_tokens = [_tokenizar(d["texto"]) for d in documentos]
    indice = BM25Okapi(corpus_tokens)
    return documentos, indice


# Indice global, se construye una sola vez al cargar el modulo.
DOCUMENTOS, BM25_INDEX = _construir_corpus()


class BuscarRequest(BaseModel):
    consulta: str
    top_k: int = 3
    academia_id: str | None = None


class RAGRequest(BaseModel):
    pregunta: str
    top_k: int = 3
    academia_id: str | None = None


@router.post("/buscar")
def buscar_semantico(req: BuscarRequest):
    """Solo retrieval: devuelve los top_k documentos mas relevantes."""
    inicio = time.time()
    tokens = _tokenizar(req.consulta)

    if not tokens:
        return {"resultados": [], "razon": "consulta vacia despues de tokenizar"}

    scores = BM25_INDEX.get_scores(tokens)

    indices_ordenados = sorted(
        range(len(scores)),
        key=lambda i: scores[i],
        reverse=True,
    )

    resultados = []
    for i in indices_ordenados:
        if scores[i] <= 0:
            continue
        doc = DOCUMENTOS[i]
        if req.academia_id and doc["academia_id"] != req.academia_id:
            continue
        resultados.append({
            "id": doc["id"],
            "academia_id": doc["academia_id"],
            "tipo": doc["tipo"],
            "texto": doc["texto"],
            "score": round(float(scores[i]), 3),
        })
        if len(resultados) >= req.top_k:
            break

    duracion = round(time.time() - inicio, 3)
    metricas.registrar_tiempo("rag_buscar", duracion)
    metricas.registrar_evento("rag_busqueda", {"consulta": req.consulta[:80], "hits": len(resultados)})

    return {
        "consulta": req.consulta,
        "tokens_usados": tokens,
        "resultados": resultados,
        "total_documentos_indice": len(DOCUMENTOS),
        "tiempo_segundos": duracion,
        "metodo": "BM25 (lightweight, en produccion: pgvector + BGE-M3)",
    }


@router.post("/responder")
def rag_responder(req: RAGRequest):
    """Retrieval + Generation: busca contexto y genera respuesta con LLM."""
    inicio = time.time()
    tokens = _tokenizar(req.pregunta)

    scores = BM25_INDEX.get_scores(tokens) if tokens else []
    indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)

    contexto_docs = []
    for i in indices:
        if scores[i] <= 0:
            continue
        doc = DOCUMENTOS[i]
        if req.academia_id and doc["academia_id"] != req.academia_id:
            continue
        contexto_docs.append(doc)
        if len(contexto_docs) >= req.top_k:
            break

    if not contexto_docs:
        return {
            "respuesta": "No tengo informacion relevante para responder esa pregunta. Te puedo escalar con un asesor humano.",
            "fuentes": [],
            "tiempo_segundos": round(time.time() - inicio, 2),
        }

    contexto_str = "\n".join(f"- {d['texto']}" for d in contexto_docs)

    system = (
        "Eres asistente de academias de musica. Responde basandote SOLO en el contexto provisto. "
        "Si la respuesta no esta en el contexto, di que no tienes esa info. "
        "Responde en español, breve (2-3 frases) y cordial."
    )
    user = f"CONTEXTO:\n{contexto_str}\n\nPREGUNTA: {req.pregunta}"

    llm = ChatGroq(model=MODELO_CHAT, temperature=0.3)
    respuesta = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content=user),
    ])

    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("rag_responder", duracion)
    metricas.registrar_evento("rag_respuesta", {"pregunta": req.pregunta[:80]})

    return {
        "pregunta": req.pregunta,
        "respuesta": respuesta.content,
        "fuentes": [
            {"id": d["id"], "texto": d["texto"], "academia": d["academia_id"]}
            for d in contexto_docs
        ],
        "tiempo_segundos": duracion,
        "modelo": MODELO_CHAT,
    }


@router.get("/indice")
def info_indice():
    """Inspecciona el indice. Util para debug y demo."""
    return {
        "total_documentos": len(DOCUMENTOS),
        "metodo": "BM25Okapi",
        "tokens_promedio_por_doc": round(
            sum(len(_tokenizar(d["texto"])) for d in DOCUMENTOS) / len(DOCUMENTOS), 1
        ),
        "documentos": [
            {"id": d["id"], "tipo": d["tipo"], "academia": d["academia_id"], "preview": d["texto"][:100]}
            for d in DOCUMENTOS
        ],
    }

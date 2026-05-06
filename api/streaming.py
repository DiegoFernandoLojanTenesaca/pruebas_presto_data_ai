"""
Feature 6 - Streaming SSE de respuestas del LLM.

En lugar de esperar la respuesta completa, enviamos tokens al frontend
conforme los genera el LLM. UX mucho mejor (efecto "ChatGPT escribiendo").

Server-Sent Events (SSE): protocolo simple, soportado por navegadores
sin libs adicionales (EventSource API).
"""
import json
import time
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_groq import ChatGroq

from config import MODELO_CHAT
from api.metricas_store import metricas


router = APIRouter(prefix="/api", tags=["streaming"])


class StreamRequest(BaseModel):
    mensaje: str
    system: str = "Eres un asistente util. Responde en español de forma concisa."


def _generar_eventos_sse(req: StreamRequest):
    """Generator que produce eventos SSE conforme llegan los tokens."""
    inicio = time.time()
    tokens_emitidos = 0

    yield f"data: {json.dumps({'tipo': 'inicio', 'modelo': MODELO_CHAT})}\n\n"

    llm = ChatGroq(model=MODELO_CHAT, temperature=0.7, streaming=True)
    try:
        for chunk in llm.stream([
            {"role": "system", "content": req.system},
            {"role": "user", "content": req.mensaje},
        ]):
            contenido = chunk.content
            if contenido:
                tokens_emitidos += 1
                yield f"data: {json.dumps({'tipo': 'token', 'texto': contenido})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'tipo': 'error', 'mensaje': str(e)})}\n\n"
        return

    duracion = round(time.time() - inicio, 2)
    metricas.registrar_tiempo("streaming", duracion)
    metricas.registrar_evento("stream_completado", {"tokens": tokens_emitidos})

    final = {
        "tipo": "fin",
        "tokens_emitidos": tokens_emitidos,
        "tiempo_segundos": duracion,
        "tokens_por_segundo": round(tokens_emitidos / duracion, 1) if duracion > 0 else 0,
    }
    yield f"data: {json.dumps(final)}\n\n"


@router.post("/01-chat-stream")
def chat_streaming(req: StreamRequest):
    """SSE endpoint. El frontend usa fetch o EventSource para consumir."""
    return StreamingResponse(
        _generar_eventos_sse(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

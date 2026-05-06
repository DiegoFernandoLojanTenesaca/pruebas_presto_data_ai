"""
Feature 7 - Transcripcion de audio con Whisper de Groq.

Whisper Large v3 corre en infraestructura de Groq (gratis con rate limits).
Caso de uso real: transcribir llamadas de ventas, audios de WhatsApp,
para luego analizar sentimiento, extraer datos, calificar leads, etc.

Tambien expone /api/transcribir/y-clasificar que combina:
audio -> texto -> clasificacion (intencion + sentimiento + scoring)
"""
import time
import requests
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from config import GROQ_API_KEY
from api.metricas_store import metricas


router = APIRouter(prefix="/api/transcribir", tags=["transcripcion"])


GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
MODELO_WHISPER = "whisper-large-v3-turbo"
EXTENSIONES_PERMITIDAS = {"mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg", "flac"}
MAX_BYTES = 25 * 1024 * 1024


def _llamar_whisper(file_bytes: bytes, filename: str, idioma: str | None = None) -> dict:
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    files = {"file": (filename, file_bytes)}
    data = {
        "model": MODELO_WHISPER,
        "response_format": "verbose_json",
        "temperature": "0",
    }
    if idioma:
        data["language"] = idioma

    r = requests.post(GROQ_TRANSCRIPTION_URL, headers=headers, files=files, data=data)
    if r.status_code != 200:
        raise HTTPException(
            status_code=r.status_code,
            detail=f"Error en Whisper: {r.text[:300]}",
        )
    return r.json()


@router.post("")
async def transcribir_audio(
    file: UploadFile = File(...),
    idioma: str | None = Form(default=None),
):
    """Transcribe audio. Idioma opcional ('es', 'en', etc) - sino auto-detecta."""
    inicio = time.time()

    if not file.filename:
        raise HTTPException(status_code=400, detail="filename requerido")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail=f"Extension '{ext}' no permitida. Soportadas: {sorted(EXTENSIONES_PERMITIDAS)}",
        )

    contenido = await file.read()
    if len(contenido) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Archivo > 25MB")

    resultado = _llamar_whisper(contenido, file.filename, idioma)
    duracion = round(time.time() - inicio, 2)

    metricas.registrar_tiempo("transcripcion", duracion)
    metricas.registrar_evento("audio_transcrito", {
        "duracion_audio": resultado.get("duration"),
        "idioma": resultado.get("language"),
    })

    return {
        "texto": resultado.get("text", ""),
        "idioma_detectado": resultado.get("language"),
        "duracion_audio_segundos": resultado.get("duration"),
        "tiempo_procesamiento_segundos": duracion,
        "modelo": MODELO_WHISPER,
        "size_archivo_kb": round(len(contenido) / 1024, 1),
    }


@router.post("/y-clasificar")
async def transcribir_y_clasificar(
    file: UploadFile = File(...),
    idioma: str | None = Form(default=None),
):
    """Pipeline completo: audio -> transcripcion -> clasificacion (intencion + sentimiento)."""
    from api.clasificacion import _clasificar_uno

    transcripcion = await transcribir_audio(file=file, idioma=idioma)
    texto = transcripcion["texto"]

    if not texto.strip():
        return {"error": "Transcripcion vacia", "transcripcion": transcripcion}

    inicio_clas = time.time()
    clasificacion = _clasificar_uno(texto, incluir_explicacion=True)
    tiempo_clas = round(time.time() - inicio_clas, 2)

    metricas.registrar_evento("audio_clasificado", {
        "intencion": clasificacion.get("intencion"),
    })

    return {
        "transcripcion": transcripcion,
        "clasificacion": clasificacion,
        "tiempo_clasificacion_segundos": tiempo_clas,
        "tiempo_total_segundos": round(transcripcion["tiempo_procesamiento_segundos"] + tiempo_clas, 2),
    }


@router.get("/info")
def info_transcripcion():
    return {
        "modelo": MODELO_WHISPER,
        "provider": "Groq",
        "extensiones_soportadas": sorted(EXTENSIONES_PERMITIDAS),
        "tamano_max_mb": 25,
        "endpoints": [
            "POST /api/transcribir — solo transcribe",
            "POST /api/transcribir/y-clasificar — transcribe + clasifica intencion/sentimiento",
        ],
    }

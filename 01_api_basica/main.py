"""
01 - Llamada basica a API de LLM (Groq)
Demuestra: conexion a API REST, envio de prompts, procesamiento de respuestas.
Modo interactivo: escribe tus propios prompts y ve las respuestas en tiempo real.
"""
import sys
import os
import json
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import GROQ_API_KEY, GROQ_URL, MODELO_CHAT, banner, separador


def llamar_groq(prompt: str, system: str = "Eres un asistente util. Responde en español.") -> str:
    """Llama a la API de Groq y retorna la respuesta."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODELO_CHAT,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 500,
    }

    response = requests.post(GROQ_URL, headers=headers, json=payload)

    if response.status_code != 200:
        return f"[Error {response.status_code}]: {response.text}"

    data = response.json()
    tokens = data.get("usage", {})
    print(f"  Modelo: {MODELO_CHAT} | Tokens: {tokens.get('total_tokens', '?')}")
    return data["choices"][0]["message"]["content"]


def modo_interactivo():
    """Chat libre: escribe lo que quieras y el LLM responde."""
    banner("MODO INTERACTIVO - API Basica")
    print("  Escribe cualquier pregunta. Escribe 'salir' para terminar.")
    print("  Escribe 'academia' para probar como asistente de academia.")
    separador()

    system = "Eres un asistente util. Responde en español de forma concisa."

    while True:
        try:
            prompt = input("\nTu: ").strip()
        except (KeyboardInterrupt, EOFError):
            break

        if not prompt:
            continue
        if prompt.lower() in ("salir", "exit", "q"):
            break
        if prompt.lower() == "academia":
            system = (
                "Eres el asistente virtual de la Academia de Musica Armonia en Cuenca. "
                "Clases: Piano ($60/mes), Guitarra ($50/mes), Violin ($70/mes), Canto ($45/mes). "
                "Horarios: Lun-Vie 9am-7pm, Sab 9am-1pm. Clase de prueba gratis. "
                "Responde de forma calida y profesional."
            )
            print("  [Modo academia activado - ahora responde como asistente de academia]")
            continue

        respuesta = llamar_groq(prompt, system)
        print(f"\nAsistente: {respuesta}")


def modo_demo():
    """Ejecuta ejemplos predefinidos para demostrar funcionalidad."""
    banner("MODO DEMO - Ejemplos de API")

    print("\n[Ejemplo 1] Pregunta simple:")
    separador()
    r = llamar_groq("Que es un agente de IA? Responde en 3 lineas.")
    print(f"Respuesta: {r}")

    print("\n[Ejemplo 2] Como asistente de academia de musica:")
    separador()
    system_academia = (
        "Eres el asistente virtual de la Academia de Musica Armonia. "
        "Clases: Piano ($60/mes, Lun-Mie-Vie), Guitarra ($50/mes, Mar-Jue-Sab). "
        "Clase de prueba gratis. Responde amigable y profesional."
    )
    r = llamar_groq(
        "Hola, me interesa aprender piano, tienen disponibilidad?",
        system_academia,
    )
    print(f"Respuesta: {r}")


if __name__ == "__main__":
    if not GROQ_API_KEY:
        print("Error: GROQ_API_KEY no encontrada. Revisa el archivo .env")
        sys.exit(1)

    banner("01 - LLAMADA BASICA A API (Groq)")
    print("  1. Modo interactivo (chat libre)")
    print("  2. Modo demo (ejemplos automaticos)")
    separador()

    opcion = input("Elige (1/2): ").strip()
    if opcion == "2":
        modo_demo()
    else:
        modo_interactivo()

    print("\nHecho!")

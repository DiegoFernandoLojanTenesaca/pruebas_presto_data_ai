"""
07 - Demo rapida: script limpio para compartir pantalla en entrevista.
Muestra en pocos segundos: API + Agente + Herramientas + Caso real.
"""
import sys
import os
import warnings

warnings.filterwarnings("ignore")
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import MODELO_AGENTE, banner, separador

from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent


@tool
def buscar_info(consulta: str) -> str:
    """Busca info de la academia: clases, precios, horarios."""
    info = {
        "Piano": "Prof. Maria Lopez, $60/mes, Lun-Mie-Vie",
        "Guitarra": "Prof. Carlos Ruiz, $50/mes, Mar-Jue-Sab",
        "Violin": "Prof. Ana Torres, $70/mes, Lun-Mie-Vie",
        "Canto": "Prof. Laura Mendez, $45/mes, Mar-Jue",
    }
    for inst, det in info.items():
        if inst.lower() in consulta.lower():
            return f"{inst}: {det}. Clase de prueba GRATIS."
    return "\n".join(f"- {k}: {v}" for k, v in info.items()) + "\nClase de prueba GRATIS."


@tool
def agendar_clase(nombre: str, instrumento: str, dia: str) -> str:
    """Agenda clase de prueba y registra en CRM."""
    print(f"  >> [CRM] Lead: {nombre} | Interes: {instrumento}")
    print(f"  >> [Calendar] Agendado: {dia}")
    print(f"  >> [WhatsApp] Confirmacion enviada")
    return f"Listo! {nombre}, clase de {instrumento} agendada para el {dia}. Av. Principal 123, Cuenca."


llm = ChatGroq(model=MODELO_AGENTE, temperature=0.4)
agente = create_react_agent(
    llm,
    [buscar_info, agendar_clase],
    prompt=(
        "Eres el asistente de la Academia de Musica Armonia en Cuenca. "
        "Responde en español, amigable. Ofrece clase de prueba gratis. "
        "Usa las herramientas para info real."
    ),
)


def chat(mensaje: str):
    resultado = agente.invoke({"messages": [HumanMessage(content=mensaje)]})
    for msg in resultado["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                print(f"  [Herramienta: {tc['name']}]")
    return resultado["messages"][-1].content


if __name__ == "__main__":
    banner("DEMO RAPIDA - Agente de Academia de Musica")
    print("  Escribe como si fueras un lead. 'salir' para terminar.")
    print("  Escribe 'demo' para ver un ejemplo automatico.")
    separador()

    while True:
        try:
            mensaje = input("\nLead: ").strip()
        except (KeyboardInterrupt, EOFError):
            break

        if not mensaje:
            continue
        if mensaje.lower() in ("salir", "exit", "q"):
            break
        if mensaje.lower() == "demo":
            print("\n[Demo automatica]")
            print("Lead: Hola! Quiero aprender guitarra, que opciones tienen?")
            separador()
            print(f"Asistente: {chat('Hola! Quiero aprender guitarra, que opciones tienen?')}")
            print()
            print("Lead: Soy Pedro, quiero agendar clase de prueba el jueves")
            separador()
            print(f"Asistente: {chat('Soy Pedro Martinez, quiero agendar clase de prueba de guitarra el jueves')}")
            continue

        respuesta = chat(mensaje)
        print(f"\nAsistente: {respuesta}")

    print("\nHecho!")

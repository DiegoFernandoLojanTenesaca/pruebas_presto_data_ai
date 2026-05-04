"""
02 - Agente de IA con herramientas (LangChain + Groq)
Demuestra: agente que decide que herramientas usar segun el mensaje del usuario.
Caso: Asistente de academia de musica con busqueda de info, agenda y CRM.
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


# --- HERRAMIENTAS ---

@tool
def buscar_info_academia(consulta: str) -> str:
    """Busca informacion de la academia: horarios, precios, clases, profesores."""
    base = {
        "Piano": {"precio": 60, "profesor": "Maria Lopez", "dias": "Lun, Mie, Vie"},
        "Guitarra": {"precio": 50, "profesor": "Carlos Ruiz", "dias": "Mar, Jue, Sab"},
        "Violin": {"precio": 70, "profesor": "Ana Torres", "dias": "Lun, Mie, Vie"},
        "Canto": {"precio": 45, "profesor": "Laura Mendez", "dias": "Mar, Jue"},
        "Bateria": {"precio": 55, "profesor": "Miguel Ortiz", "dias": "Lun, Sab"},
    }
    consulta_l = consulta.lower()
    for nombre, info in base.items():
        if nombre.lower() in consulta_l:
            return f"{nombre}: ${info['precio']}/mes, Prof. {info['profesor']}, Dias: {info['dias']}. Clase de prueba GRATIS."

    return "\n".join(f"- {k}: ${v['precio']}/mes, {v['profesor']} ({v['dias']})" for k, v in base.items()) + "\nClase de prueba GRATIS."


@tool
def agendar_clase_prueba(nombre: str, instrumento: str, dia: str) -> str:
    """Agenda una clase de prueba gratuita para un lead."""
    print(f"  >> [CRM] Lead registrado: {nombre} | Interes: {instrumento}")
    print(f"  >> [Calendar] Clase agendada: {dia}")
    print(f"  >> [WhatsApp] Confirmacion enviada")
    return f"Agendado! {nombre}, clase de {instrumento} el {dia}. Ubicacion: Av. Principal 123, Cuenca."


@tool
def registrar_lead(nombre: str, telefono: str, interes: str) -> str:
    """Registra un nuevo lead en el sistema CRM."""
    print(f"  >> [CRM] Nuevo lead: {nombre} | Tel: {telefono} | Interes: {interes}")
    return f"Lead registrado: {nombre}, telefono {telefono}, interesado en {interes}."


# --- AGENTE ---

llm = ChatGroq(model=MODELO_AGENTE, temperature=0.4)

agente = create_react_agent(
    llm,
    [buscar_info_academia, agendar_clase_prueba, registrar_lead],
    prompt=(
        "Eres el asistente virtual de la Academia de Musica Armonia en Cuenca, Ecuador. "
        "Responde en español. Se calido y profesional. "
        "Usa las herramientas para consultar info real. "
        "Si el lead muestra interes, ofrece clase de prueba GRATIS. "
        "Intenta obtener: nombre, telefono e instrumento de interes."
    ),
)


def enviar_mensaje(mensaje: str):
    """Envia un mensaje al agente y muestra respuesta con herramientas usadas."""
    resultado = agente.invoke({"messages": [HumanMessage(content=mensaje)]})

    for msg in resultado["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                print(f"  [Herramienta: {tc['name']}]")

    return resultado["messages"][-1].content


def modo_interactivo():
    """Chat con el agente: escribe como si fueras un lead."""
    banner("MODO INTERACTIVO - Agente de Academia")
    print("  Escribe como si fueras un lead interesado en clases de musica.")
    print("  El agente decidira que herramientas usar automaticamente.")
    print("  Escribe 'salir' para terminar.")
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

        respuesta = enviar_mensaje(mensaje)
        print(f"\nAsistente: {respuesta}")


def modo_demo():
    """Ejecuta casos de ejemplo."""
    banner("MODO DEMO - Agente con Herramientas")

    casos = [
        ("Lead pregunta por clases", "Hola! Me interesa aprender guitarra, que opciones tienen?"),
        ("Lead agenda clase", "Me llamo Juan Perez, quiero agendar clase de prueba de piano para el miercoles. Mi telefono es 0991234567."),
        ("Lead pregunta por todo", "Que instrumentos puedo aprender ahi? Quiero ver todas las opciones"),
    ]

    for titulo, mensaje in casos:
        print(f"\n[{titulo}]")
        print(f"Lead: {mensaje}")
        separador()
        respuesta = enviar_mensaje(mensaje)
        print(f"\nAsistente: {respuesta}")
        print()


if __name__ == "__main__":
    banner("02 - AGENTE DE IA CON HERRAMIENTAS")
    print("  1. Modo interactivo (tu eres el lead)")
    print("  2. Modo demo (casos automaticos)")
    separador()

    opcion = input("Elige (1/2): ").strip()
    if opcion == "2":
        modo_demo()
    else:
        modo_interactivo()

    print("\nHecho!")

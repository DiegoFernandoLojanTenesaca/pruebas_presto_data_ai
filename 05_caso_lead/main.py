"""
05 - Simulacion del caso Presto: Agente Multi-Tenant para Academias
Demuestra: flujo completo Lead -> Agente IA -> CRM -> Calendar -> WhatsApp
Con soporte multi-tenant (multiples academias, mismo sistema).
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


# --- BASE DE CONOCIMIENTO MULTI-TENANT ---

ACADEMIAS = {
    "1": {
        "id": "armonia",
        "nombre": "Academia de Musica Armonia",
        "ciudad": "Cuenca",
        "horarios": "Lunes a Viernes 9am-7pm, Sabados 9am-1pm",
        "clases": {
            "Piano": {"precio": 60, "profesor": "Maria Lopez", "dias": "Lun, Mie, Vie"},
            "Guitarra": {"precio": 50, "profesor": "Carlos Ruiz", "dias": "Mar, Jue, Sab"},
            "Violin": {"precio": 70, "profesor": "Ana Torres", "dias": "Lun, Mie, Vie"},
            "Canto": {"precio": 45, "profesor": "Laura Mendez", "dias": "Mar, Jue"},
        },
        "ubicacion": "Av. Principal 123, Cuenca",
    },
    "2": {
        "id": "melodia",
        "nombre": "Escuela Melodia Musical",
        "ciudad": "Guayaquil",
        "horarios": "Lunes a Sabado 10am-8pm",
        "clases": {
            "Piano": {"precio": 55, "profesor": "Pedro Sanchez", "dias": "Lun a Vie"},
            "Bateria": {"precio": 65, "profesor": "Miguel Ortiz", "dias": "Mar, Jue, Sab"},
            "Canto": {"precio": 40, "profesor": "Sofia Reyes", "dias": "Lun, Mie, Vie"},
        },
        "ubicacion": "Calle 5 de Junio 456, Guayaquil",
    },
    "3": {
        "id": "ritmo",
        "nombre": "Centro Musical Ritmo Latino",
        "ciudad": "Quito",
        "horarios": "Lunes a Viernes 8am-6pm",
        "clases": {
            "Guitarra": {"precio": 45, "profesor": "Andres Villalba", "dias": "Lun, Mie, Vie"},
            "Saxofon": {"precio": 80, "profesor": "Roberto Diaz", "dias": "Mar, Jue"},
            "Piano": {"precio": 65, "profesor": "Carmen Flores", "dias": "Lun a Sab"},
        },
        "ubicacion": "Av. Amazonas 789, Quito",
    },
}

# Academia seleccionada (simula el tenant activo)
academia_activa = None


def crear_herramientas(academia: dict):
    """Crea herramientas especificas para una academia."""

    @tool
    def consultar_clases(instrumento: str) -> str:
        """Consulta clases disponibles. Usa 'todas' para ver el catalogo completo."""
        if instrumento.lower() != "todas":
            for nombre, info in academia["clases"].items():
                if instrumento.lower() in nombre.lower():
                    return (
                        f"{nombre}: ${info['precio']}/mes, Prof. {info['profesor']}, "
                        f"Dias: {info['dias']}. Clase de prueba GRATIS (30 min)."
                    )
            return f"No ofrecemos clases de {instrumento} en {academia['nombre']}."

        resultado = f"Clases en {academia['nombre']}:\n"
        for nombre, info in academia["clases"].items():
            resultado += f"  - {nombre}: ${info['precio']}/mes, Prof. {info['profesor']} ({info['dias']})\n"
        resultado += "Clase de prueba GRATIS (30 min)."
        return resultado

    @tool
    def consultar_horarios() -> str:
        """Consulta horarios y ubicacion de la academia."""
        return f"{academia['nombre']} ({academia['ciudad']})\nHorarios: {academia['horarios']}\nUbicacion: {academia['ubicacion']}"

    @tool
    def agendar_clase_prueba(nombre_alumno: str, instrumento: str, dia: str, telefono: str) -> str:
        """Agenda una clase de prueba gratuita. Necesita nombre, instrumento, dia y telefono."""
        for nombre_clase, info in academia["clases"].items():
            if instrumento.lower() in nombre_clase.lower():
                print(f"\n  >> [CRM GoHighLevel] Lead: {nombre_alumno} | Tel: {telefono} | Interes: {nombre_clase}")
                print(f"  >> [Google Calendar] Clase: {dia} con Prof. {info['profesor']}")
                print(f"  >> [WhatsApp API] Confirmacion enviada a {telefono}")
                print(f"  >> [Pipeline] Estado: clase_prueba_agendada")
                return (
                    f"Agendado! {nombre_alumno}, clase de {nombre_clase} con Prof. {info['profesor']} "
                    f"el {dia}. Ubicacion: {academia['ubicacion']}. "
                    f"Recordatorio enviado por WhatsApp a {telefono}."
                )
        return f"No encontre clase de {instrumento} en {academia['nombre']}."

    @tool
    def escalar_a_humano(motivo: str) -> str:
        """Escala la conversacion a un asesor humano cuando no puedes resolver la consulta."""
        print(f"\n  >> [ESCALAMIENTO] Academia: {academia['nombre']} | Motivo: {motivo}")
        print(f"  >> [NOTIFICACION] Enviada al equipo de Presto")
        return f"He notificado a un asesor. Te contactaran pronto por WhatsApp."

    return [consultar_clases, consultar_horarios, agendar_clase_prueba, escalar_a_humano]


def crear_agente(academia: dict):
    """Crea un agente configurado para una academia especifica."""
    llm = ChatGroq(model=MODELO_AGENTE, temperature=0.4)
    herramientas = crear_herramientas(academia)

    system = (
        f"Eres el asistente virtual de {academia['nombre']} en {academia['ciudad']}. "
        f"Responde en español, calido y profesional. "
        f"Usa herramientas para info real, nunca inventes datos. "
        f"Si el lead muestra interes, ofrece clase de prueba GRATIS. "
        f"Intenta obtener: nombre, telefono e instrumento. "
        f"Si no puedes resolver algo, usa escalar_a_humano."
    )

    return create_react_agent(llm, herramientas, prompt=system)


def seleccionar_academia() -> dict:
    """Menu para seleccionar academia (simula multi-tenant)."""
    print("\n  Academias disponibles (clientes de Presto):\n")
    for key, ac in ACADEMIAS.items():
        clases = ", ".join(ac["clases"].keys())
        print(f"  {key}. {ac['nombre']} ({ac['ciudad']}) - {clases}")
    separador()

    while True:
        opcion = input("\n  Selecciona academia (1/2/3): ").strip()
        if opcion in ACADEMIAS:
            ac = ACADEMIAS[opcion]
            print(f"\n  >> Academia activa: {ac['nombre']} ({ac['ciudad']})")
            return ac
        print("  Opcion no valida.")


def modo_interactivo():
    """Chat como lead con la academia seleccionada."""
    banner("CASO PRESTO - Agente Multi-Tenant")
    academia = seleccionar_academia()
    agente = crear_agente(academia)

    print(f"\n  Ahora escribe como si fueras un lead de {academia['nombre']}.")
    print("  Escribe 'cambiar' para cambiar de academia, 'salir' para terminar.")
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
        if mensaje.lower() == "cambiar":
            academia = seleccionar_academia()
            agente = crear_agente(academia)
            print(f"  Ahora chateas con {academia['nombre']}.")
            continue

        resultado = agente.invoke({"messages": [HumanMessage(content=mensaje)]})
        for msg in resultado["messages"]:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    print(f"  [Herramienta: {tc['name']}]")
        print(f"\nAsistente: {resultado['messages'][-1].content}")


def modo_demo():
    """Demo automatica con las 3 academias."""
    banner("DEMO - Multi-Tenant (3 Academias)")

    casos = [
        ("1", "Hola! Que clases de musica tienen?"),
        ("2", "Me interesa la bateria, cuanto cuesta?"),
        ("3", "Soy Maria Paz, quiero clase de prueba de saxofon el viernes. Mi numero es 0995551234."),
    ]

    for ac_key, mensaje in casos:
        academia = ACADEMIAS[ac_key]
        agente = crear_agente(academia)

        print(f"\n[Academia: {academia['nombre']} - {academia['ciudad']}]")
        print(f"Lead: {mensaje}")
        separador()

        resultado = agente.invoke({"messages": [HumanMessage(content=mensaje)]})
        for msg in resultado["messages"]:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    print(f"  [Herramienta: {tc['name']}]")
        print(f"\nAsistente: {resultado['messages'][-1].content}")
        print()


if __name__ == "__main__":
    banner("05 - CASO PRESTO: AGENTE MULTI-TENANT")
    print("  1. Modo interactivo (elige academia y chatea como lead)")
    print("  2. Modo demo (prueba automatica con 3 academias)")
    separador()

    opcion = input("Elige (1/2): ").strip()
    if opcion == "2":
        modo_demo()
    else:
        modo_interactivo()

    print("\nHecho!")

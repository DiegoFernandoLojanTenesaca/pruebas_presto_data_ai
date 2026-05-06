"""
Datos y agentes por academia (multi-tenant).
Modulo compartido para evitar imports circulares.
"""
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent

from config import MODELO_AGENTE
from api.metricas_store import metricas


ACADEMIAS = {
    "armonia": {
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
    "melodia": {
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
    "ritmo": {
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


def crear_agente_academia(academia_id: str):
    """Crea un agente ReAct con herramientas especificas para una academia."""
    ac = ACADEMIAS[academia_id]

    @tool
    def consultar_clases(instrumento: str) -> str:
        """Consulta clases disponibles. Usa 'todas' para ver todo el catalogo."""
        metricas.registrar_tool("consultar_clases")
        if instrumento.lower() != "todas":
            for nombre, info in ac["clases"].items():
                if instrumento.lower() in nombre.lower():
                    return f"{nombre}: ${info['precio']}/mes, Prof. {info['profesor']}, Dias: {info['dias']}. Clase de prueba GRATIS."
            return f"No ofrecemos {instrumento} en {ac['nombre']}."
        resultado = f"Clases en {ac['nombre']}:\n"
        for nombre, info in ac["clases"].items():
            resultado += f"- {nombre}: ${info['precio']}/mes, Prof. {info['profesor']} ({info['dias']})\n"
        return resultado + "Clase de prueba GRATIS."

    @tool
    def agendar_prueba(nombre_alumno: str, instrumento: str, dia: str, telefono: str) -> str:
        """Agenda clase de prueba gratuita."""
        metricas.registrar_tool("agendar_prueba")
        for nc, info in ac["clases"].items():
            if instrumento.lower() in nc.lower():
                return f"[CRM] Lead: {nombre_alumno} | Tel: {telefono} | [Calendar] {nc} con {info['profesor']} el {dia} | [WhatsApp] Confirmacion enviada | Ubicacion: {ac['ubicacion']}"
        return f"No encontre {instrumento} en {ac['nombre']}."

    @tool
    def escalar_humano(motivo: str) -> str:
        """Escala a un asesor humano."""
        metricas.registrar_tool("escalar_humano")
        return f"[ESCALAMIENTO] Academia: {ac['nombre']} | Motivo: {motivo} | Notificacion enviada al equipo Presto"

    llm = ChatGroq(model=MODELO_AGENTE, temperature=0.4)
    return create_react_agent(
        llm,
        [consultar_clases, agendar_prueba, escalar_humano],
        prompt=f"Eres asistente de {ac['nombre']} en {ac['ciudad']}. Responde en español, calido y profesional. Usa herramientas para info real. Ofrece clase de prueba GRATIS.",
    )


# Cache de agentes por tenant. Lazy: se crea al primer uso.
agentes_cache: dict = {}

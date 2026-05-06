"""
Feature 1 - Webhook simulado de GoHighLevel.

GHL envia webhooks cuando hay eventos en el CRM (nuevo contacto,
mensaje entrante, cita agendada, etc.). Este endpoint simula recibir
esos webhooks y procesa el lead con el agente IA correspondiente.

Documentacion real: https://highlevel.stoplight.io/docs/integrations/
"""
import time
import hmac
import hashlib
from typing import Any
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from api.metricas_store import metricas


router = APIRouter(prefix="/api/webhook", tags=["webhook-ghl"])


# Mapeo locationId -> tenant interno.
# En produccion vendria de DB (tabla tenants).
LOCATION_TO_TENANT = {
    "loc_armonia_cuenca": "armonia",
    "loc_melodia_gye": "melodia",
    "loc_ritmo_uio": "ritmo",
}

# Secret compartido con GHL para validar webhooks.
# En produccion: variable de entorno por tenant.
WEBHOOK_SECRET = "presto_demo_secret_2026"


class GHLWebhookPayload(BaseModel):
    """Formato compatible con GoHighLevel webhooks."""
    type: str = Field(..., description="ContactCreate | InboundMessage | AppointmentBooked")
    locationId: str
    contactId: str | None = None
    firstName: str | None = None
    lastName: str | None = None
    phone: str | None = None
    email: str | None = None
    message: str | None = None
    channel: str | None = "WhatsApp"
    tags: list[str] = []
    source: str | None = None
    customFields: dict[str, Any] = {}


def verificar_firma(payload: bytes, firma_recibida: str | None) -> bool:
    """Valida HMAC-SHA256. GHL envia esto en header x-ghl-signature."""
    if not firma_recibida:
        return True
    esperada = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(esperada, firma_recibida)


@router.post("/ghl/lead")
def webhook_ghl_lead(
    payload: GHLWebhookPayload,
    x_ghl_signature: str | None = Header(default=None),
):
    """
    Endpoint principal del webhook.
    GHL envia POST cuando hay eventos. Procesamos segun el tipo.
    """
    inicio = time.time()

    tenant_id = LOCATION_TO_TENANT.get(payload.locationId)
    if not tenant_id:
        raise HTTPException(
            status_code=404,
            detail=f"locationId desconocido: {payload.locationId}",
        )

    metricas.registrar_evento("webhook_ghl", {
        "tipo_evento": payload.type,
        "tenant": tenant_id,
        "channel": payload.channel,
    })

    if payload.type == "ContactCreate":
        return _procesar_nuevo_contacto(payload, tenant_id, inicio)

    if payload.type == "InboundMessage":
        return _procesar_mensaje(payload, tenant_id, inicio)

    if payload.type == "AppointmentBooked":
        return _procesar_cita(payload, tenant_id, inicio)

    return {
        "status": "ignored",
        "razon": f"Tipo de evento no manejado: {payload.type}",
        "tenant": tenant_id,
    }


def _procesar_nuevo_contacto(payload: GHLWebhookPayload, tenant_id: str, inicio: float):
    """Lead nuevo: registramos y disparamos mensaje de bienvenida."""
    from api.academias import ACADEMIAS

    academia = ACADEMIAS[tenant_id]
    metricas.registrar_lead(tenant_id)

    nombre = payload.firstName or "Lead"
    bienvenida = (
        f"Hola {nombre}! Bienvenido a {academia['nombre']}. "
        f"Soy el asistente virtual y estoy aqui para ayudarte. "
        f"Tenemos clases de {', '.join(list(academia['clases'].keys())[:3])} y mas. "
        f"Que instrumento te interesa aprender?"
    )

    duracion = round(time.time() - inicio, 3)
    metricas.registrar_tiempo("webhook_contact_create", duracion)

    return {
        "status": "ok",
        "accion": "lead_registrado",
        "tenant": tenant_id,
        "academia": academia["nombre"],
        "ghl_response": {
            "contactId": payload.contactId,
            "tags_agregados": ["lead_nuevo", "fuente_webhook", f"academia_{tenant_id}"],
            "mensaje_a_enviar": bienvenida,
            "canal": payload.channel,
        },
        "tiempo_segundos": duracion,
    }


def _procesar_mensaje(payload: GHLWebhookPayload, tenant_id: str, inicio: float):
    """Mensaje entrante del lead: invocamos al agente IA del tenant."""
    from api.academias import agentes_cache, crear_agente_academia, ACADEMIAS
    from langchain_core.messages import HumanMessage

    if not payload.message:
        raise HTTPException(status_code=400, detail="message es requerido para InboundMessage")

    if tenant_id not in agentes_cache:
        agentes_cache[tenant_id] = crear_agente_academia(tenant_id)

    agente = agentes_cache[tenant_id]
    resultado = agente.invoke({"messages": [HumanMessage(content=payload.message)]})

    tools_usadas = []
    for msg in resultado["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                tools_usadas.append(tc["name"])
                metricas.registrar_tool(tc["name"])

    respuesta = resultado["messages"][-1].content
    duracion = round(time.time() - inicio, 3)
    metricas.registrar_tiempo("webhook_inbound_message", duracion)

    return {
        "status": "ok",
        "accion": "respuesta_generada",
        "tenant": tenant_id,
        "academia": ACADEMIAS[tenant_id]["nombre"],
        "ghl_response": {
            "contactId": payload.contactId,
            "mensaje_a_enviar": respuesta,
            "canal": payload.channel,
            "tools_usadas": tools_usadas,
        },
        "tiempo_segundos": duracion,
    }


def _procesar_cita(payload: GHLWebhookPayload, tenant_id: str, inicio: float):
    """Cita agendada: confirmamos y agregamos tag."""
    from api.academias import ACADEMIAS

    duracion = round(time.time() - inicio, 3)
    return {
        "status": "ok",
        "accion": "cita_confirmada",
        "tenant": tenant_id,
        "academia": ACADEMIAS[tenant_id]["nombre"],
        "ghl_response": {
            "contactId": payload.contactId,
            "tags_agregados": ["cita_agendada", "esperando_clase"],
            "mensaje_a_enviar": "Listo! Tu clase quedo agendada. Te esperamos.",
        },
        "tiempo_segundos": duracion,
    }


@router.get("/ghl/info")
def webhook_info():
    """Info del webhook para que un dev de GHL sepa como configurarlo."""
    return {
        "endpoint": "POST /api/webhook/ghl/lead",
        "tipos_soportados": ["ContactCreate", "InboundMessage", "AppointmentBooked"],
        "header_firma": "x-ghl-signature (HMAC-SHA256)",
        "tenants_disponibles": list(LOCATION_TO_TENANT.keys()),
        "ejemplo_payload": {
            "type": "InboundMessage",
            "locationId": "loc_armonia_cuenca",
            "contactId": "contact_123",
            "firstName": "Maria",
            "phone": "+593987654321",
            "message": "Hola, quiero saber sobre clases de piano",
            "channel": "WhatsApp",
        },
    }

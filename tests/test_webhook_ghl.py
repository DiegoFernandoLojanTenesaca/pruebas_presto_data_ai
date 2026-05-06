"""Tests del webhook GHL. Sin LLM (tipo ContactCreate y AppointmentBooked)."""


def test_webhook_info(client):
    r = client.get("/api/webhook/ghl/info")
    assert r.status_code == 200
    data = r.json()
    assert "tipos_soportados" in data
    assert "InboundMessage" in data["tipos_soportados"]


def test_webhook_location_desconocido(client):
    payload = {
        "type": "ContactCreate",
        "locationId": "loc_inexistente",
        "contactId": "c1",
    }
    r = client.post("/api/webhook/ghl/lead", json=payload)
    assert r.status_code == 404


def test_webhook_contact_create(client):
    payload = {
        "type": "ContactCreate",
        "locationId": "loc_armonia_cuenca",
        "contactId": "c1",
        "firstName": "Maria",
        "phone": "+593987654321",
    }
    r = client.post("/api/webhook/ghl/lead", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["accion"] == "lead_registrado"
    assert data["tenant"] == "armonia"
    assert "Maria" in data["ghl_response"]["mensaje_a_enviar"]
    assert "academia_armonia" in data["ghl_response"]["tags_agregados"]


def test_webhook_appointment_booked(client):
    payload = {
        "type": "AppointmentBooked",
        "locationId": "loc_melodia_gye",
        "contactId": "c2",
    }
    r = client.post("/api/webhook/ghl/lead", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["accion"] == "cita_confirmada"
    assert data["tenant"] == "melodia"


def test_webhook_inbound_sin_mensaje(client):
    """InboundMessage sin campo message debe fallar 400."""
    payload = {
        "type": "InboundMessage",
        "locationId": "loc_armonia_cuenca",
        "contactId": "c1",
    }
    r = client.post("/api/webhook/ghl/lead", json=payload)
    assert r.status_code == 400


def test_webhook_tipo_no_manejado(client):
    payload = {
        "type": "TipoRandom",
        "locationId": "loc_armonia_cuenca",
    }
    r = client.post("/api/webhook/ghl/lead", json=payload)
    assert r.status_code == 200
    assert r.json()["status"] == "ignored"

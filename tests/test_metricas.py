"""Tests del store de metricas + endpoint."""


def test_metricas_inicial(client):
    """Tras reset autouse, las metricas estan vacias."""
    r = client.get("/api/metricas")
    assert r.status_code == 200
    data = r.json()
    assert data["eventos_total"] == 0


def test_metricas_se_acumulan_con_uso(client):
    client.get("/api/05-academias")
    client.post("/api/rag/buscar", json={"consulta": "piano", "top_k": 1})
    client.post("/api/rag/buscar", json={"consulta": "guitarra", "top_k": 1})

    r = client.get("/api/metricas")
    data = r.json()
    assert data["por_tipo"]["rag_busqueda"] == 2


def test_listar_eventos(client):
    client.post("/api/rag/buscar", json={"consulta": "piano", "top_k": 1})
    r = client.get("/api/metricas/eventos?limit=10")
    data = r.json()
    assert data["total"] >= 1
    assert any(e["tipo"] == "rag_busqueda" for e in data["eventos"])


def test_reset_metricas(client):
    client.post("/api/rag/buscar", json={"consulta": "piano", "top_k": 1})
    client.post("/api/metricas/reset")
    r = client.get("/api/metricas")
    assert r.json()["eventos_total"] == 0


def test_webhook_actualiza_lead_count(client):
    payload = {
        "type": "ContactCreate",
        "locationId": "loc_armonia_cuenca",
        "contactId": "c1",
        "firstName": "X",
    }
    client.post("/api/webhook/ghl/lead", json=payload)
    r = client.get("/api/metricas")
    assert r.json()["leads_por_academia"]["armonia"] == 1

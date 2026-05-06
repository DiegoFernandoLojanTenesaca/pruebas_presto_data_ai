"""Tests basicos: health, info, listado de academias. Sin LLM."""


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_info(client):
    r = client.get("/api/info")
    assert r.status_code == 200
    data = r.json()
    assert "stack" in data
    assert "modulos" in data
    assert len(data["modulos"]) == 7
    assert len(data["features_avanzadas"]) >= 9


def test_listar_academias(client):
    r = client.get("/api/05-academias")
    assert r.status_code == 200
    data = r.json()
    assert set(data.keys()) == {"armonia", "melodia", "ritmo"}
    assert data["armonia"]["ciudad"] == "Cuenca"
    assert "Piano" in data["armonia"]["clases"]

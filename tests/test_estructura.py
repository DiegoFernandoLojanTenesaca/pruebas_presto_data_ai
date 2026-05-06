"""Tests de estructura de la app: rutas registradas, openapi limpio."""


def test_rutas_principales_registradas(client):
    r = client.get("/openapi.json")
    assert r.status_code == 200
    paths = set(r.json()["paths"].keys())
    requeridas = {
        "/api/health",
        "/api/info",
        "/api/01-api-basica",
        "/api/02-agente",
        "/api/05-academias",
        "/api/05-caso-lead",
        "/api/01-chat-stream",
        "/api/scoring",
        "/api/rag/buscar",
        "/api/rag/responder",
        "/api/clasificar",
        "/api/clasificar/batch",
        "/api/metricas",
        "/api/transcribir",
        "/api/ab-test",
        "/api/memoria/chat",
        "/api/webhook/ghl/lead",
    }
    faltantes = requeridas - paths
    assert not faltantes, f"Rutas faltantes: {faltantes}"


def test_categorias_clasificacion(client):
    r = client.get("/api/clasificar/categorias")
    data = r.json()
    assert "interes_alto" in data["intenciones"]
    assert "objecion" in data["intenciones"]
    assert set(data["sentimientos"]) == {"positivo", "neutro", "negativo"}


def test_ejemplos_scoring(client):
    r = client.get("/api/scoring/ejemplos")
    data = r.json()
    assert {"caliente", "tibio", "frio"} <= set(data.keys())

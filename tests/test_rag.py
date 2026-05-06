"""Tests del RAG. Solo retrieval (sin LLM) para que sean rapidos y deterministas."""


def test_indice_tiene_documentos(client):
    r = client.get("/api/rag/indice")
    assert r.status_code == 200
    data = r.json()
    assert data["total_documentos"] >= 12
    assert data["metodo"] == "BM25Okapi"


def test_buscar_piano_cuenca(client):
    r = client.post("/api/rag/buscar", json={"consulta": "piano cuenca", "top_k": 3})
    assert r.status_code == 200
    data = r.json()
    assert len(data["resultados"]) > 0
    primero = data["resultados"][0]
    assert primero["score"] > 0
    assert "Piano" in primero["texto"] or "piano" in primero["texto"].lower()


def test_buscar_filtra_por_academia(client):
    r = client.post("/api/rag/buscar", json={
        "consulta": "piano",
        "top_k": 5,
        "academia_id": "ritmo",
    })
    data = r.json()
    for resultado in data["resultados"]:
        assert resultado["academia_id"] == "ritmo"


def test_buscar_consulta_irrelevante(client):
    """Consulta sin nada que ver: debe devolver vacio o muy pocos hits."""
    r = client.post("/api/rag/buscar", json={"consulta": "xyzabc123", "top_k": 3})
    data = r.json()
    assert len(data["resultados"]) == 0


def test_tokenizacion_limpia_stopwords(client):
    r = client.post("/api/rag/buscar", json={"consulta": "el la de en piano", "top_k": 1})
    data = r.json()
    assert "el" not in data["tokens_usados"]
    assert "la" not in data["tokens_usados"]
    assert "piano" in data["tokens_usados"]

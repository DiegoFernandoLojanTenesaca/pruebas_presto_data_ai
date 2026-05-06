"""Configuracion compartida para los tests."""
import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


@pytest.fixture(scope="session")
def client():
    """Cliente de FastAPI para tests. Sesion completa para reuso."""
    from api.server import app
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_metricas_entre_tests():
    """Cada test arranca con metricas limpias."""
    from api.metricas_store import metricas
    metricas.eventos.clear()
    metricas.contadores.clear()
    metricas.tools_usadas.clear()
    metricas.tiempos_por_endpoint.clear()
    metricas.leads_por_academia.clear()
    metricas.scores.clear()
    yield

"""
Configuracion compartida para todos los scripts.
Carga las variables de entorno y provee utilidades comunes.
"""
import os

def cargar_env():
    """Carga variables del archivo .env"""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for linea in f:
                linea = linea.strip()
                if linea and not linea.startswith("#") and "=" in linea:
                    clave, valor = linea.split("=", 1)
                    os.environ[clave.strip()] = valor.strip()

cargar_env()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODELO_CHAT = "llama-3.3-70b-versatile"
MODELO_AGENTE = "meta-llama/llama-4-scout-17b-16e-instruct"


def banner(titulo: str):
    """Imprime un banner bonito."""
    ancho = 60
    print()
    print("=" * ancho)
    print(f"  {titulo}")
    print("=" * ancho)


def separador():
    print("-" * 60)

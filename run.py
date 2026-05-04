"""
Backend Presto Pruebas — FastAPI
Ejecuta: python run.py
"""

import uvicorn

if __name__ == "__main__":
    print()
    print("\033[1m╔══════════════════════════════════════════╗\033[0m")
    print("\033[1m║   Presto Pruebas — Backend FastAPI       ║\033[0m")
    print("\033[1m║   Diego Fernando Lojan Tenesaca          ║\033[0m")
    print("\033[1m╚══════════════════════════════════════════╝\033[0m")
    print()
    print("\033[36m▶  http://localhost:8000\033[0m")
    print("\033[36m▶  Docs: http://localhost:8000/docs\033[0m")
    print()

    uvicorn.run("api.server:app", host="0.0.0.0", port=8000, reload=True)

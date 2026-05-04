# 01 - Llamada Basica a API de LLM

Demuestra como conectarse a la API de Groq (compatible con OpenAI) usando `requests` puro.

## Que hace
- Envia prompts a un modelo de lenguaje (Llama 3.3 70B)
- Procesa y muestra la respuesta con metricas de tokens
- Modo interactivo: chat libre o como asistente de academia
- Modo demo: ejemplos automaticos

## Ejecutar
```bash
cd presto-pruebas
venv/bin/python 01_api_basica/main.py
```

## Conceptos demostrados
- API REST (POST con headers y JSON)
- Autenticacion con Bearer token
- Roles de sistema (system prompt)
- Procesamiento de respuesta JSON

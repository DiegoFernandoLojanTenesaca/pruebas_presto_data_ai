# 05 - Caso Presto: Agente Multi-Tenant para Academias

Simulacion completa del sistema que Presto necesita: un agente de IA que atiende leads de **multiples academias** con datos aislados.

## Que hace
- Sistema multi-tenant: 3 academias con datos independientes
- Cada academia tiene sus clases, precios, profesores y ubicacion
- El agente usa herramientas para: buscar info, consultar horarios, agendar clases, escalar a humano
- Simula integraciones con: GoHighLevel CRM, Google Calendar, WhatsApp API
- Modo interactivo: elige academia y chatea como lead, cambia de academia en vivo
- Modo demo: prueba automatica con las 3 academias

## Ejecutar
```bash
cd presto-pruebas
venv/bin/python 05_caso_lead/main.py
```

## Conceptos demostrados
- Arquitectura multi-tenant
- Agentes con multiples herramientas
- Integraciones CRM + Calendar + WhatsApp (simuladas)
- Escalamiento a humano (guardrails)
- Flujo completo: lead -> info -> agenda -> CRM

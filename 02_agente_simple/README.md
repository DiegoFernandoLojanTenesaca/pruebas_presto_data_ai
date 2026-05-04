# 02 - Agente de IA con Herramientas

Demuestra un agente que **decide autonomamente** que herramientas usar segun el mensaje del usuario.

## Que hace
- Agente con LangChain + LangGraph + Groq
- 3 herramientas: buscar info, agendar clase, registrar lead en CRM
- El agente decide si buscar, agendar o ambas segun el contexto
- Modo interactivo: chatea como si fueras un lead
- Modo demo: casos automaticos

## Ejecutar
```bash
cd presto-pruebas
venv/bin/python 02_agente_simple/main.py
```

## Conceptos demostrados
- Agentes de IA (ReAct pattern)
- Tool use / Function calling
- LangChain + LangGraph
- Toma de decisiones autonoma del agente

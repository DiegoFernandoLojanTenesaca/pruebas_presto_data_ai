# Arquitectura del Sistema de IA para Presto

## Flujo Principal: Lead -> Matricula

```
                        ACADEMIA DE MUSICA (Cliente de Presto)
                        ======================================

  Instagram/Facebook/Web
        |
        v
  [Lead interesado]  ----WhatsApp----> [GoHighLevel CRM]
                                            |
                                        (Webhook)
                                            |
                                            v
                                    +------------------+
                                    |  AGENTE DE IA    |
                                    |  (LangChain/     |
                                    |   LangGraph)     |
                                    +------------------+
                                      |    |    |    |
                          +-----------+    |    |    +-----------+
                          |                |    |                |
                          v                v    v                v
                    [Buscar Info]    [Agendar]  [Registrar]  [Escalar]
                    (RAG/Base de    (Google     (GoHighLevel  (Notificar
                     conocimiento)  Calendar)   API)          humano)
                          |                |    |
                          v                v    v
                    Responde con      Agenda    Actualiza
                    info real de      clase     estado del
                    la academia       prueba    lead en CRM
                          |                |    |
                          +-------+--------+----+
                                  |
                                  v
                          [Respuesta por WhatsApp]
                                  |
                                  v
                          Lead se matricula! $$$
```

## Arquitectura Multi-Tenant (Una instalacion, multiples academias)

```
                    +----------------------------------+
                    |        SISTEMA PRESTO            |
                    +----------------------------------+
                    |                                  |
                    |  +----------+  +----------+     |
                    |  | Academia |  | Academia |     |
                    |  | Armonia  |  | Melodia  | ... |
                    |  +----------+  +----------+     |
                    |  | - datos  |  | - datos  |     |
                    |  | - config |  | - config |     |
                    |  | - tono   |  | - tono   |     |
                    |  | - precios|  | - precios|     |
                    |  +----------+  +----------+     |
                    |       |              |           |
                    |       v              v           |
                    |  +---------------------------+   |
                    |  |     AGENTE DE IA          |   |
                    |  |  (mismo codigo, diferente |   |
                    |  |   contexto por academia)  |   |
                    |  +---------------------------+   |
                    |              |                    |
                    |              v                    |
                    |  +---------------------------+   |
                    |  |      PostgreSQL            |   |
                    |  |  Schema: armonia           |   |
                    |  |  Schema: melodia           |   |
                    |  |  (datos aislados)          |   |
                    |  +---------------------------+   |
                    +----------------------------------+
```

## Stack Tecnologico

```
Frontend/CRM:     GoHighLevel (gestion de leads, funnels, WhatsApp)
Agente IA:        Python + LangChain/LangGraph + Groq/OpenAI
Backend:          FastAPI (microservicios)
Base de datos:    PostgreSQL + pgvector (busqueda semantica)
Integraciones:    WhatsApp API, Google Calendar, GoHighLevel API
Automatizacion:   Webhooks + Make/Zapier (complementario)
Despliegue:       Docker + Docker Compose
```

## Flujo Tecnico Detallado

```
1. Lead envia mensaje por WhatsApp
        |
2. GoHighLevel recibe mensaje y dispara Webhook
        |
3. Webhook llega a nuestro endpoint FastAPI
        |
4. FastAPI identifica la academia (tenant) por el webhook
        |
5. Se carga el contexto de esa academia (RAG)
        |
6. LangGraph ejecuta el agente con las herramientas disponibles:
   - buscar_info: consulta embeddings en pgvector
   - agendar: llama a Google Calendar API
   - registrar: actualiza lead en GoHighLevel via API
   - escalar: notifica a humano si no puede resolver
        |
7. El agente genera respuesta personalizada
        |
8. Se envia respuesta por WhatsApp via GoHighLevel API
        |
9. Se registra la interaccion en el CRM
```

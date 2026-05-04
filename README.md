# Presto AI — Pruebas Tecnicas

Pruebas tecnicas para el puesto de **Programador con enfoque en IA** en [Presto](https://prestoprogram.com).

Presto ayuda a academias de musica en Latinoamerica a captar y retener alumnos. Este repositorio demuestra como la IA puede automatizar la atencion de leads, agendar clases de prueba y gestionar el CRM de forma inteligente.

---

## Que es esto

Aplicacion full-stack con **7 modulos** interactivos:

| # | Modulo | Descripcion |
|---|--------|-------------|
| 01 | API Basica | Chat directo con LLM — conexion REST, streaming de respuestas |
| 02 | Agente con Herramientas | Agente ReAct con tool use: buscar info, agendar, registrar en CRM |
| 03 | Automatizacion | Conceptos de Make/Zapier aplicados al flujo de leads |
| 04 | Portafolio | Proyectos empresariales, propios e investigacion |
| 05 | Caso Presto | Simulacion completa multi-tenant (3 academias, CRM, Calendar, WhatsApp) |
| 06 | Arquitectura | Diagrama visual del sistema propuesto para Presto |
| 07 | Demo Codigo | Script limpio para mostrar en entrevista |

---

## Stack

### Backend (Python)
- **FastAPI** — API REST con endpoints por modulo
- **LangChain + LangGraph** — Orquestacion de agentes IA (patron ReAct)
- **Groq API** — LLMs: `llama-3.3-70b-versatile` (chat), `llama-4-scout-17b-16e-instruct` (tool use)
- **PostgreSQL + pgvector** — Base de datos con busqueda semantica (arquitectura propuesta)

### Frontend (TypeScript)
- **Next.js 16** — App Router, Turbopack
- **Tailwind CSS v4** — Variables CSS personalizadas, tema oscuro/claro
- **Framer Motion** — Animaciones de scroll y transiciones
- **Heroicons v2** — Iconografia consistente

---

## Arquitectura

```
Lead (WhatsApp)
    │
    ▼
GoHighLevel CRM → Webhook
    │
    ▼
FastAPI (identifica tenant)
    │
    ▼
LangGraph (agente IA)
    ├── Buscar Info (RAG)
    ├── Agendar (Google Calendar)
    ├── Registrar (CRM)
    └── Escalar (notificar humano)
    │
    ▼
Respuesta por WhatsApp
```

### Multi-Tenant
Cada academia tiene sus propios datos, configuracion y precios. El mismo codigo atiende a todas:

| Academia | Ciudad |
|----------|--------|
| Academia Armonia | Cuenca |
| Escuela Melodia | Guayaquil |
| Centro Ritmo | Quito |

---

## Como ejecutar

### 1. Clonar

```bash
git clone https://github.com/DiegoFernandoLojanTenesaca/pruebas_presto_data_ai.git
cd pruebas_presto_data_ai
```

### 2. Backend (Python)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar API key de Groq (https://console.groq.com)
cp .env.example .env
# Editar .env con tu GROQ_API_KEY

python run.py
# → Backend en http://localhost:8000
```

### 3. Frontend (Next.js)

```bash
cd web
npm install
npm run dev
# → Frontend en http://localhost:3000
```

---

## API Endpoints

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/01-chat` | Chat basico con LLM |
| POST | `/api/02-agente` | Agente con herramientas |
| GET | `/api/05-academias` | Lista de academias (tenants) |
| POST | `/api/05-caso-lead` | Chat multi-tenant como lead |

---

## Estructura del proyecto

```
presto-pruebas/
├── run.py                    # Lanza el backend (uvicorn)
├── config.py                 # Configuracion compartida
├── requirements.txt          # Dependencias Python
├── .env.example              # Variables de entorno (template)
├── api/
│   └── server.py             # FastAPI — todos los endpoints
├── web/                      # Frontend Next.js
│   ├── app/
│   │   ├── layout.tsx        # Layout con navbar, tema, idioma
│   │   ├── page.tsx          # Home — grid de modulos
│   │   ├── globals.css       # Temas oscuro/claro, efectos
│   │   ├── api-basica/       # Modulo 01
│   │   ├── agente/           # Modulo 02
│   │   ├── automatizacion/   # Modulo 03
│   │   ├── portafolio/       # Modulo 04
│   │   ├── caso-lead/        # Modulo 05
│   │   ├── arquitectura/     # Modulo 06
│   │   └── demo/             # Modulo 07
│   └── components/
│       ├── ThemeProvider.tsx  # Tema + idioma + traducciones
│       ├── AnimateIn.tsx      # Animaciones de scroll
│       ├── ChatPanel.tsx      # Chat reutilizable
│       └── MetaCard.tsx       # Tarjeta de metricas
├── 01_api_basica/            # Scripts standalone
├── 02_agente_simple/
├── 03_automatizacion/
├── 04_portafolio/
├── 05_caso_lead/
├── 06_arquitectura/
└── 07_demo_codigo/
```

---

## Funcionalidades destacadas

- **Tema oscuro/claro** — Toggle con transiciones suaves, paleta adaptada
- **Bilingue (ES/EN)** — Cambio de idioma en toda la interfaz
- **Animaciones** — Scroll-triggered con Framer Motion
- **Glassmorphism** — Efectos de cristal, gradientes, glow
- **Chat interactivo** — Burbujas animadas, indicador de escritura
- **Multi-tenant** — Cada academia con datos aislados
- **Agente ReAct** — Toma decisiones autonomas con herramientas

---

## Modelos usados

| Modelo | Uso | Provider |
|--------|-----|----------|
| `llama-3.3-70b-versatile` | Chat general (Modulo 01) | Groq |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Tool use / Agentes (Modulos 02, 05) | Groq |

---

## Autor

**Diego Fernando Lojan Tenesaca**
- GitHub: [DiegoFernandoLojanTenesaca](https://github.com/DiegoFernandoLojanTenesaca)
- LinkedIn: [diego-fernando-lojan](https://linkedin.com/in/diego-fernando-lojan)
- Email: fernando.lojan10@gmail.com

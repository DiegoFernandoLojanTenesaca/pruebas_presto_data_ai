# Deploy a producción — paso a paso (gratis)

Stack final: **Render** (backend + frontend) + **Neon** (Postgres) + **Groq** (LLMs).
Costo total: **$0/mes**.

---

## Paso 0 — Preparativos (5 min)

Necesitas cuentas gratis en:

1. **GitHub** → para subir el repo (https://github.com)
2. **Render** → para hostear backend y frontend (https://render.com)
3. **Neon** → para Postgres persistente (https://console.neon.tech)
4. **Groq** → para LLMs gratis (https://console.groq.com)

Todos tienen plan free indefinido suficiente para esta demo.

---

## Paso 1 — Subir el código a GitHub

```bash
cd /mnt/disco1tb/PROYECTO/kumbre/presto-pruebas

# Si aun no es repo:
git init
git add .
git commit -m "Initial: Presto AI demo con 14 features"

# Crea el repo en GitHub (web) y ejecuta:
git remote add origin https://github.com/TU_USUARIO/presto-ai-demo.git
git branch -M main
git push -u origin main
```

> **Importante:** revisa `.gitignore` para que no subas `.env` ni `memoria.db`.

---

## Paso 2 — Crear DB en Neon (3 min)

1. Entra a https://console.neon.tech y registrate con GitHub
2. Click **"Create project"**
3. Nombre: `presto-demo` · Region: `US East (Ohio)` (cercano a Render)
4. Plan: **Free**
5. Copia la **connection string** que se muestra. Tiene la forma:
   ```
   postgresql://user:pass@ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

✅ **Guarda esa URL.** La usas en el siguiente paso.

---

## Paso 3 — Obtener API key de Groq (1 min)

1. Entra a https://console.groq.com
2. Login con Google
3. Sidebar → **API Keys** → **Create API Key**
4. Copia la key (empieza con `gsk_...`)

✅ **Guarda esa key.**

---

## Paso 4 — Deploy backend en Render (3 min)

1. https://dashboard.render.com → **New +** → **Blueprint**
2. Conecta tu repo de GitHub `presto-ai-demo`
3. Render detecta el `render.yaml` y crea **2 servicios**: `presto-api` y `presto-web`
4. **Antes de hacer deploy**, ve a **`presto-api` → Environment** y agrega:
   - `GROQ_API_KEY` = `gsk_...` (del paso 3)
   - `DATABASE_URL` = `postgresql://...` (del paso 2)
5. Click **"Apply"** y espera ~3-5 min (build + first deploy)

URL final: `https://presto-api.onrender.com` (o similar)

✅ **Verifica:** abre `https://presto-api.onrender.com/api/health` → debe devolver `{"status":"ok"}`.

> ⚠️ El plan free duerme tras 15 min de inactividad. El primer request despierta (~30s). Después responde rápido.

---

## Paso 5 — Deploy frontend en Render

Ya se creó automáticamente como `presto-web`. Solo falta:

1. **`presto-web` → Environment** → agrega:
   - `NEXT_PUBLIC_API_URL` = `https://presto-api.onrender.com`
   *(la URL exacta de tu backend del paso 4)*
2. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
3. Espera ~3 min

URL final: `https://presto-web.onrender.com`

✅ **Verifica:** abre la URL → home con los 14 módulos. Indicador de backend debe estar verde.

---

## Paso 6 — Probar que todo funciona

Pruebas rápidas:

```bash
# 1. Health
curl https://presto-api.onrender.com/api/health

# 2. Anti-abandono (LLM real)
curl -X POST https://presto-api.onrender.com/api/anti-abandono \
  -H "Content-Type: application/json" \
  -d '{
    "conversacion":[
      {"rol":"lead","texto":"Cuanto piano?"},
      {"rol":"asistente","texto":"$60 mensuales"},
      {"rol":"lead","texto":"Esta caro, lo voy a pensar"}
    ],
    "academia_id":"armonia"
  }'

# 3. Memoria persistente (Neon Postgres)
curl -X POST https://presto-api.onrender.com/api/memoria/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"prod_test","mensaje":"Hola soy Diego","academia_id":"armonia"}'

# Repite el mismo session_id otro día → recuerda el nombre.
```

En el navegador:
- `https://presto-web.onrender.com/dashboard` → métricas live
- `https://presto-web.onrender.com/anti-abandono` → el feature killer

---

## Paso 7 — Mandar el link

Tu URL pública para Presto:

> 🔗 **`https://presto-web.onrender.com`**

Comparte ese link. Sugerencia para el mensaje:

> Hola, te comparto la demo que armé pensando en Presto Program:
> https://presto-web.onrender.com
>
> 14 features de IA aplicadas a captación y retención de leads para academias de música:
> automatización tipo GHL, scoring automático, anti-abandono con LLM, RAG sobre catálogo,
> transcripción de WhatsApp, dashboard analítico, multi-tenant, etc.
>
> Stack: FastAPI + LangGraph + Groq (Llama) + Postgres (Neon) + Next.js 16.
> Backend en Render free, código en https://github.com/TU_USUARIO/presto-ai-demo

---

## Troubleshooting

### Backend tarda 30s la primera vez
Normal. Es el cold start del plan free. Después responde rápido por ~15 min.

Si quieres mantenerlo despierto, usa https://uptimerobot.com (gratis) y ping cada 10 min a `/api/health`.

### Error 500 en /api/memoria/chat
Revisa que `DATABASE_URL` esté seteada en Render → presto-api → Environment.
Si quieres usar SQLite (sin DB externa), elimina la variable `DATABASE_URL` y redeploy.

### Frontend muestra "Backend desconectado"
Revisa que `NEXT_PUBLIC_API_URL` apunte a la URL correcta del backend (sin `/` al final).

### Build falla con "module not found: psycopg"
Refrresca dependencies: en Render → presto-api → Manual Deploy → **Clear build cache**.

### Whisper devuelve 401
Tu Groq API key venció o está mal. Genera una nueva en https://console.groq.com.

---

## Limites del plan free

| Servicio | Limite |
|----------|--------|
| Render web (cada uno) | 750h/mes, sleep tras 15min idle, cold start ~30s |
| Neon Postgres | 0.5GB storage, sin sleep en plan free actual |
| Groq | rate limit por minuto (suficiente para demos) |

Para una demo que se enseña activamente, esto es **más que suficiente**.

---

## Mejoras futuras (si pasa a algo serio)

- 💰 Render starter $7/mes elimina cold starts
- 💰 Neon scaler tier para mas storage si crece
- 🔒 Domain custom (ej: `demo.tudominio.com`) en ambos servicios
- 🚦 GitHub Actions: tests + auto-deploy en cada push a main
- 📊 Sentry para tracking de errores en produccion

# Notas Rapidas: Make (Integromat) / Zapier

## Que son
Plataformas de automatizacion visual (no-code/low-code).
Conectan servicios con: TRIGGER -> FILTRO -> ACCION

## Conceptos clave
- **Scenario (Make) / Zap (Zapier):** Un flujo de automatizacion
- **Trigger:** El evento que inicia el flujo (ej: nuevo lead en GoHighLevel)
- **Module/Action:** La accion que se ejecuta (ej: enviar WhatsApp, crear evento en Calendar)
- **Filter:** Condicion para continuar o no (ej: solo si el lead es de Cuenca)
- **Router:** Divide el flujo en multiples caminos segun condiciones

## Ejemplo aplicado a Presto
```
TRIGGER: Nuevo lead en GoHighLevel
    |
FILTER: Es una academia activa?
    |
    +--> SI --> ACTION: Enviar mensaje de bienvenida por WhatsApp
    |              |
    |          ACTION: Crear tarea de seguimiento en GoHighLevel
    |              |
    |          ACTION: Notificar al equipo por Slack/Email
    |
    +--> NO --> ACTION: Agregar a lista de espera
```

## Make vs Zapier
| Caracteristica | Make | Zapier |
|---------------|------|--------|
| Precio | Mas barato | Mas caro |
| Flexibilidad | Mas flexible (visual) | Mas simple |
| Integraciones | 1000+ | 5000+ |
| Para Presto | Mejor opcion | OK tambien |

## Como lo explico en la entrevista
> "No he usado Make/Zapier directamente en produccion, pero conozco la logica:
> trigger, filtro, accion. Es la version visual de lo que yo hago con codigo.
> La ventaja del codigo es mas flexibilidad; la de Make/Zapier es velocidad
> para prototipar. Puedo aprender cualquiera de las dos en muy poco tiempo."

## Tutorial recomendado (ver antes de la entrevista)
- Make: Buscar "Make tutorial español basico" en YouTube (15 min)
- Zapier: Buscar "Zapier tutorial español" en YouTube (10 min)

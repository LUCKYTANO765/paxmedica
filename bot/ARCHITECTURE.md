# Arquitectura del Bot de WhatsApp — Bombas de Dolor Bolivia

## 1. Comparativa de Proveedores de WhatsApp API para Bolivia

### Meta Business API (directo)
| Aspecto | Detalle |
|---|---|
| **Costo** | Gratis para los primeros 1,000 conversaciones/mes iniciadas por usuarios; luego ~$0.006–$0.015 por conversación dependiendo del tipo |
| **Disponibilidad en Bolivia** | Sí, disponible |
| **Facilidad de configuración** | Alta complejidad — requiere aprobación de Meta, número verificado, cuenta Business Manager |
| **Para pequeño negocio familiar** | No recomendado como primera opción — burocracia elevada |

### Twilio
| Aspecto | Detalle |
|---|---|
| **Costo** | ~$0.005 por mensaje enviado + tarifa de WhatsApp de Meta |
| **Disponibilidad en Bolivia** | Sí, disponible globalmente |
| **Facilidad de configuración** | Media — documentación excelente, interfaz clara, sandbox gratuito para pruebas |
| **Para pequeño negocio familiar** | Buena opción secundaria — robusto pero tiene costos por mensaje |

### 360dialog
| Aspecto | Detalle |
|---|---|
| **Costo** | Desde $5 USD/mes (plan básico) + costos de conversación de Meta |
| **Disponibilidad en Bolivia** | Sí |
| **Facilidad de configuración** | Media-baja — panel de control sencillo, activación en ~24h |
| **Para pequeño negocio familiar** | Opción razonable para volúmenes bajos |

### WATI (WhatsApp Team Inbox)
| Aspecto | Detalle |
|---|---|
| **Costo** | Desde $49 USD/mes — el más caro de los listados |
| **Disponibilidad en Bolivia** | Sí |
| **Facilidad de configuración** | Muy fácil — tiene interfaz visual, no-code |
| **Para pequeño negocio familiar** | No recomendado por el precio alto |

### Baileys (librería open-source, no oficial)
| Aspecto | Detalle |
|---|---|
| **Costo** | Gratis — usa el número personal de WhatsApp |
| **Disponibilidad en Bolivia** | Sí, en cualquier lugar con WhatsApp |
| **Facilidad de configuración** | Media — requiere escanear QR, puede ser baneado por Meta |
| **Para pequeño negocio familiar** | NO recomendado — viola TOS de WhatsApp, riesgo de baneo permanente |

---

## RECOMENDACION: Twilio (con sandbox para pruebas)

**Por que Twilio:**
1. **Sandbox gratuito inmediato** — puedes probar el bot en minutos sin aprobaciones
2. **Documentación en español disponible** — más fácil para el propietario
3. **Escalable** — cuando el negocio crezca, el mismo sistema funciona
4. **Soporte confiable** — empresa establecida con garantías de uptime
5. **Precio justo para volúmenes bajos** — un negocio familiar con ~100-300 mensajes/mes paga menos de $5/mes

**Flujo de activación recomendado:**
1. Crear cuenta Twilio gratis → probar con sandbox de WhatsApp
2. Cuando listo para producción → solicitar número WhatsApp Business a través del panel de Twilio (proceso ~1-3 días, Twilio lo gestiona con Meta)

---

## 2. Diagrama de Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Paciente)                        │
│                    📱 WhatsApp (Bolivia)                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Mensaje de texto/voz/imagen
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TWILIO WHATSAPP API                          │
│              (Recibe y reenvía mensajes via HTTPS)               │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Webhook POST /webhook
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVIDOR NODE.JS (Railway)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Express.js Server                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   Webhook    │  │  Historial   │  │  Manejador   │  │   │
│  │  │   Handler    │  │ Conversacion │  │  de Errores  │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │   │
│  │         │                 │                              │   │
│  │         └─────────────────▼                              │   │
│  │                    Claude API Client                      │   │
│  └───────────────────────────┬─────────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTPS API Call
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANTHROPIC CLAUDE API                          │
│           Modelo: claude-haiku-4-5-20251001                      │
│           (Rápido, económico, en español)                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Respuesta generada
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVIDOR NODE.JS (Railway)                     │
│              Formatea respuesta para WhatsApp                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ POST a Twilio API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TWILIO WHATSAPP API                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Mensaje entregado
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Paciente)                        │
│                    📱 Recibe respuesta                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Flujo de Datos Detallado

```
1. ENTRADA
   Cliente escribe mensaje en WhatsApp
   └─► Twilio recibe el mensaje
       └─► Twilio hace POST a tu webhook URL:
           POST https://tu-servidor.railway.app/webhook
           Body: { From: "whatsapp:+591XXXXXXXX", Body: "Hola, ¿cuánto cuesta?" }

2. PROCESAMIENTO
   Express.js recibe el POST
   └─► Extrae número de teléfono y texto del mensaje
       └─► Recupera historial de conversación (en memoria, por número)
           └─► Construye prompt para Claude:
               - System prompt (instrucciones del negocio)
               - Historial de mensajes previos
               - Mensaje actual del cliente
               └─► Llama a Anthropic API
                   └─► Claude genera respuesta en español

3. SALIDA
   Servidor recibe respuesta de Claude
   └─► Hace POST a Twilio API con la respuesta
       └─► Twilio entrega mensaje al cliente en WhatsApp
           └─► Guarda respuesta en historial de conversación
```

---

## 4. Integración con Claude API

### Modelo elegido: `claude-haiku-4-5-20251001`
- **Por que Haiku:** Es el modelo más económico de Anthropic — aproximadamente $0.25 por millón de tokens de entrada y $1.25 por millón de tokens de salida. Para mensajes cortos de WhatsApp (~200 tokens promedio), el costo es negligible (~$0.00005 por mensaje).
- **Velocidad:** Responde en menos de 1 segundo — ideal para chat en tiempo real
- **Capacidad:** Más que suficiente para responder preguntas sobre un producto

### Gestión del Historial de Conversación
- El historial se guarda **en memoria del servidor** por número de teléfono
- Se mantienen los últimos **10 intercambios** (20 mensajes) por conversación
- Después de **6 horas de inactividad**, el historial se limpia automáticamente
- **No se usa base de datos** — mantiene el sistema simple y sin costo adicional

### Diseño del System Prompt
El system prompt instruye a Claude a:
1. Actuar como asistente cálido y profesional de "Bombas de Dolor Bolivia"
2. Responder SOLO sobre el producto (no dar consejo médico general)
3. Siempre recomendar consultar al médico para decisiones médicas
4. Mantener respuestas concisas (2-4 oraciones máximo para WhatsApp)
5. Usar los valores placeholder cuando no se conocen datos exactos
6. Nunca inventar información médica

---

## 5. Opciones de Deployment

### Railway
| Aspecto | Detalle |
|---|---|
| **Costo** | Plan Hobby: $5 USD/mes (incluye $5 de crédito de uso — en la práctica casi gratis para bajo tráfico) |
| **Facilidad** | Muy fácil — conectar repositorio de GitHub, deployar automáticamente |
| **HTTPS** | Incluido automáticamente — necesario para webhooks de Twilio |
| **Bolivia** | No requiere tarjeta boliviana — acepta tarjetas internacionales |

### Render
| Aspecto | Detalle |
|---|---|
| **Costo** | Plan gratuito disponible (pero el servidor "duerme" después de 15 min de inactividad) |
| **Facilidad** | Fácil — interfaz similar a Railway |
| **HTTPS** | Incluido |
| **Problema** | El plan gratuito tiene cold starts de ~30 segundos — malo para un bot de mensajería |

### Fly.io
| Aspecto | Detalle |
|---|---|
| **Costo** | Plan gratuito con límites generosos |
| **Facilidad** | Requiere CLI — más técnico que los anteriores |
| **HTTPS** | Incluido |
| **Para negocio familiar** | No recomendado — curva de aprendizaje alta |

### RECOMENDACION DE DEPLOYMENT: Railway
- **$5/mes** es el costo más bajo con servidor siempre activo (sin cold starts)
- El dashboard es visual y simple
- Deploy automático al hacer push a GitHub
- Logs en tiempo real fáciles de ver

---

## 6. Variables de Entorno Necesarias

```
ANTHROPIC_API_KEY        → Clave de API de Anthropic (claude.ai/api)
WHATSAPP_API_TOKEN       → Token de autenticación de Twilio
WHATSAPP_PHONE_NUMBER_ID → Número SID de Twilio (formato: MGXXXXXXXX)
WHATSAPP_VERIFY_TOKEN    → Token secreto que tú inventas para verificar webhooks
PORT                     → Puerto del servidor (Railway lo asigna automáticamente)
NODE_ENV                 → "production" en Railway, "development" local
```

---

## 7. Consideraciones de Seguridad

- Todas las comunicaciones son via HTTPS (cifradas)
- Las claves de API nunca se incluyen en el código fuente — solo en variables de entorno
- El webhook verifica la firma de Twilio en cada solicitud
- El historial de conversación no persiste entre reinicios del servidor (sin PII en disco)
- No se almacena información personal del cliente de forma permanente

---

## 8. Limitaciones y Consideraciones para Bolivia

1. **Latencia:** Railway tiene servidores en USA — la latencia a Bolivia es ~150-200ms, aceptable para mensajería
2. **Pagos internacionales:** Necesitarás una tarjeta de crédito internacional para Twilio y Railway (Visa/Mastercard)
3. **Número de teléfono:** Twilio puede asignarte un número de WhatsApp Business de Bolivia (+591) o un número internacional — verificar disponibilidad al momento de registro
4. **Volumen:** Este sistema soporta cómodamente hasta ~1,000 mensajes/día sin optimizaciones adicionales

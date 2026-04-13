# Bot de WhatsApp — Bombas de Dolor Bolivia

Este bot responde automáticamente a mensajes de WhatsApp usando inteligencia artificial (Claude de Anthropic). Fue diseñado para el negocio familiar "Bombas de Dolor Bolivia" en La Paz.

---

## Requisitos antes de empezar

- Una cuenta de correo electrónico
- Una tarjeta de crédito o débito internacional (Visa o Mastercard) para Twilio y Railway
- Aproximadamente 30-60 minutos para la configuración completa

---

## PASO 1: Configurar Twilio (WhatsApp API)

### 1.1 Crear cuenta de Twilio

1. Ir a [twilio.com](https://www.twilio.com) y hacer clic en **"Sign up for free"**
2. Completar el registro con nombre, correo y contraseña
3. Verificar el correo electrónico
4. Ingresar número de teléfono para verificación

### 1.2 Activar el Sandbox de WhatsApp (para pruebas)

1. En el dashboard de Twilio, ir al menú izquierdo: **Messaging → Try it out → Send a WhatsApp message**
2. Verás un número de sandbox (generalmente `+1 415 523 8886`) y un código de activación como `join [palabra-palabra]`
3. Desde tu teléfono, enviar el código de activación a ese número de WhatsApp para habilitar las pruebas
4. Guardar el número del sandbox — lo necesitarás como `TWILIO_WHATSAPP_NUMBER`

### 1.3 Obtener credenciales de Twilio

1. En el dashboard principal de Twilio, copiar:
   - **Account SID** (empieza con "AC...")
   - **Auth Token** (hacer clic en el ojo para verlo)
2. Guardar estos datos — los necesitarás más adelante

### 1.4 Configurar el Webhook en Twilio

> **Nota:** El webhook es la dirección web de tu bot donde Twilio enviará los mensajes. Necesitas tener el bot desplegado primero (Paso 4) para tener esta URL. Vuelve aquí después del Paso 4.

1. En el dashboard de Twilio: **Messaging → Settings → WhatsApp Sandbox Settings**
2. En el campo **"When a message comes in"**, poner tu URL de Railway + `/webhook`:
   ```
   https://tu-app.railway.app/webhook
   ```
3. Método: **HTTP POST**
4. Guardar cambios

---

## PASO 2: Configurar Anthropic (Claude AI)

### 2.1 Crear cuenta de Anthropic

1. Ir a [console.anthropic.com](https://console.anthropic.com)
2. Hacer clic en **"Sign up"** y completar el registro
3. Verificar el correo electrónico

### 2.2 Obtener la clave de API

1. Una vez dentro del dashboard, ir a **"API Keys"** en el menú
2. Hacer clic en **"Create Key"**
3. Darle un nombre descriptivo como "BombasDeDolor-Bot"
4. Copiar la clave generada — empieza con "sk-ant-..."

> **IMPORTANTE:** Guardar esta clave en un lugar seguro. Solo se muestra una vez.

### 2.3 Agregar crédito de prepago

1. Ir a **"Billing"** en el dashboard de Anthropic
2. Agregar método de pago y al menos $5 USD de crédito inicial
3. Para este bot con bajo volumen de mensajes, $5 USD dura varios meses

---

## PASO 3: Preparar el código

### 3.1 Instalar Node.js (si no lo tienes)

1. Ir a [nodejs.org](https://nodejs.org)
2. Descargar la versión **LTS** (la recomendada)
3. Instalarlo con todas las opciones por defecto

### 3.2 Instalar dependencias del bot

1. Abrir la carpeta `bot` en la terminal:
   - En Windows: Clic derecho en la carpeta `bot` → "Abrir en Terminal"
2. Ejecutar:
   ```
   npm install
   ```
3. Esperar a que termine (descarga las librerías necesarias)

### 3.3 Crear el archivo de configuración

1. En la carpeta `bot`, buscar el archivo `.env.example`
2. Hacer una copia y renombrarla a `.env` (sin el `.example`)
3. Abrir el archivo `.env` con el Bloc de notas
4. Completar los valores con los datos que obtuviste en los pasos anteriores:

```
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXX...    ← tu clave de Anthropic
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx...      ← tu Account SID de Twilio
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxx...         ← tu Auth Token de Twilio
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886    ← número del sandbox de Twilio
WHATSAPP_VERIFY_TOKEN=mi_palabra_secreta        ← inventa una palabra secreta
PORT=3000
NODE_ENV=production
```

---

## PASO 4: Desplegar en Railway

### 4.1 Subir el código a GitHub

1. Ir a [github.com](https://github.com) y crear una cuenta gratuita
2. Crear un repositorio nuevo (privado, para proteger tu código)
3. Subir la carpeta `bot` completa al repositorio
   - **IMPORTANTE:** No subir el archivo `.env` — solo el `.env.example`
   - Si usas la interfaz web de GitHub, arrastrar los archivos (excepto `.env`)

### 4.2 Crear cuenta en Railway

1. Ir a [railway.app](https://railway.app)
2. Hacer clic en **"Login"** → **"Login with GitHub"** (conectar con tu cuenta de GitHub)
3. Autorizar Railway para acceder a tus repositorios

### 4.3 Crear nuevo proyecto en Railway

1. En el dashboard de Railway, hacer clic en **"New Project"**
2. Seleccionar **"Deploy from GitHub repo"**
3. Buscar y seleccionar el repositorio del bot
4. Railway comenzará a desplegar automáticamente

### 4.4 Configurar variables de entorno en Railway

1. En tu proyecto de Railway, hacer clic en el servicio del bot
2. Ir a la pestaña **"Variables"**
3. Agregar cada variable del archivo `.env`:
   - Hacer clic en **"New Variable"** para cada una
   - Nombre: `ANTHROPIC_API_KEY`, Valor: tu clave
   - Repetir para todas las variables
4. Railway reiniciará el bot automáticamente

### 4.5 Obtener la URL del bot

1. En Railway, ir a la pestaña **"Settings"** del servicio
2. En la sección **"Networking"**, hacer clic en **"Generate Domain"**
3. Copiar la URL generada (algo como `https://tu-app-xxxxx.railway.app`)
4. Esta es la URL que usarás en el webhook de Twilio (Paso 1.4)

---

## PASO 5: Probar el bot

### 5.1 Verificar que el servidor está activo

1. Abrir en el navegador: `https://tu-app.railway.app/`
2. Debería aparecer un mensaje JSON con `"status": "ok"`

### 5.2 Probar desde WhatsApp

1. Desde el teléfono que activaste en el sandbox de Twilio (Paso 1.2):
2. Enviar un mensaje al número de sandbox: **+1 415 523 8886**
3. Escribir: "Hola"
4. El bot debería responder en pocos segundos

### Mensajes de prueba recomendados:
- "Hola"
- "¿Qué es una bomba de dolor?"
- "¿Cuánto cuesta?"
- "¿Hacen envíos a Cochabamba?"
- "¿Cómo se usa la bomba en casa?"
- "Quiero hacer un pedido"

### 5.3 Ver los logs del bot

Para ver qué está pasando en el servidor:
1. En Railway, ir a la pestaña **"Deployments"**
2. Hacer clic en el despliegue activo
3. Ver los logs en tiempo real

---

## PASO 6: Personalizar precios y datos del negocio

Para actualizar la información del negocio, abrir el archivo `bot.js` y buscar la sección `SYSTEM_PROMPT`. Los valores a cambiar son:

| Placeholder | Qué cambiar | Ejemplo |
|---|---|---|
| `[PRECIO_BS]` | Precio en bolivianos | `150 bolivianos` |
| `[COSTO_ENVIO_LAPAZ]` | Costo de envío en La Paz | `20 bolivianos` |
| `[COSTO_ENVIO_CIUDADES]` | Costo de envío a otras ciudades | `50 bolivianos` |

También puedes actualizar:
- Los métodos de pago aceptados
- Los tiempos de entrega
- La cantidad mínima/máxima de pedido
- Información sobre el producto

Después de cualquier cambio en `bot.js`, subir los cambios a GitHub y Railway desplegará la nueva versión automáticamente.

---

## PASO 7: Pasar a producción (cuando estés listo)

El sandbox de Twilio es solo para pruebas. Para usar el bot con clientes reales:

1. En el dashboard de Twilio: **Messaging → Senders → WhatsApp senders**
2. Hacer clic en **"Request access"**
3. Completar el formulario de verificación de negocio (requiere: nombre del negocio, sitio web, descripción)
4. Meta aprueba en 1-5 días hábiles
5. Una vez aprobado, actualizar `TWILIO_WHATSAPP_NUMBER` con tu número real de Bolivia

---

## Costos estimados mensuales

| Servicio | Costo estimado |
|---|---|
| Railway (hosting) | ~$5 USD/mes |
| Anthropic Claude (IA) | ~$1-3 USD/mes (bajo volumen) |
| Twilio (mensajes) | ~$0.005/mensaje + costos de Meta |
| **Total aproximado** | **$8-12 USD/mes** |

---

## Preguntas frecuentes

**¿El bot funciona 24/7?**
Sí, Railway mantiene el servidor activo siempre. Los clientes pueden escribir a cualquier hora.

**¿Qué pasa si el bot no sabe responder algo?**
Claude responderá honestamente que no tiene esa información y sugerirá contactar directamente al negocio.

**¿Puedo tener una conversación con el bot antes de mostrárselo a clientes?**
Sí, simplemente escribe al número del sandbox desde tu teléfono registrado.

**¿El bot guarda los datos de los clientes?**
El historial de conversación se guarda temporalmente en memoria mientras el servidor está activo, pero se borra automáticamente después de 6 horas de inactividad y no se guarda en ninguna base de datos.

**¿Cómo sé si llegó un pedido?**
Por ahora el bot confirma el pedido al cliente pero no te notifica directamente. Se recomienda revisar los logs de Railway o configurar un reenvío de mensajes en Twilio. En el futuro se puede agregar una notificación por correo.

---

## Soporte

Para problemas técnicos, revisar:
1. Los logs en Railway (pestaña "Deployments")
2. Los logs en Twilio (sección "Monitor → Logs")
3. El estado del servidor en: `https://tu-app.railway.app/stats`

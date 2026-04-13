/**
 * Bot de WhatsApp — Bombas de Dolor Bolivia
 * Proveedor: Twilio WhatsApp API
 */

"use strict";

require("dotenv").config();
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const axios = require("axios");
const { URLSearchParams } = require("url");

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "bomba_dolor_verify";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER; // ej: "whatsapp:+14155238886"

// Historial de conversaciones en memoria: { phoneNumber: { messages: [], lastActivity: Date } }
const conversationHistory = new Map();

// Tiempo máximo de inactividad antes de limpiar historial: 6 horas
const INACTIVITY_TIMEOUT_MS = 6 * 60 * 60 * 1000;

// Máximo de intercambios guardados por conversación (para controlar tokens)
const MAX_HISTORY_PAIRS = 10;

// ---------------------------------------------------------------------------
// Cliente de Anthropic
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ---------------------------------------------------------------------------
// System Prompt en Español
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Eres el Asistente Virtual de "Bombas de Dolor Bolivia", un negocio familiar en La Paz, Bolivia que vende bombas de dolor (pain pumps) para la recuperación post-cirugía plástica.

IDENTIDAD Y TONO:
- Tu nombre es "Asistente de Bombas de Dolor Bolivia"
- Eres cálido, empático y profesional — los clientes son pacientes en recuperación post-operatoria y pueden estar incómodos o ansiosos
- Habla siempre en español boliviano natural, sin ser demasiado formal ni demasiado informal
- Usa "usted" para mantener respeto, especialmente con pacientes mayores
- Sé conciso: los mensajes de WhatsApp deben tener máximo 3-5 oraciones. Si necesitas dar más información, divídela en varios mensajes cortos.

INFORMACIÓN DEL PRODUCTO:
- Producto: Bombas de dolor (pain pumps) para post-operatorio de cirugía plástica
- Son dispositivos médicos que administran anestésico local de forma continua en la zona operada
- Reducen el dolor post-operatorio sin necesitar pastillas en exceso
- Son de un solo uso, desechables y seguras cuando se usan correctamente
- Precio actual: [PRECIO_BS] bolivianos (a completar por el propietario)
- Cantidad mínima de pedido: 1 unidad
- Cantidad máxima por pedido: 10 unidades (consultar para pedidos mayores)
- Métodos de pago: Transferencia bancaria, QR de pago boliviano, efectivo en La Paz (a confirmar con el negocio)

LOGÍSTICA:
- Entrega en La Paz: 24 a 48 horas
- Entrega en otras ciudades de Bolivia: 3 a 5 días hábiles, coordinado por WhatsApp
- Costo de envío en La Paz: [COSTO_ENVIO_LAPAZ] bolivianos
- Costo de envío a otras ciudades: [COSTO_ENVIO_CIUDADES] bolivianos (varía según destino)

USO POST-OPERATORIO (información general, siempre derivar al médico):
- La bomba viene lista para usar, instalada por el médico cirujano durante la operación
- Administra anestésico local de forma continua por 2-5 días dependiendo del modelo
- El paciente lleva la bomba consigo (generalmente en una pequeña bolsa)
- No mojar la conexión ni jalar el tubo
- El médico indica cuándo y cómo retirarla
- Señales de alerta: enrojecimiento excesivo, fiebre, dolor que no cede → llamar al médico inmediatamente

REGLAS FUNDAMENTALES:
1. NUNCA des consejos médicos específicos sobre dosis, medicamentos o decisiones clínicas
2. SIEMPRE recomienda consultar al médico tratante para decisiones médicas
3. NUNCA inventes precios, fechas o información técnica que no esté en este prompt
4. Si no sabes algo, di honestamente "Para esa información específica, le recomiendo contactar directamente con nuestro equipo"
5. Si el cliente muestra signos de emergencia médica (dolor intenso, fiebre alta, sangrado), dile que llame a su médico INMEDIATAMENTE
6. Solo responde preguntas relacionadas con las bombas de dolor y el proceso de compra/entrega

FLUJO DE PEDIDO:
Cuando el cliente quiera hacer un pedido, solicita amablemente:
1. Nombre completo
2. Tipo de cirugía (para confirmar compatibilidad del producto)
3. Dirección de entrega (ciudad, barrio, referencia)
4. Cantidad de unidades
5. Método de pago preferido

Al tener todos los datos, confirma el pedido con un resumen claro.

SALUDO INICIAL:
Si el cliente saluda por primera vez, responde con:
"¡Hola! 👋 Bienvenido/a al servicio de *Bombas de Dolor Bolivia*. Soy su asistente virtual y estoy aquí para ayudarle con información sobre nuestras bombas de dolor para post-operatorio. ¿En qué le puedo ayudar hoy?"`;

// ---------------------------------------------------------------------------
// Funciones de gestión de historial
// ---------------------------------------------------------------------------

/**
 * Obtiene o crea el historial de conversación para un número de teléfono.
 */
function getHistory(phoneNumber) {
  const now = Date.now();

  if (conversationHistory.has(phoneNumber)) {
    const entry = conversationHistory.get(phoneNumber);
    // Si la conversación lleva más de 6 horas sin actividad, limpiarla
    if (now - entry.lastActivity > INACTIVITY_TIMEOUT_MS) {
      conversationHistory.delete(phoneNumber);
      return [];
    }
    entry.lastActivity = now;
    return entry.messages;
  }

  return [];
}

/**
 * Guarda un par de mensajes (usuario + asistente) en el historial.
 */
function saveToHistory(phoneNumber, userMessage, assistantMessage) {
  const now = Date.now();
  let messages = getHistory(phoneNumber);

  messages.push({ role: "user", content: userMessage });
  messages.push({ role: "assistant", content: assistantMessage });

  // Mantener solo los últimos MAX_HISTORY_PAIRS intercambios
  const maxMessages = MAX_HISTORY_PAIRS * 2;
  if (messages.length > maxMessages) {
    messages = messages.slice(messages.length - maxMessages);
  }

  conversationHistory.set(phoneNumber, { messages, lastActivity: now });
}

/**
 * Limpia historiales inactivos periódicamente (cada hora).
 */
function cleanupInactiveHistories() {
  const now = Date.now();
  for (const [phone, entry] of conversationHistory.entries()) {
    if (now - entry.lastActivity > INACTIVITY_TIMEOUT_MS) {
      conversationHistory.delete(phone);
    }
  }
}

setInterval(cleanupInactiveHistories, 60 * 60 * 1000);

// ---------------------------------------------------------------------------
// Función principal: llamar a Claude
// ---------------------------------------------------------------------------

/**
 * Envía el mensaje del usuario a Claude y devuelve la respuesta en texto.
 * @param {string} phoneNumber - Número de teléfono del cliente
 * @param {string} userMessage - Texto del mensaje del cliente
 * @returns {Promise<string>} - Respuesta de Claude
 */
async function getBotResponse(phoneNumber, userMessage) {
  const history = getHistory(phoneNumber);

  const messages = [
    ...history,
    { role: "user", content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: messages,
  });

  const assistantMessage = response.content[0].text;

  // Guardar en historial
  saveToHistory(phoneNumber, userMessage, assistantMessage);

  return assistantMessage;
}

// ---------------------------------------------------------------------------
// Función para enviar mensajes via Twilio
// ---------------------------------------------------------------------------

/**
 * Envía un mensaje de WhatsApp usando la API de Twilio.
 * @param {string} to - Número de destino en formato "whatsapp:+591XXXXXXXX"
 * @param {string} message - Texto del mensaje
 */
async function sendWhatsAppMessage(to, message) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const params = new URLSearchParams();
  params.append("From", TWILIO_WHATSAPP_NUMBER);
  params.append("To", to);
  params.append("Body", message);

  await axios.post(url, params.toString(), {
    auth: {
      username: TWILIO_ACCOUNT_SID,
      password: TWILIO_AUTH_TOKEN,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

// ---------------------------------------------------------------------------
// Servidor Express
// ---------------------------------------------------------------------------

const app = express();

// Parsear body de Twilio (form-urlencoded) y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Endpoint de salud
// ---------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Bombas de Dolor Bolivia - WhatsApp Bot",
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Webhook: verificación (GET) — requerido por Meta/Twilio para activar el webhook
// ---------------------------------------------------------------------------

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado correctamente.");
    res.status(200).send(challenge);
  } else {
    // También aceptar el token simple para Twilio
    res.status(200).send("OK");
  }
});

// ---------------------------------------------------------------------------
// Webhook: recibir mensajes entrantes (POST)
// ---------------------------------------------------------------------------

app.post("/webhook", async (req, res) => {
  // Twilio envía los datos como form-urlencoded
  const body = req.body;

  // Responder a Twilio inmediatamente con 200 para evitar reintentos
  res.status(200).send("OK");

  try {
    // Extraer datos del mensaje de Twilio
    const fromNumber = body.From; // ej: "whatsapp:+591XXXXXXXX"
    const messageBody = body.Body || "";
    const messageType = body.MediaContentType0 ? getMediaType(body.MediaContentType0) : "text";
    const numMedia = parseInt(body.NumMedia || "0", 10);

    if (!fromNumber) {
      console.log("Webhook recibido sin número de origen, ignorando.");
      return;
    }

    console.log(`[${new Date().toISOString()}] Mensaje de ${fromNumber}: tipo=${messageType}, texto="${messageBody.substring(0, 50)}"`);

    let userMessage = messageBody;

    // Manejar mensajes no textuales (audio, imagen, video, documento)
    if (numMedia > 0 || messageType !== "text") {
      if (messageType === "audio") {
        userMessage = "[El cliente envió una nota de voz]";
        const response = "Gracias por su mensaje 🎤 Por el momento solo puedo leer mensajes de texto. ¿Podría escribir su consulta? Estoy aquí para ayudarle.";
        await sendWhatsAppMessage(fromNumber, response);
        return;
      } else if (messageType === "image") {
        userMessage = "[El cliente envió una imagen]";
        const response = "Gracias por la imagen 📷 Por el momento solo proceso mensajes de texto. ¿Podría escribir su consulta? Con gusto le atiendo.";
        await sendWhatsAppMessage(fromNumber, response);
        return;
      } else if (messageType === "video") {
        const response = "Gracias por su video 📹 Por ahora solo proceso mensajes de texto. ¿Podría escribir su consulta?";
        await sendWhatsAppMessage(fromNumber, response);
        return;
      } else if (messageType === "document") {
        const response = "Gracias por el documento 📄 Por ahora solo proceso mensajes de texto. ¿En qué le puedo ayudar?";
        await sendWhatsAppMessage(fromNumber, response);
        return;
      }
    }

    // Si el mensaje de texto está vacío
    if (!userMessage || userMessage.trim() === "") {
      await sendWhatsAppMessage(fromNumber, "Disculpe, no pude leer su mensaje. ¿Podría escribirlo nuevamente?");
      return;
    }

    // Obtener respuesta de Claude
    const claudeResponse = await getBotResponse(fromNumber, userMessage.trim());

    // Enviar respuesta al cliente
    await sendWhatsAppMessage(fromNumber, claudeResponse);

    console.log(`[${new Date().toISOString()}] Respuesta enviada a ${fromNumber}`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error procesando mensaje:`, error.message);

    // Intentar notificar al cliente del error
    try {
      const fromNumber = req.body.From;
      if (fromNumber) {
        await sendWhatsAppMessage(
          fromNumber,
          "Disculpe, tuve un problema técnico momentáneo. Por favor intente nuevamente en unos segundos. Si el problema persiste, contáctenos directamente."
        );
      }
    } catch (sendError) {
      console.error("No se pudo enviar mensaje de error al cliente:", sendError.message);
    }
  }
});

// ---------------------------------------------------------------------------
// Función auxiliar: determinar tipo de media
// ---------------------------------------------------------------------------

function getMediaType(contentType) {
  if (!contentType) return "text";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("application/")) return "document";
  return "other";
}

// ---------------------------------------------------------------------------
// Endpoint para limpiar historial de una conversación (útil para testing)
// ---------------------------------------------------------------------------

app.delete("/history/:phone", (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  if (conversationHistory.has(phone)) {
    conversationHistory.delete(phone);
    res.json({ success: true, message: `Historial de ${phone} eliminado.` });
  } else {
    res.status(404).json({ success: false, message: "No se encontró historial para ese número." });
  }
});

// ---------------------------------------------------------------------------
// Endpoint de estadísticas (para monitoreo básico)
// ---------------------------------------------------------------------------

app.get("/stats", (req, res) => {
  res.json({
    active_conversations: conversationHistory.size,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Manejo de rutas no encontradas
// ---------------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ---------------------------------------------------------------------------
// Manejo global de errores de Express
// ---------------------------------------------------------------------------

app.use((err, req, res, next) => {
  console.error("Error no manejado:", err.message);
  res.status(500).json({ error: "Error interno del servidor" });
});

// ---------------------------------------------------------------------------
// Iniciar servidor
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log("================================================");
  console.log("  Bot de WhatsApp — Bombas de Dolor Bolivia");
  console.log("================================================");
  console.log(`  Servidor activo en el puerto: ${PORT}`);
  console.log(`  Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`  Webhook URL: http://localhost:${PORT}/webhook`);
  console.log("================================================");

  // Verificar variables de entorno críticas
  const missingVars = [];
  if (!process.env.ANTHROPIC_API_KEY) missingVars.push("ANTHROPIC_API_KEY");
  if (!TWILIO_ACCOUNT_SID) missingVars.push("TWILIO_ACCOUNT_SID");
  if (!TWILIO_AUTH_TOKEN) missingVars.push("TWILIO_AUTH_TOKEN");
  if (!TWILIO_WHATSAPP_NUMBER) missingVars.push("TWILIO_WHATSAPP_NUMBER");

  if (missingVars.length > 0) {
    console.warn(`  ⚠️  Variables de entorno faltantes: ${missingVars.join(", ")}`);
    console.warn("  El bot puede no funcionar correctamente sin estas variables.");
  } else {
    console.log("  Todas las variables de entorno configuradas correctamente.");
  }
  console.log("================================================");
});

module.exports = app;

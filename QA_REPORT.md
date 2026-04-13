# Reporte de Revisión — PaxMedica / Bombas de Dolor Bolivia

Fecha: 2026-04-12

---

## Landing Page (index.html)

### Lo que está bien ✅

- El archivo tiene el idioma declarado correctamente (`lang="es"`)
- La página se adapta a celulares, tablets y computadoras
- Todas las secciones están presentes: Hero, ¿Qué es?, Beneficios, Cómo Funciona, Testimonios, Cómo Pedir, Preguntas Frecuentes, Llamada a la acción final, y Footer
- El footer incluye el aviso médico legal
- Hay 4 espacios marcados donde van las fotos del producto
- El acordeón de Preguntas Frecuentes abre y cierra correctamente
- Los 8 botones de WhatsApp usan el mismo número de teléfono (`591XXXXXXXX`)
- Cada botón de WhatsApp ya tiene un mensaje escrito listo para enviar
- Las fuentes se cargan de manera optimizada (preconnect a Google Fonts)
- La página usa etiquetas HTML semánticas (header, main, section, footer)
- Los elementos interactivos tienen descripciones para lectores de pantalla (accesibilidad)
- Las imágenes tienen texto alternativo

### Advertencias menores ⚠️
*(No rompen la página, pero conviene tenerlas en cuenta)*

- No hay un punto de corte específico en 375px, aunque el diseño fluido igual funciona bien en ese tamaño
- Las imágenes reales van a necesitar el atributo `loading="lazy"` cuando se reemplacen los espacios reservados
- Falta la etiqueta `og:url` para que el preview de WhatsApp sea más completo
- Los testimonios son de ejemplo — reemplazarlos con testimonios reales antes de lanzar

### Pendiente antes de publicar ❌

- Reemplazar `591XXXXXXXX` con el número real de WhatsApp en todo el archivo (8 lugares)
- Agregar la URL real de la imagen del producto en la etiqueta `og:image` (para el preview al compartir el link)
- Subir las 4 fotos del producto y reemplazar los espacios reservados

---

## Bot de WhatsApp (carpeta bot/)

### Lo que está bien ✅

- Las variables de entorno se cargan correctamente al arrancar
- El bot responde en español
- Maneja correctamente los 5 temas principales:
  - Qué es la bomba de dolor
  - Precio
  - Tiempo de entrega
  - Instrucciones de uso
  - Seguridad del producto
- Si alguien manda un audio, imagen o video, el bot responde amablemente pidiendo que escriba su consulta
- Si el mensaje llega vacío, el bot lo maneja sin romperse
- El servidor guarda el historial de conversación por 6 horas sin necesidad de base de datos
- Responde inmediatamente al webhook de Twilio antes de procesar el mensaje (evita mensajes duplicados)
- Si faltan variables de entorno al arrancar, el servidor avisa en consola qué falta

### Advertencia importante ⚠️

- **El webhook no verifica la firma de Twilio** — esto significa que alguien que conozca la URL del servidor podría enviar mensajes falsos. Es bajo riesgo si la URL no es pública, pero conviene activar la verificación antes de escalar a muchos usuarios.

---

## Instrucciones para publicar

### Landing Page en Vercel (gratis)

1. Crear cuenta en [vercel.com](https://vercel.com) si no tienes una
2. Instalar Vercel en la terminal: `npm install -g vercel`
3. Dentro de la carpeta del proyecto, escribir: `vercel`
4. Seguir los pasos que aparecen en pantalla (son 4-5 preguntas simples)
5. Al terminar, Vercel da un link `.vercel.app` — ese es tu sitio en vivo
6. **Importante:** antes de publicar, reemplazar el número de WhatsApp en `index.html`

### Bot en Railway (~5 USD/mes)

1. Crear cuenta en [railway.app](https://railway.app)
2. Crear un nuevo proyecto desde GitHub o subiendo la carpeta `bot/`
3. En la sección de variables de entorno en Railway, agregar los valores de `.env`
4. Railway detecta automáticamente que es Node.js y lo despliega solo
5. Copiar la URL que da Railway y configurarla como webhook en Twilio
6. Para probar, mandar un WhatsApp al número de Twilio sandbox

---

## Lista de tareas antes de ir en vivo

- [ ] Reemplazar `591XXXXXXXX` con el número real de WhatsApp en `index.html`
- [ ] Cambiar `[PRECIO_BS]` en el bot con el precio real en bolivianos
- [ ] Cambiar `[COSTO_ENVIO_LP]` y `[COSTO_ENVIO_INT]` con los costos reales de envío
- [ ] Tomar las 4 fotos del producto y reemplazar los espacios en la landing
- [ ] Crear cuenta en Twilio y completar el archivo `.env` del bot
- [ ] Probar el bot en el sandbox de Twilio antes de activarlo en producción
- [ ] Hacer clic en cada botón de WhatsApp desde un celular real para verificar que funcionan

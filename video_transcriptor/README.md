# Video Transcription App

Una aplicación moderna para transcribir y traducir videos usando IA, manteniendo las características originales de voz.

## Características

- 🎥 **Subida de videos grandes**: Hasta 1GB de tamaño
- 🎤 **Transcripción con IA**: Preserva tono, acento y sensibilidad
- 🌐 **Traducción multiidioma**: Soporte para 10+ idiomas
- 🔊 **Preservación de voz**: Mantiene características originales
- 📱 **Diseño responsivo**: Funciona en móvil, tablet y desktop
- 🔔 **Notificaciones en tiempo real**: Sistema completo de alertas
- 💾 **Backend gratuito**: Integración con Supabase

## Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **Notificaciones**: React Hot Toast
- **Iconos**: Lucide React
- **IA**: OpenAI Whisper, Google Translate, ElevenLabs
- **Procesamiento**: FFmpeg WebAssembly

## Configuración

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar Supabase**:
   - Haz clic en "Connect to Supabase" en la aplicación
   - O crea un proyecto en [supabase.com](https://supabase.com)
   - Copia las variables de entorno al archivo `.env`

3. **Configurar APIs de IA**:
   - **OpenAI**: Obtén tu API key en [platform.openai.com](https://platform.openai.com/api-keys)
   - **Google Translate**: Activa la API en [Google Cloud Console](https://console.cloud.google.com/)
   - **ElevenLabs**: Registrate en [elevenlabs.io](https://elevenlabs.io) y obtén tu API key
   - Agrega las keys como variables de entorno en Supabase Edge Functions

4. **Ejecutar la aplicación**:
   ```bash
   npm run dev
   ```

## APIs Integradas

### 🎤 OpenAI Whisper
- **Función**: Transcripción de audio a texto
- **Características**: Reconocimiento automático de idioma, alta precisión
- **Costo**: ~$0.006 por minuto de audio

### 🌐 Google Translate API
- **Función**: Traducción de texto entre idiomas
- **Características**: Soporte para 100+ idiomas, detección automática
- **Costo**: ~$20 por millón de caracteres

### 🔊 ElevenLabs
- **Función**: Síntesis de voz con preservación de características
- **Características**: Clonación de voz, múltiples idiomas, alta calidad
- **Costo**: Plan gratuito con 10,000 caracteres/mes

### 🎬 FFmpeg
- **Función**: Extracción de audio de archivos de video
- **Características**: Soporte para todos los formatos de video
- **Implementación**: WebAssembly para procesamiento en el navegador

## Uso

1. **Seleccionar idioma de destino** en el selector superior
2. **Arrastrar videos** al área de subida o hacer clic para seleccionar
3. **Monitorear el progreso** en tiempo real
4. **Descargar el MP3 traducido** una vez completado

## Formatos Soportados

- **Video**: MP4, AVI, MOV, MKV
- **Tamaño máximo**: 1GB por archivo
- **Salida**: MP3 con voz traducida

## Estados del Proceso

1. **Subiendo**: Carga del archivo al servidor
2. **Procesando**: Extracción del audio del video
3. **Transcribiendo**: Conversión de audio a texto con IA
4. **Traduciendo**: Traducción y síntesis de voz
5. **Completado**: Archivo listo para descarga

## Arquitectura

### Frontend (React + TypeScript)
- Interfaz de usuario responsiva
- Sistema de notificaciones en tiempo real
- Manejo de estados de procesamiento
- Integración con Supabase

### Backend (Supabase)
- **Base de datos**: PostgreSQL para metadatos
- **Storage**: Almacenamiento de archivos de video y audio
- **Edge Functions**: Procesamiento con APIs de IA
- **Real-time**: Actualizaciones en tiempo real

### Edge Functions
1. **process-video**: Orquesta todo el pipeline de IA
2. **extract-audio**: Extrae audio usando FFmpeg

### Pipeline de Procesamiento
```
Video Upload → Audio Extraction → Transcription → Translation → Speech Synthesis → Download
     ↓              ↓               ↓             ↓              ↓
  Supabase      FFmpeg         OpenAI        Google        ElevenLabs
  Storage      WebAssembly     Whisper       Translate        API
```

## Costos Estimados

Para un video de 10 minutos:
- **OpenAI Whisper**: ~$0.06
- **Google Translate**: ~$0.02 (1000 palabras)
- **ElevenLabs**: ~$0.30 (3000 caracteres)
- **Total**: ~$0.38 por video

## Configuración de Producción

1. **Variables de entorno en Supabase**:
   ```bash
   OPENAI_API_KEY=sk-...
   GOOGLE_TRANSLATE_API_KEY=AIza...
   ELEVENLABS_API_KEY=...
   ```

2. **Límites recomendados**:
   - Tamaño máximo de archivo: 1GB
   - Tiempo máximo de procesamiento: 30 minutos
   - Límite de archivos simultáneos: 5

3. **Monitoreo**:
   - Logs de Edge Functions
   - Métricas de uso de APIs
   - Costos por procesamiento

## Licencia

MIT License
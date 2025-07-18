import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessVideoRequest {
  jobId: string;
  filePath: string;
  targetLanguage: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { jobId, filePath, targetLanguage }: ProcessVideoRequest = await req.json()

    // Update status to processing
    await supabase
      .from('transcriptions')
      .update({ status: 'processing', progress: 10 })
      .eq('id', jobId)

    // Step 1: Extract audio using FFmpeg
    const audioPath = await extractAudio(supabase, filePath, jobId)
    
    await supabase
      .from('transcriptions')
      .update({ status: 'transcribing', progress: 30 })
      .eq('id', jobId)

    // Step 2: Transcribe with OpenAI Whisper
    const transcription = await transcribeAudio(audioPath)
    
    await supabase
      .from('transcriptions')
      .update({ 
        status: 'translating', 
        progress: 60,
        original_language: transcription.language,
        transcription_text: transcription.text
      })
      .eq('id', jobId)

    // Step 3: Translate text
    const translatedText = await translateText(transcription.text, targetLanguage)
    
    await supabase
      .from('transcriptions')
      .update({ progress: 80 })
      .eq('id', jobId)

    // Step 4: Generate speech with ElevenLabs
    const audioUrl = await generateSpeech(translatedText, jobId, supabase)
    
    // Mark as completed
    await supabase
      .from('transcriptions')
      .update({ 
        status: 'completed', 
        progress: 100,
        audio_url: audioUrl
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({ success: true, audioUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing video:', error)
    
    // Update job with error status
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const { jobId } = await req.json().catch(() => ({}))
    if (jobId) {
      await supabase
        .from('transcriptions')
        .update({ 
          status: 'error', 
          error_message: error.message 
        })
        .eq('id', jobId)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function extractAudio(supabase: any, videoPath: string, jobId: string): Promise<string> {
  // Download video file from Supabase storage
  const { data: videoData } = await supabase.storage
    .from('video-files')
    .download(videoPath)

  if (!videoData) throw new Error('Failed to download video file')

  // Convert video data to audio using FFmpeg
  // Note: In a real implementation, you'd use FFmpeg WebAssembly or a server-side solution
  const audioPath = `audio/${jobId}.wav`
  
  // Simulate audio extraction (in production, use actual FFmpeg)
  const audioBlob = await simulateAudioExtraction(videoData)
  
  // Upload extracted audio
  const { error } = await supabase.storage
    .from('video-files')
    .upload(audioPath, audioBlob)

  if (error) throw error
  
  return audioPath
}

async function simulateAudioExtraction(videoData: Blob): Promise<Blob> {
  // This is a simulation - in production, you'd use FFmpeg
  // For now, we'll create a dummy audio blob
  return new Blob(['dummy audio data'], { type: 'audio/wav' })
}

async function transcribeAudio(audioPath: string): Promise<{ text: string; language: string }> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) throw new Error('OpenAI API key not configured')

  // In a real implementation, you'd download the audio file and send it to OpenAI
  // For now, we'll simulate the API call
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'multipart/form-data',
    },
    body: createFormData(audioPath)
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const result = await response.json()
  return {
    text: result.text,
    language: result.language || 'es'
  }
}

function createFormData(audioPath: string): FormData {
  const formData = new FormData()
  // In production, you'd add the actual audio file here
  formData.append('file', new Blob(['dummy']), 'audio.wav')
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'json')
  return formData
}

async function translateText(text: string, targetLanguage: string): Promise<string> {
  const googleApiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY')
  if (!googleApiKey) throw new Error('Google Translate API key not configured')

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      target: targetLanguage,
      format: 'text'
    })
  })

  if (!response.ok) {
    throw new Error(`Google Translate API error: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data.translations[0].translatedText
}

async function generateSpeech(text: string, jobId: string, supabase: any): Promise<string> {
  const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
  if (!elevenlabsApiKey) throw new Error('ElevenLabs API key not configured')

  // Use a default voice ID (you can make this configurable)
  const voiceId = 'pNInz6obpgDQGcFmaJgB' // Adam voice

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': elevenlabsApiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    })
  })

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`)
  }

  const audioBuffer = await response.arrayBuffer()
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
  
  // Upload generated audio to Supabase storage
  const audioPath = `generated/${jobId}.mp3`
  const { error } = await supabase.storage
    .from('video-files')
    .upload(audioPath, audioBlob)

  if (error) throw error

  // Get public URL
  const { data } = supabase.storage
    .from('video-files')
    .getPublicUrl(audioPath)

  return data.publicUrl
}
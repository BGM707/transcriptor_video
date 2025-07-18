import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TranscriptionRecord {
  id: string;
  file_name: string;
  file_size: number;
  status: 'uploading' | 'processing' | 'transcribing' | 'translating' | 'completed' | 'error';
  progress: number;
  original_language?: string;
  target_language: string;
  audio_url?: string;
  transcription_text?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
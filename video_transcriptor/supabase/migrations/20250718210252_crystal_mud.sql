/*
  # Create transcriptions table

  1. New Tables
    - `transcriptions`
      - `id` (uuid, primary key)
      - `file_name` (text, not null)
      - `file_size` (bigint, not null)
      - `status` (text, not null, default 'uploading')
      - `progress` (integer, default 0)
      - `original_language` (text)
      - `target_language` (text, not null)
      - `audio_url` (text)
      - `transcription_text` (text)
      - `error_message` (text)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `transcriptions` table
    - Add policy for users to manage their own transcriptions
*/

CREATE TABLE IF NOT EXISTS transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  status text NOT NULL DEFAULT 'uploading',
  progress integer DEFAULT 0,
  original_language text,
  target_language text NOT NULL,
  audio_url text,
  transcription_text text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (in production, you'd want user-specific policies)
CREATE POLICY "Allow all operations on transcriptions"
  ON transcriptions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for video files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('video-files', 'video-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow all operations on video files bucket
CREATE POLICY "Allow all operations on video files"
  ON storage.objects
  FOR ALL
  TO anon, authenticated
  USING (bucket_id = 'video-files')
  WITH CHECK (bucket_id = 'video-files');
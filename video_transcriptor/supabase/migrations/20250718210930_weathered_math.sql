/*
  # Add API keys configuration table

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `service` (text, not null) - openai, google_translate, elevenlabs
      - `key_value` (text, not null) - encrypted API key
      - `is_active` (boolean, default true)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `api_keys` table
    - Add policy for admin access only
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL UNIQUE,
  key_value text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access API keys (for edge functions)
CREATE POLICY "Service role can manage API keys"
  ON api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default API key placeholders
INSERT INTO api_keys (service, key_value, is_active) VALUES
  ('openai', 'your_openai_api_key_here', false),
  ('google_translate', 'your_google_translate_api_key_here', false),
  ('elevenlabs', 'your_elevenlabs_api_key_here', false)
ON CONFLICT (service) DO NOTHING;
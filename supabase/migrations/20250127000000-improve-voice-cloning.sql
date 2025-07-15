-- Improve voice cloning support and voice library integration
-- This migration ensures cloned voices are properly saved and managed

-- Add duration column to voices table if not exists
ALTER TABLE public.voices 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;

-- Update voice_type constraint to include more voice types
ALTER TABLE public.voices 
DROP CONSTRAINT IF EXISTS voices_voice_type_check;

ALTER TABLE public.voices 
ADD CONSTRAINT voices_voice_type_check 
CHECK (voice_type IN ('conversational', 'narrative', 'ai', 'robotic', 'natural', 'cloned', 'generated', 'professional', 'casual', 'custom'));

-- Ensure all required columns exist for voice cloning
ALTER TABLE public.voices 
ADD COLUMN IF NOT EXISTS external_voice_id TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS voice_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_cloned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS clone_source_url TEXT,
ADD COLUMN IF NOT EXISTS clone_quality TEXT DEFAULT 'standard' CHECK (clone_quality IN ('standard', 'high', 'premium'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voices_provider ON public.voices(provider);
CREATE INDEX IF NOT EXISTS idx_voices_external_voice_id ON public.voices(external_voice_id);
CREATE INDEX IF NOT EXISTS idx_voices_is_cloned ON public.voices(is_cloned);
CREATE INDEX IF NOT EXISTS idx_voices_user_voice_type ON public.voices(user_id, voice_type);

-- Update provider constraint
ALTER TABLE public.voices 
DROP CONSTRAINT IF EXISTS voices_provider_check;

ALTER TABLE public.voices 
ADD CONSTRAINT voices_provider_check 
CHECK (provider IN ('local', 'elevenlabs', 'openai', 'azure', 'aws', 'google', 'custom'));

-- Create function to automatically set is_cloned when voice_type is 'cloned'
CREATE OR REPLACE FUNCTION public.set_is_cloned_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.voice_type = 'cloned' THEN
    NEW.is_cloned = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set is_cloned flag
DROP TRIGGER IF EXISTS trigger_set_is_cloned_flag ON public.voices;
CREATE TRIGGER trigger_set_is_cloned_flag
  BEFORE INSERT OR UPDATE ON public.voices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_is_cloned_flag();

-- Create a view for easier querying of cloned voices
CREATE OR REPLACE VIEW public.cloned_voices AS
SELECT 
  v.*,
  CASE 
    WHEN v.provider = 'elevenlabs' THEN 'ElevenLabs'
    WHEN v.provider = 'openai' THEN 'OpenAI'
    WHEN v.provider = 'azure' THEN 'Azure'
    WHEN v.provider = 'aws' THEN 'AWS'
    WHEN v.provider = 'google' THEN 'Google'
    ELSE 'Local'
  END as provider_display_name
FROM public.voices v
WHERE v.is_cloned = TRUE OR v.voice_type = 'cloned';

-- Grant access to the view
GRANT SELECT ON public.cloned_voices TO authenticated;

-- Create function to get user's available voices (including cloned)
CREATE OR REPLACE FUNCTION public.get_user_voices(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  language TEXT,
  voice_type TEXT,
  description TEXT,
  audio_url TEXT,
  duration INTEGER,
  external_voice_id TEXT,
  provider TEXT,
  voice_settings JSONB,
  is_cloned BOOLEAN,
  clone_source_url TEXT,
  clone_quality TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  provider_display_name TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    v.id,
    v.user_id,
    v.name,
    v.language,
    v.voice_type,
    v.description,
    v.audio_url,
    v.duration,
    v.external_voice_id,
    v.provider,
    v.voice_settings,
    v.is_cloned,
    v.clone_source_url,
    v.clone_quality,
    v.created_at,
    v.updated_at,
    CASE 
      WHEN v.provider = 'elevenlabs' THEN 'ElevenLabs'
      WHEN v.provider = 'openai' THEN 'OpenAI'
      WHEN v.provider = 'azure' THEN 'Azure'
      WHEN v.provider = 'aws' THEN 'AWS'
      WHEN v.provider = 'google' THEN 'Google'
      ELSE 'Local'
    END as provider_display_name
  FROM public.voices v
  WHERE v.user_id = user_uuid
  ORDER BY v.created_at DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_voices(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.voices.clone_quality IS 'Quality level of the cloned voice (standard, high, premium)';
COMMENT ON VIEW public.cloned_voices IS 'View showing all cloned voices with provider display names';
COMMENT ON FUNCTION public.get_user_voices(UUID) IS 'Function to get all voices for a specific user including cloned voices';
COMMENT ON FUNCTION public.set_is_cloned_flag() IS 'Automatically sets is_cloned flag when voice_type is cloned';
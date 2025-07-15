-- Add voice cloning support to the voices table
-- This migration adds fields needed for voice cloning functionality with ElevenLabs

-- Add new columns for voice cloning
ALTER TABLE public.voices 
ADD COLUMN IF NOT EXISTS external_voice_id TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'local',
ADD COLUMN IF NOT EXISTS voice_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_cloned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS clone_source_url TEXT;

-- Update the voice_type constraint to include cloned voices
ALTER TABLE public.voices 
DROP CONSTRAINT IF EXISTS voices_voice_type_check;

ALTER TABLE public.voices 
ADD CONSTRAINT voices_voice_type_check 
CHECK (voice_type IN ('conversational', 'narrative', 'ai', 'robotic', 'natural', 'cloned', 'generated', 'professional', 'casual'));

-- Add provider constraint
ALTER TABLE public.voices 
ADD CONSTRAINT voices_provider_check 
CHECK (provider IN ('local', 'elevenlabs', 'openai', 'azure', 'aws', 'google'));

-- Create index for better performance when querying by provider
CREATE INDEX IF NOT EXISTS idx_voices_provider ON public.voices(provider);
CREATE INDEX IF NOT EXISTS idx_voices_external_voice_id ON public.voices(external_voice_id);
CREATE INDEX IF NOT EXISTS idx_voices_is_cloned ON public.voices(is_cloned);

-- Create voice_generations table for tracking text-to-speech generations
CREATE TABLE IF NOT EXISTS public.voice_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voice_id UUID REFERENCES public.voices(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  output_language TEXT NOT NULL DEFAULT 'en-US',
  voice_settings JSONB DEFAULT '{}',
  audio_url TEXT,
  audio_duration INTEGER, -- in seconds
  character_count INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  provider TEXT DEFAULT 'elevenlabs',
  external_generation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on voice_generations
ALTER TABLE public.voice_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voice_generations
CREATE POLICY "Users can view their own voice generations" 
ON public.voice_generations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice generations" 
ON public.voice_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice generations" 
ON public.voice_generations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice generations" 
ON public.voice_generations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at on voice_generations
CREATE TRIGGER update_voice_generations_updated_at
BEFORE UPDATE ON public.voice_generations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_generations_user_id ON public.voice_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_generations_voice_id ON public.voice_generations(voice_id);
CREATE INDEX IF NOT EXISTS idx_voice_generations_status ON public.voice_generations(status);
CREATE INDEX IF NOT EXISTS idx_voice_generations_provider ON public.voice_generations(provider);
CREATE INDEX IF NOT EXISTS idx_voice_generations_created_at ON public.voice_generations(created_at DESC);

-- Create voice_usage_stats table for tracking API usage
CREATE TABLE IF NOT EXISTS public.voice_usage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('clone', 'synthesize', 'transform')),
  character_count INTEGER DEFAULT 0,
  audio_duration INTEGER DEFAULT 0, -- in seconds
  cost_credits INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on voice_usage_stats
ALTER TABLE public.voice_usage_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voice_usage_stats
CREATE POLICY "Users can view their own usage stats" 
ON public.voice_usage_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage stats" 
ON public.voice_usage_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for usage stats
CREATE INDEX IF NOT EXISTS idx_voice_usage_stats_user_id ON public.voice_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_usage_stats_provider ON public.voice_usage_stats(provider);
CREATE INDEX IF NOT EXISTS idx_voice_usage_stats_operation_type ON public.voice_usage_stats(operation_type);
CREATE INDEX IF NOT EXISTS idx_voice_usage_stats_created_at ON public.voice_usage_stats(created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN public.voices.external_voice_id IS 'External voice ID from third-party providers (e.g., ElevenLabs voice ID)';
COMMENT ON COLUMN public.voices.provider IS 'Voice provider service (local, elevenlabs, openai, etc.)';
COMMENT ON COLUMN public.voices.voice_settings IS 'JSON settings for voice synthesis (stability, similarity_boost, etc.)';
COMMENT ON COLUMN public.voices.is_cloned IS 'Whether this voice is a clone of another voice';
COMMENT ON COLUMN public.voices.clone_source_url IS 'URL to the source audio used for cloning';

COMMENT ON TABLE public.voice_generations IS 'Track text-to-speech generation requests and results';
COMMENT ON TABLE public.voice_usage_stats IS 'Track API usage and costs for voice operations';
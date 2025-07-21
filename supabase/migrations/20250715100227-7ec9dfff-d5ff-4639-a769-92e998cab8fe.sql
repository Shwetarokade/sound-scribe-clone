-- Update voices table to use voice_type instead of category
ALTER TABLE public.voices RENAME COLUMN category TO voice_type;

-- Add constraint for voice types
ALTER TABLE public.voices 
ADD CONSTRAINT voices_voice_type_check 
CHECK (voice_type IN ('conversational', 'narrative', 'ai', 'robotic', 'natural'));

-- Add admin/service role insert policy for voices
CREATE POLICY "Service role can insert any voice" 
  ON public.voices 
  FOR INSERT 
  TO authenticated 
  USING (auth.role() = 'service_role') 
  WITH CHECK (true);

-- Create generated_voices table for recent generations
CREATE TABLE public.generated_voices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voice_id UUID REFERENCES public.voices(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  output_language TEXT NOT NULL DEFAULT 'en',
  speed REAL NOT NULL DEFAULT 1.0,
  pitch REAL NOT NULL DEFAULT 1.0,
  audio_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on generated_voices
ALTER TABLE public.generated_voices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for generated_voices
CREATE POLICY "Users can view their own generations" 
ON public.generated_voices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generations" 
ON public.generated_voices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations" 
ON public.generated_voices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" 
ON public.generated_voices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps for generated_voices
CREATE TRIGGER update_generated_voices_updated_at
BEFORE UPDATE ON public.generated_voices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
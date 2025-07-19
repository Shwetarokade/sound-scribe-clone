-- Create profiles table if it doesn't exist (referenced by voice_generations)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Drop existing tables if they exist to recreate with new structure
DROP TABLE IF EXISTS public.generated_voices CASCADE;
DROP TABLE IF EXISTS public.voices CASCADE;

-- Create voices table with new structure
CREATE TABLE public.voices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  language text NOT NULL,
  description text NULL,
  creator_id uuid NOT NULL,
  reference_audio_id text NOT NULL,
  api_speaker_id text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  audio_storage_path text NULL,
  CONSTRAINT voices_pkey PRIMARY KEY (id),
  CONSTRAINT voices_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Create voice_generations table with new structure
CREATE TABLE public.voice_generations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  voice_id uuid NULL,
  text text NOT NULL,
  audio_url text NOT NULL,
  is_favorite boolean NOT NULL DEFAULT false,
  duration_seconds integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NULL,
  CONSTRAINT voice_generations_pkey PRIMARY KEY (id),
  CONSTRAINT voice_generations_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT voice_generations_voice_id_fkey FOREIGN KEY (voice_id) REFERENCES voices (id) ON DELETE SET NULL
);

-- Enable RLS on voices
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

-- Create policies for voices
CREATE POLICY "Users can view their own voices" 
ON public.voices 
FOR SELECT 
USING (creator_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own voices" 
ON public.voices 
FOR INSERT 
WITH CHECK (creator_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own voices" 
ON public.voices 
FOR UPDATE 
USING (creator_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own voices" 
ON public.voices 
FOR DELETE 
USING (creator_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Enable RLS on voice_generations
ALTER TABLE public.voice_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for voice_generations
CREATE POLICY "Users can view their own voice generations" 
ON public.voice_generations 
FOR SELECT 
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own voice generations" 
ON public.voice_generations 
FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own voice generations" 
ON public.voice_generations 
FOR UPDATE 
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own voice generations" 
ON public.voice_generations 
FOR DELETE 
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_voices_updated_at
    BEFORE UPDATE ON public.voices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
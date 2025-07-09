
-- Create a table to store voice data
CREATE TABLE public.voices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own voices
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

-- Create policies for the voices table
CREATE POLICY "Users can view their own voices" 
  ON public.voices 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voices" 
  ON public.voices 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voices" 
  ON public.voices 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voices" 
  ON public.voices 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for voice files
INSERT INTO storage.buckets (id, name, public)
VALUES ('voices', 'voices', true);

-- Create storage policies for the voices bucket
CREATE POLICY "Users can upload their own voice files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own voice files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own voice files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'voices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own voice files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'voices' AND auth.uid()::text = (storage.foldername(name))[1]);

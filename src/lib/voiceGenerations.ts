import { supabase } from "@/integrations/supabase/client";

export async function getVoiceGenerationsByUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_voices')
      .select(`
        id,
        voice_id,
        input_text,
        audio_url,
        created_at,
        speed,
        pitch,
        output_language
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching voice generations:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}
import { supabase } from "@/integrations/supabase/client";

export async function getVoiceGenerationsByUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('voice_generations')
      .select(`
        id,
        voice_id,
        text,
        audio_url,
        created_at,
        is_favorite,
        duration_seconds,
        name
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

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import WaveformRecorder from "./WaveformRecorder";
import VoiceForm from "./VoiceForm";

interface VoiceFormData {
  name: string;
  language: string;
  category: string;
  description: string;
}

const AddVoice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [audioData, setAudioData] = useState<{
    file: File;
    trimStart: number;
    trimEnd: number;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleAudioReady = (audioFile: File, trimStart: number, trimEnd: number) => {
    setAudioData({ file: audioFile, trimStart, trimEnd });
    setShowForm(true);
    
    // Smooth scroll to form
    setTimeout(() => {
      const formElement = document.getElementById('voice-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleClear = () => {
    setAudioData(null);
    setShowForm(false);
  };

  const uploadToSupabase = async (file: File, fileName: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    const filePath = `${user.id}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('voices')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('voices')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFormSubmit = async (formData: VoiceFormData) => {
    if (!audioData || !user) {
      toast({
        title: "Error",
        description: "Please select an audio file and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create trimmed file name
      const fileName = `${Date.now()}_${formData.name.replace(/\s+/g, '_')}.${audioData.file.name.split('.').pop()}`;
      const audioUrl = await uploadToSupabase(audioData.file, fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('voices')
        .insert({
          user_id: user.id,
          name: formData.name,
          language: formData.language,
          category: formData.category,
          description: formData.description,
          audio_url: audioUrl,
          duration: audioData.trimEnd - audioData.trimStart
        });

      if (dbError) {
        throw dbError;
      }

      toast({
        title: "Success!",
        description: "Voice has been added to your library and is now available for generation.",
      });

      // Reset form and state
      setAudioData(null);
      setShowForm(false);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add voice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="animate-in fade-in-50 duration-500">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Add New Voice</CardTitle>
            <CardDescription>
              Record or upload audio samples to create a new AI voice clone. Supports Indian languages with advanced waveform editing.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <WaveformRecorder 
                onAudioReady={handleAudioReady}
                onClear={handleClear}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <div id="voice-form">
          <VoiceForm 
            onSubmit={handleFormSubmit}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default AddVoice;

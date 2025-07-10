
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
    console.log('Audio ready:', { fileName: audioFile.name, trimStart, trimEnd });
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
    console.log('Clearing audio data and form');
    setAudioData(null);
    setShowForm(false);
  };

  // Create a trimmed audio file
  const createTrimmedAudio = async (file: File, trimStart: number, trimEnd: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      audio.onload = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const sampleRate = audioBuffer.sampleRate;
          const startFrame = Math.floor(trimStart * sampleRate);
          const endFrame = Math.floor(trimEnd * sampleRate);
          const frameCount = endFrame - startFrame;
          
          const trimmedBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            frameCount,
            sampleRate
          );
          
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const originalData = audioBuffer.getChannelData(channel);
            const trimmedData = trimmedBuffer.getChannelData(channel);
            
            for (let i = 0; i < frameCount; i++) {
              trimmedData[i] = originalData[startFrame + i];
            }
          }
          
          // Convert back to blob
          const length = trimmedBuffer.length * trimmedBuffer.numberOfChannels * 2;
          const arrayBuffer2 = new ArrayBuffer(length);
          const view = new DataView(arrayBuffer2);
          
          let offset = 0;
          for (let i = 0; i < trimmedBuffer.length; i++) {
            for (let channel = 0; channel < trimmedBuffer.numberOfChannels; channel++) {
              const sample = Math.max(-1, Math.min(1, trimmedBuffer.getChannelData(channel)[i]));
              view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
              offset += 2;
            }
          }
          
          const blob = new Blob([arrayBuffer2], { type: 'audio/wav' });
          const trimmedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '_trimmed.wav'), { 
            type: 'audio/wav' 
          });
          
          resolve(trimmedFile);
        } catch (error) {
          console.error('Audio trimming error:', error);
          // Fallback: return original file
          resolve(file);
        }
      };
      
      audio.onerror = () => {
        console.error('Audio loading error, using original file');
        // Fallback: return original file
        resolve(file);
      };
      
      const url = URL.createObjectURL(file);
      audio.src = url;
    });
  };

  const uploadToSupabase = async (file: File, fileName: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    console.log('Uploading to Supabase:', { fileName, fileSize: file.size });
    
    const filePath = `${user.id}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('voices')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('voices')
      .getPublicUrl(filePath);

    console.log('Upload successful, public URL:', data.publicUrl);
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

    console.log('Form submission started:', formData);
    setLoading(true);

    try {
      // Create trimmed audio file
      const trimmedFile = await createTrimmedAudio(
        audioData.file, 
        audioData.trimStart, 
        audioData.trimEnd
      );
      
      console.log('Trimmed file created:', { 
        originalSize: audioData.file.size, 
        trimmedSize: trimmedFile.size 
      });

      // Create unique file name
      const timestamp = Date.now();
      const fileName = `${timestamp}_${formData.name.replace(/\s+/g, '_')}.${trimmedFile.name.split('.').pop()}`;
      
      // Upload to Supabase Storage
      const audioUrl = await uploadToSupabase(trimmedFile, fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('voices')
        .insert({
          user_id: user.id,
          name: formData.name,
          language: formData.language,
          category: formData.category,
          description: formData.description || null,
          audio_url: audioUrl,
          duration: Math.round(audioData.trimEnd - audioData.trimStart)
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Voice saved successfully');
      
      toast({
        title: "Success!",
        description: `Voice "${formData.name}" has been added to your library and is now available for generation.`,
      });

      // Reset form and state
      setAudioData(null);
      setShowForm(false);
      
    } catch (error: any) {
      console.error('Form submission error:', error);
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

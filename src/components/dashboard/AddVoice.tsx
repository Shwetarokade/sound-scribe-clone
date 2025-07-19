
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Cloud, Mic, Play, Pause, Square, Upload } from "lucide-react";
import VoiceForm from "./VoiceForm";

interface VoiceFormData {
  name: string;
  language: string;
  voice_type: string;
  description: string;
}

const AddVoice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cachedVoices, setCachedVoices] = useState<any[]>([]);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [audioData, setAudioData] = useState<{
    file: File;
    trimStart: number;
    trimEnd: number;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Upload states
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
      }, 100);
      
      // Setup waveform visualization
      setupWaveform(stream);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone. Please allow microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const setupWaveform = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    drawWaveform();
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isRecording) return;
      
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'hsl(var(--background))';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        
        ctx.fillStyle = `hsl(245, 100%, ${50 + (dataArray[i] / 255) * 30}%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      requestAnimationFrame(draw);
    };
    
    draw();
  };

  // Upload functions
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid format",
        description: "Please upload an MP3 or WAV file.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 50MB.",
        variant: "destructive"
      });
      return;
    }
    
    // Check audio duration
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      if (audio.duration < 5) {
        toast({
          title: "Audio too short",
          description: "Need ≥5s of speech for voice cloning.",
          variant: "destructive"
        });
        return;
      }
      
      setAudioData({ 
        file, 
        trimStart: 0, 
        trimEnd: Math.min(audio.duration, 15) 
      });
      setShowForm(true);
    };
    
    audio.src = URL.createObjectURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handlePlayRecording = () => {
    if (!recordedBlob) return;
    
    if (isPlaying) {
      audioPreviewRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = URL.createObjectURL(recordedBlob);
        audioPreviewRef.current.play();
        setIsPlaying(true);
        
        audioPreviewRef.current.onended = () => setIsPlaying(false);
      }
    }
  };

  const useRecordedAudio = () => {
    if (!recordedBlob) return;
    
    const file = new File([recordedBlob], 'recording.webm', { type: 'audio/webm' });
    setAudioData({ 
      file, 
      trimStart: 0, 
      trimEnd: Math.min(recordingTime, 15) 
    });
    setShowForm(true);
  };

  const handleClear = () => {
    setAudioData(null);
    setShowForm(false);
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setUploadProgress(0);
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

    try {
      // Create optimistic voice object FIRST (before any async operations)
      const timestamp = Date.now();
      const optimisticVoice = {
        id: `temp-${timestamp}`, 
        user_id: user.id,
        name: formData.name,
        language: formData.language,
        voice_type: formData.voice_type,
        description: formData.description || null,
        audio_url: URL.createObjectURL(audioData.file), // Use original file for immediate preview
        duration: Math.round(audioData.trimEnd - audioData.trimStart),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Immediately show in Voice Library (optimistic update)
      window.dispatchEvent(new CustomEvent('voiceAdded', { 
        detail: optimisticVoice 
      }));

      // Show immediate success message
      toast({
        title: "Voice added to library! ▶️",
        description: `${formData.name} is now available in your Voice Library`,
      });

      // Reset form and state immediately
      setAudioData(null);
      setShowForm(false);
      setRecordedBlob(null);
      setRecordingTime(0);
      setIsPlaying(false);
      setUploadProgress(0);

      // Upload and save to database in the background (async)
      setTimeout(async () => {
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
          const fileName = `${timestamp}_${formData.name.replace(/\s+/g, '_')}.${trimmedFile.name.split('.').pop()}`;
          
          // Upload to Supabase Storage
          const audioUrl = await uploadToSupabase(trimmedFile, fileName);

          // Save to database
          const { data: insertedData, error: dbError } = await supabase
            .from('voices')
            .insert({
              creator_id: user.id,
              name: formData.name,
              language: formData.language,
              category: formData.voice_type,
              description: formData.description || null,
              reference_audio_id: timestamp.toString(),
              audio_storage_path: audioUrl
            })
            .select()
            .single();

          if (dbError) {
            console.error('Database error:', dbError);
            
            // Remove optimistic update and show error
            window.dispatchEvent(new CustomEvent('voiceAddedError', { 
              detail: { 
                tempId: optimisticVoice.id,
                error: dbError.message 
              }
            }));
            
            toast({
              title: "Upload failed",
              description: "Voice removed from library. Please try again.",
              variant: "destructive"
            });
            
            return;
          }

          // Replace optimistic update with real data
          window.dispatchEvent(new CustomEvent('voiceAddedSuccess', { 
            detail: { 
              tempId: optimisticVoice.id,
              realVoice: insertedData
            }
          }));

          console.log('Voice saved successfully to database');
          
        } catch (backgroundError: any) {
          console.error('Background upload error:', backgroundError);
          
          // Remove optimistic update and show error
          window.dispatchEvent(new CustomEvent('voiceAddedError', { 
            detail: { 
              tempId: optimisticVoice.id,
              error: backgroundError.message 
            }
          }));
          
          toast({
            title: "Upload failed", 
            description: "Voice removed from library. Please try again.",
            variant: "destructive"
          });
        }
      }, 100); // Small delay to ensure UI updates first
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add voice. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="animate-in fade-in-50 duration-500">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Add New Voice</CardTitle>
            <CardDescription>
              Upload audio or record directly to create a new AI voice clone. Supports Indian languages with simple audio editing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Dual Panel Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Left Panel - Upload Audio */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">📂 Upload Audio</h3>
                
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragOver 
                      ? 'border-primary bg-primary/5 scale-[1.02]' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-15 h-15 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-200 hover:scale-105 shadow-[0_4px_12px_rgba(108,99,255,0.3)]"
                  >
                    <Cloud className="w-6 h-6 text-primary-foreground" />
                  </button>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP3/WAV, max 50MB
                  </p>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {audioData && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Audio uploaded successfully!</p>
                    <p className="text-xs text-muted-foreground">
                      Duration: {(audioData.trimEnd - audioData.trimStart).toFixed(1)}s
                    </p>
                  </div>
                )}
              </div>

              {/* Right Panel - Record Audio */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">🎙 Record Audio</h3>
                
                <div className="space-y-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto transition-all duration-200 hover:scale-105 ${
                      isRecording 
                        ? 'bg-destructive text-destructive-foreground' 
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  {isRecording && (
                    <div className="text-center">
                      <p className="text-lg font-mono">
                        {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                        {Math.floor(recordingTime % 60).toString().padStart(2, '0')}.
                        {Math.floor((recordingTime % 1) * 10)}
                      </p>
                    </div>
                  )}
                  
                  {/* Waveform Canvas */}
                  <div className="bg-muted/20 rounded-lg p-4">
                    <canvas 
                      ref={canvasRef}
                      width={300}
                      height={100}
                      className="w-full h-24 rounded"
                    />
                    {!isRecording && !recordedBlob && (
                      <div className="text-center py-8 text-muted-foreground">
                        Start recording to see waveform
                      </div>
                    )}
                  </div>
                  
                  {/* Playback Controls */}
                  {recordedBlob && (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={handlePlayRecording}
                          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all duration-200"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        
                        <button
                          onClick={useRecordedAudio}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
                        >
                          Use Recording
                        </button>
                      </div>
                      
                      <audio ref={audioPreviewRef} className="hidden" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Add to Library Section */}
            {(audioData || recordedBlob) && (
              <div className="mt-8 pt-6 border-t">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    <span className="font-medium">Ready to add to library</span>
                  </div>
                  
                  {loading && (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-2 text-sm text-muted-foreground">
                        <span className="text-primary font-medium">✓ Uploading</span>
                        <span>→</span>
                        <span className="text-primary font-medium">✓ Processing</span>
                        <span>→</span>
                        <span className="text-primary font-medium">⏳ Adding to Library</span>
                        <span>→</span>
                        <span className="text-muted-foreground">Ready!</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 max-w-md mx-auto">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse w-3/4 transition-all duration-1000" />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Creating voice profile and optimizing for AI generation...
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Add to Voice Library
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
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

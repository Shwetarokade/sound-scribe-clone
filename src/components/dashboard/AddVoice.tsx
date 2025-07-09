
import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, Mic, X, Play, Pause, Save, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VoiceForm {
  name: string;
  language: string;
  category: string;
  description: string;
}

const AddVoice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voiceForm, setVoiceForm] = useState<VoiceForm>({
    name: "",
    language: "",
    category: "",
    description: ""
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [trimRange, setTrimRange] = useState([0, 15]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const indianLanguages = [
    { value: "hi", label: "Hindi" },
    { value: "ta", label: "Tamil" },
    { value: "te", label: "Telugu" },
    { value: "bn", label: "Bengali" },
    { value: "mr", label: "Marathi" },
    { value: "gu", label: "Gujarati" },
    { value: "kn", label: "Kannada" },
    { value: "ml", label: "Malayalam" },
    { value: "pa", label: "Punjabi" },
    { value: "or", label: "Odia" },
    { value: "as", label: "Assamese" },
    { value: "ur", label: "Urdu" },
    { value: "en-in", label: "English (Indian)" }
  ];

  const categories = [
    { value: "conversational", label: "Conversational" },
    { value: "narrative", label: "Narrative" },
    { value: "ai", label: "AI" },
    { value: "present", label: "Present" }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid File",
          description: "Please upload an audio file (MP3, WAV, etc.)",
          variant: "destructive"
        });
        return;
      }

      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Get audio duration
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration);
        setTrimRange([0, Math.min(15, audio.duration)]);
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setAudioFile(file);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Get audio duration
        const audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(audio.duration);
          setTrimRange([0, Math.min(15, audio.duration)]);
        });
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.currentTime = trimRange[0];
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current && audioRef.current.currentTime >= trimRange[1]) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile || !user) {
      toast({
        title: "Error",
        description: "Please select an audio file and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    if (!voiceForm.name || !voiceForm.language || !voiceForm.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create trimmed file (simplified - in production you'd use actual audio processing)
      const fileName = `${Date.now()}_${voiceForm.name.replace(/\s+/g, '_')}.${audioFile.name.split('.').pop()}`;
      const audioUrl = await uploadToSupabase(audioFile, fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('voices')
        .insert({
          user_id: user.id,
          name: voiceForm.name,
          language: voiceForm.language,
          category: voiceForm.category,
          description: voiceForm.description,
          audio_url: audioUrl,
          duration: trimRange[1] - trimRange[0]
        });

      if (dbError) {
        throw dbError;
      }

      toast({
        title: "Success!",
        description: "Voice has been added to your library and is now available for generation.",
      });

      // Reset form
      setVoiceForm({ name: "", language: "", category: "", description: "" });
      setAudioFile(null);
      setAudioUrl("");
      setTrimRange([0, 15]);
      setAudioDuration(0);
      
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

  const removeFile = () => {
    setAudioFile(null);
    setAudioUrl("");
    setTrimRange([0, 15]);
    setAudioDuration(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Voice</CardTitle>
          <CardDescription>
            Upload audio samples or record your voice to create a new AI voice clone. Supports Indian languages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Audio Upload/Recording */}
            <div className="space-y-4">
              <Label>Audio File</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-sm font-medium">Upload or record audio</p>
                    <p className="text-xs text-muted-foreground">
                      MP3, WAV files up to 10MB. High quality recordings work best.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    <label className="cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button type="button" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </label>
                    <span className="text-xs text-muted-foreground">or</span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={isRecording ? "bg-red-100 border-red-300 dark:bg-red-900/20" : ""}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isRecording ? "Stop Recording" : "Record Voice"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Audio Player and Trimmer */}
              {audioUrl && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {audioFile?.name || 'Recorded Audio'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Trim to 15 seconds (Current: {trimRange[0].toFixed(1)}s - {trimRange[1].toFixed(1)}s)
                      </Label>
                      <Slider
                        value={trimRange}
                        onValueChange={setTrimRange}
                        max={audioDuration}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Voice Details Form */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voiceName">Voice Name *</Label>
                <Input
                  id="voiceName"
                  placeholder="e.g., Professional Speaker"
                  value={voiceForm.name}
                  onChange={(e) => setVoiceForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language *</Label>
                <Select
                  value={voiceForm.language}
                  onValueChange={(value) => setVoiceForm(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianLanguages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Voice Category *</Label>
                <Select
                  value={voiceForm.category}
                  onValueChange={(value) => setVoiceForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the voice characteristics and intended use..."
                  value={voiceForm.description}
                  onChange={(e) => setVoiceForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Training Tips */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Tips for better voice training:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use high-quality, clear audio recordings (44.1kHz, 16-bit minimum)</li>
                <li>• 15-second clips work best for voice cloning</li>
                <li>• Avoid background noise and echo</li>
                <li>• Speak naturally with consistent volume and pace</li>
                <li>• Record in a quiet environment for best results</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !audioFile || !voiceForm.name || !voiceForm.language || !voiceForm.category}
            >
              {loading ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Processing Voice...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Voice to Library
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddVoice;

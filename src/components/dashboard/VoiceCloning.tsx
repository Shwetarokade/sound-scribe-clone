import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  VolumeX,
  Volume2,
  Zap,
  FileAudio,
  Brain,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  model_id: string;
}

interface ClonedVoice {
  id: string;
  name: string;
  description: string;
  external_voice_id: string;
  provider: string;
  created_at: string;
}

const VoiceCloning = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Cloning states
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Synthesis states
  const [isGenerating, setIsGenerating] = useState(false);
  const [synthText, setSynthText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Voice settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.0,
    use_speaker_boost: true,
    model_id: 'eleven_multilingual_v2'
  });
  
  // Available voices and models
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Available languages
  const languages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
    { value: 'it-IT', label: 'Italian' },
    { value: 'pt-BR', label: 'Portuguese (Brazil)' },
    { value: 'hi-IN', label: 'Hindi' },
    { value: 'ja-JP', label: 'Japanese' },
    { value: 'ko-KR', label: 'Korean' },
    { value: 'zh-CN', label: 'Chinese (Mandarin)' },
  ];

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 25 * 1024 * 1024; // 25MB
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an audio file smaller than 25MB",
        variant: "destructive"
      });
      return;
    }
    
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg', 'audio/webm'];
    if (!allowedTypes.some(type => file.type.includes(type.split('/')[1]) || file.name.toLowerCase().includes(type.split('/')[1]))) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file (MP3, WAV, M4A, OGG, WebM)",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
  }, [toast]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Clone voice function
  const cloneVoice = async () => {
    if (!selectedFile || !voiceName.trim() || !user) {
      toast({
        title: "Missing information",
        description: "Please select an audio file and enter a voice name",
        variant: "destructive"
      });
      return;
    }

    setIsCloning(true);
    setCloneProgress(0);

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('name', voiceName.trim());
      formData.append('description', voiceDescription.trim());
      formData.append('user_id', user.id);
      formData.append('language', 'en-US');
      formData.append('category', 'cloned');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setCloneProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/voice-cloning/clone', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setCloneProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to clone voice');
      }

      const result = await response.json();

      toast({
        title: "Voice cloned successfully!",
        description: `${voiceName} is now available for text-to-speech generation`,
      });

      // Reset form
      setSelectedFile(null);
      setVoiceName("");
      setVoiceDescription("");
      setCloneProgress(0);
      
      // Refresh cloned voices list
      await loadClonedVoices();
      
    } catch (error) {
      console.error('Voice cloning error:', error);
      toast({
        title: "Voice cloning failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCloning(false);
      setCloneProgress(0);
    }
  };

  // Generate speech function
  const generateSpeech = async () => {
    if (!synthText.trim() || !selectedVoiceId) {
      toast({
        title: "Missing information",
        description: "Please enter text and select a voice",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/voice-cloning/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: synthText.trim(),
          voice_id: selectedVoiceId,
          options: voiceSettings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setGeneratedAudio(audioUrl);

      toast({
        title: "Speech generated successfully!",
        description: "Your audio is ready to play and download",
      });

    } catch (error) {
      console.error('Speech generation error:', error);
      toast({
        title: "Speech generation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Load cloned voices
  const loadClonedVoices = async () => {
    try {
      const response = await fetch('/api/voices?user_id=' + user?.id);
      if (response.ok) {
        const data = await response.json();
        setClonedVoices(data.data.filter((v: any) => v.provider === 'elevenlabs'));
      }
    } catch (error) {
      console.error('Error loading cloned voices:', error);
    }
  };

  // Load usage info
  const loadUsage = async () => {
    try {
      const response = await fetch('/api/voice-cloning/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.data);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  // Play/pause audio
  const togglePlayback = () => {
    if (!audioRef.current || !generatedAudio) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Download audio
  const downloadAudio = () => {
    if (!generatedAudio) return;
    
    const link = document.createElement('a');
    link.href = generatedAudio;
    link.download = `voice-synthesis-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Usage Stats */}
      {usage && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            ElevenLabs Usage: {usage.character_count?.toLocaleString() || 0} / {usage.character_limit?.toLocaleString() || 0} characters used
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="clone" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clone">Clone Voice</TabsTrigger>
          <TabsTrigger value="synthesize">Generate Speech</TabsTrigger>
        </TabsList>

        {/* Voice Cloning Tab */}
        <TabsContent value="clone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Clone Your Voice
              </CardTitle>
              <CardDescription>
                Upload a 30-second audio sample to create a custom voice clone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Area */}
              <div
                ref={dropRef}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  <FileAudio className="h-12 w-12 text-muted-foreground" />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <p className="font-medium text-green-600">
                        Selected: {selectedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-medium">
                        Drop audio file here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports MP3, WAV, M4A, OGG, WebM (max 25MB)
                      </p>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCloning}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              </div>

              {/* Voice Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voiceName">Voice Name *</Label>
                  <Input
                    id="voiceName"
                    placeholder="e.g., My Professional Voice"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    disabled={isCloning}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voiceDescription">Description</Label>
                  <Input
                    id="voiceDescription"
                    placeholder="Optional description"
                    value={voiceDescription}
                    onChange={(e) => setVoiceDescription(e.target.value)}
                    disabled={isCloning}
                  />
                </div>
              </div>

              {/* Progress Bar */}
              {isCloning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cloning voice...</span>
                    <span>{cloneProgress}%</span>
                  </div>
                  <Progress value={cloneProgress} className="w-full" />
                </div>
              )}

              {/* Clone Button */}
              <Button
                onClick={cloneVoice}
                disabled={!selectedFile || !voiceName.trim() || isCloning}
                className="w-full"
                size="lg"
              >
                {isCloning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cloning Voice...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Clone Voice
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Speech Synthesis Tab */}
        <TabsContent value="synthesize" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Text Input and Voice Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Generate Speech
                </CardTitle>
                <CardDescription>
                  Convert text to speech using your cloned voices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="synthText">Text to Synthesize</Label>
                  <Textarea
                    id="synthText"
                    placeholder="Enter the text you want to convert to speech..."
                    value={synthText}
                    onChange={(e) => setSynthText(e.target.value)}
                    rows={6}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Characters: {synthText.length}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voiceSelect">Select Voice</Label>
                  <Select
                    value={selectedVoiceId}
                    onValueChange={setSelectedVoiceId}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a cloned voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {clonedVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.external_voice_id}>
                          <div className="flex items-center gap-2">
                            <span>{voice.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {voice.provider}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateSpeech}
                  disabled={!synthText.trim() || !selectedVoiceId || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Generate Speech
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Voice Settings
                </CardTitle>
                <CardDescription>
                  Fine-tune your voice synthesis parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Stability: {voiceSettings.stability}</Label>
                    <Slider
                      value={[voiceSettings.stability]}
                      onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, stability: value }))}
                      max={1}
                      min={0}
                      step={0.01}
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values make the voice more consistent
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Similarity Boost: {voiceSettings.similarity_boost}</Label>
                    <Slider
                      value={[voiceSettings.similarity_boost]}
                      onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, similarity_boost: value }))}
                      max={1}
                      min={0}
                      step={0.01}
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values make the voice more similar to the original
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Style: {voiceSettings.style}</Label>
                    <Slider
                      value={[voiceSettings.style]}
                      onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, style: value }))}
                      max={1}
                      min={0}
                      step={0.01}
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values add more expressive variation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modelSelect">Model</Label>
                    <Select
                      value={voiceSettings.model_id}
                      onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, model_id: value }))}
                      disabled={isGenerating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eleven_multilingual_v2">Multilingual v2</SelectItem>
                        <SelectItem value="eleven_flash_v2_5">Flash v2.5 (Faster)</SelectItem>
                        <SelectItem value="eleven_turbo_v2_5">Turbo v2.5 (Fastest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generated Audio Player */}
                {generatedAudio && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Generated Audio
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadAudio}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <audio
                      ref={audioRef}
                      src={generatedAudio}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceCloning;
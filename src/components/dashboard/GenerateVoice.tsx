
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Upload, 
  FileText, 
  RefreshCw, 
  Brain,
  FileAudio,
  Loader2,
  CheckCircle2,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Voice {
  id: string;
  name: string;
  language: string;
  category: string;
  description?: string;
  external_voice_id?: string;
  provider?: string;
}

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

const GenerateVoice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Original generation states
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [text, setText] = useState("");
  const [outputLanguage, setOutputLanguage] = useState("hi");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [tone, setTone] = useState("neutral");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [transliteratedText, setTransliteratedText] = useState("");
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);

  // Voice cloning states
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [usage, setUsage] = useState<any>(null);

  // Voice settings for cloning
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.0,
    use_speaker_boost: true,
    model_id: 'eleven_multilingual_v2'
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Language mapping for transliteration
  const languageMap: { [key: string]: string } = {
    "hi": "hindi",
    "ta": "tamil", 
    "te": "telugu",
    "bn": "bengali",
    "mr": "marathi",
    "gu": "gujarati",
    "kn": "kannada",
    "ml": "malayalam",
    "pa": "punjabi",
    "or": "odia",
    "as": "assamese",
    "ur": "urdu"
  };

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

  const tones = [
    { value: "neutral", label: "Neutral" },
    { value: "friendly", label: "Friendly" },
    { value: "professional", label: "Professional" },
    { value: "energetic", label: "Energetic" },
    { value: "calm", label: "Calm" },
    { value: "cheerful", label: "Cheerful" }
  ];

  // Handle file selection for cloning
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
      
      // Refresh voices list
      await Promise.all([loadClonedVoices(), fetchData()]);
      
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

  // Fetch user's voices and recent generations from Supabase
  const fetchData = async () => {
    if (!user) return;

    // Fetch voices
    const { data: voicesData, error: voicesError } = await supabase
      .from('voices')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (voicesError) {
      console.error('Error fetching voices:', voicesError);
      toast({
        title: "Error",
        description: "Failed to load your voices.",
        variant: "destructive"
      });
    } else {
      setVoices(voicesData || []);
    }

    // Fetch recent generations
    const { data: generationsData, error: generationsError } = await supabase
      .from('voice_generations')
      .select(`
        *,
        voices:voice_id (name, category)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (generationsError) {
      console.error('Error fetching generations:', generationsError);
    } else {
      setRecentGenerations(generationsData || []);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchData(), loadClonedVoices(), loadUsage()]);
    }
  }, [user, toast]);

  // Enhanced Google Transliteration API integration
  const transliterateWithGoogle = async (inputText: string, targetLanguage: string) => {
    if (!inputText.trim() || targetLanguage === "en-in") {
      setTransliteratedText(inputText);
      return;
    }

    setIsTransliterating(true);
    
    try {
      // Using Google Input Tools API for transliteration
      const languageCode = languageMap[targetLanguage] || "hindi";
      const response = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(inputText)}&itc=${languageCode}-t-i0-pinyin&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`);
      
      if (response.ok) {
        const data = await response.json();
        if (data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
          const transliterated = data[1][0][1][0];
          setTransliteratedText(transliterated);
          
          toast({
            title: "Transliteration complete",
            description: `Text transliterated to ${indianLanguages.find(l => l.value === targetLanguage)?.label}`,
          });
        } else {
          // Fallback to enhanced mock transliteration
          const fallbackTransliterated = enhancedMockTransliterate(inputText, targetLanguage);
          setTransliteratedText(fallbackTransliterated);
        }
      } else {
        throw new Error('Transliteration API failed');
      }
    } catch (error) {
      console.error('Transliteration error:', error);
      // Enhanced fallback transliteration
      const fallbackTransliterated = enhancedMockTransliterate(inputText, targetLanguage);
      setTransliteratedText(fallbackTransliterated);
      
      toast({
        title: "Using offline transliteration",
        description: "Google transliteration unavailable, using local fallback",
        variant: "destructive"
      });
    } finally {
      setIsTransliterating(false);
    }
  };

  // Enhanced mock transliteration with better language support
  const enhancedMockTransliterate = (input: string, targetLang: string) => {
    const transliterationMaps: { [key: string]: { [key: string]: string } } = {
      "hi": { // Hindi
        'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ',
        'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
        'ka': 'क', 'kha': 'ख', 'ga': 'ग', 'gha': 'घ', 'nga': 'ङ',
        'cha': 'च', 'chha': 'छ', 'ja': 'ज', 'jha': 'झ', 'nya': 'ञ',
        'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'na': 'न',
        'pa': 'प', 'pha': 'फ', 'ba': 'ब', 'bha': 'भ', 'ma': 'म',
        'ya': 'य', 'ra': 'र', 'la': 'ल', 'va': 'व', 'wa': 'व',
        'sha': 'श', 'shha': 'ष', 'sa': 'स', 'ha': 'ह',
        'k': 'क', 'g': 'ग', 'ch': 'च', 'j': 'ज', 't': 'त', 'd': 'द',
        'p': 'प', 'b': 'ब', 'm': 'म', 'y': 'य', 'r': 'र', 'l': 'ल',
        'v': 'व', 'w': 'व', 'sh': 'श', 's': 'स', 'h': 'ह', 'n': 'न'
      },
      "ta": { // Tamil
        'a': 'அ', 'aa': 'ஆ', 'i': 'இ', 'ii': 'ஈ', 'u': 'உ', 'uu': 'ஊ',
        'e': 'எ', 'ee': 'ஏ', 'ai': 'ஐ', 'o': 'ஒ', 'oo': 'ஓ', 'au': 'ஔ',
        'ka': 'க', 'nga': 'ங', 'cha': 'ச', 'ja': 'ஜ', 'nya': 'ஞ',
        'ta': 'ட', 'nna': 'ண', 'tha': 'த', 'nha': 'ந', 'pa': 'ப',
        'ma': 'ம', 'ya': 'ய', 'ra': 'ர', 'la': 'ல', 'va': 'வ',
        'zha': 'ழ', 'lla': 'ள', 'rra': 'ற', 'na': 'ன', 'sa': 'ஸ', 'ha': 'ஹ'
      }
    };

    const map = transliterationMaps[targetLang] || transliterationMaps["hi"];
    
    // Simple word-based transliteration
    return input.toLowerCase().split(' ').map(word => {
      // Try to match longer patterns first
      let result = word;
      const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);
      
      for (const key of sortedKeys) {
        result = result.replace(new RegExp(key, 'g'), map[key]);
      }
      
      // Handle remaining single characters
      result = result.split('').map(char => map[char] || char).join('');
      
      return result;
    }).join(' ');
  };

  // Real-time transliteration with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (text.trim()) {
        transliterateWithGoogle(text, outputLanguage);
      } else {
        setTransliteratedText("");
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [text, outputLanguage]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setText(content);
        };
        reader.readAsText(file);
        toast({
          title: "File uploaded successfully",
          description: `Loaded content from ${file.name}`,
        });
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Basic PDF text extraction using pdfjs-dist would go here
        toast({
          title: "PDF Support",
          description: "PDF text extraction will be available soon. Please use TXT files for now.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a TXT or PDF file.",
          variant: "destructive"
        });
      }
    }
  };

  const handleGenerate = async () => {
    if (!selectedVoice || !text.trim()) {
      toast({
        title: "Error",
        description: "Please select a voice and enter text to generate.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Find selected voice details
      const selectedVoiceData = voices.find(v => v.id === selectedVoice);
      
      console.log("Generating voice:", {
        voiceId: selectedVoice,
        voiceName: selectedVoiceData?.name,
        text: transliteratedText || text,
        outputLanguage,
        speed: speed[0],
        pitch: pitch[0]
      });

      // Use transliterated text for generation
      const textToGenerate = transliteratedText || text;

      // Simulate generation process with realistic timing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock generated audio URL (in production, this would call your voice generation API)
      const mockAudioUrl = "mock-audio-url-generated";
      setGeneratedAudio(mockAudioUrl);

      // Save to voice_generations table
      const { error: saveError } = await supabase
        .from('voice_generations')
        .insert({
          user_id: user?.id,
          text: textToGenerate,
          voice_id: selectedVoice,
          audio_url: mockAudioUrl,
          name: textToGenerate.substring(0, 50) + (textToGenerate.length > 50 ? '...' : ''),
          is_favorite: false
        });

      if (saveError) {
        console.error('Error saving generation:', saveError);
      } else {
        // Refresh recent generations
        const { data: generationsData } = await supabase
          .from('voice_generations')
          .select(`
            *,
            voices:voice_id (name, category)
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setRecentGenerations(generationsData || []);
      }
      
      toast({
        title: "Success!",
        description: `Voice generated successfully using ${selectedVoiceData?.name}.`,
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate voice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate speech function for cloned voices
  const generateSpeech = async () => {
    if (!text.trim() || !selectedVoice) {
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
          text: transliteratedText || text,
          voice_id: selectedVoice,
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

  const handlePlayPause = () => {
    if (!audioRef.current || !generatedAudio) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!generatedAudio) {
      toast({
        title: "No audio to download",
        description: "Please generate audio first before downloading.",
        variant: "destructive"
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = generatedAudio;
      
      // Create filename with selected voice and timestamp
      const selectedVoiceData = voices.find(v => v.id === selectedVoice);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `generated_${selectedVoiceData?.name || 'voice'}_${timestamp}.mp3`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download complete! 📁",
        description: `Generated audio saved as ${fileName}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not download the generated audio. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Usage Stats */}
      {usage && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            ElevenLabs Usage: {usage.character_count?.toLocaleString() || 0} / {usage.character_limit?.toLocaleString() || 0} characters used
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Speech</TabsTrigger>
          <TabsTrigger value="clone" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Clone Voice
          </TabsTrigger>
        </TabsList>

        {/* Speech Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          {/* Input Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle>Text to Speech</CardTitle>
                <CardDescription>
                  Enter text or upload a file to convert to speech in Indian languages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </label>
                  <span className="text-xs text-muted-foreground">TXT or PDF</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="text">Text Content</Label>
                  <Textarea
                    id="text"
                    placeholder="Enter your text here or upload a file..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {text.length} characters
                  </div>
                </div>

                {/* Transliteration Panel */}
                {text.trim() && (
                  <div className="space-y-2 mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Transliterated Output</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => transliterateWithGoogle(text, outputLanguage)}
                        disabled={isTransliterating}
                        className="h-6 px-2"
                      >
                        <RefreshCw className={`h-3 w-3 ${isTransliterating ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground min-h-[60px] p-2 bg-background rounded border">
                      {isTransliterating ? (
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Transliterating with Google API...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium">{transliteratedText || "Enter text to see transliteration"}</div>
                          {transliteratedText && (
                            <div className="text-xs text-blue-600">
                              ✓ Ready for voice generation
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto-transliteration enabled • Click refresh to manually update
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>
                  Configure voice parameters and quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Voice</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose from your voice library" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.external_voice_id || voice.id}>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-2">
                              {voice.name}
                              {voice.provider && (
                                <Badge variant="secondary" className="text-xs">
                                  {voice.provider}
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {voice.category} • {voice.language.toUpperCase()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {clonedVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.external_voice_id}>
                          <div className="flex flex-col">
                            <span className="flex items-center gap-2">
                              {voice.name}
                              <Badge variant="secondary" className="text-xs">
                                cloned
                              </Badge>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {voice.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {voices.length === 0 && clonedVoices.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No voices found. Add voices in the "Add Voice" tab or clone a voice first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Output Language</Label>
                  <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                    <SelectTrigger>
                      <SelectValue />
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

                <div className="space-y-3">
                  <Label>Speed: {speed[0].toFixed(1)}x</Label>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Pitch: {pitch[0].toFixed(1)}x</Label>
                  <Slider
                    value={pitch}
                    onValueChange={setPitch}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerate}
                  className="w-full"
                  disabled={isGenerating || !selectedVoice || !text.trim()}
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
          </div>
        </TabsContent>

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
      </Tabs>

      {/* Generated Audio Section */}
      {generatedAudio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Generated Audio</span>
            </CardTitle>
            <CardDescription>
              Your generated speech is ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              <div className="flex-1 bg-muted rounded-full h-2">
                <div className={`bg-primary h-2 rounded-full transition-all duration-300 ${isPlaying ? 'w-full' : 'w-1/3'}`}></div>
              </div>

              <span className="text-sm text-muted-foreground">
                {isPlaying ? "Playing..." : "Ready"}
              </span>
            </div>
            <audio
              ref={audioRef}
              src={generatedAudio}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Recent Generations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Generations</CardTitle>
          <CardDescription>
            Your recently generated audio files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentGenerations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent generations yet.</p>
              <p className="text-sm mt-1">Generated audio will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentGenerations.map((generation) => (
                <div key={generation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{generation.text.substring(0, 50)}...</p>
                    <p className="text-xs text-muted-foreground">
                      {generation.voices?.name} • {generation.voices?.category} • {new Date(generation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateVoice;

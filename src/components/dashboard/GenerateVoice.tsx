import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
  Mic,
  Loader2,
  CheckCircle2,
  Zap,
  RefreshCw
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
  api_speaker_id?: string;
  reference_audio_id: string;
  audio_storage_path?: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

interface VoiceGeneration {
  id: string;
  name: string;
  text: string;
  voice_id: string;
  audio_url: string;
  duration_seconds?: number;
  user_id: string;
  is_favorite: boolean;
  created_at: string;
}

const GenerateVoice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core states
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [text, setText] = useState("");
  const [generationName, setGenerationName] = useState("");
  const [outputLanguage, setOutputLanguage] = useState("en-in");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [transliteratedText, setTransliteratedText] = useState("");
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [recentGenerations, setRecentGenerations] = useState<VoiceGeneration[]>([]);

  // Voice cloning states
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newVoiceName, setNewVoiceName] = useState("");
  const [newVoiceDescription, setNewVoiceDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);

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

  const languages = [
    { value: "en-in", label: "English (Indian)" },
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
    if (!selectedFile || !newVoiceName.trim() || !user) {
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
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setCloneProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Mock voice cloning - in production, this would upload the file and use an AI service
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate a mock reference audio ID
      const mockReferenceAudioId = `cloned_${Date.now()}`;

      // Insert new voice into database
      const { data: newVoice, error: insertError } = await supabase
        .from('voices')
        .insert({
          name: newVoiceName.trim(),
          description: newVoiceDescription.trim() || null,
          creator_id: profile.id,
          language: outputLanguage,
          category: 'cloned',
          reference_audio_id: mockReferenceAudioId,
          api_speaker_id: `mock_cloned_${Date.now()}`
        })
        .select()
        .single();

      clearInterval(progressInterval);
      setCloneProgress(100);

      if (insertError) {
        throw new Error(insertError.message);
      }

      toast({
        title: "Voice cloned successfully!",
        description: `${newVoiceName} is now available for text-to-speech generation`,
      });

      // Reset form
      setSelectedFile(null);
      setNewVoiceName("");
      setNewVoiceDescription("");
      setCloneProgress(0);
      setShowCloneForm(false);
      
      // Refresh voices list
      await fetchData();
      
    } catch (error: unknown) {
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
        setClonedVoices(data.data.filter((v: { provider: string }) => v.provider === 'elevenlabs'));
      }
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

  // Handle file upload for text input
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

  // Fetch user's voices and recent generations from Supabase
  const fetchData = async () => {
    if (!user) return;

    try {
      // Get user profile first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Fetch voices
      const { data: voicesData, error: voicesError } = await supabase
        .from('voices')
        .select('*')
        .eq('creator_id', profile.id)
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
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (generationsError) {
        console.error('Error fetching generations:', generationsError);
      } else {
        setRecentGenerations(generationsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Generate speech function
  const handleGenerate = async () => {
    if (!selectedVoice || !text.trim() || !generationName.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a voice, enter text, and provide a name for the generation.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Find selected voice details
      const selectedVoiceData = voices.find(v => v.id === selectedVoice);
      
      console.log("Generating voice:", {
        voiceId: selectedVoice,
        voiceName: selectedVoiceData?.name,
        text,
        outputLanguage,
        speed: speed[0],
        pitch: pitch[0]
      });

      // Simulate generation process with realistic timing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock generated audio URL (in production, this would call your voice generation API)
      const mockAudioUrl = `https://example.com/generated-audio-${Date.now()}.mp3`;
      const mockDuration = Math.floor(text.length / 10); // Estimate duration based on text length
      
      setGeneratedAudio(mockAudioUrl);

      // Save to voice_generations table
      const { error: saveError } = await supabase
        .from('voice_generations')
        .insert({
          user_id: profile.id,
          name: generationName.trim(),
          text,
          voice_id: selectedVoice,
          audio_url: mockAudioUrl,
          duration_seconds: mockDuration
        });

      if (saveError) {
        console.error('Error saving generation:', saveError);
        toast({
          title: "Warning",
          description: "Audio generated but couldn't save to history.",
          variant: "destructive"
        });
      } else {
        // Refresh recent generations
        await fetchData();
      }
      
      toast({
        title: "Success!",
        description: `Voice generated successfully using ${selectedVoiceData?.name}.`,
      });
      
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate voice. Please try again.",
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

    } catch (error: unknown) {
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

  // Audio playback controls
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
      
      // Create filename with generation name and timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `${generationName || 'generated_audio'}_${timestamp}.mp3`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download complete!",
        description: `Audio saved as ${fileName}`,
      });
    } catch (error: unknown) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not download the generated audio. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Generate Voice</h1>
        <p className="text-muted-foreground">
          Convert text to speech using your voice library or clone a new voice
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Text Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Text Input
            </CardTitle>
            <CardDescription>
              Enter text or upload a file to convert to speech
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

            {/* Generation Name */}
            <div className="space-y-2">
              <Label htmlFor="generationName">Generation Name *</Label>
              <Input
                id="generationName"
                placeholder="e.g., My Speech Recording"
                value={generationName}
                onChange={(e) => setGenerationName(e.target.value)}
              />
            </div>
            {/* Transliteration Panel (always visible) */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
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
              <p className="text-xs text-muted-foreground mt-2">
                Auto-transliteration enabled • Click refresh to manually update
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Voice Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Voice Settings
            </CardTitle>
            <CardDescription>
              Configure voice parameters and quality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Voice</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCloneForm(!showCloneForm)}
                  className="text-xs"
                >
                  <Mic className="h-3 w-3 mr-1" />
                  Clone Voice
                </Button>
              </div>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose from your voice library" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2">
                          {voice.name}
                          <Badge variant="secondary" className="text-xs">
                            {voice.category}
                          </Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {voice.language.toUpperCase()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {voices.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No voices found. Clone a voice below to get started.
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
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clone Voice Form (Conditional) */}
      {showCloneForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Clone Voice
            </CardTitle>
            <CardDescription>
              Upload a voice sample to create a custom voice clone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Area */}
            <div
              ref={dropRef}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-8 w-8 text-muted-foreground" />
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="font-medium text-green-600">
                      Selected: {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="font-medium">
                      Drop audio file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports MP3, WAV, M4A (max 25MB)
                    </p>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCloning}
                >
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
                <Label htmlFor="newVoiceName">Voice Name *</Label>
                <Input
                  id="newVoiceName"
                  placeholder="e.g., My Professional Voice"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  disabled={isCloning}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newVoiceDescription">Description</Label>
                <Input
                  id="newVoiceDescription"
                  placeholder="Optional description..."
                  value={newVoiceDescription}
                  onChange={(e) => setNewVoiceDescription(e.target.value)}
                  disabled={isCloning}
                />
              </div>
            </div>

            {/* Clone Progress */}
            {isCloning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Cloning Progress</Label>
                  <span className="text-sm text-muted-foreground">{cloneProgress}%</span>
                </div>
                <Progress value={cloneProgress} className="w-full" />
              </div>
            )}

            {/* Clone Button */}
            <div className="flex gap-2">
              <Button
                onClick={cloneVoice}
                disabled={isCloning || !selectedFile || !newVoiceName.trim()}
                className="flex-1"
              >
                {isCloning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cloning Voice...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Clone Voice
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCloneForm(false)}
                disabled={isCloning}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleGenerate}
            className="w-full h-12 text-lg"
            disabled={isGenerating || !selectedVoice || !text.trim() || !generationName.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Speech...
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5 mr-2" />
                Generate Speech
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Audio Controls */}
      {generatedAudio && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Audio Generated Successfully
            </CardTitle>
            <CardDescription>
              Your speech is ready to play and download
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <audio
              ref={audioRef}
              src={generatedAudio}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
          </CardContent>
        </Card>
      )}

      {/* Recent Generations */}
      {recentGenerations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
            <CardDescription>
              Your latest voice generations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGenerations.map((generation) => (
                <div
                  key={generation.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{generation.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {generation.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(generation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {generation.duration_seconds && (
                      <Badge variant="secondary">
                        {generation.duration_seconds}s
                      </Badge>
                    )}
                    <Button variant="outline" size="sm">
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GenerateVoice;
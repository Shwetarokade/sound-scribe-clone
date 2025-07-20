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

interface ClonedVoice {
  id: string;
  name: string;
  description?: string;
  provider: string;
  external_voice_id: string;
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  model_id: string;
}

const GenerateVoice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core states
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [text, setText] = useState("");
  const [outputLanguage, setOutputLanguage] = useState("en-in");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [transliteratedText, setTransliteratedText] = useState("");
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [recentGenerations, setRecentGenerations] = useState<VoiceGeneration[]>([]);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  // Add state for file_id and assert_id
  const [fileId, setFileId] = useState<string | null>(null);
  const [assertId, setAssertId] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const languageMap: Record<string, string> = {
    "hi": "hindi",
    "ta": "tamil",
    "te": "telugu",
    "bn": "bengali",
    "mr": "marathi",
    "gu": "gujarati",
    "kn": "kannada",
    "ml": "malayalam",
    "pa": "punjabi",
    "or": "oriya",
    "as": "assamese",
    "ur": "urdu"
  };

  const indianLanguages = languages;

  // Handle file upload for both text and audio files
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setUploadedAudioFile(file);
        setUploadedAudioUrl(URL.createObjectURL(file));
        // Use file name (without extension) as file_id for now
        setFileId(file.name.replace(/\.[^/.]+$/, ''));
        toast({
          title: "Audio file selected",
          description: `Selected ${file.name}`,
        });
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
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
          description: "Please upload a TXT, PDF, or audio file.",
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
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Enhanced Google Transliteration API integration
  const transliterateWithGoogle = async (inputText: string, targetLanguage: string) => {
    if (!inputText.trim() || targetLanguage === "en-in") {
      setTransliteratedText(inputText);
      return;
    }

    setIsTransliterating(true);
    
    try {
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
          const fallbackTransliterated = enhancedMockTransliterate(inputText, targetLanguage);
          setTransliteratedText(fallbackTransliterated);
        }
      } else {
        throw new Error('Transliteration API failed');
      }
    } catch (error: unknown) {
      console.error('Transliteration error:', error);
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
    
    return input.toLowerCase().split(' ').map(word => {
      let result = word;
      const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);
      
      for (const key of sortedKeys) {
        result = result.replace(new RegExp(key, 'g'), map[key]);
      }
      
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
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [text, outputLanguage]);

  // Generate speech function
  const handleGenerate = async () => {
    if (!fileId || !text.trim() || !outputLanguage) {
      toast({
        title: "Missing information",
        description: "Please upload an audio file, enter text, and select a language.",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    try {
      // Call the Supabase Edge Function for generation
      const response = await fetch('https://fvvifdcldpfrfseybfrs.supabase.co/functions/v1/voice-proxy/voice/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          text: text,
          lang_id: outputLanguage
        })
      });
      if (!response.ok) {
        throw new Error('Failed to generate voice');
      }
      const data = await response.json();
      console.log('Generate API response:', data); // <-- Debug log for user
      const returnedAssertId = data.assert_id || data.asset_id || data.id; // adapt to actual response
      setAssertId(returnedAssertId);
      const audioUrl = `https://fvvifdcldpfrfseybfrs.supabase.co/functions/v1/voice-proxy/voice/download/${returnedAssertId}`;
      setGeneratedAudio(audioUrl);
      toast({
        title: "Success!",
        description: `Voice generated successfully.`,
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
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `generated_audio_${timestamp}.mp3`;
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
          Convert text to speech using your voice library
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
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </label>
              <span className="text-xs text-muted-foreground">TXT, PDF, or Audio</span>
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
              <Label>Select Voice</Label>
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
                  No voices found
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

      {/* Generate Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleGenerate}
            className="w-full h-12 text-lg"
            disabled={isGenerating || !fileId || !text.trim() || !outputLanguage}
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
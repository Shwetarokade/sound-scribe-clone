
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Download, Volume2, Upload, FileText, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Voice {
  id: string;
  name: string;
  language: string;
  voice_type: string;
  description?: string;
}

const GenerateVoice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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

  // Fetch user's voices and recent generations from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch voices
      const { data: voicesData, error: voicesError } = await supabase
        .from('voices')
        .select('*')
        .eq('user_id', user.id)
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
        .from('generated_voices')
        .select(`
          *,
          voices:voice_id (name, voice_type)
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

    fetchData();
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
        'ta': 'ட', 'na': 'ண', 'tha': 'த', 'nha': 'ந', 'pa': 'ப',
        'ma': 'ம', 'ya': 'ய', 'ra': 'ர', 'la': 'ல', 'va': 'வ',
        'zha': 'ழ', 'la': 'ள', 'ra': 'ற', 'na': 'ன', 'sa': 'ஸ', 'ha': 'ஹ'
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

      // Save to generated_voices table
      const { error: saveError } = await supabase
        .from('generated_voices')
        .insert({
          user_id: user?.id,
          input_text: textToGenerate,
          voice_id: selectedVoice,
          output_language: outputLanguage,
          speed: speed[0],
          pitch: pitch[0],
          audio_url: mockAudioUrl
        });

      if (saveError) {
        console.error('Error saving generation:', saveError);
      } else {
        // Refresh recent generations
        const { data: generationsData } = await supabase
          .from('generated_voices')
          .select(`
            *,
            voices:voice_id (name, voice_type)
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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In production, implement actual audio playback
    console.log("Playing generated audio:", !isPlaying);
    
    if (!isPlaying) {
      // Simulate playback
      setTimeout(() => setIsPlaying(false), 5000);
    }
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
      toast({
        title: "Download starting...",
        description: "Preparing generated audio for download",
      });

      // In production, this would be the actual generated audio URL
      // For now, create a mock audio file blob
      const mockAudioBlob = new Blob(
        [new ArrayBuffer(1024 * 1024)], // 1MB mock audio file
        { type: 'audio/wav' }
      );
      
      const url = window.URL.createObjectURL(mockAudioBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename with selected voice and timestamp
      const selectedVoiceData = voices.find(v => v.id === selectedVoice);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `generated_${selectedVoiceData?.name || 'voice'}_${timestamp}.wav`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
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
    <div className="max-w-4xl mx-auto space-y-6">
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
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span>{voice.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {voice.voice_type} • {voice.language.toUpperCase()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {voices.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No voices found. Add voices in the "Add Voice" tab first.
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
              {isGenerating ? "Generating..." : "Generate Speech"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Audio Section */}
      {generatedAudio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5" />
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
                    <p className="text-sm font-medium truncate">{generation.input_text.substring(0, 50)}...</p>
                    <p className="text-xs text-muted-foreground">
                      {generation.voices?.name} • {generation.voices?.voice_type} • {generation.output_language.toUpperCase()} • {new Date(generation.created_at).toLocaleDateString()}
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

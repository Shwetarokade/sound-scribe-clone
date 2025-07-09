
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Download, Volume2, Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Voice {
  id: string;
  name: string;
  language: string;
  category: string;
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

  // Fetch user's voices from Supabase
  useEffect(() => {
    const fetchVoices = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('voices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching voices:', error);
        toast({
          title: "Error",
          description: "Failed to load your voices.",
          variant: "destructive"
        });
      } else {
        setVoices(data || []);
      }
    };

    fetchVoices();
  }, [user, toast]);

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
        text,
        outputLanguage,
        speed: speed[0],
        pitch: pitch[0],
        tone
      });

      // Simulate generation process with realistic timing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock generated audio URL (in production, this would call your voice generation API)
      setGeneratedAudio("mock-audio-url-generated");
      
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

  const handleDownload = () => {
    // In production, implement actual audio download
    console.log("Downloading generated audio");
    toast({
      title: "Download",
      description: "Generated audio download started!",
    });
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
                          {voice.category} • {voice.language.toUpperCase()}
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
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent generations yet.</p>
            <p className="text-sm mt-1">Generated audio will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateVoice;

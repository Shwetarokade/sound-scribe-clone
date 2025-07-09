
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Download, Volume2 } from "lucide-react";

// Mock voices - replace with real data from Supabase
const mockVoices = [
  { id: "1", name: "Professional Speaker" },
  { id: "2", name: "Friendly Narrator" },
  { id: "3", name: "Character Voice" }
];

const GenerateVoice = () => {
  const [selectedVoice, setSelectedVoice] = useState("");
  const [text, setText] = useState("");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([1.0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedVoice || !text.trim()) return;

    setIsGenerating(true);
    
    // TODO: Implement actual voice generation
    console.log("Generating voice:", {
      voiceId: selectedVoice,
      text,
      speed: speed[0],
      pitch: pitch[0]
    });

    // Simulate generation process
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedAudio("mock-audio-url");
    }, 3000);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual audio playback
    console.log("Playing audio:", !isPlaying);
  };

  const handleDownload = () => {
    // TODO: Implement audio download
    console.log("Downloading audio");
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
              Enter the text you want to convert to speech
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Text Content</Label>
              <Textarea
                id="text"
                placeholder="Enter your text here..."
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
                  <SelectValue placeholder="Choose a voice" />
                </SelectTrigger>
                <SelectContent>
                  {mockVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
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
                <div className="bg-primary h-2 rounded-full w-1/3"></div>
              </div>

              <span className="text-sm text-muted-foreground">0:45 / 2:30</span>
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
            <p>No recent generations yet.</p>
            <p className="text-sm mt-1">Generated audio will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateVoice;

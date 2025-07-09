
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, Trash2, Search } from "lucide-react";

// Mock data - replace with real data from Supabase
const mockVoices = [
  {
    id: "1",
    name: "Professional Speaker",
    description: "Clear, authoritative voice perfect for presentations",
    createdAt: "2024-01-15",
    samples: 5,
    status: "trained"
  },
  {
    id: "2", 
    name: "Friendly Narrator",
    description: "Warm, conversational tone ideal for audiobooks",
    createdAt: "2024-01-10",
    samples: 8,
    status: "training"
  },
  {
    id: "3",
    name: "Character Voice",
    description: "Unique character voice for animation projects",
    createdAt: "2024-01-05",
    samples: 3,
    status: "trained"
  }
];

const VoiceLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const filteredVoices = mockVoices.filter(voice =>
    voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voice.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayPause = (voiceId: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
    } else {
      setPlayingVoice(voiceId);
      // TODO: Implement actual audio playback
      console.log("Playing voice:", voiceId);
    }
  };

  const handleDelete = (voiceId: string) => {
    // TODO: Implement voice deletion
    console.log("Delete voice:", voiceId);
  };

  const handleDownload = (voiceId: string) => {
    // TODO: Implement voice model download
    console.log("Download voice:", voiceId);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search voices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Voice Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVoices.map((voice) => (
          <Card key={voice.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{voice.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {voice.description}
                  </CardDescription>
                </div>
                <Badge 
                  variant={voice.status === "trained" ? "default" : "secondary"}
                >
                  {voice.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Created: {voice.createdAt}</p>
                  <p>Samples: {voice.samples}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayPause(voice.id)}
                    disabled={voice.status !== "trained"}
                  >
                    {playingVoice === voice.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(voice.id)}
                    disabled={voice.status !== "trained"}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(voice.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No voices found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or add a new voice to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceLibrary;

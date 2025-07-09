
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, Trash2, Search, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Voice {
  id: string;
  name: string;
  language: string;
  category: string;
  description?: string;
  audio_url: string;
  duration?: number;
  created_at: string;
}

const VoiceLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  // Fetch voices from Supabase
  useEffect(() => {
    const fetchVoices = async () => {
      if (!user) return;

      setLoading(true);
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
      setLoading(false);
    };

    fetchVoices();
  }, [user, toast]);

  const filteredVoices = voices.filter(voice =>
    voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voice.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayPause = (voiceId: string, audioUrl: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      // TODO: Implement actual audio pause
    } else {
      setPlayingVoice(voiceId);
      // TODO: Implement actual audio playback
      console.log("Playing voice:", voiceId, audioUrl);
    }
  };

  const handleDelete = async (voiceId: string, audioUrl: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('voices')
        .delete()
        .eq('id', voiceId);

      if (dbError) throw dbError;

      // Delete from storage (extract file path from URL)
      const urlParts = audioUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;
      
      const { error: storageError } = await supabase.storage
        .from('voices')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Update local state
      setVoices(voices.filter(voice => voice.id !== voiceId));
      
      toast({
        title: "Success",
        description: "Voice deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete voice.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = (audioUrl: string, voiceName: string) => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${voiceName}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryBadgeVariant = (category: string) => {
    if (category.includes('male')) return 'default';
    if (category.includes('female')) return 'secondary';
    if (category.includes('teen')) return 'outline';
    return 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your voices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search voices by name, category, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Voice Cards */}
      {filteredVoices.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVoices.map((voice) => (
            <Card key={voice.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Mic className="h-4 w-4" />
                      <span>{voice.name}</span>
                    </CardTitle>
                    {voice.description && (
                      <CardDescription className="text-sm">
                        {voice.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={getCategoryBadgeVariant(voice.category)}>
                    {voice.category.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Language: {voice.language.toUpperCase()}</p>
                    <p>Created: {formatDate(voice.created_at)}</p>
                    {voice.duration && (
                      <p>Duration: {Math.round(voice.duration)}s</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayPause(voice.id, voice.audio_url)}
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
                      onClick={() => handleDownload(voice.audio_url, voice.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(voice.id, voice.audio_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Mic className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          {searchTerm ? (
            <>
              <p className="text-muted-foreground">No voices found matching "{searchTerm}".</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search terms.
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">No voices in your library yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first voice in the "Add Voice" tab to get started.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceLibrary;

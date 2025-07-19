
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Download, Trash2, Search, Mic, Heart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Voice {
  id: string;
  name: string;
  language: string;
  category: string;
  description?: string;
  audio_storage_path: string;
  duration?: number;
  created_at: string;
}

const VoiceLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [voiceTypeFilter, setVoiceTypeFilter] = useState("all");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const indianLanguages = [
    { value: "all", label: "All Languages" },
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

  const voiceTypes = [
    { value: "all", label: "All Voice Types" },
    { value: "conversational", label: "Conversational" },
    { value: "narrative", label: "Narrative" },
    { value: "ai", label: "AI" },
    { value: "robotic", label: "Robotic" },
    { value: "natural", label: "Natural" }
  ];

  // Fetch voices from Supabase with real-time updates
  useEffect(() => {
    const fetchVoices = async () => {
      if (!user) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('voices')
        .select('*')
        .eq('creator_id', user.id)
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

  // Separate useEffect for optimistic updates
  useEffect(() => {
    // Listen for optimistic voice updates
    const handleVoiceAdded = (event: any) => {
      const newVoice = event.detail;
      setVoices(prev => [newVoice, ...prev]);
    };

    const handleVoiceAddedSuccess = (event: any) => {
      const { tempId, realVoice } = event.detail;
      setVoices(prev => prev.map(voice => 
        voice.id === tempId ? realVoice : voice
      ));
    };

    const handleVoiceAddedError = (event: any) => {
      const { tempId } = event.detail;
      setVoices(prev => prev.filter(voice => voice.id !== tempId));
    };

    const handleRefresh = () => {
      if (user) {
        supabase
          .from('voices')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) setVoices(data);
          });
      }
    };

    window.addEventListener('voiceAdded', handleVoiceAdded);
    window.addEventListener('voiceAddedSuccess', handleVoiceAddedSuccess);
    window.addEventListener('voiceAddedError', handleVoiceAddedError);
    window.addEventListener('voiceLibraryRefresh', handleRefresh);
    
    return () => {
      window.removeEventListener('voiceAdded', handleVoiceAdded);
      window.removeEventListener('voiceAddedSuccess', handleVoiceAddedSuccess);
      window.removeEventListener('voiceAddedError', handleVoiceAddedError);
      window.removeEventListener('voiceLibraryRefresh', handleRefresh);
    };
  }, [user]);

  // Separate useEffect for real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('voices-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voices',
          filter: `creator_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New voice added via Supabase:', payload.new);
          const newVoice = payload.new as Voice;
          
          // Only add if it's not already in the list (avoid duplicates from optimistic updates)
          setVoices(prev => {
            const existsAlready = prev.some(v => v.id === newVoice.id);
            if (existsAlready) return prev;
            return [newVoice, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voice.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLanguage = languageFilter === "all" || voice.language === languageFilter;
    const matchesVoiceType = voiceTypeFilter === "all" || voice.category === voiceTypeFilter;
    
    return matchesSearch && matchesLanguage && matchesVoiceType;
  });

  const handlePlayPause = (voiceId: string, audioUrl: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      // Pause the audio
      const audioElement = document.querySelector(`audio[data-voice-id="${voiceId}"]`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.pause();
      }
    } else {
      setPlayingVoice(voiceId);
      
      // Create or get audio element
      let audioElement = document.querySelector(`audio[data-voice-id="${voiceId}"]`) as HTMLAudioElement;
      if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.setAttribute('data-voice-id', voiceId);
        audioElement.src = audioUrl;
        audioElement.onended = () => setPlayingVoice(null);
        document.body.appendChild(audioElement);
      }
      
      audioElement.play().catch(error => {
        console.error('Audio playback failed:', error);
        setPlayingVoice(null);
      });
    }
  };

  const toggleFavorite = (voiceId: string) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(voiceId)) {
      newFavorites.delete(voiceId);
      toast({
        title: "Removed from Favorites",
        description: "Voice removed from your favorites list.",
      });
    } else {
      newFavorites.add(voiceId);
      toast({
        title: "Added to Favorites",
        description: "Voice added to your favorites list.",
      });
    }
    setFavorites(newFavorites);
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

  const handleDownload = async (audioUrl: string, voiceName: string) => {
    try {
      toast({
        title: "Download starting...",
        description: `Preparing ${voiceName} for download`,
      });

      // Fetch the audio file
      const response = await fetch(audioUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audio file');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename with timestamp for uniqueness
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileExtension = audioUrl.includes('.wav') ? '.wav' : '.mp3';
      link.download = `${voiceName}_${timestamp}${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download complete! 📁",
        description: `${voiceName} has been saved to your downloads folder`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not download the audio file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getVoiceTypeBadgeVariant = (voiceType: string) => {
    switch (voiceType) {
      case 'conversational': return 'default';
      case 'narrative': return 'secondary';
      case 'ai': return 'outline';
      case 'robotic': return 'destructive';
      case 'natural': return 'default';
      default: return 'default';
    }
  };

  const getLanguageLabel = (langCode: string) => {
    const lang = indianLanguages.find(l => l.value === langCode);
    return lang?.label || langCode.toUpperCase();
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
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search voices by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-4">
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by language" />
            </SelectTrigger>
            <SelectContent>
              {indianLanguages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={voiceTypeFilter} onValueChange={setVoiceTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by voice type" />
            </SelectTrigger>
            <SelectContent>
              {voiceTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Voice Cards */}
      {filteredVoices.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVoices.map((voice, index) => (
            <Card 
              key={voice.id} 
              className="hover:shadow-md transition-all duration-300 animate-fade-in" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Mic className="h-4 w-4" />
                      <span>{voice.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(voice.id)}
                        className="p-1 h-auto"
                      >
                        {favorites.has(voice.id) ? (
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </Button>
                    </CardTitle>
                    {voice.description && (
                      <CardDescription className="text-sm">
                        {voice.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={getVoiceTypeBadgeVariant(voice.category)}>
                    {voice.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Language: {getLanguageLabel(voice.language)}</span>
                      <Badge variant="outline" className="text-xs">
                        AI Ready
                      </Badge>
                    </div>
                    <p>Created: {formatDate(voice.created_at)}</p>
                    {voice.duration && (
                      <div className="flex items-center justify-between">
                        <span>Duration: {Math.round(voice.duration)}s</span>
                        <span className="text-xs text-green-600">✓ Available</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayPause(voice.id, voice.audio_storage_path)}
                      className={`min-w-[48px] min-h-[48px] ${playingVoice === voice.id ? 'bg-primary/20 border-primary' : ''}`}
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
                      onClick={() => handleDownload(voice.audio_storage_path, voice.name)}
                      className="min-w-[48px] min-h-[48px]"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(voice.id, voice.audio_storage_path)}
                      className="min-w-[48px] min-h-[48px]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {playingVoice === voice.id && (
                    <div className="mt-2">
                      <div className="w-full bg-muted rounded-full h-1">
                        <div className="bg-primary h-1 rounded-full animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Mic className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          {searchTerm || languageFilter !== "all" || voiceTypeFilter !== "all" ? (
            <>
              <p className="text-muted-foreground">No voices found matching your filters.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search terms or filters.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setLanguageFilter("all");
                  setVoiceTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>
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

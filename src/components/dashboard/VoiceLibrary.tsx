
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
  const [languageFilter, setLanguageFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
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

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "conversational", label: "Conversational" },
    { value: "narrative", label: "Narrative" },
    { value: "ai", label: "AI" },
    { value: "present", label: "Present" }
  ];

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

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voice.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLanguage = languageFilter === "all" || voice.language === languageFilter;
    const matchesCategory = categoryFilter === "all" || voice.category === categoryFilter;
    
    return matchesSearch && matchesLanguage && matchesCategory;
  });

  const handlePlayPause = (voiceId: string, audioUrl: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      // TODO: Implement actual audio pause
    } else {
      setPlayingVoice(voiceId);
      // TODO: Implement actual audio playback
      console.log("Playing voice:", voiceId, audioUrl);
      
      // Simulate playback duration
      setTimeout(() => setPlayingVoice(null), 3000);
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
    switch (category) {
      case 'conversational': return 'default';
      case 'narrative': return 'secondary';
      case 'ai': return 'outline';
      case 'present': return 'destructive';
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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Voice Cards */}
      {filteredVoices.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVoices.map((voice) => (
            <Card key={voice.id} className="hover:shadow-md transition-shadow">
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
                  <Badge variant={getCategoryBadgeVariant(voice.category)}>
                    {voice.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Language: {getLanguageLabel(voice.language)}</p>
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
          {searchTerm || languageFilter !== "all" || categoryFilter !== "all" ? (
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
                  setCategoryFilter("all");
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

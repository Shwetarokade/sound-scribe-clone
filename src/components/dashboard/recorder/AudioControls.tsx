
import { Button } from "@/components/ui/button";
import { Play, Pause, Scissors, X } from "lucide-react";

interface AudioControlsProps {
  audioFile: File | null;
  isPlaying: boolean;
  trimRegion: { start: number; end: number } | null;
  duration: number;
  onTogglePlayback: () => void;
  onTrimAndSave: () => void;
  onClear: () => void;
}

const AudioControls = ({
  audioFile,
  isPlaying,
  trimRegion,
  duration,
  onTogglePlayback,
  onTrimAndSave,
  onClear
}: AudioControlsProps) => {
  if (!audioFile) return null;

  return (
    <div className="flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onTogglePlayback}
          className="transition-all duration-200 hover:scale-105"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {audioFile.name}
          {trimRegion && duration > 0 && (
            <span className="ml-2 text-primary">
              Trim: {trimRegion.start.toFixed(1)}s - {trimRegion.end.toFixed(1)}s 
              ({(trimRegion.end - trimRegion.start).toFixed(1)}s selected)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          type="button"
          onClick={onTrimAndSave}
          disabled={!trimRegion}
          className="transition-all duration-200 hover:scale-105"
        >
          <Scissors className="h-4 w-4 mr-2" />
          Use Selected Audio
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="transition-all duration-200 hover:scale-105"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AudioControls;

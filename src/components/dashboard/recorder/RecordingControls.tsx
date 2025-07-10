
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload } from "lucide-react";
import { useRef } from "react";

interface RecordingControlsProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (file: File) => void;
}

const RecordingControls = ({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onFileUpload
}: RecordingControlsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-4 mb-6">
      <label className="cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button type="button" variant="outline" size="lg" className="transition-all duration-200 hover:scale-105">
          <Upload className="h-5 w-5 mr-2" />
          Upload Audio
        </Button>
      </label>
      
      <span className="text-sm text-muted-foreground">or</span>
      
      <Button
        type="button"
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        onClick={isRecording ? onStopRecording : onStartRecording}
        className="transition-all duration-200 hover:scale-105"
      >
        {isRecording ? (
          <>
            <Square className="h-5 w-5 mr-2" />
            Stop Recording ({recordingTime.toFixed(1)}s)
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            Start Recording
          </>
        )}
      </Button>
    </div>
  );
};

export default RecordingControls;

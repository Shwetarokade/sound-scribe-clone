
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import RecordingControls from "./recorder/RecordingControls";
import WaveformDisplay from "./recorder/WaveformDisplay";
import AudioControls from "./recorder/AudioControls";
import { useWaveformRecorder } from "./recorder/useWaveformRecorder";

interface WaveformRecorderProps {
  onAudioReady: (audioFile: File, trimStart: number, trimEnd: number) => void;
  onClear: () => void;
}

const WaveformRecorder = ({ onAudioReady, onClear }: WaveformRecorderProps) => {
  const {
    isRecording,
    isPlaying,
    audioFile,
    recordingTime,
    trimRegion,
    duration,
    initializeWaveSurfer,
    startRecording,
    stopRecording,
    togglePlayback,
    handleFileUpload,
    handleTrimAndSave,
    clearAudio,
    cleanup
  } = useWaveformRecorder(onAudioReady, onClear);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          <RecordingControls
            isRecording={isRecording}
            recordingTime={recordingTime}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onFileUpload={handleFileUpload}
          />

          <WaveformDisplay
            onWaveformRef={initializeWaveSurfer}
            hasAudio={!!audioFile}
            isRecording={isRecording}
          />

          <AudioControls
            audioFile={audioFile}
            isPlaying={isPlaying}
            trimRegion={trimRegion}
            duration={duration}
            onTogglePlayback={togglePlayback}
            onTrimAndSave={handleTrimAndSave}
            onClear={clearAudio}
          />

          {/* Instructions */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tips:</strong> Drag the highlighted region to select your desired clip (up to 15 seconds). 
              You can resize and move the selection area on the waveform. The selected audio will be used for voice cloning.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaveformRecorder;

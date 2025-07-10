
import { useRef, useEffect } from "react";

interface WaveformDisplayProps {
  onWaveformRef: (ref: HTMLDivElement) => void;
  hasAudio: boolean;
  isRecording: boolean;
}

const WaveformDisplay = ({ onWaveformRef, hasAudio, isRecording }: WaveformDisplayProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (waveformRef.current) {
      onWaveformRef(waveformRef.current);
    }
  }, [onWaveformRef]);

  return (
    <div className="bg-muted/20 rounded-lg p-4 mb-4 transition-all duration-300">
      <div ref={waveformRef} className="w-full" />
      
      {!hasAudio && !isRecording && (
        <div className="text-center py-8 text-muted-foreground animate-pulse">
          Record or upload audio to see waveform
        </div>
      )}
    </div>
  );
};

export default WaveformDisplay;

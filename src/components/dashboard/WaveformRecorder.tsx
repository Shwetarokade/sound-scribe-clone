
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Play, Pause, Upload, Scissors, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

interface WaveformRecorderProps {
  onAudioReady: (audioFile: File, trimStart: number, trimEnd: number) => void;
  onClear: () => void;
}

const WaveformRecorder = ({ onAudioReady, onClear }: WaveformRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [trimRegion, setTrimRegion] = useState<{ start: number; end: number } | null>(null);
  const [duration, setDuration] = useState(0);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<any>(null);
  const regionsPluginRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Cleanup function to destroy WaveSurfer instance
  const destroyWaveSurfer = () => {
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy();
      } catch (error) {
        console.log('WaveSurfer destroy error (non-critical):', error);
      }
      wavesurferRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  // Initialize WaveSurfer
  const initializeWaveSurfer = () => {
    if (!waveformRef.current) return;

    destroyWaveSurfer();

    try {
      // Initialize regions plugin
      regionsPluginRef.current = RegionsPlugin.create();
      
      // Initialize WaveSurfer
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'hsl(var(--muted-foreground))',
        progressColor: 'hsl(var(--primary))',
        cursorColor: 'hsl(var(--primary))',
        barWidth: 2,
        barRadius: 1,
        height: 80,
        normalize: true,
        plugins: [regionsPluginRef.current],
        backend: 'WebAudio'
      });

      // Initialize record plugin
      recordPluginRef.current = RecordPlugin.create({
        scrollingWaveform: true,
        renderRecordedAudio: true
      });
      
      wavesurferRef.current.registerPlugin(recordPluginRef.current);

      // Set up event listeners
      wavesurferRef.current.on('play', () => setIsPlaying(true));
      wavesurferRef.current.on('pause', () => setIsPlaying(false));
      wavesurferRef.current.on('finish', () => setIsPlaying(false));
      wavesurferRef.current.on('ready', () => {
        const newDuration = wavesurferRef.current?.getDuration() || 0;
        setDuration(newDuration);
        createTrimRegion(newDuration);
      });

      // Record plugin events
      recordPluginRef.current.on('record-start', () => {
        setIsRecording(true);
        setRecordingTime(0);
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 0.1);
        }, 100);
      });

      recordPluginRef.current.on('record-end', (blob: Blob) => {
        setIsRecording(false);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setAudioFile(file);
      });

      // Regions events
      regionsPluginRef.current.on('region-updated', (region: any) => {
        setTrimRegion({ start: region.start, end: region.end });
      });

    } catch (error) {
      console.error('WaveSurfer initialization error:', error);
      toast({
        title: "Audio Error",
        description: "Failed to initialize audio recorder. Please refresh and try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    initializeWaveSurfer();

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      destroyWaveSurfer();
    };
  }, []);

  const startRecording = async () => {
    try {
      if (recordPluginRef.current) {
        await recordPluginRef.current.startRecording();
      }
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recordPluginRef.current && isRecording) {
      recordPluginRef.current.stopRecording();
    }
  };

  const togglePlayback = () => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid File",
          description: "Please upload an audio file (MP3, WAV, etc.)",
          variant: "destructive"
        });
        return;
      }

      // Clear previous state
      clearAudio();
      
      setAudioFile(file);
      
      // Clean up previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      const url = URL.createObjectURL(file);
      audioUrlRef.current = url;
      
      if (wavesurferRef.current) {
        wavesurferRef.current.load(url);
      }
    }
  };

  const createTrimRegion = (audioDuration?: number) => {
    if (wavesurferRef.current && regionsPluginRef.current) {
      // Clear existing regions
      regionsPluginRef.current.clearRegions();
      
      const totalDuration = audioDuration || wavesurferRef.current.getDuration();
      const regionEnd = Math.min(15, totalDuration);
      
      if (totalDuration > 0) {
        const region = regionsPluginRef.current.addRegion({
          start: 0,
          end: regionEnd,
          color: 'hsla(var(--primary) / 0.2)',
          resize: true,
          drag: true
        });
        
        setTrimRegion({ start: 0, end: regionEnd });
      }
    }
  };

  const handleTrimAndSave = () => {
    if (audioFile && trimRegion) {
      onAudioReady(audioFile, trimRegion.start, trimRegion.end);
    } else {
      toast({
        title: "Error",
        description: "Please record or upload audio and select a region to trim.",
        variant: "destructive"
      });
    }
  };

  const clearAudio = () => {
    setAudioFile(null);
    setTrimRegion(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setDuration(0);
    
    if (wavesurferRef.current) {
      wavesurferRef.current.empty();
    }
    
    if (regionsPluginRef.current) {
      regionsPluginRef.current.clearRegions();
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    
    onClear();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
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
              onClick={isRecording ? stopRecording : startRecording}
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

          {/* Waveform Container */}
          <div className="bg-muted/20 rounded-lg p-4 mb-4 transition-all duration-300">
            <div ref={waveformRef} className="w-full" />
            
            {!audioFile && !isRecording && (
              <div className="text-center py-8 text-muted-foreground animate-pulse">
                Record or upload audio to see waveform
              </div>
            )}
          </div>

          {/* Audio Controls */}
          {audioFile && (
            <div className="flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={togglePlayback}
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
                  onClick={handleTrimAndSave}
                  disabled={!trimRegion}
                  className="transition-all duration-200 hover:scale-105"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  Use Selected Audio
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearAudio}
                  className="transition-all duration-200 hover:scale-105"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

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

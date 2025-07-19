
import { useState, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import { TrimRegionManager } from "./TrimRegionManager";

export const useWaveformRecorder = (onAudioReady: (file: File, trimStart: number, trimEnd: number) => void, onClear: () => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [trimRegion, setTrimRegion] = useState<{ start: number; end: number } | null>(null);
  const [duration, setDuration] = useState(0);
  
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<ReturnType<typeof RecordPlugin.create> | null>(null);
  const trimManagerRef = useRef<TrimRegionManager | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const destroyWaveSurfer = useCallback(() => {
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
  }, []);

  const initializeWaveSurfer = useCallback((container: HTMLDivElement) => {
    if (!container) return;

    destroyWaveSurfer();

    try {
      // Initialize trim manager
      trimManagerRef.current = new TrimRegionManager(setTrimRegion);
      
      // Initialize WaveSurfer
      wavesurferRef.current = WaveSurfer.create({
        container,
        waveColor: 'hsl(var(--muted-foreground))',
        progressColor: 'hsl(var(--primary))',
        cursorColor: 'hsl(var(--primary))',
        barWidth: 2,
        barRadius: 1,
        height: 80,
        normalize: true,
        plugins: [trimManagerRef.current.getPlugin()],
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
        trimManagerRef.current?.createTrimRegion(newDuration);
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

    } catch (error) {
      console.error('WaveSurfer initialization error:', error);
      toast({
        title: "Audio Error",
        description: "Failed to initialize audio recorder. Please refresh and try again.",
        variant: "destructive"
      });
    }
  }, [destroyWaveSurfer]);

  const startRecording = useCallback(async () => {
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
  }, []);

  const stopRecording = useCallback(() => {
    if (recordPluginRef.current && isRecording) {
      recordPluginRef.current.stopRecording();
    }
  }, [isRecording]);

  const togglePlayback = useCallback(() => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleFileUpload = useCallback((file: File) => {
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
  }, []);

  const handleTrimAndSave = useCallback(() => {
    if (audioFile && trimRegion) {
      onAudioReady(audioFile, trimRegion.start, trimRegion.end);
    } else {
      toast({
        title: "Error",
        description: "Please record or upload audio and select a region to trim.",
        variant: "destructive"
      });
    }
  }, [audioFile, trimRegion, onAudioReady]);

  const clearAudio = useCallback(() => {
    setAudioFile(null);
    setTrimRegion(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setDuration(0);
    
    if (wavesurferRef.current) {
      wavesurferRef.current.empty();
    }
    
    if (trimManagerRef.current) {
      trimManagerRef.current.clearRegions();
    }
    
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    
    onClear();
  }, [onClear]);

  const cleanup = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    destroyWaveSurfer();
  }, [destroyWaveSurfer]);

  return {
    // State
    isRecording,
    isPlaying,
    audioFile,
    recordingTime,
    trimRegion,
    duration,
    
    // Actions
    initializeWaveSurfer,
    startRecording,
    stopRecording,
    togglePlayback,
    handleFileUpload,
    handleTrimAndSave,
    clearAudio,
    cleanup
  };
};
